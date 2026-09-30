import {Effect} from './effect.js';

export class ExhaustEffect extends Effect {
    filterTarget(card) {
        return !card.exhausted &&
            super.filterTarget.apply(this, arguments);
    }
    execute(_params) {
        const {selectedTarget} = this;

        selectedTarget.exhaust();

        selectedTarget.refresh();
    }
}