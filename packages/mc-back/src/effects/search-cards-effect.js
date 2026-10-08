import {
    DIALOG_SELECT_CARD,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_HAND,
    TARGET_ALL_PLAYERS,
    TARGET_YOU,
} from 'mc-shared';
import {checkFilter} from '../utils/filter-utils.js';
import {canPlayCard} from '../utils/card-play-utils.js';

import {Effect} from './effect.js';


export class SearchCardsEffect extends Effect {
    constructor({
        locations = [], // ['discardPile', 'deck', 'hand']
        players = TARGET_YOU,
        filter = {},
        title = 'Elige una carta',
        count = 1,
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
        this.upTo = upTo;
        this.firstMatch = firstMatch;
        this.reverseLocations = reverseLocations;
        this.requireMatch = requireMatch;
        this.distinctNames = distinctNames;
        this.showCancel = showCancel;
        this.onlyPlayable = onlyPlayable;
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

        for (const targetPlayer of targetPlayers) {
            for (const location of this.locations) {
                let cards = this.getCardsAtLocation(targetPlayer, location);
                cards = cards.filter(card => !excludedCardIds.has(card.id));
                if (this.firstMatch && this.reverseLocations.includes(location)) {
                    cards = cards.slice().reverse();
                }

                for (const card of cards) {
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

                    options.push(card);
                    if (this.firstMatch) {
                        break;
                    }
                }

                if (this.firstMatch && options.length) {
                    break;
                }
            }

            if (this.firstMatch && options.length) {
                break;
            }
        }

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
        } else if (location === PLACE_ENCOUNTER_DECK_CARDS) {
            return this.match.scenario.deck.cards;
        } else if (location === PLACE_ENCOUNTER_DISCARD) {
            return this.match.scenario.deck.discardPile;
        }

        return [];
    }

    async execute(params) {
        const {player} = params;
        const {costPaymentSession} = params;

        if (this.firstMatch) {
            params.selectedCards = [];
            params.selectedCard = undefined;
            params.card = undefined;
        }
        
        const options = await this.getOptions(params);
        const hasStagedPayment = costPaymentSession?.hasPayment(this) || false;

        if ((costPaymentSession && !hasStagedPayment) ||
            (options.length === 0 && !costPaymentSession)) {
            return;
        }

        if (this.firstMatch) {
            params.selectedCards = options;
            params.selectedCard = options[0];
            params.card = options[0];
            return;
        }

        const response = costPaymentSession ?
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
        if (this.showCancel && !costPaymentSession && !response) {
            this.paymentCancelled = true;
            return;
        }

        const selected = costPaymentSession ?
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
