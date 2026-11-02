import {targetMap} from '../targets/index.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';

import {Trigger} from './base/trigger.js';

export class CharacterGetAttackTrigger extends Trigger {
    constructor(params) {
        super(params);

        this.target = params.target;
    }
    canTrigger(params) {
        if (this.target) {
            const targetFn = targetMap[this.target];
            const triggerPlayer = getTriggerCardPlayer(this.card, params.player);
            const candidates = targetFn ? targetFn({
                ...params,
                ability: this.ability,
                card: this.card,
                effect: params.effect,
                match: params.match,
                params,
                player: triggerPlayer?.isPlayer ?
                    triggerPlayer :
                    params.player,
                targetEffect: params.effect,
            }) : [];
            const selectedTarget = params.effect?.selectedTarget;

            if (!candidates.some(candidate =>
                CharacterGetAttackTrigger.matchesTarget(
                    candidate,
                    selectedTarget
                ))) {
                return false;
            }
        }

        return super.canTrigger(params);
    }
    static matchesTarget(candidate, selectedTarget) {
        return Boolean(candidate && selectedTarget) && (
            candidate === selectedTarget ||
            (candidate.id !== undefined &&
                candidate.id === selectedTarget.id) ||
            candidate.parent === selectedTarget ||
            candidate.parent?.id === selectedTarget.id ||
            selectedTarget.parent === candidate ||
            selectedTarget.parent?.id === candidate.id ||
            candidate.superhero === selectedTarget ||
            selectedTarget.owner === candidate
        );
    }
}
