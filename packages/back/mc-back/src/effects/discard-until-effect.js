import {
    DIALOG_ENCOUNTERS_REVEAL,
    DIALOG_REVEAL_CARDS,
} from 'mc-shared';

import {Effect} from './effect.js';

export class DiscardUntilEffect extends Effect {
    constructor({
        condition,
        removeFromDiscard = false,
        showDiscardedCards = false,
        showSelectedCard = false,
        title = 'Cartas descartadas',
    }) {
        super(arguments[0]);

        if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
            throw new Error('DiscardUntilEffect requires a condition.');
        }

        this.condition = condition;
        this.removeFromDiscard = removeFromDiscard;
        this.showDiscardedCards = showDiscardedCards;
        this.showSelectedCard = showSelectedCard;
        this.title = title;
        this.selectedCard = undefined;
        this.selectedCardDeck = undefined;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.selectedCard = undefined;
        this.selectedCardDeck = undefined;
    }
    async execute(params) {
        const selectedTarget = this.selectedTarget;
        const deck = typeof selectedTarget?.discardUntil === 'function' ?
            selectedTarget :
            selectedTarget?.deck;
        if (!deck || typeof deck.discardUntil !== 'function') {
            throw new Error('DiscardUntilEffect requires a deck target.');
        }
        const discardedCards = [];
        this.selectedCard = await deck.discardUntil(
            this.condition,
            this.removeFromDiscard,
            discardedCards
        );
        this.selectedCardDeck = this.selectedCard ? deck : undefined;
        params.selectedCard = this.selectedCard;
        params.selectedCards = this.selectedCard ? [this.selectedCard] : [];
        params.selectedCardDeck = this.selectedCardDeck;
        params.discardedCards = discardedCards;
        await deck.refresh();

        if (this.showSelectedCard && this.selectedCard) {
            await this.openPublicDialog({
                dialogType: DIALOG_ENCOUNTERS_REVEAL,
                title: this.title,
                data: {
                    card: this.selectedCard.toObj(params),
                    horizontal: Boolean(
                        this.selectedCard.isMainScheme ||
                        this.selectedCard.isSideScheme
                    ),
                },
            }, params.player);
        }

        if (this.showDiscardedCards && discardedCards.length) {
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
