import {Effect} from "./effect.js";
import {HealEffect} from "./heal-effect.js";

export class RecoveryEffect extends Effect {
    filterTarget(card) {
        return !!card.damage &&
            super.filterTarget.apply(this, arguments);
    }
    async execute(params) {
        const {selectedTarget} = this;

        const damage = params.damage || this.damage;

        const healEffect = new HealEffect({
            selectedTarget,
            damage,
            match: this.match,
        });

        return await healEffect.runEffect(params);
    }
}