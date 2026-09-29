import {Effect} from "./effect.js";

export const EFFECT_PREVENT_PLACE_THREAT = 'prevent-place-threat';
export class PreventPlaceThreatEffect extends Effect {
    constructor({
// PreventDamageEffect
        threat = 0
    }) {
        super(arguments[0]);

        this.threat = threat;
        this.preventThreat = 0;
    }
    canRun(params) {
        const {effect} = params;
        const {threat} = effect;

        if (threat < 1) {
            return false;
        }

        return super.canRun(params);
    }
    execute(params) {
        const {effect} = params;
        const {threat} = effect;

        if (this.threat) {
            this.preventThreat += this.threat;
        } else {
            this.preventThreat = threat || 0;
        }
        effect.preventThreat = this.preventThreat;
    }
}