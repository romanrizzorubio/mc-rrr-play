import {Trigger} from "./base/trigger.js";

export const TRIGGER_ATTACHED_DEFEAT = 'ATTACHED_DEFEAT';
export class AttachedDefeatTrigger extends Trigger {
    canTrigger(params) {
        const {card} = this;
        const {effect} = params;

        if (card.attachedTo.id === effect.selectedTarget.id) {
            return super.canTrigger(params);
        }
    }
}