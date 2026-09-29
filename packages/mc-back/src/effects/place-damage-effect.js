import {Effect} from "./effect.js";

export const EFFECT_PLACE_DAMAGE = 'place-damage';
export class PlaceDamageEffect extends Effect {
    constructor({
        damage,
    }) {
        super(arguments[0]);

        this.damage = damage;
    }
    execute(params) {
        const {selectedTarget} = this;

        const damage = this.damage || params.damage;

        selectedTarget.placeDamage(damage);

        if (selectedTarget.attachedTo) {
            selectedTarget.attachedTo.refresh();
        } else {
            selectedTarget.refresh();
        }
    }
}