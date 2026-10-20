import {TARGET_CARD} from 'mc-shared';
import {ValidTarget} from '../targets/valid-target.js';

import {Effect} from './effect.js';

export class FaceDownEffect extends Effect {
    constructor({
        cards,
        cardsTarget = TARGET_CARD,
    }) {
        super(arguments[0]);

        this.cards = cards;
        this.cardsTarget = cardsTarget;
    }
    async prepare(params) {
        await super.prepare(params);

        const {cardsTarget} = this;
        const validTarget = new ValidTarget({
            multipleTarget: true,
            match: this.match,
        });

        if (!this.cards?.length) {
            this.cards = await validTarget.selectTarget({
                ...params,
                target: cardsTarget,
                source: this.source,
            });
        }
    }
    async execute() {
        const {selectedTarget, cards} = this;
        const selectedCards = Array.isArray(cards) ? cards : [cards];
        const owners = new Set();

        selectedCards.forEach(card => {
            const owner = card.owner;
            if (owner?.hand?.cards.includes(card)) {
                owner.hand.discardHand(card);
                owners.add(owner);
            }
        });

        selectedTarget.addFaceDown(cards);

        await this.promisesSequential([...owners], owner => owner.hand.refresh());
        const refreshTarget = selectedTarget.gameZone || selectedTarget;
        await refreshTarget.refresh();
    }
}