import {Effect} from './effect.js';

export class HealEffect extends Effect {
    constructor({
// HealEffect
        character: _character,
        damage,
        target: _target,
        allowNoDamage = false,
    }) {
        super(arguments[0]);

        this.damage = damage;
        this.allowNoDamage = allowNoDamage;
    }
    filterTarget(card) {
        return (this.allowNoDamage || card.canHeal) &&
            super.filterTarget.apply(this, arguments);
    }

    async execute(params) {
        const {selectedTarget} = this;
        const damage = this.paramsCalc ?
            await this.calculate(params) :
            this.damage;

        selectedTarget.healDamage(damage);

        await selectedTarget.refresh();
    }
}