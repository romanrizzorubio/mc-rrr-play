import {Engine} from '../../engine/engine.js';

export class FaceDown extends Engine {
    constructor({
// FaceDown
        card,
        attached,
    }) {
        super();

        this.card = card;
        this.attached = attached;
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
        const {card: {
            name,
            isEncounterCard,
            isPlayerCard,
            isVillain,
            owner,
            card: {image},
        }} = this;

        return {
            ...super.toObj(arguments[0]),
            name,
            image,
            isEncounterCard,
            isPlayerCard,
            isVillain,
            owner: owner.name,
        };
    }
}