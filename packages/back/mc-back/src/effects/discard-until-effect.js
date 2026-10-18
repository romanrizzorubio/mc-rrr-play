import {
    DIALOG_ENCOUNTERS_REVEAL,
    DIALOG_REVEAL_CARDS,
} from 'mc-shared';

import {Effect} from './effect.js';

export class DiscardUntilEffect extends Effect {
    constructor({
        condition,
        showDiscardedCards = false,
        showSelectedCard = false,
        title = 'Cartas descartadas',
    }) {
        super(arguments[0]);

        if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
            throw new Error('DiscardUntilEffect requires a condition.');
        }

        this.condition = condition;
        this.showDiscardedCards = showDiscardedCards;
        this.showSelectedCard = showSelectedCard;
        this.title = title;
    }
    async execute(params) {
        const selectedTarget = this.selectedTarget;
        const deck = typeof selectedTarget?.discardUntil === 'function' ?
            selectedTarget :
            selectedTarget?.deck;
        if (!deck || typeof deck.discardUntil !== 'function') {
            throw new Error('DiscardUntilEffect requires a deck target.');
        }
        const discardedCards = this.showDiscardedCards ? [] : undefined;
        const selectedCard = await deck.discardUntil(
            this.condition,
            false,
            discardedCards
        );
        params.selectedCard = selectedCard;
        params.selectedCards = selectedCard ? [selectedCard] : [];
        await deck.refresh();

        if (this.showSelectedCard && selectedCard) {
            await this.openDialog({
                dialogType: DIALOG_ENCOUNTERS_REVEAL,
                title: this.title,
                data: {
                    card: selectedCard.toObj(params),
                    horizontal: Boolean(
                        selectedCard.isMainScheme || selectedCard.isSideScheme
                    ),
                },
            });
        }

        if (discardedCards?.length) {
            await this.openDialog({
                dialogType: DIALOG_REVEAL_CARDS,
                title: this.title,
                data: {
                    cards: discardedCards.map(card => card.toObj(params)),
                },
            });
        }
    }
}
