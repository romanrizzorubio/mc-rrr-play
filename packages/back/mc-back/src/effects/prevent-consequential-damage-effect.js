import {Effect} from './effect.js';

export class PreventConsequentialDamageEffect extends Effect {
    execute(params) {
        const ability = params.triggeredEffect?.ability;
        if (!ability?.isBasic || !ability.card?.isAlly) {
            throw new Error(
                'PreventConsequentialDamageEffect requires an Ally basic ability.'
            );
        }

        ability.preventConsequentialDamage = true;
    }
}
