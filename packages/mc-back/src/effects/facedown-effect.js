import {Effect} from "./effect.js";
import {ValidTarget} from "../engine/valid-target.js";
import {TARGET_CARD} from "../constants/targets.js";
import {path} from "../engine/utils.js";

export const EFFECT_FACEDOWN = 'facedown';
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

        const {cardsTarget} = this
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
    execute(params) {
        const {selectedTarget, cards} = this;

        selectedTarget.addFaceDown(cards);

        selectedTarget.refresh();
    }
}