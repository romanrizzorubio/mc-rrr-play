import {
    DECK_POSITION_TOP,
    DIALOG_SELECT_TARGET,
    PLACE_DECK,
    PLACE_HAND,
} from 'mc-shared';
import {path} from '../engine/utils.js';
import {Effect} from './effect.js';

const LOCATION_TYPES = [PLACE_DECK, PLACE_HAND];

export class SwapCardsEffect extends Effect {
    constructor({
        locations,
        title = 'Elige una carta para intercambiarla',
        ...params
    }) {
        super(params);

        this.validateLocations(locations);
        this.locations = locations;
        this.title = title;
        this.cards = [];
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.cards = [];
    }
    validateLocations(locations) {
        if (!Array.isArray(locations) ||
            locations.length !== 2 ||
            locations.some(location => !this.isValidLocation(location))) {
            throw new TypeError(
                'SwapCardsEffect requires exactly two valid locations.'
            );
        }
    }
    isValidLocation(location) {
        if (!location ||
            !LOCATION_TYPES.includes(location.type) ||
            typeof location.path !== 'string') {
            return false;
        }

        return location.type === PLACE_HAND ?
            !location.position :
            location.position === DECK_POSITION_TOP;
    }
    getLocationCards(location, params) {
        const container = path(params, location.path);
        if (!container || !Array.isArray(container.cards)) {
            throw new TypeError(
                `SwapCardsEffect could not resolve the ${location.type} at "${location.path}".`
            );
        }

        if (location.type === PLACE_HAND) {
            return container.cards.slice();
        }

        return container.cards[0] ? [container.cards[0]] : [];
    }
    getLocation(location, params) {
        const container = path(params, location.path);
        if (!container || !Array.isArray(container.cards)) {
            throw new TypeError(
                `SwapCardsEffect could not resolve the ${location.type} at "${location.path}".`
            );
        }

        return container;
    }
    getCardOptions(params) {
        return this.getLocationCards(this.locations[0], params);
    }
    getReplacementCard(params) {
        return this.getLocationCards(this.locations[1], params)[0];
    }
    async canRun(params) {
        return Boolean(
            await super.canRun(params) &&
            this.getCardOptions(params).length &&
            this.getReplacementCard(params)
        );
    }
    async execute(params) {
        const {player} = params;
        const cardOptions = this.getCardOptions(params);
        const replacementCard = this.getReplacementCard(params);
        if (!cardOptions.length || !replacementCard) {
            throw new Error('SwapCardsEffect requires a card in each source location.');
        }

        const response = await this.openDialog({
            dialogType: DIALOG_SELECT_TARGET,
            targetPlayer: player,
            title: this.title,
            data: {
                cards: cardOptions.map(card => card.toObj(params)),
                count: 1,
            },
        });
        const selected = Array.isArray(response?.selected) ?
            response.selected[0] :
            response?.selected;
        const cardToSwap = cardOptions.find(card =>
            card.id === selected?.id);
        if (!cardToSwap) {
            throw new Error('SwapCardsEffect received an invalid card selection.');
        }

        const currentOptions = this.getCardOptions(params);
        const currentReplacementCard = this.getReplacementCard(params);
        if (!currentOptions.includes(cardToSwap) ||
            currentReplacementCard !== replacementCard) {
            throw new Error('SwapCardsEffect source cards changed during selection.');
        }

        const containers = this.locations.map(location =>
            this.getLocation(location, params));
        const cards = [cardToSwap, replacementCard];
        this.locations.forEach((location, index) => {
            const container = containers[index];
            const card = cards[index];
            if (!container.cards.includes(card) ||
                (location.position === DECK_POSITION_TOP &&
                    container.cards[0] !== card)) {
                throw new Error(
                    'SwapCardsEffect source cards are no longer in their locations.'
                );
            }

            if (location.type === PLACE_HAND) {
                if (typeof container.discardHand !== 'function') {
                    throw new TypeError('SwapCardsEffect requires a hand source.');
                }
                container.discardHand(card);
            } else if (!container.removeCardFromDeck(card)) {
                throw new Error('SwapCardsEffect could not remove a source card.');
            }
        });

        const sourceDecks = new Set(containers.filter(source =>
            source.isPlayerDeck));
        await this.promisesSequential([...sourceDecks], deck =>
            deck.checkCycle?.()
        );

        const destinations = [replacementCard, cardToSwap];
        this.locations.forEach((location, index) => {
            const container = containers[index];
            const card = destinations[index];
            if (location.type === PLACE_HAND) {
                container.addCard(card);
            } else {
                container.cards.unshift(card);
            }
        });

        this.cards = cards;
        await this.promisesSequential(
            [...new Set(containers)],
            container => container.refresh?.()
        );
    }
}
