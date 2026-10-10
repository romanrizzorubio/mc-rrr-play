import {Trigger} from './base/trigger.js';
import {MixinAttachedTrigger} from './mixins/mixin-attached-trigger.js';
import {getCharacterForDamageTarget} from './utils/character-for-damage-target.js';

export class AttachedWouldDealtDamageTrigger extends MixinAttachedTrigger(Trigger) {
    getInterruptName({effect}) {
        const selectedTarget = Array.isArray(effect.selectedTarget) ?
            effect.selectedTarget[0] :
            effect.selectedTarget;
        const target = getCharacterForDamageTarget(selectedTarget);

        return `${target.name} va a sufrir ${effect.damage} de Daño.`;
    }
    async canTrigger(params) {
        const {card} = this;
        const {effect} = params;

        return card.attachedTo.id === effect.selectedTarget.id;
    }
}