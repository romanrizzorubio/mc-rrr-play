import { DIALOG_DISCARD_HAND} from 'mc-shared';

import {DiscardFromHandEffect} from './discard-from-hand-effect.js';
import {Effect} from './effect.js';

export class SelectDiscardToCardEffect extends Effect {
    constructor({
        count = 1,
        showDialog = true,
    }) {
        super(arguments[0]);

        this.count = count;
        this.showDialog = showDialog;

        this.cards = [];
    }
    getCostPaymentEffects(params) {
        return this.shouldPromptForPayment(params) ? [this] : [];
    }
    shouldPromptForPayment(_params, session) {
        const excludedCardIds = session?.getExcludedCardIds() || new Set();

        return this.selectedTarget.hand.cards.some(card =>
            !excludedCardIds.has(card.id));
    }
    getCostPaymentTitle() {
        const cards = this.count === 1 ? '1 carta' : `${this.count} cartas`;

        return this.title || `Descartar hasta ${cards} de la mano`;
    }
    async preparePayment(params, session) {
        const {selectedTarget, count} = this;
        const excludedCardIds = session.getExcludedCardIds();
        const cards = selectedTarget.hand.cards.filter(card =>
            !excludedCardIds.has(card.id));

        if (!cards.length) {
            return {
                cards: [],
                generators: [],
                hand: [],
            };
        }

        const response = await this.openDialog({
            dialogType: DIALOG_DISCARD_HAND,
            data: {
                count,
                upTo: true,
                cards: cards.map(card => card.toObj(params)),
            },
        });
        if (!response) {
            return undefined;
        }

        const selected = response.selected || [];
        const selectedCards = selected.map(selectedCard => {
            const card = cards.find(candidate => candidate.id === selectedCard.id);
            if (!card) {
                throw new Error('La selección de cartas para descartar no es válida.');
            }

            return card;
        });

        return {
            cards: selectedCards,
            generators: [],
            hand: selectedCards,
        };
    }
    async execute(params) {
        const {selectedTarget} = this;
        let selectedCards;
        if (params.costPaymentSession) {
            selectedCards = params.costPaymentSession.hasPayment(this) ?
                params.costPaymentSession.getPayment(this).cards :
                [];
        } else {
            const response = await this.openDialog({
                dialogType: DIALOG_DISCARD_HAND,
                data: {
                    count: this.count,
                    upTo: true,
                    cards: selectedTarget.hand.cards.map(card =>
                        card.toObj(arguments[0])),
                },
            });
            selectedCards = response?.selected;
        }

        if (selectedCards) {
            this.cards = selectedCards.map(card =>
                typeof card === 'string' ?
                    selectedTarget.hand.cards.find(c => c.id === card) :
                    selectedTarget.hand.cards.find(c => c.id === card.id) || card);

            const discardFromHandEffect = new DiscardFromHandEffect({
                match: this.match,
            });

            await this.promisesSequential(this.cards, async card => {
                discardFromHandEffect.selectedTarget = card;

                await discardFromHandEffect.runEffect(params);
            });
        }
    }
}
