import {TARGET_CARD, TARGET_ENEMY} from 'mc-shared';
import {checkCondition} from '../engine/utils.js';
import {targetMap} from '../targets/index.js';
import {getTriggerCardPlayer} from '../utils/trigger-card-player.js';
import {Trigger} from './base/trigger.js';
import {getCharacterForDamageTarget} from './utils/character-for-damage-target.js';

export class CharacterWouldTakeDamageTrigger extends Trigger {
    static #targetIndexesByTrigger = new WeakMap();

    constructor({target = TARGET_CARD, condition, ...params}) {
        super(params);

        this.target = target;
        this.condition = condition;
        this._keepTriggering = false;
    }
    get keepTriggering() {
        return this._keepTriggering;
    }
    normalizeTarget(target) {
        return getCharacterForDamageTarget(target);
    }
    getTargetState(effect) {
        if (!effect || typeof effect !== 'object') {
            return {
                currentIndex: undefined,
                indexes: new Set(),
                resolutionId: undefined,
            };
        }

        let indexesByEffect = CharacterWouldTakeDamageTrigger
            .#targetIndexesByTrigger.get(this);
        if (!indexesByEffect) {
            indexesByEffect = new WeakMap();
            CharacterWouldTakeDamageTrigger
                .#targetIndexesByTrigger.set(this, indexesByEffect);
        }

        let state = indexesByEffect.get(effect);
        const resolutionId = effect.triggerResolutionId;

        if (!state || state.resolutionId !== resolutionId) {
            state = {
                currentIndex: undefined,
                indexes: new Set(),
                resolutionId,
            };
            indexesByEffect.set(effect, state);
        }

        return state;
    }
    getTargetIndexes(params, {requireDamage = true} = {}) {
        const player = getTriggerCardPlayer(
            this.card,
            params.player ?? this.card.owner
        );
        const {effect} = params;
        const selectedTargets = Array.isArray(effect?.selectedTarget) ?
            effect.selectedTarget :
            [effect?.selectedTarget];
        if (!effect || typeof effect !== 'object' ||
            selectedTargets.every(target => !target)) {
            return [];
        }

        const resolveTarget = targetMap[this.target];

        if (!resolveTarget) {
            throw new Error(`Unknown damage trigger target "${this.target}".`);
        }

        const triggerTargets = resolveTarget({
            ...params,
            player,
            ability: this.ability,
            card: this.card,
            condition: this.condition,
            match: params.match || this.card.match,
        }).flat(Infinity)
            .map(target => this.normalizeTarget(target))
            .filter(Boolean);

        return selectedTargets.reduce((indexes, target, index) => {
            const damageTargetWasEnemy = effect?.excessDamageTargetWasEnemy;
            const wasEnemy = Array.isArray(damageTargetWasEnemy) ?
                damageTargetWasEnemy[index] :
                damageTargetWasEnemy;
            const targetMatches = triggerTargets.includes(
                this.normalizeTarget(target)
            ) || (
                this.target === TARGET_ENEMY &&
                wasEnemy &&
                (!this.condition || checkCondition(target, this.condition))
            );

            if (targetMatches &&
                (!requireDamage ||
                    this.getTargetDamage(params, target, index) > 0)) {
                indexes.push(index);
            }

            return indexes;
        }, []);
    }
    getTargetIndex(params) {
        const {effect} = params;
        if (!effect || typeof effect !== 'object') {
            return undefined;
        }

        const state = this.getTargetState(effect);
        if (state.currentIndex !== undefined &&
            !state.indexes.has(state.currentIndex)) {
            return state.currentIndex;
        }

        return this.getTargetIndexes(params, {requireDamage: false})
            .find(index => !state.indexes.has(index));
    }
    getTarget(params, targetIndex) {
        const {effect} = params;
        const index = Number.isInteger(targetIndex) ?
            targetIndex :
            this.getTargetIndex(params);

        if (index === undefined) {
            return undefined;
        }

        return Array.isArray(effect?.selectedTarget) ?
            effect.selectedTarget[index] :
            effect?.selectedTarget;
    }
    getTargetDamage(
        params,
        target = this.getTarget(params),
        targetIndex
    ) {
        if (!target) {
            return 0;
        }

        const {effect} = params;
        if (Array.isArray(effect.takenDamage)) {
            const targets = Array.isArray(effect.selectedTarget) ?
                effect.selectedTarget :
                [effect.selectedTarget];
            const index = Number.isInteger(targetIndex) ?
                targetIndex :
                this.getTargetIndex(params) ??
                    targets.findIndex(selectedTarget =>
                        selectedTarget === target
                    );

            return index < 0 ? 0 : effect.takenDamage[index];
        }

        return effect.takenDamage;
    }
    async canTrigger(params, {requireDamage = true} = {}) {
        const {effect} = params;
        const state = this.getTargetState(effect);

        for (const targetIndex of this.getTargetIndexes(params, {
            requireDamage,
        })) {
            if (state.indexes.has(targetIndex)) {
                continue;
            }

            const abilityParams = this.getAbilityParams(params, targetIndex);
            if (await super.canTrigger(abilityParams)) {
                state.currentIndex = targetIndex;
                this._keepTriggering = state.indexes.size > 0;

                return true;
            }
        }

        state.currentIndex = undefined;
        this._keepTriggering = false;

        return false;
    }
    async runTrigger(params, isResolutionActive) {
        const {effect} = params;
        const state = this.getTargetState(effect);
        const targetIndex = state.currentIndex ?? this.getTargetIndex(params);
        if (targetIndex === undefined) {
            return;
        }

        this.triggered = false;
        this.paymentCancelled = false;
        try {
            await super.runTrigger(params, isResolutionActive);
            if (!this.paymentCancelled) {
                state.indexes.add(state.currentIndex ?? targetIndex);
            }
            this._keepTriggering = !this.paymentCancelled &&
                this.getTargetIndexes(params)
                    .some(index => !state.indexes.has(index));
        } finally {
            state.currentIndex = undefined;
        }
    }
    getAbilityParams(params, targetIndex) {
        const player = getTriggerCardPlayer(
            this.card,
            params.player ?? this.card.owner
        );
        const triggerParams = {
            ...params,
            player,
        };
        const index = Number.isInteger(targetIndex) ?
            targetIndex :
            this.getTargetIndex(triggerParams);
        const target = this.getTarget(triggerParams, index);

        return {
            ...super.getAbilityParams(triggerParams),
            triggeredTarget: target,
            triggeredTargetCharacter: this.normalizeTarget(target),
            triggeredTargetDamage: this.getTargetDamage(
                triggerParams,
                target,
                index
            ),
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
