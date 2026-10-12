import {randomUUID} from 'node:crypto';

import {Engine} from '../../engine/engine.js';

export class FaceDown extends Engine {
    constructor({
// FaceDown
        card,
        attached,
        isFutureBoost = false,
    }) {
        super();

        this.card = card;
        this.attached = attached;
        this.isFutureBoost = isFutureBoost;
        this.id = randomUUID();
    }
    discard() {
        return this.card.discard();
    }
    removeCard() {
        const {attached} = this;

        const index = attached.faceDown.indexOf(this);

        if (index > -1) {
            attached.faceDown.splice(index, 1);
        }
    }
    returnToOwnerHand() {
        const {card} = this;

        this.removeCard();

        card.owner.hand.addCard(card);
    }
    toObj() {
        if (this.isFutureBoost) {
            return {
                ...super.toObj(arguments[0]),
                isEncounterCard: true,
                isFutureBoost: true,
            };
        }

        const {card} = this;

        return {
            ...super.toObj(arguments[0]),
            id: this.id,
            isFaceDown: true,
            isEncounterCard: card.isEncounterCard,
            isPlayerCard: card.isPlayerCard,
            owner: card.owner?.name,
        };
    }
}