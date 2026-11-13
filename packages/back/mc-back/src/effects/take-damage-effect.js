import {
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_PLACE_DAMAGE,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_ATTACHED_TAKES_DAMAGE,
} from 'mc-shared';

import {Effect} from './effect.js';
import {AttackEffect} from './attack-effect.js';
import {
    canResolveDamageWithStatus,
    defeatCharacter,
    defeatCharacterIfLethal,
    getDamageStatusTarget,
    isCharacterLethal,
    resolveDamageStatus,
    resolveToughDamage,
} from '../utils/damage-resolution.js';

export class TakeDamageEffect extends AttackEffect(Effect) {
    constructor({
        damage,
        ignoreTough = false,
        preventDamage = 0,
        attackKeywordSource,
    }) {
        super(arguments[0]);

        this.initialDamage = damage;
        this.damage = damage;
        this.ignoreTough = ignoreTough;
        this.attackKeywordSource = attackKeywordSource;
        this.initialPreventDamage = Array.isArray(preventDamage) ?
            preventDamage.slice() :
            preventDamage;

        this.preventDamage = Array.isArray(this.initialPreventDamage) ?
            this.initialPreventDamage.slice() :
            this.initialPreventDamage;
        this.excess = 0;
        this.canceled = false;
        this.defeated = false;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.damage = this.initialDamage;
        this.preventDamage = Array.isArray(this.initialPreventDamage) ?
            this.initialPreventDamage.slice() :
            this.initialPreventDamage;
        this.excess = 0;
        this.canceled = false;
        this.defeated = false;
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
    async resolveStatusBeforeInterrupts() {
        const {selectedTarget} = this;
        const piercing = this.isAttack && this.piercing;
        const multiTarget = Array.isArray(selectedTarget);

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
        const canResolve = await super.triggerWould(params);
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
            triggers.concat([TRIGGER_CHARACTER_TAKES_DAMAGE]) :
            triggers;
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

    async takeDamage(selectedTarget, takenDamage, params) {
        if (takenDamage <= 0) {
            return false;
        }

        await this.placeDamage(selectedTarget, takenDamage, params);

        return defeatCharacterIfLethal(selectedTarget, {
            match: this.match,
            ability: this.ability,
            activation: this.activation,
            params,
        });
    }
    async execute(params) {
        const {selectedTarget, takenDamage} = this;
        this.defeated = false;

        if (selectedTarget instanceof Array) {
            const takeDamage = async (target, index) => {
                if (takenDamage instanceof Array) {
                    return this.takeDamage(target, takenDamage[index], params);
                } else {
                    return this.takeDamage(target, takenDamage, params);
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
                params
            );
        }
    }
}