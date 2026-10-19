import {targetMap} from '../targets/index.js';

import {Trigger} from './base/trigger.js';

const matchesTarget = (candidate, selectedTarget) =>
    candidate === selectedTarget ||
    candidate?.id === selectedTarget?.id ||
    candidate?.parent === selectedTarget ||
    candidate?.parent?.id === selectedTarget?.id ||
    selectedTarget?.parent === candidate ||
    selectedTarget?.parent?.id === candidate?.id;

export class GetHandSizeTrigger extends Trigger {
    canTrigger(params) {
        if (this.target) {
            const targetFn = targetMap[this.target];
            const candidates = targetFn ? targetFn({
                ...params,
                effect: params.effect,
                match: params.match,
                params,
                player: params.player,
                targetEffect: params.effect,
            }) : [];
            const selectedTarget = params.effect?.selectedTarget;

            if (!candidates.some(candidate =>
                matchesTarget(candidate, selectedTarget))) {
                return false;
            }
        }

        return super.canTrigger(params);
    }
}
