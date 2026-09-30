import {Effect} from './effect.js';

export class ReadyEffect extends Effect {
    filterTarget(card) {
        return card.exhausted &&
            super.filterTarget.apply(this, arguments);
    }
    async execute(_params) {
        const {selectedTarget} = this;

        if (selectedTarget) {
            await selectedTarget.ready();
            selectedTarget.refresh();
        }
    }
}