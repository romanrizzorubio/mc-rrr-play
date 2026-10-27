import {Effect} from './effect.js';

export class PlaceCountersEffect extends Effect {
    constructor({
        counters,
        maxCounters,
    }) {
        super(arguments[0]);

        if (maxCounters !== undefined &&
            (!Number.isSafeInteger(maxCounters) || maxCounters < 0)) {
            throw new TypeError('maxCounters must be a non-negative integer.');
        }

        this.counters = counters;
        this.maxCounters = maxCounters;
    }
    execute(params) {
        const {selectedTarget, paramsCalc} = this;

        let counters = paramsCalc ?
            this.calculate(params) :
            this.counters || params.counters;

        if (this.maxCounters !== undefined) {
            const currentCounters = selectedTarget.counters ?? 0;
            if (!Number.isSafeInteger(counters) || counters < 0) {
                throw new TypeError('Counters must resolve to a non-negative integer.');
            }
            if (!Number.isSafeInteger(currentCounters) || currentCounters < 0) {
                throw new TypeError('Existing counters must be a non-negative integer.');
            }

            counters = Math.min(
                counters,
                Math.max(0, this.maxCounters - currentCounters),
            );
        }

        selectedTarget.placeCounters(counters);

        if (selectedTarget.attachedTo) {
            selectedTarget.attachedTo.refresh();
        } else {
            selectedTarget.refresh();
        }
    }
}