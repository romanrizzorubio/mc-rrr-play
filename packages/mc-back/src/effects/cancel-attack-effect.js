import {Effect} from "./effect.js";

export const EFFECT_CANCEL_ATTACK = 'cancel-attack';
export class CancelAttackEffect extends Effect {
    execute(params) {
        const {selectedTarget} = this;

        selectedTarget.cancelActivation();
    }
}