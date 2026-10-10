import {
    DIALOG_REVEAL_CARDS,
} from 'mc-shared';
import {checkCondition} from '../engine/utils.js';

import {Effect} from './effect.js';

export class LookAtTopCardsEffect extends Effect {
    constructor({
        count = 1,
        filter = {},
        title = 'Cartas que estás mirando',
    }) {
        super(arguments[0]);

        this.count = count;
        this.filter = filter;
        this.title = title;
        this.cards = [];
        this.matchingCards = [];
    }
    async execute(params) {
        const deck = this.selectedTarget;
        if (deck !== this.match.scenario.deck &&
            deck?.isPlayerDeck !== true) {
            throw new TypeError('LookAtTopCardsEffect requires a player or encounter deck.');
        }

        this.cards = deck.cards.slice(0, this.count);
        this.matchingCards = this.cards.filter(card =>
            checkCondition(card, this.filter));

        if (this.cards.length) {
            await this.openDialog({
                dialogType: DIALOG_REVEAL_CARDS,
                title: this.title,
                data: {
                    cards: this.cards.map(card => card.toObj(params)),
                },
            });
        }
    }
}
