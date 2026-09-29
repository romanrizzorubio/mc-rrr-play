import {Effect} from "./effect.js";

export const EFFECT_TOUGH = 'tough';
export class ToughEffect extends Effect {
    filterTarget(card) {
        return !card.isTough &&
            super.filterTarget.apply(this, arguments);
    }
    execute(params) {
        const {selectedTarget} = this;

        selectedTarget.setTough();

        selectedTarget.refresh();
    }
}