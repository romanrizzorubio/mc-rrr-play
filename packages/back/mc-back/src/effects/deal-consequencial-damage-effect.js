import {DealDamageEffect} from './deal-damage-effect.js';

export class DealConsequencialDamageEffect extends DealDamageEffect {
    constructor(params) {
        super({
            ...params,
            suppressAbilityThwart: true,
        });
    }
    get isConsequential() {
        return true;
    }
    get isAttack() {
        return false;
    }
}