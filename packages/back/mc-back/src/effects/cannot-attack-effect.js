import {CannotValidationEffect} from './cannot-validation-effect.js';

export class CannotAttackEffect extends CannotValidationEffect {
    matchesEffect(effect) {
        return effect.isAttack === true;
    }
}
