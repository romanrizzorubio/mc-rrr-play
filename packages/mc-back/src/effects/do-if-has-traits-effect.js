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

    async checkCondition(params, selectedTarget = this.selectedTarget) {
        const getTraitsEffect = new GetTraitsEffect({
            selectedTarget,
            match: this.match,
        });

        await getTraitsEffect.runEffect(params);

        return this.traits.some(trait => getTraitsEffect.traits.some(t => t === trait));
    }

    async canRun(params) {
        const validTargets = await this.getValidTarget(params);

        if (!validTargets.length || !await super.canRun(params)) {
            return false;
        }

        return Boolean(await this.promisesSequentialSome(validTargets, async selectedTarget => {
            const checked = await this.checkCondition(params, selectedTarget);
            const effect = checked ? this.effect : this.effectNot;

            if (!effect) {
                return true;
            }

            return effect.canRun(params);
        }));
    }
}