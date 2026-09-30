import {DoIfEffect} from './do-if-effect.js';
import {GetTraitsEffect} from './get-traits-effect.js';

export class DoIfHasTraitsEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        traits,
        effect: _effect,
        effectNot: _effectNot,
// DoIfHasDamageEffect
        resources: _resources = [],
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