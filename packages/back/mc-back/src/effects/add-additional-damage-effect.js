import {EFFECT_CATEGORY_DAMAGE} from 'mc-shared';

import {Effect} from './effect.js';

export class AddAdditionalDamageEffect extends Effect {
    constructor({
        count,
    }) {
        super(arguments[0]);

        this.count = count;
        this.addedDamage = 0;
    }
    async execute(params) {
        const damage = this.paramsCalc ?
            await this.calculate(params) :
            this.count;
        if (!Number.isSafeInteger(damage) || damage < 0) {
            throw new TypeError(
                'Additional damage must be a non-negative integer.'
            );
        }

        const target = this.selectedTarget;
        if (!target?.effectCategories?.includes(EFFECT_CATEGORY_DAMAGE) ||
            !Number.isFinite(target.damageModifier)) {
            throw new TypeError(
                'Additional damage requires a damage effect target.'
            );
        }

        target.damageModifier += damage;
        this.addedDamage = damage;
    }
}
