import {path} from '../engine/utils.js';

import {Effect} from './effect.js';

export class TuckUnderEffect extends Effect {
    constructor({
        cards,
    }) {
        super(arguments[0]);

        this.cards = cards;
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
            cards.every(card => card.owner?.hand?.cards?.includes(card));
    }
    async execute(params) {
        const {selectedTarget} = this;
        const cards = this.getCards(params);

        if (!Array.isArray(selectedTarget?.tuckedCards)) {
            throw new Error('TuckUnderEffect requires a host with tucked-card storage.');
        }
        if (cards.length === 0) {
            throw new Error('TuckUnderEffect requires at least one selected card.');
        }

        const owners = new Set();
        for (const card of cards) {
            const hand = card.owner?.hand;
            if (!Array.isArray(hand?.cards) ||
                !hand.cards.includes(card) ||
                typeof hand.discardHand !== 'function' ||
                typeof hand.refresh !== 'function') {
                throw new Error('TuckUnderEffect can only tuck cards from their owners\' hands.');
            }

            owners.add(card.owner);
        }

        for (const card of cards) {
            card.owner.hand.discardHand(card);
            selectedTarget.tuckedCards.push(card);
        }

        await selectedTarget.refresh();
        await this.promisesSequential([...owners], owner => owner.hand.refresh());
    }
}
