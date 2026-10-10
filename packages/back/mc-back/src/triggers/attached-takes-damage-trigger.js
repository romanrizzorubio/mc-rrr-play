import {Trigger} from './base/trigger.js';
import {getCurrentVillainStage} from '../utils/target-utils.js';

export class AttachedTakesDamageTrigger extends Trigger {
    async canTrigger(params) {
        const {attachedTo} = this.card;
        const {effect} = params;

        if (!attachedTo) {
            return false;
        }

        const selectedTargets = Array.isArray(effect.selectedTarget) ?
            effect.selectedTarget :
            [effect.selectedTarget];
        const targetIndex = selectedTargets.findIndex(target =>
            getCurrentVillainStage(target, effect.match)?.id === attachedTo.id);

        if (targetIndex < 0) {
            return false;
        }

        const takenDamage = Array.isArray(effect.takenDamage) ?
            effect.takenDamage[targetIndex] :
            effect.takenDamage;

        return takenDamage > 0 && super.canTrigger(params);
    }
}
