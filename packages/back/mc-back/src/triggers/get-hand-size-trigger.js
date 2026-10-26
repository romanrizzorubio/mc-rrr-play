import {targetMap} from '../targets/index.js';

import {Trigger} from './base/trigger.js';

const matchesTarget = (candidate, selectedTarget) =>
    Boolean(candidate && selectedTarget) && (
        candidate === selectedTarget ||
        candidate.id === selectedTarget.id ||
        candidate.parent === selectedTarget ||
        candidate.parent?.id === selectedTarget.id ||
        selectedTarget.parent === candidate ||
        selectedTarget.parent?.id === candidate.id ||
        candidate.superhero === selectedTarget ||
        selectedTarget.owner === candidate
    );

export class GetHandSizeTrigger extends Trigger {
    constructor(params) {
        super(params);

        this.target = params.target;
    }
    canTrigger(params) {
        if (this.target) {
            const targetFn = targetMap[this.target];
            const candidates = targetFn ? targetFn({
                ...params,
                card: this.card,
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
