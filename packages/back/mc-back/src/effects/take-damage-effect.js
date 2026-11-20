import {
    DIALOG_LIST,
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_PLACE_DAMAGE,
    PRIORITY_FORCED_INTERRUPT,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_ATTACHED_TAKES_DAMAGE,
    TRIGGER_YOU_DEAL_DAMAGE,
    TRIGGER_YOU_DEALT_EXCESS_DAMAGE,
} from 'mc-shared';

import {Effect} from './effect.js';
import {AttackEffect} from './attack-effect.js';
import {
    calculateExcessDamage,
    canResolveDamageWithStatus,
    defeatCharacter,
    defeatCharacterIfLethal,
    getDamageStatusTarget,
    isEnemyDamageTarget,
    isCharacterLethal,
    resolveDamageStatus,
    resolveToughDamage,
} from '../utils/damage-resolution.js';

export class TakeDamageEffect extends AttackEffect(Effect) {
    constructor({
        character,
        damage,
        ignoreTough = false,
        preventDamage = 0,
        attackKeywordSource,
        isConsequential = false,
    }) {
        super(arguments[0]);

        this._character = character;
        this.initialDamage = damage;
        this.damage = damage;
        this.ignoreTough = ignoreTough;
        this.attackKeywordSource = attackKeywordSource;
        this.isConsequential = isConsequential;
        this.initialPreventDamage = Array.isArray(preventDamage) ?
            preventDamage.slice() :
            preventDamage;

        this.preventDamage = Array.isArray(this.initialPreventDamage) ?
            this.initialPreventDamage.slice() :
            this.initialPreventDamage;
        this.excessDamage = 0;
        this.excessDamageTargetWasEnemy = undefined;
        this.canceled = false;
        this.defeated = false;
        this.costDamagePreventionReasons = new Set();
        this.costRequiredDamage = undefined;
        this.costBlockedDialogShown = false;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.damage = this.initialDamage;
        this.preventDamage = Array.isArray(this.initialPreventDamage) ?
            this.initialPreventDamage.slice() :
            this.initialPreventDamage;
        this.excessDamage = 0;
        this.excessDamageTargetWasEnemy = undefined;
        this.canceled = false;
        this.defeated = false;
        this.costDamagePreventionReasons.clear();
        this.costRequiredDamage = undefined;
        this.costBlockedDialogShown = false;
    }
    getResolutionChildEffects() {
        const effects = super.getResolutionChildEffects();
        // The originating attack is context, not a child to reset during damage.
        effects.delete(this.attackKeywordSource);
        return effects;
    }
    cancel({triggeredTarget} = {}) {
        const {selectedTarget} = this;

        if (!Array.isArray(selectedTarget) || !triggeredTarget) {
            this.canceled = true;
            return;
        }

        const targetIndex = selectedTarget.findIndex(target =>
            target === triggeredTarget ||
            (triggeredTarget.id !== undefined &&
                target?.id === triggeredTarget.id &&
                target.name === triggeredTarget.name)
        );
        if (targetIndex < 0) {
            throw new Error('TakeDamageEffect could not find the replaced damage target.');
        }

        const damage = Array.isArray(this.damage) ?
            this.damage.slice() :
            selectedTarget.map(() => this.damage);
        const prevention = Array.isArray(this.preventDamage) ?
            this.preventDamage.slice() :
            selectedTarget.map(() => this.preventDamage ?? 0);

        prevention[targetIndex] = damage[targetIndex];
        this.damage = damage;
        this.preventDamage = prevention;
        this.canceled = !this.checkTrigger();
    }
    get effectCategories() {
        return [EFFECT_CATEGORY_DAMAGE];
    }
    get character() {
        return this._character || super.character;
    }
    getAttackKeyword(name) {
        if (this.attackKeywordSource?.isAttack &&
            typeof this.attackKeywordSource.getAttackKeyword === 'function') {
            return Boolean(
                this.attackKeywordSource.getAttackKeyword(name) ||
                super.getAttackKeyword(name)
            );
        }

        return super.getAttackKeyword(name);
    }
    get takenDamage() {
        if (this.damage instanceof Array) {
            if (this.preventDamage instanceof Array) {
                return this.damage.map((damage, index) =>
                    Math.max(0, damage - this.preventDamage[index]));
            }
            return this.damage.map(damage =>
                Math.max(0, damage - this.preventDamage));
        }
        return Math.max(0, this.damage - this.preventDamage);
    }
    canRun(params) {
        const damage = this.paramsCalc ?
            this.calculate(params) :
            this.damage;
        const canTakeDamage = Array.isArray(damage) ?
            damage.some(amount => amount >= 1) :
            damage >= 1;

        if (!canTakeDamage) {
            return false;
        }

        return super.canRun(params);
    }
    isDamageCost(params = {}) {
        if (Object.hasOwn(params, 'triggeredEffect')) {
            return this.isCost;
        }

        return this.isCost ||
            params.isCost === true ||
            params.costPaymentSession?.requireAllCosts === true;
    }
    getDamageAmounts(damage) {
        const targetsCount = Array.isArray(this.selectedTarget) ?
            this.selectedTarget.length :
            this.selectedTarget ? 1 : 0;
        const amounts = Array.isArray(damage) ?
            damage :
            Array(targetsCount).fill(damage);

        return amounts.map(amount => Math.max(0, amount ?? 0));
    }
    hasToughPreventingDamage() {
        const piercing = this.isAttack && this.piercing;
        if (this.ignoreTough || piercing) {
            return false;
        }

        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            [this.selectedTarget];
        const damageAmounts = this.getDamageAmounts(this.damage);

        return targets.some((target, index) =>
            this.getStatusTarget(target).isTough &&
            damageAmounts[index] > 0);
    }
    checkTrigger(params) {
        if (!this.isActivationActive(params)) {
            return false;
        }

        if (this.canceled) {
            return false;
        }

        const {takenDamage} = this;

        if (takenDamage instanceof Array) {
            return takenDamage.some(d => d > 0);
        }
        return takenDamage > 0;
    }
    getStatusTarget(target = this.selectedTarget) {
        return getDamageStatusTarget(target);
    }
    checkStatus() {
        return canResolveDamageWithStatus(this.selectedTarget, {
            ignoreTough: this.ignoreTough,
            piercing: this.isAttack && this.piercing,
        });
    }
    async resolveStatusBeforeInterrupts(params) {
        const {selectedTarget} = this;
        const piercing = this.isAttack && this.piercing;
        const multiTarget = Array.isArray(selectedTarget);

        if (this.isDamageCost(params)) {
            this.costRequiredDamage = this.getDamageAmounts(this.damage);
            if (this.hasToughPreventingDamage()) {
                this.costDamagePreventionReasons.add('tough');
                return false;
            }
        }

        if (!multiTarget && !piercing) {
            return true;
        }

        const targets = multiTarget ? selectedTarget : [selectedTarget];
        const result = await resolveToughDamage({
            targets,
            damage: this.damage,
            preventDamage: this.preventDamage,
            getStatusTarget: target => this.getStatusTarget(target),
            ignoreTough: this.ignoreTough,
            piercing,
        });

        this.damage = result.damage;

        return result.hasDamage;
    }
    async triggerWould(params) {
        const {selectedTarget} = this;
        const targets = Array.isArray(selectedTarget) ?
            selectedTarget :
            [selectedTarget];
        const isTargetInPlay = target => target?.isInPlay ||
            target?.controller?.gameZone?.cards?.includes(target) ||
            target?.engaged?.gameZone?.cards?.includes(target);
        const wasInPlay = targets.map(isTargetInPlay);
        const isDamageCost = this.isDamageCost(params);
        const canResolve = await super.triggerWould(params, {
            allowForcedInterrupts: !isDamageCost,
            allowOptionalInterrupts: !isDamageCost,
            ...(isDamageCost ? {
                beforeForcedInterrupts: async (_type, triggerParams) => {
                    const forcedInterrupts = await this._getTriggers(
                        [TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE],
                        PRIORITY_FORCED_INTERRUPT,
                        triggerParams
                    );
                    if (forcedInterrupts.length) {
                        this.costDamagePreventionReasons.add('forcedInterrupt');

                        return false;
                    }

                    return true;
                },
            } : {}),
        });
        const piercing = this.isAttack && this.piercing;
        const multiTarget = Array.isArray(selectedTarget);

        if (!canResolve) {
            return canResolve;
        }
        const damage = Array.isArray(this.damage) ?
            this.damage.slice() :
            targets.map(() => this.damage);
        let targetLeftPlay = false;
        targets.forEach((target, index) => {
            if (wasInPlay[index] && !isTargetInPlay(target)) {
                damage[index] = 0;
                targetLeftPlay = true;
            }
        });
        if (targetLeftPlay) {
            this.damage = multiTarget ? damage : damage[0];
        }
        if (!multiTarget && !piercing) {
            return canResolve;
        }

        const result = await resolveToughDamage({
            targets,
            damage: this.damage,
            preventDamage: this.preventDamage,
            getStatusTarget: target => this.getStatusTarget(target),
            ignoreTough: this.ignoreTough,
            piercing,
        });

        this.damage = result.damage;
        if (piercing && result.hasDamage) {
            this._activation?.effect?.markAttackKeywordUsed?.('piercing');
        }

        return result.hasDamage;
    }
    getTitle() {
        return `Sufres ${this.damage} de Daño.`;
    }
    async prepare(params) {
        if (this.paramsCalc) {
            this.damage = this.calculate(params);
        }

        return super.prepare(params);
    }
    resolveStatus() {
        return resolveDamageStatus(this.selectedTarget, {
            ignoreTough: this.ignoreTough,
        });
    }
    isFullResolved() {
        if (!Array.isArray(this.costRequiredDamage)) {
            return super.isFullResolved();
        }

        const takenDamage = this.getDamageAmounts(this.takenDamage);

        return super.isFullResolved() &&
            this.costRequiredDamage.every((damage, index) =>
                takenDamage[index] >= damage);
    }
    async showCostFailureDialog(params) {
        if (!this.isDamageCost(params) ||
            !this.costDamagePreventionReasons.size ||
            this.costBlockedDialogShown) {
            return;
        }

        const {player} = params;
        if (!player) {
            throw new TypeError(
                'TakeDamageEffect requires the paying player to explain a blocked damage cost.'
            );
        }

        const explanations = [];
        if (this.costDamagePreventionReasons.has('forcedInterrupt')) {
            explanations.push('hay una interrupción obligada aplicable a ese daño');
        }
        if (this.costDamagePreventionReasons.has('tough')) {
            explanations.push('el estado Duro impediría que sufrieras todo el daño requerido');
        }

        await this.openDialog({
            dialogType: DIALOG_LIST,
            targetPlayer: player,
            hideOk: true,
            hideViewTable: true,
            title: 'Coste no pagado',
            subtitle: `No puedes pagar este coste porque ${explanations.join(' y ')}.`,
            data: {
                options: [{
                    id: 0,
                    text: 'Entendido',
                }],
            },
        });
        this.costBlockedDialogShown = true;
    }
    async prepareCost(params, session) {
        const prepared = await super.prepareCost(params, session);

        if (!prepared) {
            await this.showCostFailureDialog(params);
        }

        return prepared;
    }
    async runEffect(params) {
        await super.runEffect(params);

        if (!this.fullResolved) {
            await this.showCostFailureDialog(params);
        }
    }
    getTriggersWould() {
        return super.getTriggersWould()
            .concat([
                TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
            ]);
    }
    getTriggersEnds(params) {
        const triggers = super.getTriggersEnds(params)
            .concat([TRIGGER_ATTACHED_TAKES_DAMAGE]);

        return this.checkTrigger(params) ?
            triggers.concat([
                TRIGGER_CHARACTER_TAKES_DAMAGE,
                TRIGGER_YOU_DEAL_DAMAGE,
                ...(this.hasExcessDamage() ?
                    [TRIGGER_YOU_DEALT_EXCESS_DAMAGE] :
                    []),
            ]) :
            triggers;
    }
    hasExcessDamage() {
        return Array.isArray(this.excessDamage) ?
            this.excessDamage.some(damage => damage > 0) :
            this.excessDamage > 0;
    }
    async placeDamage(selectedTarget, takenDamage, params) {
        const placeDamageEffect = this.match.effectsFactory.createEffect({
            type: EFFECT_PLACE_DAMAGE,
            selectedTarget,
            damage: takenDamage,
        });
        await placeDamageEffect.runEffect(params);
    }

