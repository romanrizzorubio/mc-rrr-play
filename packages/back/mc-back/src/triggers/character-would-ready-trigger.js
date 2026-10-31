import {TARGET_CARD} from 'mc-shared';
import {targetMap} from '../targets/index.js';
import {getAttachmentHost} from '../utils/attachment-utils.js';
import {Trigger} from './base/trigger.js';

export class CharacterWouldReadyTrigger extends Trigger {
    constructor({target = TARGET_CARD, ...params}) {
        super(params);
        this.target = target;
    }
    getTarget(params) {
        const resolveTarget = targetMap[this.target];
        if (!resolveTarget) {
            throw new Error(`Unknown ready trigger target "${this.target}".`);
        }

        const targets = resolveTarget({
            ...params,
            ability: this.ability,
            card: this.card,
            match: params.match || this.card.match,
        }).map(getAttachmentHost);
        const selectedTargets = Array.isArray(params.effect?.selectedTarget) ?
            params.effect.selectedTarget : [params.effect?.selectedTarget];

        return selectedTargets.find(target =>
            target &&
            target.exhausted &&
            !params.effect.isTargetCanceled(target) &&
            targets.includes(getAttachmentHost(target)));
    }
    canTrigger(params) {
        return Boolean(this.getTarget(params)) &&
            super.canTrigger(this.getAbilityParams(params));
    }
    getAbilityParams(params) {
        return {
            ...super.getAbilityParams(params),
            triggeredTarget: this.getTarget(params),
        };
    }
    getInterruptName(params) {
        return `${this.getTarget(params).name} va a prepararse.`;
    }
}
