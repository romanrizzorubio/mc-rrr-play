import {
    DIALOG_SELECT_CARD,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_HAND,
    PLACE_IN_PLAY,
    TARGET_ALL_PLAYERS,
    TARGET_YOU,
} from 'mc-shared';
import {canPlayCard} from '../utils/card-play-utils.js';
import {EFFECT_RESOLUTION_CONTEXT} from '../utils/effect-resolution-context.js';
import {checkFilter} from '../utils/filter-utils.js';

import {Effect} from './effect.js';
import {ShuffleDeckEffect} from './shuffle-deck-effect.js';

const REFERENCE_CARD_TYPE_ENCOUNTER = 'encounter';
const REFERENCE_CARD_TYPE_PLAYER = 'player';
const REFERENCE_PRIORITY_NO_MATCH = -1;
const REFERENCE_PRIORITY_SOURCE_CARD = 0;
const REFERENCE_PRIORITY_ASSOCIATED_SET = 1;
const REFERENCE_PRIORITY_CARD_TYPE = 2;
const REFERENCE_PRIORITY_COUNT = 3;

export class SearchCardsEffect extends Effect {
    static getCardSet(card) {
        return card?.set ?? card?.card?.set;
    }
    static getAssociatedSuperheroSet(referenceCard, match) {
        const ownerSuperheroSet = this.getCardSet(referenceCard?.owner?.superhero);
        if (ownerSuperheroSet) {
            return ownerSuperheroSet;
        }

        const referenceSet = this.getCardSet(referenceCard);
        const associatedSuperhero = (match?.players || []).find(({superhero}) =>
            referenceSet && this.getCardSet(superhero) === referenceSet)?.superhero;

        return this.getCardSet(associatedSuperhero);
    }
    static isPlayerCard(card) {
        return Boolean(
            card?.isPlayerCard ||
            card?.card?.isPlayerCard ||
            card?.isSuperhero ||
            card?.card?.isSuperhero
        );
    }
    static isEncounterCard(card) {
        return Boolean(card?.isEncounterCard || card?.card?.isEncounterCard);
    }
    static getReferenceCardType(card) {
        if (this.isEncounterCard(card)) {
            return REFERENCE_CARD_TYPE_ENCOUNTER;
        }
        if (this.isPlayerCard(card)) {
            return REFERENCE_CARD_TYPE_PLAYER;
        }
    }
    static isSameCard(card, referenceCard) {
        return card === referenceCard ||
            card?.parent === referenceCard ||
            referenceCard?.parent === card ||
            referenceCard?.sides?.includes(card) ||
            card?.sides?.includes(referenceCard);
    }
    static getReferencePriority(
        card,
        referenceCard,
        associatedSuperheroSet,
        referenceCardType
    ) {
        if (this.isSameCard(card, referenceCard)) {
            return REFERENCE_PRIORITY_SOURCE_CARD;
        }
        if (associatedSuperheroSet &&
            this.getCardSet(card) === associatedSuperheroSet) {
            return REFERENCE_PRIORITY_ASSOCIATED_SET;
        }
        if (
            (referenceCardType === REFERENCE_CARD_TYPE_ENCOUNTER &&
                this.isEncounterCard(card)) ||
            (referenceCardType === REFERENCE_CARD_TYPE_PLAYER &&
                this.isPlayerCard(card))
        ) {
            return REFERENCE_PRIORITY_CARD_TYPE;
        }

        return REFERENCE_PRIORITY_NO_MATCH;
    }

    constructor({
        locations = [], // ['discardPile', 'deck', 'hand']
        players = TARGET_YOU,
        filter = {},
        title = 'Elige una carta',
        count = 1,
        topCount,
        upTo = false,
        firstMatch = false,
        reverseLocations = [],
        requireMatch = false,
        distinctNames = false,
        showCancel = false,
        onlyPlayable = false,
    }) {
        super(arguments[0]);
        this.locations = locations;
        this.playersTarget = players;
        this.filter = filter;
        this.title = title;
        this.count = count;
        this.topCount = topCount;
        this.upTo = upTo;
        this.firstMatch = firstMatch;
        this.reverseLocations = reverseLocations;
        this.requireMatch = requireMatch;
        this.distinctNames = distinctNames;
        this.showCancel = showCancel;
        this.onlyPlayable = onlyPlayable;
        this.searchedDecks = new Map();
    }

    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        if (!this.requireMatch) {
            return true;
        }

