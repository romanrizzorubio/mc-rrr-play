import {TARGET_CARD} from 'mc-shared';
import {targetMap} from '../targets/index.js';
import {Trigger} from './base/trigger.js';
import {getCharacterForDamageTarget} from './utils/character-for-damage-target.js';

export class CharacterWouldTakeDamageTrigger extends Trigger {
    constructor({target = TARGET_CARD, condition, ...params}) {
        super(params);

        this.target = target;
        this.condition = condition;
    }
    normalizeTarget(target) {
        return getCharacterForDamageTarget(target);
    }
    getTarget(params) {
        const {effect} = params;
        const selectedTargets = Array.isArray(effect?.selectedTarget) ?
            effect.selectedTarget :
            [effect?.selectedTarget];
        const resolveTarget = targetMap[this.target];

        if (!resolveTarget) {
            throw new Error(`Unknown damage trigger target "${this.target}".`);
        }

        const triggerTargets = resolveTarget({
            ...params,
            ability: this.ability,
            card: this.card,
            condition: this.condition,
            match: params.match || this.card.match,
        }).map(target => this.normalizeTarget(target));

        return selectedTargets.find(target =>
            triggerTargets.includes(this.normalizeTarget(target))
        );
    }
    getTargetDamage(params, target = this.getTarget(params)) {
        if (!target) {
            return 0;
        }

        const {effect} = params;
        if (Array.isArray(effect.takenDamage)) {
            const targets = Array.isArray(effect.selectedTarget) ?
                effect.selectedTarget :
                [effect.selectedTarget];
            const targetIndex = targets.findIndex(selectedTarget =>
                selectedTarget === target
            );

            return targetIndex < 0 ? 0 : effect.takenDamage[targetIndex];
        }

        return effect.takenDamage;
    }
    canTrigger(params) {
        const target = this.getTarget(params);
        const abilityParams = this.getAbilityParams(params);

        return target &&
            this.getTargetDamage(params, target) > 0 &&
            super.canTrigger(abilityParams);
    }
    getAbilityParams(params) {
        const target = this.getTarget(params);

        return {
            ...super.getAbilityParams(params),
            triggeredTarget: target,
            triggeredTargetCharacter: this.normalizeTarget(target),
            triggeredTargetDamage: this.getTargetDamage(params, target),
        };
    }
    getName(params) {
        return super.getName(this.getAbilityParams(params));
    }
    getInterruptName(params) {
        const {
            effect,
            triggeredTargetCharacter,
            triggeredTargetDamage,
        } = params;
        const selectedTarget = Array.isArray(effect.selectedTarget) ?
            effect.selectedTarget[0] :
            effect.selectedTarget;
        const target = triggeredTargetCharacter ||
            getCharacterForDamageTarget(selectedTarget);
        const damage = triggeredTargetDamage ?? effect.damage;

        return `${target.name} va a sufrir ${damage} de Daño.`;
    }
}
