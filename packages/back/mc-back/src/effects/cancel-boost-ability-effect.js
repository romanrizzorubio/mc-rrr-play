import {Effect} from './effect.js';

export class CancelBoostAbilityEffect extends Effect {
    canRun(params) {
        const boostEffect = this.selectedTarget ?? params.effect;

        return Boolean(
            boostEffect?.card?.boostAbility &&
            !boostEffect.cancelledBoostAbility &&
            super.canRun(params)
        );
    }
    execute(params) {
        const boostEffect = this.selectedTarget ?? params.effect;

        if (!boostEffect?.card?.boostAbility) {
            throw new TypeError(
                'CancelBoostAbilityEffect requires a boost card with a boost ability.'
            );
        }

        boostEffect.cancelledBoostAbility = true;
    }
}