        return (await this.getOptions(params)).length > 0;
    }
    async getCostPaymentEffects(params) {
        if (this.firstMatch) {
            return [];
        }

        return await this.shouldPromptForPayment(params) ? [this] : [];
    }
    async shouldPromptForPayment(params, session) {
        const excludedCardIds = session?.getExcludedCardIds() || new Set();

        return !this.firstMatch &&
            (await this.getOptions(params, excludedCardIds)).length > 0;
    }
    async markKnownDeckOptions(cards, player) {
        const decks = new Set([
            player?.deck,
            ...(this.match?.players || []).map(targetPlayer => targetPlayer.deck),
            this.match?.scenario?.deck,
        ].filter(Boolean));

        await this.promisesSequential([...decks], async deck => {
            const knownCards = cards.filter(card =>
                Array.isArray(deck.cards) && deck.cards.includes(card));
            if (!knownCards.length) {
                return;
            }
            if (typeof deck.markKnown !== 'function') {
                throw new TypeError('SearchCardsEffect requires decks to track known cards.');
            }

            deck.markKnown(knownCards);
            await deck.refresh();
        });
    }
    getCostPaymentTitle() {
        return this.title;
    }
    async getOptions(params, excludedCardIds = new Set()) {
        const game = this.match;
        const {player} = params;
        const targetPlayers = this.playersTarget === TARGET_ALL_PLAYERS ?
                game.players :
                [player];
        const options = [];
        const searchedDecks = new Map();
        const referenceCard = typeof this.filter.name === 'string' ?
            this.ability?.card :
            undefined;
        const associatedSuperheroSet =
            this.constructor.getAssociatedSuperheroSet(referenceCard, game);
        const referenceCardType =
            this.constructor.getReferenceCardType(referenceCard);
        const referenceOptions = Array.from(
            {length: REFERENCE_PRIORITY_COUNT},
            () => []
        );
        let foundFirstMatch = false;

        for (const targetPlayer of targetPlayers) {
            for (const location of this.locations) {
                let cards = this.getCardsAtLocation(targetPlayer, location);
                if (location === PLACE_DECK) {
                    searchedDecks.set(targetPlayer.deck, targetPlayer);
                } else if (location === PLACE_ENCOUNTER_DECK_CARDS) {
                    const scenario = this.match.scenario;
                    searchedDecks.set(scenario.deck, scenario);
                }
                if (location === PLACE_DECK &&
                    this.topCount !== undefined) {
                    if (!Number.isSafeInteger(this.topCount) || this.topCount < 0) {
                        throw new TypeError('SearchCardsEffect topCount must be a non-negative integer.');
                    }
                    cards = cards.slice(0, this.topCount);
                }
                cards = cards.filter(card => !excludedCardIds.has(card.id));
                if (this.firstMatch && this.reverseLocations.includes(location)) {
                    cards = cards.slice().reverse();
                }

                for (const card of cards) {
                    const referencePriority = referenceCard ?
                        this.constructor.getReferencePriority(
                            card,
                            referenceCard,
                            associatedSuperheroSet,
                            referenceCardType
                        ) :
                        -1;
                    if (referenceCard && referencePriority < 0) {
                        continue;
                    }
                    if (referenceCard && this.firstMatch &&
                        referenceOptions[referencePriority].length) {
                        continue;
                    }
                    if (!await checkFilter(card, this.filter, params)) {
                        continue;
                    }
                    if (this.onlyPlayable &&
                        !await canPlayCard(card, {
                            ...params,
                            player: targetPlayer,
                        })) {
                        continue;
                    }

                    if (referenceCard) {
                        referenceOptions[referencePriority].push(card);
                        if (this.firstMatch &&
                            referencePriority === REFERENCE_PRIORITY_SOURCE_CARD) {
                            foundFirstMatch = true;
                            break;
                        }
                    } else {
                        options.push(card);
                        if (this.firstMatch) {
                            foundFirstMatch = true;
                            break;
                        }
                    }
                }

                if (foundFirstMatch) {
                    break;
                }
            }
            if (foundFirstMatch) {
                break;
            }
        }

        if (referenceCard) {
            const highestPriorityOptions = referenceOptions.find(group =>
                group.length);
            options.push(...(highestPriorityOptions || []));
        }

        this.searchedDecks = searchedDecks;
        return options;
    }
    async preparePayment(params, session) {
        const options = await this.getOptions(params, session.getExcludedCardIds());
        const {player} = params;
        if (options.length === 0) {
            return {
                cards: [],
                generators: [],
                hand: [],
            };
        }

        await this.markKnownDeckOptions(options, player);
        const response = await this.openDialog({
                dialogType: DIALOG_SELECT_CARD,
                showCancel: this.showCancel,
                hand: player.hand.cards.map(card => card.toObj(params)),
                data: {
                    title: this.title,
                    cards: options.map(card => card.toObj(params)),
                    count: this.count,
                    distinctNames: this.distinctNames,
                    upTo: this.upTo,
                },
        });
        if (!response) {
                return undefined;
        }

        const selected = response.selected || [];
        const selectedCards = selected.map(selectedCard => {
                const card = options.find(candidate => candidate.id === selectedCard.id);
                if (!card) {
                    throw new Error('La selección de cartas de búsqueda no es válida.');
                }

                return card;
        });

        if (selectedCards.length) {
            this.setSelectedCards(params, selectedCards);
        }

        return {
                cards: selectedCards,
                generators: [],
                hand: [],
                reservedCards: selectedCards.filter(card =>
                    player.hand.cards.includes(card) ||
                    session.getExcludedCardIds().has(card.id)),
        };
    }

    getCardsAtLocation(player, location) {
        if (location === PLACE_DISCARD_PILE) {
            return player.deck.discardPile;
        } else if (location === PLACE_DECK) {
            return player.deck.cards;
        } else if (location === PLACE_HAND) {
            return player.hand.cards;
        } else if (location === PLACE_IN_PLAY) {
            return player.gameZone?.cards || [];
        } else if (location === PLACE_ENCOUNTER_DECK_CARDS) {
            return this.match.scenario.deck.cards;
        } else if (location === PLACE_ENCOUNTER_DISCARD) {
            return this.match.scenario.deck.discardPile;
        }

        return [];
    }

    async shuffleSearchedDecks(params) {
        if (this.searchedDecks.size === 0) {
            return;
        }
        if (!this.match) {
            throw new TypeError('SearchCardsEffect requires match context to shuffle searched decks.');
        }

        const searchedDecks = [...this.searchedDecks];
        for (const [deck] of searchedDecks) {
            if (!deck || typeof deck.shuffle !== 'function' ||
                typeof deck.refresh !== 'function') {
                throw new TypeError('SearchCardsEffect requires searched decks to support shuffling and refreshing.');
            }
        }

        const resolutionContext = params[EFFECT_RESOLUTION_CONTEXT];
        if (resolutionContext) {
            for (const [deck, target] of searchedDecks) {
                resolutionContext.afterResolution.set(deck, () =>
                    this.shuffleSearchedDeck(deck, target, params));
            }

            return;
        }

        for (const [deck, target] of searchedDecks) {
            await this.shuffleSearchedDeck(deck, target, params);
        }
    }
    async shuffleSearchedDeck(deck, target, params) {
        const shuffleEffect = new ShuffleDeckEffect({
            match: this.match,
            selectedTarget: target,
        });
        await shuffleEffect.execute(params);
        await deck.refresh();
    }

    async execute(params) {
        const {player} = params;
        const {costPaymentSession} = params;

        if (this.firstMatch) {
            params.selectedCards = [];
            params.selectedCard = undefined;
            params.card = undefined;
        }
        
        const hasStagedPayment = costPaymentSession?.hasPayment(this) || false;
        const isPreparedWithoutPayment =
            costPaymentSession?.isPrepared(this) && !hasStagedPayment;

        if (isPreparedWithoutPayment) {
            return;
        }

        const options = await this.getOptions(params);
        if (options.length === 0 && !hasStagedPayment) {
            await this.shuffleSearchedDecks(params);
            return;
        }

        if (this.firstMatch) {
            params.selectedCards = options;
            params.selectedCard = options[0];
            params.card = options[0];
            await this.shuffleSearchedDecks(params);
            return;
        }

        if (!hasStagedPayment) {
            await this.markKnownDeckOptions(options, player);
        }
        const response = hasStagedPayment ?
            undefined :
            await this.openDialog({
                dialogType: DIALOG_SELECT_CARD,
                showCancel: this.showCancel,
                hand: player.hand.cards.map(card => card.toObj(params)),
                data: {
                    title: this.title,
                    cards: options.map(card => card.toObj(params)),
                    count: this.count,
                    distinctNames: this.distinctNames,
                    upTo: this.upTo,
                },
            });
        if (this.showCancel && !hasStagedPayment && !response) {
            this.paymentCancelled = true;
            await this.shuffleSearchedDecks(params);
            return;
        }

        const selected = hasStagedPayment ?
            costPaymentSession.getPayment(this).cards :
            response?.selected;
        if (selected && selected[0]) {
            // Guardamos el resultado en params para efectos encadenados
            params.selectedCards = selected.map(card =>
                typeof card === 'string' ?
                    options.find(candidate => candidate.id === card) :
                    options.find(candidate => candidate.id === card.id) || card);
            this.setSelectedCards(params, params.selectedCards);
            params.card = params.selectedCard;
        }
        await this.shuffleSearchedDecks(params);
    }
    setSelectedCards(params, selectedCards) {
        params.selectedCards = selectedCards;
        if (this.distinctNames) {
            const selectedNames = new Set();
            params.selectedCards = params.selectedCards.filter(card => {
                if (!card || selectedNames.has(card.name)) {
                    return false;
                }

                selectedNames.add(card.name);
                return true;
            });
        }
        params.selectedCard = params.selectedCards[0];
    }
}
