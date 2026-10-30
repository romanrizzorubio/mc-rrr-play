import {Trigger} from './base/trigger.js';

export class WouldAddAccelerationTokenTrigger extends Trigger {
    constructor(params = {}) {
        super(params);

        const triggerParams = params.triggerParams ?? params;
        this.excludeSourceCard = triggerParams.excludeSourceCard;
    }
    canTrigger(params) {
        if (!params.effect?.selectedTarget?.isScheme) {
            return false;
        }
        if (this.excludeSourceCard) {
            const sourceCard = this.card?.parent ?? this.card;
            const targetCard = params.effect?.selectedTarget?.parent ??
                params.effect?.selectedTarget;
            if (sourceCard === targetCard) {
                return false;
            }
        }

        return super.canTrigger(params);
    }
}
