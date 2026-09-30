import {Trigger} from './base/trigger.js';

export class AttachedWouldAttackTrigger extends Trigger {
    canTrigger(params) {
        const {card} = this;
        const {effect} = params;

        if (card.attachedTo.id === effect.character.id) {
            return super.canTrigger(params);
        }
    }
}