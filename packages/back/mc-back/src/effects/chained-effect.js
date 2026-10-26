import {TARGET_PARENT} from 'mc-shared';
import {getCurrentVillainStage} from '../utils/target-utils.js';

import {Effect} from './effect.js';

export class ChainedEffect extends Effect {
    static getNestedEffects(value) {
        if (value instanceof Effect) {
            return [value];
        }

        return Array.isArray(value) ?
            value.flatMap(nested => this.getNestedEffects(nested)) :
            [];
    }
    static inheritTargetCondition(effect, target, condition, visited = new Set()) {
        if (visited.has(effect)) {
            return;
        }
        visited.add(effect);

        if (effect.target === target && !effect.condition) {
            effect.condition = condition;
            effect.validTarget.condition = condition;
        }

        Object.values(effect)
            .flatMap(value => this.getNestedEffects(value))
            .forEach(nestedEffect =>
                this.inheritTargetCondition(
                    nestedEffect,
                    target,
                    condition,
                    visited
                ));
    }
    constructor({
// ChainedEffect
        effects = [],
        outputParams = [],
        deckId,
    }) {
        super(arguments[0]);

        this.effects = effects;
        this.outputParams = outputParams;
        this.deckId = deckId;

        effects.forEach(effect => {
            if (!effect.target) {
                effect.target = this.target;
            }
            if (this.condition?.name) {
                this.constructor.inheritTargetCondition(
                    effect,
                    this.target,
                    this.condition
                );
            }

            return effect;
        });
    }
    get ability() {
        return super.ability;
    }
    set ability(ability) {
        super.ability = ability;
        this.effects.forEach(effect => {
            effect.ability = ability;
        });
    }
    get activationEnd() {
        return this.effects.every(effect => effect.activationEnd);
    }
    isResolved() {
        return this.effects.some(effect => effect.isResolved());
    }
    isFullResolved() {
        return this.effects.every(effect => effect.isFullResolved());
    }
    async getCostPaymentEffects(params) {
        const newParams = this.getEffectParams(params);
        const effects = await Promise.all(this.effects.map(effect =>
            effect.getCostPaymentEffects(newParams)));

        return effects.flat();
    }
    getEffectParams(params) {
        const {selectedTarget} = this;
        const targetPlayer = selectedTarget && selectedTarget.isPlayer ?
            selectedTarget :
            params.targetPlayer;
        const parentTargets = selectedTarget === undefined ?
            this.getValidTarget(params).flat(Infinity) :
            selectedTarget === null ?
                [] :
                Array.isArray(selectedTarget) ?
                    selectedTarget.flat(Infinity) :
                    [selectedTarget];

        return {
            ...params,
            effects: this.effects,
            parentTargets,
            ...(targetPlayer ? {targetPlayer} : {}),
        };
    }
    getPaymentResourcePreferences() {
        return [
            ...super.getPaymentResourcePreferences(),
            ...this.effects.flatMap(effect =>
                effect.getPaymentResourcePreferences())
        ];
    }
    getExclusivePaymentResourcePreferences() {
        return [
            ...super.getExclusivePaymentResourcePreferences(),
            ...this.effects.flatMap(effect =>
                effect.getExclusivePaymentResourcePreferences())
        ];
    }
    async confirmBeforeResolve(params) {
        const effectParams = this.getEffectParams(params);
        for (const effect of this.effects) {
            if (typeof effect.confirmBeforeResolve === 'function' &&
                !await effect.confirmBeforeResolve(effectParams)) {
                return false;
            }
        }

        return true;
    }
    requiresAll(params) {
        return Boolean(
            params.isCost ||
            params.costPaymentSession?.requireAllCosts ||
            this.thenEffect
        );
    }
    canRun(params) {
        const newParams = this.getEffectParams(params);

        if (this.requiresAll(params)) {
            return this.promisesSequentialEvery(this.effects, effect =>
                effect.canRun(newParams));
        }

        const requiredEffects = this.effects.filter(effect =>
            effect.isRequiredForAbilityAvailability);

        if (requiredEffects.length) {
            return this.promisesSequentialEvery(requiredEffects, effect =>
                effect.canRun(newParams));
        }

        return this.promisesSequentialSome(this.effects, effect =>
            effect.canRun(newParams));
    }
    async prepare(params) {
        await super.prepare(params);

        await this.promisesSequential(this.effects, async effect => {
            if (effect.target === this.target ||
                effect.target === TARGET_PARENT) {
                effect.selectedTarget = this.selectedTarget;
            } else if (effect.refreshTarget &&
                !params.preserveNestedSelectedTargets &&
                !params.preselectedEffectTargets?.has(effect)) {
                effect.selectedTarget = undefined;
            }
        });

        return this.selectedTarget;
    }
    async prepareCost(params, session) {
        if (!await super.prepareCost(params, session)) {
            return false;
        }

        const {effectParams} = session.getPreparedEffect(this);
        const newParams = this.getEffectParams(effectParams);
        session.prepareExecutionParams(this, newParams);

        for (const effect of this.effects) {
            if (!await effect.prepareCost(newParams, session)) {
                return false;
            }
        }

        return true;
    }
    async execute(params) {
        const requiresAll = this.requiresAll(params);
        const newParams = params.costPaymentSession?.getExecutionParams(this) ||
            this.getEffectParams(params);

        await this.promisesSequential(this.effects, async effect => {
            this.selectedTarget = getCurrentVillainStage(
                this.selectedTarget,
                this.match
            );
            if (effect.target === this.target ||
                effect.target === TARGET_PARENT) {
                effect.selectedTarget = this.selectedTarget;
            }

            if (newParams.costPaymentSession?.isPrepared(effect) ||
                await effect.canRun(newParams)) {
                await effect.runEffect(newParams);

                if (effect.paymentCancelled) {
                    this.paymentCancelled = true;
                    return false;
                }

                if (requiresAll && !effect.isFullResolved()) {
                    return false;
                }
            } else if (requiresAll) {
                return false;
            }
        });

        this.outputParams.forEach(param => {
            params[param] = newParams[param];
        });
    }
}