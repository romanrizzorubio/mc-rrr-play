import {Effect} from "./effect.js";

export const EFFECT_PLACE_COUNTER = 'place-counter';
export class PlaceCountersEffect extends Effect {
    constructor({
        counters,
    }) {
        super(arguments[0]);

        this.counters = counters;
    }
    execute(params) {
        const {selectedTarget, paramsCalc} = this;

        const counters = paramsCalc ?
            this.calculate(params) :
            this.counters || params.counters;

        selectedTarget.placeCounters(counters);

        if (selectedTarget.attachedTo) {
            selectedTarget.attachedTo.refresh();
        } else {
            selectedTarget.refresh();
        }
    }
}