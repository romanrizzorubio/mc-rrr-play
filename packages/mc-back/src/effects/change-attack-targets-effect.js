import {Effect} from './effect.js';

export class ChangeAttackTargetsEffect extends Effect {
    execute(params) {
        const attackEffect = params.attack?.effect;
        if (!attackEffect || typeof attackEffect.changeAttackTargets !== 'function') {
            throw new Error('ChangeAttackTargetsEffect requires an enemy attack context.');
        }

        attackEffect.changeAttackTargets(this.selectedTarget);
    }
}
