import {DiscardFromGameEffect} from './discard-from-game-effect.js';
import {TRIGGER_THIS_COUNTERS_REMOVED} from 'mc-shared';
import {Effect} from './effect.js';

export class RemoveCountersEffect extends Effect {
    constructor({
        count
    }) {
        super(arguments[0]);

        this.count = count;
        this.count = count;
    }
    async getCount(params) {
        const count = this.paramsCalc ?
            await this.calculate(params) :
            this.count;

        if (!Number.isFinite(count) || count < 0) {
            throw new Error('RemoveCountersEffect requires a non-negative counter count.');
        }

        return count;
    }
    filterTarget(card) {
        return card.counters > 0 &&
            super.filterTarget.apply(this, arguments);
    }
    async canRun(params) {
        this.count = await this.getCount(params);

        return this.count > 0 && super.canRun(params);
    }
    async prepare(params) {
        this.count = await this.getCount(params);
        await super.prepare(params);
    }
    isResolved() {
        return this.removedCounters > 0;
    }
    isFullResolved() {
        return this.removedCounters === this.count;
    }
    getTriggersEnds(params) {
        return super.getTriggersEnds(params)
            .concat([TRIGGER_THIS_COUNTERS_REMOVED]);
    }
    async execute(params) {
        const {selectedTarget, count} = this;

        this.removedCounters = Math.min(count, Math.max(0, selectedTarget.counters));
        if (!this.removedCounters) {
            return;
        }

        selectedTarget.removeCounters(this.removedCounters);

        await selectedTarget.refresh();

        if (selectedTarget.counters < 1 && selectedTarget.uses) {
            const discardFromGameEffect = new DiscardFromGameEffect({
                selectedTarget,
                match: this.match,
            });

            await discardFromGameEffect.runEffect(params);
        }
    }
}