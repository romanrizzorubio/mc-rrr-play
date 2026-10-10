import {Effect} from './effect.js';

export class CancelAttackEffect extends Effect {
    getAttackEffect(params) {
        const attackEffect = params.attack?.effect;

        if (typeof attackEffect?.cancelActivation === 'function') {
            return attackEffect;
        }

        return this.selectedTarget;
    }
    async canRun(params) {
        const attackEffect = this.getAttackEffect(params);

        if (typeof attackEffect?.cancelActivation !== 'function') {
            return false;
        }

        return super.canRun(params);
    }
    execute(params) {
        const attackEffect = this.getAttackEffect(params);

        if (typeof attackEffect?.cancelActivation !== 'function') {
            throw new Error('CancelAttackEffect requires a cancellable attack activation.');
        }

        attackEffect.cancelActivation();
    }
}