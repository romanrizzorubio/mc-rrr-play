import {
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_DEFEAT,
    EFFECT_PLACE_DAMAGE,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_ATTACHED_TAKES_DAMAGE,
} from 'mc-shared';

import {Effect} from './effect.js';

export class TakeDamageEffect extends Effect {
    constructor({
        damage,
        ignoreTough = false,
    }) {
        super(arguments[0]);

        this.initialDamage = damage;
        this.damage = damage;
        this.ignoreTough = ignoreTough;

        this.preventDamage = 0;
        this.excess = 0;
        this.canceled = false;
        this.defeated = false;
    }
    resetResolutionData() {
        super.resetResolutionData();
        this.damage = this.initialDamage;
        this.preventDamage = 0;
        this.excess = 0;
        this.canceled = false;
        this.defeated = false;
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
    get takenDamage() {
        if (this.damage instanceof Array) {
            if (this.preventDamage instanceof Array) {
                return this.damage.map((d, index) => d - this.preventDamage[index]);
            }
            return this.damage.map(d => d - this.preventDamage);
        }
        return this.damage - this.preventDamage;
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
        return target.isPlayer ?
            target.superhero.currentSide :
            target;
    }
    checkStatus() {
        if (this.ignoreTough) {
            return true;
        }

        if (this.isAttack && this.piercing) {
            return true;
        }

        const {selectedTarget} = this;

        if (Array.isArray(selectedTarget)) {
            return true;
        }

        return !this.getStatusTarget(selectedTarget).isTough;
    }
    async triggerWould(params) {
        const canResolve = await super.triggerWould(params);
        const {selectedTarget} = this;
        const piercing = this.isAttack && this.piercing;
        const multiTarget = Array.isArray(selectedTarget);

        if (!canResolve || (!multiTarget && !piercing)) {
            return canResolve;
        }

        const targets = multiTarget ? selectedTarget : [selectedTarget];
        const damage = Array.isArray(this.damage) ?
            this.damage.slice() :
            targets.map(() => this.damage);
        const prevention = Array.isArray(this.preventDamage) ?
            this.preventDamage :
            targets.map(() => this.preventDamage);
        let hasDamage = false;

        for (let index = 0; index < targets.length; index++) {
            const target = targets[index];
            const statusTarget = this.getStatusTarget(target);
            const prevented = prevention[index] || 0;

            if (!this.ignoreTough &&
                statusTarget.isTough &&
                damage[index] - prevented > 0) {
                statusTarget.removeTough();
                await statusTarget.refresh();
                if (!piercing) {
                    damage[index] = prevented;
                }
            }

            if (damage[index] - prevented > 0) {
                hasDamage = true;
            }
        }

        this.damage = multiTarget ? damage : damage[0];

        return hasDamage;
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
        if (this.ignoreTough) {
            return;
        }

        const {selectedTarget} = this;
        const statusTarget = this.getStatusTarget(selectedTarget);

        statusTarget.removeTough();

        statusTarget.refresh();
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
        const defeatTarget = selectedTarget.isPlayer ?
            selectedTarget.superhero.currentSide :
            selectedTarget;
        const defeatEffect = this.match.effectsFactory.createEffect({
            type: EFFECT_DEFEAT,
            selectedTarget: defeatTarget,
            ability: this.ability,
            activation: this.activation,
        });

        await defeatEffect.runEffect(params);

        return defeatEffect.defeated === true;
    }

    async takeDamage(selectedTarget, takenDamage, params) {
        if (takenDamage <= 0) {
            return false;
        }

        await this.placeDamage(selectedTarget, takenDamage, params);

        const life = await selectedTarget.getLife();

        if (life <= 0) {
            return this.defeat(selectedTarget, params);
        }

        return false;
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

                        return {
                            target,
                            life: await target.getLife(),
                        };
                    })
                );

                for (const {target, life} of targetsToDefeat.filter(Boolean)) {
                    if (life <= 0) {
                        this.defeated = await this.defeat(target, params) ||
                            this.defeated;
                    }
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