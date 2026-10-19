import {Effect} from './effect.js';

export class CancelCardEffectsEffect extends Effect {
    getEffectToCancel(params) {
        return [
            params.playCardEffect,
            params.triggeredEffect,
            params.effect,
        ].find(effect =>
            typeof effect?.cancelEffects === 'function'
        );
    }
    async canRun(params) {
        return Boolean(this.getEffectToCancel(params)) &&
            await super.canRun(params);
    }
    execute(params) {
        const effectToCancel = this.getEffectToCancel(params);

        if (!effectToCancel) {
            throw new Error('CancelCardEffectsEffect requires a cancellable effect.');
        }

        effectToCancel.cancelEffects(params);
    }
}
