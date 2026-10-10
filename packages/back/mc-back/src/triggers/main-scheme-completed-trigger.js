import {Trigger} from './base/trigger.js';

export class MainSchemeCompletedTrigger extends Trigger {
    canTrigger(params) {
        const completedScheme = params.effect?.selectedTarget;

        return completedScheme?.id === this.card.id &&
            super.canTrigger(params);
    }
}
