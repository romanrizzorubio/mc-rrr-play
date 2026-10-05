import {Effect} from './effect.js';

export class RequireDefenderEffect extends Effect {
    constructor({
        condition,
    }) {
        super(arguments[0]);

        if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
            throw new Error('RequireDefenderEffect requires a condition.');
        }

        this.condition = condition;
    }
    execute(params) {
        const attackEffect = params.attack?.effect;
        if (!attackEffect || typeof attackEffect.addDefenderCondition !== 'function') {
            throw new Error('RequireDefenderEffect requires an enemy attack context.');
        }

        attackEffect.addDefenderCondition(this.condition);
    }
}
