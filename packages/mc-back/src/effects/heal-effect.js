import {Effect} from "./effect.js";

export const EFFECT_HEAL = 'heal';
export class HealEffect extends Effect {
    constructor({
// HealEffect
        character,
        damage,
        target
    }) {
        super(arguments[0]);

        this.damage = damage;
    }
    filterTarget(card) {
        return card.canHeal &&
            super.filterTarget.apply(this, arguments);
    }

    execute(params) {
        const {selectedTarget, damage} = this;

        selectedTarget.healDamage(damage);

        selectedTarget.refresh();
    }
}