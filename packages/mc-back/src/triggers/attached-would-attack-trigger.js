import {Trigger} from "./base/trigger.js";

export const TRIGGER_ATTACHED_WOULD_ATTACK = 'ATTACHED_WOULD_ATTACK';
export class AttachedWouldAttackTrigger extends Trigger {
    canTrigger(params) {
        const {card} = this;
        const {effect} = params;

        if (card.attachedTo.id === effect.character.id) {
            return super.canTrigger(params);
        }
    }
}