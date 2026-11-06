import {Effect} from './effect.js';
import {path} from '../engine/utils.js';
import {selectItemForResolution} from '../utils/select-item-for-resolution.js';

export class ResolveCardsInOrderEffect extends Effect {
    constructor({
        cards: cardsSource,
        effectDefinition,
        title = 'Elige la próxima carta que se resolverá',
        chooseOrder = true,
        showSingleCardDialog = false,
    }) {
        super(arguments[0]);

        if (!effectDefinition || typeof effectDefinition !== 'object' ||
            Array.isArray(effectDefinition)) {
            throw new TypeError(
                'ResolveCardsInOrderEffect requires an effect definition.'
            );
        }

        this.cardsSource = cardsSource;
        this.effectDefinition = effectDefinition;
        this.title = title;
        this.chooseOrder = chooseOrder;
        this.showSingleCardDialog = showSingleCardDialog;
        this.cards = [];
        this.results = [];
        this.value = 0;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.cards = [];
        this.results = [];
        this.value = 0;
    }
    getCards(params) {
        const cards = typeof this.cardsSource === 'string' ?
            path(params, this.cardsSource) :
            this.cardsSource;
        if (!Array.isArray(cards)) {
            throw new TypeError(
                'ResolveCardsInOrderEffect cards must resolve to a card list.'
            );
        }

        return cards.slice();
    }
    async selectNextCard(cards, params) {
        return selectItemForResolution({
            items: cards,
            openDialog: dialog => this.openDialog(dialog),
            targetPlayer: params.player,
            title: this.title,
            showSingleCardDialog: this.showSingleCardDialog,
            getCard: card => ({
                ...card.toObj(params),
                id: card.id,
            }),
            getText: card => card.toObj(params).name ??
                card.card?.name ??
                card.id,
            invalidSelectionMessage:
                'ResolveCardsInOrderEffect received an invalid card selection.',
        });
    }
    async execute(params) {
        this.cards = this.getCards(params);
        this.results = [];
        this.value = 0;

        const remainingCards = this.cards.slice();
        while (remainingCards.length) {
            const card = this.chooseOrder ?
                await this.selectNextCard(remainingCards, params) :
                remainingCards[0];
            remainingCards.splice(remainingCards.indexOf(card), 1);

            const effect = this.match.effectsFactory.parseEffect(
                this.effectDefinition
            );
            if (!effect) {
                throw new Error(
                    'ResolveCardsInOrderEffect could not create its nested effect.'
                );
            }

            effect.ability = this.ability;
            await effect.runEffect({
                ...params,
                card,
                resolvedCard: card,
                resolvedCards: this.cards,
            });

            const value = Number.isFinite(effect.value) ?
                effect.value :
                0;
            this.results.push({card, effect, value});
            this.value += value;
        }
    }
}
