import {CANCEL_ENCOUNTER_NOT} from '../../effects/cancel-encounter-constants.js';

export const MixinTreacheryTrigger = C => class extends C {
    constructor(params) {
        super(params);
    }
    canTrigger(params) {
        const {effect} = params;

        if (effect.selectedTarget.isTreachery &&
            effect.canceled === CANCEL_ENCOUNTER_NOT) {
            return super.canTrigger(params);
        }

        return false;
    }
};