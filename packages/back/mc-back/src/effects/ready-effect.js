import {Effect} from './effect.js';

export class ReadyEffect extends Effect {
    filterTarget(card) {
        return card.exhausted &&
            super.filterTarget.apply(this, arguments);
    }
    async execute(_params) {
        const {selectedTarget} = this;
        const selectedTargets = Array.isArray(selectedTarget) ?
            selectedTarget :
            selectedTarget ? [selectedTarget] : [];

        for (const target of selectedTargets) {
            await target.ready();
            await target.refresh();
        }
    }
}