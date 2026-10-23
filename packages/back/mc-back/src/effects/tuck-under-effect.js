import {
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_HAND,
    PLACE_IN_PLAY,
    PLACE_TUCKED,
} from 'mc-shared';
import {path} from '../engine/utils.js';
import {getPlayerCardLocation} from '../utils/player-card-play-from.js';

import {Effect} from './effect.js';

export class TuckUnderEffect extends Effect {
    constructor({
        cards,
    }) {
        super(arguments[0]);

        this.cards = cards;
    }
    getCardLocation(card) {
        const location = getPlayerCardLocation(card, card.owner);
        if (location) {
            return location;
        }

        for (const player of this.match?.players || []) {
            const cards = player.gameZone?.cards;
            const index = cards?.indexOf(card) ?? -1;
            if (index > -1) {
                return {
                    place: PLACE_IN_PLAY,
                    cards,
                    index,
                    player,
                    host: player.gameZone,
                };
            }
        }
    }
    getCards(params) {
        let cards;
        if (Array.isArray(this.cards)) {
            cards = this.cards;
        } else if (typeof this.cards === 'string') {
            cards = path(params, this.cards);
        } else {
            return [];
        }
        if (cards === undefined) {
            return [];
        }
        if (!Array.isArray(cards)) {
            throw new TypeError('TuckUnderEffect requires cards to resolve to an array.');
        }
        if (cards.some(card => !card || typeof card !== 'object')) {
            throw new TypeError('TuckUnderEffect requires every selected card to be a card object.');
        }
        if (new Set(cards).size !== cards.length) {
            throw new Error('TuckUnderEffect cannot tuck the same card more than once.');
        }

        return cards;
    }
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        const cards = this.getCards(params);

        return cards.length > 0 &&
            cards.every(card => this.getCardLocation(card));
    }
    async execute(params) {
        const {selectedTarget} = this;
        const cards = this.getCards(params);

        if (!Array.isArray(selectedTarget?.tuckedCards) ||
            typeof selectedTarget.refresh !== 'function') {
            throw new Error('TuckUnderEffect requires a host with tucked-card storage.');
        }
        if (cards.length === 0) {
            throw new Error('TuckUnderEffect requires at least one selected card.');
        }

        const locations = new Map();
        for (const card of cards) {
            const location = this.getCardLocation(card);
            if (!location) {
                throw new Error('TuckUnderEffect requires selected cards in a player zone.');
            }

            if (location.place === PLACE_HAND &&
                (typeof card.owner.hand?.discardHand !== 'function' ||
                    typeof card.owner.hand?.refresh !== 'function')) {
                throw new Error('TuckUnderEffect requires the selected hand to support card removal.');
            }
            if ((location.place === PLACE_DECK &&
                typeof card.owner.deck?.searchDeck !== 'function') ||
                (location.place === PLACE_DISCARD_PILE &&
                    typeof card.owner.deck?.searchDiscard !== 'function') ||
                ((location.place === PLACE_DECK ||
                    location.place === PLACE_DISCARD_PILE) &&
                    typeof card.owner.deck?.refresh !== 'function')) {
                throw new Error('TuckUnderEffect requires the selected deck to support card removal.');
            }
            if (location.place === PLACE_TUCKED &&
                typeof location.host?.refresh !== 'function') {
                throw new Error('TuckUnderEffect requires the selected host to support refresh.');
            }
            if (location.place === PLACE_IN_PLAY &&
                (typeof location.host?.remove !== 'function' ||
                    typeof location.host?.refresh !== 'function' ||
                    typeof card.init !== 'function')) {
                throw new Error('TuckUnderEffect requires in-play cards to support removal and refresh.');
            }

            locations.set(card, location);
        }

        const sourcesToRefresh = new Set();
        for (const card of cards) {
            const {place, host, player} = locations.get(card);

            if (place === PLACE_HAND) {
                player.hand.discardHand(card);
                sourcesToRefresh.add(player.hand);
            } else if (place === PLACE_DECK) {
                await player.deck.searchDeck(card);
                sourcesToRefresh.add(player.deck);
            } else if (place === PLACE_DISCARD_PILE) {
                player.deck.searchDiscard(card);
                sourcesToRefresh.add(player.deck);
            } else if (place === PLACE_TUCKED) {
                const index = host.tuckedCards.indexOf(card);
                if (index < 0) {
                    throw new Error('TuckUnderEffect selected card left its host before moving.');
                }
                host.tuckedCards.splice(index, 1);
                sourcesToRefresh.add(host);
            } else if (place === PLACE_IN_PLAY) {
                host.remove(card);
                await card.init();
                sourcesToRefresh.add(host);
            } else {
                throw new Error(`TuckUnderEffect cannot remove cards from "${place}".`);
            }

            selectedTarget.tuckedCards.push(card);
        }

        sourcesToRefresh.add(selectedTarget);
        await this.promisesSequential(
            [...sourcesToRefresh],
            source => source.refresh()
        );
    }
}
