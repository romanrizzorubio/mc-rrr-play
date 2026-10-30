import {
    DIALOG_REVEAL_CARDS,
    TARGET_ANY_DECK,
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
    getTargetSelectionMode() {
        return this.target === TARGET_ANY_DECK ? 'deck' : undefined;
    }
    filterTarget(deck, params) {
        return (deck === this.match?.scenario?.deck || deck?.isPlayerDeck === true) &&
            Array.isArray(deck?.cards) && deck.cards.length > 0 &&
            super.filterTarget(deck, params);
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.cards = [];
        this.matchingCards = [];
    }
    async execute(params) {
        this.cards = [];
        const decks = Array.isArray(this.selectedTarget) ?
            this.selectedTarget : [this.selectedTarget];
        for (const deck of decks) {
            if (deck !== this.match.scenario.deck &&
                deck?.isPlayerDeck !== true) {
                throw new TypeError('LookAtTopCardsEffect requires a player or encounter deck.');
            }

            const cards = deck.cards.slice(0, this.count);
            this.cards.push(...cards);
            if (cards.length) {
                deck.markKnown(cards);
                await deck.refresh();
            }
        }
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
