import {YouDealDamageTrigger} from './you-deal-damage-trigger.js';

export class YouDealtExcessDamageTrigger extends YouDealDamageTrigger {
    static #targetIndexesByTrigger = new WeakMap();

    constructor(params) {
        super(params);
    }
    get keepTriggering() {
        return true;
    }
    getDamageValue(effect, property, index) {
        const value = effect?.[property];

        return Array.isArray(value) ? value[index] ?? 0 : value ?? 0;
    }
    getTriggeredTargetIndexes(effect) {
        let indexesByEffect = YouDealtExcessDamageTrigger.#targetIndexesByTrigger
            .get(this);
        if (!indexesByEffect) {
            indexesByEffect = new WeakMap();
            YouDealtExcessDamageTrigger.#targetIndexesByTrigger.set(
                this,
                indexesByEffect
            );
        }

        let state = indexesByEffect.get(effect);
        const resolutionId = effect.triggerResolutionId;

        if (!state || state.resolutionId !== resolutionId) {
            state = {
                resolutionId,
                indexes: new Set(),
            };
            indexesByEffect.set(effect, state);
        }

        return state.indexes;
    }
    getExcessTarget(params, targetIndex) {
        const effect = params.effect;
        if (!effect || typeof effect !== 'object') {
            return undefined;
        }

        const targets = Array.isArray(effect.selectedTarget) ?
            effect.selectedTarget :
            [effect.selectedTarget];
        const triggeredTargetIndexes = this.getTriggeredTargetIndexes(effect);

        const indexes = Number.isInteger(targetIndex) ?
            [targetIndex] :
            targets.map((_, index) => index);

        for (const index of indexes) {
            const target = targets[index];
            if (!target ||
                triggeredTargetIndexes.has(index) ||
                this.getDamageValue(effect, 'excessDamage', index) <= 0) {
                continue;
            }

            const character = this.normalizeTarget(target);
            const wasEnemy = Array.isArray(effect.excessDamageTargetWasEnemy) ?
                effect.excessDamageTargetWasEnemy[index] :
                effect.excessDamageTargetWasEnemy;
            if (!(wasEnemy ??
                (character?.isMinion || character?.isVillain))) {
                continue;
            }

            return {
                index,
                target,
            };
        }

        return undefined;
    }
    getTargetIndexes(params, options) {
        return super.getTargetIndexes(params, options).filter(index =>
            this.getExcessTarget(params, index)
        );
    }
    getTarget(params, targetIndex) {
        const index = Number.isInteger(targetIndex) ?
            targetIndex :
            this.getTargetIndex(params);

        return this.getExcessTarget(params, index)?.target;
    }
    async runTrigger(params, isResolutionActive) {
        const targetState = this.getTargetState(params.effect);
        const targetIndex = targetState.currentIndex ??
            this.getTargetIndex(params);
        const excessTarget = this.getExcessTarget(params, targetIndex);
        if (!excessTarget) {
            targetState.currentIndex = undefined;

            return;
        }

        this.getTriggeredTargetIndexes(params.effect).add(excessTarget.index);

        const effect = Object.create(params.effect);
        effect.selectedTarget = excessTarget.target;
        Object.defineProperty(effect, 'takenDamage', {
            value: this.getDamageValue(
                params.effect,
                'takenDamage',
                excessTarget.index
            ),
        });
        Object.defineProperty(effect, 'excessDamageTargetWasEnemy', {
            value: this.getDamageValue(
                params.effect,
                'excessDamageTargetWasEnemy',
                excessTarget.index
            ),
        });
        effect.damage = this.getDamageValue(
            params.effect,
            'damage',
            excessTarget.index
        );
        effect.preventDamage = this.getDamageValue(
            params.effect,
            'preventDamage',
            excessTarget.index
        );
        effect.excessDamage = this.getDamageValue(
            params.effect,
            'excessDamage',
            excessTarget.index
        );

        try {
            await super.runTrigger({
                ...params,
                effect,
            }, isResolutionActive);
        } finally {
            targetState.indexes.add(excessTarget.index);
            targetState.currentIndex = undefined;
        }
    }
}
