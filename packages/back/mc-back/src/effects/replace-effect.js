import {Effect} from './effect.js';

export class ReplaceEffect extends Effect {
    constructor({replacement, ...params}) {
        super(params);

        this.replacement = replacement;
        this.effectCancelled = false;
    }
    get ability() {
        return super.ability;
    }
    set ability(ability) {
        super.ability = ability;

        if (this.replacement) {
            this.replacement.ability = ability;
        }
    }
    getEffectToReplace(params) {
        return params.replacedEffect || params.effect;
    }
    async canRun(params) {
        const effectToReplace = this.getEffectToReplace(params);

        return Boolean(
            this.replacement &&
            typeof effectToReplace?.cancel === 'function' &&
            await this.replacement.canRun(params) &&
            await super.canRun(params)
        );
    }
    isResolved() {
        return this.effectCancelled &&
            Boolean(this.replacement?.isResolved());
    }
    isFullResolved() {
        return this.effectCancelled &&
            Boolean(this.replacement?.isFullResolved());
    }
    async execute(params) {
        const effectToReplace = this.getEffectToReplace(params);

        if (typeof effectToReplace?.cancel !== 'function' || !this.replacement) {
            throw new Error('ReplaceEffect requires a cancellable effect and a replacement.');
        }

        effectToReplace.cancel(params);
        this.effectCancelled = true;
        await this.replacement.runEffect(params);
    }
}
