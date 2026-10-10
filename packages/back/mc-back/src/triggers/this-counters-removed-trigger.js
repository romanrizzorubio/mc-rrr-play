import {Trigger} from './base/trigger.js';

export class ThisCountersRemovedTrigger extends Trigger {
    canTrigger(params) {
        const selectedTarget = params.effect?.selectedTarget;
        const targets = Array.isArray(selectedTarget) ?
            selectedTarget :
            [selectedTarget];
        const affectsThisCard = targets.some(target =>
            target === this.card ||
            (target?.id !== undefined &&
                target.id === this.card.id &&
                target.name === this.card.name)
        );

        return affectsThisCard && super.canTrigger(params);
    }
}
