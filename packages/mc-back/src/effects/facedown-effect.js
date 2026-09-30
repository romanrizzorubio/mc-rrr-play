import {TARGET_CARD} from '../constants/targets.js';
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

        if (!this.cards || !this.cards.length) {
            this.cards = await validTarget.selectTarget({
                ...params,
                target: cardsTarget,
                source: this.source,
            });
        }
    }
    execute(_params) {
        const {selectedTarget, cards} = this;

        selectedTarget.addFaceDown(cards);

        selectedTarget.refresh();
    }
}