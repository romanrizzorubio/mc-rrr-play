import {DoIfEffect} from "./do-if-effect.js";
import {GetThwartEffect} from "./get-thwart-effect.js";
import {GetTraitsEffect} from "./get-traits-effect.js";

export const EFFECT_DO_IF_HAS_TRAITS = 'do-if-has-traits';
export class DoIfHasTraitsEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        traits,
        effect,
        effectNot,
// DoIfHasDamageEffect
        resources = [],
    }) {
        super(arguments[0]);

        this.traits = traits;
    }

    async checkCondition(params) {
        const {selectedTarget} = this;

        const getTraitsEffect = new GetTraitsEffect({
            selectedTarget,
            match: this.match,
        });

        await getTraitsEffect.runEffect(params);

        return this.traits.some(trait => getTraitsEffect.traits.some(t => t === trait));
    }
}