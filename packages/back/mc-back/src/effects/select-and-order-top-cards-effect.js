import {
    DECK_POSITION_BOTTOM,
    DECK_POSITION_TOP,
    DIALOG_DISCARD_ORDER,
    PLACE_DISCARD_PILE,
    PLACE_HAND,
} from 'mc-shared';

import {Effect} from './effect.js';

export class SelectAndOrderTopCardsEffect extends Effect {
    constructor({
        count = 1,
        orderTitle = 'Elige el orden de las cartas que vuelven al mazo',
        title = 'Elige una carta para descartar',
        selectionDestination = PLACE_DISCARD_PILE,
        returnPosition = DECK_POSITION_TOP,
        selectionHeading,
        returnHeading,
        selectionInstructions,
        selectionDropText,
        confirmText,
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
        if (![PLACE_DISCARD_PILE, PLACE_HAND].includes(selectionDestination)) {
            throw new TypeError(
                'SelectAndOrderTopCardsEffect selectionDestination must be a player card location.'
            );
        }
        if (![DECK_POSITION_TOP, DECK_POSITION_BOTTOM].includes(returnPosition)) {
            throw new TypeError(
                'SelectAndOrderTopCardsEffect returnPosition must be top or bottom.'
            );
        }
        this.selectionDestination = selectionDestination;
        this.returnPosition = returnPosition;
        this.selectionHeading = selectionHeading ??
            (selectionDestination === PLACE_HAND ?
                'Carta que añades a tu mano' :
                'Descartar');
        this.returnHeading = returnHeading ??
            (returnPosition === DECK_POSITION_BOTTOM ?
                'Cartas que van al fondo del mazo' :
                'Cartas que vuelven al mazo');
        this.selectionInstructions = selectionInstructions;
        this.selectionDropText = selectionDropText;
        this.confirmText = confirmText;
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
                targetPlayer: params.player,
                title: this.orderTitle,
                ...(this.selectionInstructions === undefined ||
                    this.selectionInstructions === null ? {
                        subtitle: `${this.title}. La carta de la izquierda quedará ${
                            this.returnPosition === DECK_POSITION_BOTTOM ?
                                'primero al llegar al fondo' :
                                'en la parte superior'
                        } del mazo.`,
                    } : {}),
                data: {
                    cards: cards.map(card => ({
                        ...card.toObj(params),
                        id: card.id,
                    })),
                    discardCount: 1,
                    allowReorder: true,
                    selectionHeading: this.selectionHeading,
                    returnHeading: this.returnHeading,
                    selectionInstructions: this.selectionInstructions,
                    selectionDropText: this.selectionDropText,
                    returnPosition: this.returnPosition,
                    confirmText: this.confirmText,
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

        deck.forgetKnown(cards);
        if (this.returnPosition === DECK_POSITION_BOTTOM) {
            deck.cards.push(...orderedCards);
        } else {
            deck.cards.unshift(...orderedCards);
        }
        if (this.returnPosition === DECK_POSITION_TOP) {
            deck.markKnown(orderedCards);
        }
        if (this.selectionDestination === PLACE_HAND) {
            if (typeof params.player?.hand?.addCard !== 'function') {
                throw new TypeError(
                    'SelectAndOrderTopCardsEffect requires a player hand to add the selected card.'
                );
            }
            params.player.hand.addCard(discardedCard);
            await params.player.hand.refresh();
        } else if (typeof deck.discard === 'function') {
            await deck.discard(discardedCard);
        } else {
            deck.discardPile.push(discardedCard);
            await deck.checkCycle?.();
        }
        await deck.refresh();

        this.discardedCard = discardedCard;
        this.orderedCards = orderedCards;
    }
}
