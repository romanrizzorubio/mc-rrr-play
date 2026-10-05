import {Effect} from './effect.js';

export class DiscardUntilEffect extends Effect {
    constructor({
        condition,
    }) {
        super(arguments[0]);

        if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
            throw new Error('DiscardUntilEffect requires a condition.');
        }

        this.condition = condition;
    }
    async execute(params) {
        const deck = this.selectedTarget;
        if (!deck || typeof deck.discardUntil !== 'function') {
            throw new Error('DiscardUntilEffect requires a deck target.');
        }
        params.selectedCard = await deck.discardUntil(this.condition);
    }
}
