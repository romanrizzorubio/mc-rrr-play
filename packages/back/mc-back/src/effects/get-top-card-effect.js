import {Effect} from './effect.js';

export class GetTopCardEffect extends Effect {
    constructor({
        remove = false,
        deckId,
    }) {
        super(arguments[0]);

        this.remove = remove;
        this.deckId = deckId;
        this.card = undefined;
        this.cards = [];
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.card = undefined;
        this.cards = [];
    }
    getDeck() {
        const {selectedTarget} = this;
        if (selectedTarget?.isPlayerExtraDeck) {
            return selectedTarget;
        }

        const owner = selectedTarget?.owner;

        return typeof owner?.getExtraDeck === 'function' ?
            owner.getExtraDeck(this.deckId) :
            owner?.extraDecks?.[this.deckId];
    }
    async canRun(params) {
        return Boolean(
            await super.canRun(params) &&
            this.getDeck()?.cards?.length
        );
    }
    async execute(params) {
        const {selectedTarget} = this;
        const deck = this.getDeck();
        const card = selectedTarget?.isPlayerExtraDeck ?
            deck?.cards?.[0] :
            selectedTarget;

        if (!card || !deck) {
            return;
        }

        this.card = card;
        this.cards = [card];
        params.selectedCard = card;
        params.selectedCards = [card];

        if (this.remove) {
            deck.removeCardFromDeck(card);
            await deck.checkCycle();
        }

        await deck.refresh();
    }
}
