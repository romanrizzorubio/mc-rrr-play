import {Effect} from './effect.js';

export class ReadyEffect extends Effect {
    filterTarget(card) {
        return card.exhausted &&
            super.filterTarget.apply(this, arguments);
    }
    async canReadyTarget(target, params) {
        if (!target) {
            return true;
        }

        const owner = target.owner;

        if (!owner?.isPlayer || typeof owner.canReady !== 'function') {
            return true;
        }

        const card = target.parent?.sides?.includes(target) ?
            target.parent :
            target;

        return owner.canReady({...params, card});
    }
    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        const targets = (await this.getValidTarget(params)).flat(Infinity);

        return this.promisesSequentialSome(targets, target =>
            this.canReadyTarget(target, params));
    }
    async execute(params) {
        const {selectedTarget} = this;
        const selectedTargets = Array.isArray(selectedTarget) ?
            selectedTarget :
            selectedTarget ? [selectedTarget] : [];

        for (const target of selectedTargets) {
            if (!await this.canReadyTarget(target, params)) {
                continue;
            }

            await target.ready();
            await target.refresh();
        }
    }
}