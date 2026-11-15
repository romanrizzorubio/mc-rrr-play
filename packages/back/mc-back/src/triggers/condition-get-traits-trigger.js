import {targetMap} from '../targets/index.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';
import {Trigger} from './base/trigger.js';
import {MixinConditionTrigger} from './mixins/mixin-condition-trigger.js';

const matchesTarget = (candidate, selectedTarget) =>
    Boolean(candidate && selectedTarget) && (
        candidate === selectedTarget ||
        (candidate.id !== undefined &&
            candidate.id === selectedTarget.id) ||
        candidate.parent === selectedTarget ||
        candidate.parent?.id === selectedTarget.id ||
        selectedTarget.parent === candidate ||
        selectedTarget.parent?.id === candidate.id
    );

export class ConditionGetTraitsTrigger extends MixinConditionTrigger(Trigger) {
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

            if (!candidates.some(candidate =>
                matchesTarget(candidate, params.effect?.selectedTarget))) {
                return false;
            }
        }

        return super.canTrigger(params);
    }
}