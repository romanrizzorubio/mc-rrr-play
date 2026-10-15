import {DIALOG_DISCARD_ORDER} from 'mc-shared';

import {Effect} from './effect.js';

export class SelectAndOrderTopCardsEffect extends Effect {
    constructor({
        count = 1,
        orderTitle = 'Elige el orden de las cartas que vuelven al mazo',
        title = 'Elige una carta para descartar',
        target,
    }) {
        super(arguments[0]);

        if (typeof target !== 'string') {
            throw new TypeError(
                'SelectAndOrderTopCardsEffect requires a deck target selector.'
            );
        }

        this.count = count;
        this.orderTitle = orderTitle;
        this.title = title;
    }
    async execute(params) {
        const deck = this.selectedTarget;
        if (!deck || typeof deck.draw !== 'function' ||
            !Array.isArray(deck.cards) || !Array.isArray(deck.discardPile)) {
            throw new TypeError(
                'SelectAndOrderTopCardsEffect requires a deck target.'
            );
        }

        const cards = await deck.draw(this.count);
        if (!cards.length) {
            return;
        }

        let discardedCard = cards[0];
        let orderedCards = [];
        if (cards.length > 1) {
            const response = await this.openDialog({
                dialogType: DIALOG_DISCARD_ORDER,
                title: this.orderTitle,
                subtitle: `${this.title}. La carta de la izquierda quedará en la parte superior del mazo.`,
                data: {
                    cards: cards.map(card => ({
                        ...card.toObj(params),
                        id: card.id,
                    })),
                    discardCount: 1,
                    allowReorder: true,
                },
            });
            const selectedIds = new Set();
            const resolveSelection = (selection, count) => {
                if (!Array.isArray(selection) || selection.length !== count) {
                    throw new Error(
                        'SelectAndOrderTopCardsEffect received an invalid discard-and-order selection.'
                    );
                }

                return selection.map(selectedCard => {
                    const card = cards.find(candidate =>
                        candidate.id === selectedCard?.id);
                    if (!card || selectedIds.has(card.id)) {
                        throw new Error(
                            'SelectAndOrderTopCardsEffect received an invalid discard-and-order selection.'
                        );
                    }

                    selectedIds.add(card.id);
                    return card;
                });
            };
            [discardedCard] = resolveSelection(response?.discarded, 1);
            const orderedSelection = resolveSelection(
                response?.selected,
                cards.length - 1
            );
            if (selectedIds.size !== cards.length) {
                throw new Error(
                    'SelectAndOrderTopCardsEffect received an incomplete discard-and-order selection.'
                );
            }

            if (response.skipDiscardOrderDialog === true) {
                this.match.skipDiscardOrderDialog = true;
            }
            orderedCards = orderedSelection;
        } else {
            orderedCards = [];
        }

        deck.cards.unshift(...orderedCards);
        deck.markKnown(orderedCards);
        deck.discardPile.push(discardedCard);
        await deck.refresh();

        this.discardedCard = discardedCard;
        this.orderedCards = orderedCards;
    }
}
