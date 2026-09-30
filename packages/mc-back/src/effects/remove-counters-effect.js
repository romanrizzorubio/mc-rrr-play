import {DiscardFromGameEffect} from './discard-from-game-effect.js';
import {Effect} from './effect.js';

export class RemoveCountersEffect extends Effect {
    constructor({
        count
    }) {
        super(arguments[0]);

        this.count = count;
    }

    filterTarget(card) {
        const {count} = this;

        return card.counters >= count &&
            super.filterTarget.apply(this, arguments);
    }
    async execute(params) {
        const {selectedTarget, count} = this;

        selectedTarget.removeCounters(count);

        selectedTarget.refresh();

        if (selectedTarget.counters < 1 && selectedTarget.uses) {
            const discardFromGameEffect = new DiscardFromGameEffect({
                selectedTarget,
                match: this.match,
            });

            await discardFromGameEffect.runEffect(params);
        }
    }
}