    async defeat(selectedTarget, params) {
        return defeatCharacter(selectedTarget, {
            match: this.match,
            ability: this.ability,
            activation: this.activation,
            params,
        });
    }

    async takeDamage(selectedTarget, takenDamage, params, index = 0) {
        if (takenDamage <= 0) {
            this.setExcessDamage(index, 0);
            this.setAttackExcessDamage(0);

            return false;
        }

        const excessDamage = await this.calculateExcessDamage(
            selectedTarget,
            takenDamage
        );
        this.setExcessDamage(index, excessDamage);
        this.setAttackExcessDamage(excessDamage);
        await this.placeDamage(selectedTarget, takenDamage, params);

        const defeated = await defeatCharacterIfLethal(selectedTarget, {
            match: this.match,
            ability: this.ability,
            activation: this.activation,
            params,
        });
        if (defeated) {
            await this.resolveOverkillDamage(params);
        }

        return defeated;
    }
    async calculateExcessDamage(selectedTarget, takenDamage) {
        const excessDamage = await calculateExcessDamage(
            selectedTarget,
            takenDamage
        );

        return this.isAttack &&
            !this.isAttackDamageOnly &&
            this.activation &&
            !Array.isArray(this.selectedTarget) ?
            excessDamage + (this.activation.excessDamageModifier ?? 0) :
            excessDamage;
    }
    setAttackExcessDamage(excessDamage) {
        if (this.isAttack &&
            !this.isAttackDamageOnly &&
            this.activation &&
            !Array.isArray(this.selectedTarget)) {
            this.activation.excessDamage = excessDamage;
        }
    }
    async resolveOverkillDamage(params) {
        const {activation} = this;
        if (!this.isAttack ||
            this.isAttackDamageOnly ||
            Array.isArray(this.selectedTarget) ||
            !activation?.excessDamageTarget ||
            activation.excessDamage <= 0) {
            return;
        }

        const overkillDamageEffect = this.match.effectsFactory.createEffect({
            type: EFFECT_DEAL_DAMAGE,
            ability: this.ability,
            character: this.character,
            activation,
            damage: activation.excessDamage,
            ignoreTough: this.ignoreTough,
            isAttackDamageOnly: true,
            attackKeywordSource: this.attackKeywordSource,
            selectedTarget: activation.excessDamageTarget,
            isAttack: true,
        });
        await overkillDamageEffect.runEffect(params);
        activation.excessDamageTaken = overkillDamageEffect.takenDamage ?? 0;
    }
    setExcessDamage(index, excessDamage) {
        if (Array.isArray(this.selectedTarget)) {
            this.excessDamage[index] = excessDamage;
        } else {
            this.excessDamage = excessDamage;
        }
    }
    async execute(params) {
        const {selectedTarget, takenDamage} = this;
        this.defeated = false;
        this.excessDamage = Array.isArray(selectedTarget) ?
            selectedTarget.map(() => 0) :
            0;
        const targets = Array.isArray(selectedTarget) ?
            selectedTarget :
            [selectedTarget];
        const targetWasEnemy = targets.map(isEnemyDamageTarget);
        this.excessDamageTargetWasEnemy = Array.isArray(selectedTarget) ?
            targetWasEnemy :
            targetWasEnemy[0] ?? false;

        if (selectedTarget instanceof Array) {
            const takeDamage = async (target, index) => {
                if (takenDamage instanceof Array) {
                    return this.takeDamage(
                        target,
                        takenDamage[index],
                        params,
                        index
                    );
                } else {
                    return this.takeDamage(target, takenDamage, params, index);
                }
            };

            const resolvesOverkill = typeof this.activation?.getOverkill === 'function' &&
                this.activation.getOverkill(params);

            if (resolvesOverkill) {
                for (const [index, target] of selectedTarget.entries()) {
                    this.defeated = await takeDamage(target, index) ||
                        this.defeated;
                }
            } else {
                this.excessDamage = await Promise.all(
                    selectedTarget.map(async (target, index) => {
                        const targetDamage = takenDamage instanceof Array ?
                            takenDamage[index] :
                            takenDamage;

                        return targetDamage > 0 ?
                            this.calculateExcessDamage(target, targetDamage) :
                            0;
                    })
                );

                await Promise.all(selectedTarget.map(async (target, index) => {
                    const targetDamage = takenDamage instanceof Array ?
                        takenDamage[index] :
                        takenDamage;

                    if (targetDamage > 0) {
                        await this.placeDamage(target, targetDamage, params);
                    }
                }));

                const targetsToDefeat = await Promise.all(
                    selectedTarget.map(async (target, index) => {
                        const targetDamage = takenDamage instanceof Array ?
                            takenDamage[index] :
                            takenDamage;

                        if (targetDamage <= 0) {
                            return undefined;
                        }

                        return await isCharacterLethal(target) ?
                            {target} :
                            undefined;
                    })
                );

                for (const {target} of targetsToDefeat.filter(Boolean)) {
                    this.defeated = await this.defeat(target, params) ||
                        this.defeated;
                }
            }
        } else {
            this.defeated = await this.takeDamage(
                selectedTarget,
                takenDamage,
                params,
                0
            );
        }
    }
}