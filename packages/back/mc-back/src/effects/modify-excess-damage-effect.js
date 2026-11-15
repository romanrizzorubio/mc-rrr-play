import {Effect} from './effect.js';

export class ModifyExcessDamageEffect extends Effect {
    constructor({count = 1}) {
        super(arguments[0]);

        this.count = count;
    }
    async canRun(params) {
        const attack = this.selectedTarget?.activation ??
            params.effect?.activation;

        return Number.isSafeInteger(this.count) &&
            this.count > 0 &&
            attack?.excessDamage > 0 &&
            await super.canRun(params);
    }
    execute() {
        const attack = this.selectedTarget?.activation;
        if (!attack || !Number.isSafeInteger(attack.excessDamage) ||
            attack.excessDamage < 1) {
            throw new Error(
                'ModifyExcessDamageEffect requires an attack with excess damage.',
            );
        }

        attack.excessDamage += this.count;
    }
}
