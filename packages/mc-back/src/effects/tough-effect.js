import {Effect} from './effect.js';

export class ToughEffect extends Effect {
    filterTarget(card) {
        return !card.isTough &&
            super.filterTarget.apply(this, arguments);
    }
    execute(_params) {
        const {selectedTarget} = this;

        selectedTarget.setTough();

        selectedTarget.refresh();
    }
}