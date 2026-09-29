import {Trigger} from "./base/trigger.js";
import {MixinAttachedTrigger} from "./mixins/mixin-attached-trigger.js";

export const TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE = 'ATTACHED_WOULD_DEALT_DAMAGE';
export class AttachedWouldDealtDamageTrigger extends MixinAttachedTrigger(Trigger) {
    async canTrigger(params) {
        const {card} = this;
        const {effect} = params;

        return card.attachedTo.id === effect.selectedTarget.id;
    }
}