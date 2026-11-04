import {Effect} from './effect.js';

export class RepeatEffect extends Effect {
    constructor({count, effectDefinition, ...params}) {
        super(params);

        if (!Number.isSafeInteger(count) || count < 1) {
            throw new TypeError(
                'RepeatEffect requires a positive integer count.'
            );
        }
        if (!effectDefinition || typeof effectDefinition !== 'object' ||
            Array.isArray(effectDefinition)) {
            throw new TypeError('RepeatEffect requires an effect definition.');
        }

        this.count = count;
        this.effectDefinition = effectDefinition;
        this.results = [];
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.results = [];
    }
    createRepeatedEffect() {
        const effect = this.match.effectsFactory.parseEffect(
            this.effectDefinition
        );
        if (!effect) {
            throw new Error('RepeatEffect could not create its nested effect.');
        }

        effect.ability = this.ability;

        return effect;
    }
    async canRun(params) {
        return this.createRepeatedEffect().canRun(params);
    }
    async execute(params) {
        this.results = [];

        for (let index = 0; index < this.count; index++) {
            const effect = this.createRepeatedEffect();
            this.results.push(effect);

            if (!await effect.canRun(params)) {
                continue;
            }

            await effect.runEffect(params);

            if (effect.paymentCancelled) {
                this.paymentCancelled = true;
                return false;
            }
        }
    }
    isResolved() {
        return this.results.some(effect => effect.isResolved());
    }
    isFullResolved() {
        return this.results.length === this.count &&
            this.results.every(effect => effect.isFullResolved());
    }
}
