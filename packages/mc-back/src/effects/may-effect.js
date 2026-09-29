import {Effect} from "./effect.js";

export const EFFECT_MAY = 'may';
export class MayEffect extends Effect {
    constructor({
// MayEffect
        effect,
    }) {
        super(arguments[0]);

        this.effect = effect;
    }
    get keepTriggering() {
        return this.effect.keepTriggering;
    }
    canRun(params) {
        return this.effect.canRun(params);
    }
    async prepare(params) {
        await super.prepare(params);

        const {effect} = this;

        if (effect.target === this.target) {
            effect.selectedTarget = this.selectedTarget;
        } else {
            await effect.prepare({
                ...params,
                effect: this,
            });
        }

        return this.selectedTarget;
    }
    execute(params) {
        const {effect} = this;

        return effect.runEffect(params)
    }
}