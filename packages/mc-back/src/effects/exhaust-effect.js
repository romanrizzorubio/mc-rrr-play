import {Effect} from "./effect.js";

export const EFFECT_EXHAUST = 'exhaust';
export class ExhaustEffect extends Effect {
    filterTarget(card) {
        return !card.exhausted &&
            super.filterTarget.apply(this, arguments);
    }
    execute(params) {
        const {selectedTarget} = this;

        selectedTarget.exhaust();

        selectedTarget.refresh();
    }
}