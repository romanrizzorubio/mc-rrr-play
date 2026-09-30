import {Effect} from './effect.js';

export class HealEffect extends Effect {
    constructor({
// HealEffect
        character: _character,
        damage,
        target: _target
    }) {
        super(arguments[0]);

        this.damage = damage;
    }
    filterTarget(card) {
        return card.canHeal &&
            super.filterTarget.apply(this, arguments);
    }

    execute(_params) {
        const {selectedTarget, damage} = this;

        selectedTarget.healDamage(damage);

        selectedTarget.refresh();
    }
}