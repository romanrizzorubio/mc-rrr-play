import {Effect} from "./effect.js";
import {TARGET_ALL_CARDS, TARGET_ALL_PLAYERS, TARGET_CARD, TARGET_HAND_RANDOM} from "../constants/targets.js";
import {ValidTarget} from "../engine/valid-target.js";

export const EFFECT_RETURN_FACEDOWN = 'return-facedown';
export class ReturnFaceDownEffect extends Effect {
    constructor({
        faceDownTarget = TARGET_CARD,
        selectedFaceDown,
    }) {
        super(arguments[0]);

        this.faceDownTarget = faceDownTarget;
        this.selectedFaceDown = selectedFaceDown;
    }
    async prepare(params) {
        await super.prepare(params);

        const {selectedTarget, faceDownTarget} = this;

        const validTarget = new ValidTarget({
            match: this.match,
        });

        this.selectedFaceDown = await validTarget.selectTarget({
            ...params,
            target: faceDownTarget,
            cards: selectedTarget.faceDown,
        })
    }
    async execute(params) {
        const {selectedFaceDown} = this;

        await this.promisesSequential(selectedFaceDown, faceDown => {
            faceDown.returnToOwnerHand();
        })

        selectedFaceDown.refresh();
    }
}