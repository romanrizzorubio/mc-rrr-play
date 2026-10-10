import {Effect} from './effect.js';
import {getActivationEffect} from './utils/get-activation-effect.js';

export class CancelActivationEffect extends Effect {
    getActivationEffect(params) {
        return getActivationEffect(params, this.selectedTarget);
    }
    async canRun(params) {
        return Boolean(this.getActivationEffect(params)) && super.canRun(params);
    }
    execute(params) {
        const activationEffect = this.getActivationEffect(params);

        if (!activationEffect) {
            throw new Error('CancelActivationEffect requires a cancellable activation.');
        }

        activationEffect.cancelActivation();
    }
}
