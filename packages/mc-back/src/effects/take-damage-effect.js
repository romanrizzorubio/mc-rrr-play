import {
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_DEFEAT,
    EFFECT_PLACE_DAMAGE,
    TRIGGER_ATTACHED_TAKES_DAMAGE,
    TRIGGER_YOU_WOULD_TAKE_DAMAGE,
} from 'mc-shared';

import {Effect} from './effect.js';

export class TakeDamageEffect extends Effect {
    constructor({
        damage,
    }) {
        super(arguments[0]);

        this.damage = damage;

        this.preventDamage = 0;
        this.excess = 0;
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
    checkTrigger() {
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
        const {selectedTarget} = this;

        if (Array.isArray(selectedTarget)) {
            return true;
        }

        return !this.getStatusTarget(selectedTarget).isTough;
    }
    async triggerWould(params) {
        const canResolve = await super.triggerWould(params);
        const {selectedTarget} = this;

        if (!canResolve || !Array.isArray(selectedTarget)) {
            return canResolve;
        }

        const damage = Array.isArray(this.damage) ?
            this.damage.slice() :
            selectedTarget.map(() => this.damage);
        const prevention = Array.isArray(this.preventDamage) ?
            this.preventDamage :
            selectedTarget.map(() => this.preventDamage);
        let hasDamage = false;

        for (let index = 0; index < selectedTarget.length; index++) {
            const target = selectedTarget[index];
            const statusTarget = this.getStatusTarget(target);
            const prevented = prevention[index] || 0;

            if (statusTarget.isTough && damage[index] - prevented > 0) {
                statusTarget.removeTough();
                await statusTarget.refresh();
                damage[index] = prevented;
            }

            if (damage[index] - prevented > 0) {
                hasDamage = true;
            }
        }

        this.damage = damage;

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
        const {selectedTarget} = this;
        const statusTarget = this.getStatusTarget(selectedTarget);

        statusTarget.removeTough();

        statusTarget.refresh();
    }
    getTriggersWould() {
        return super.getTriggersWould()
            .concat([
                TRIGGER_YOU_WOULD_TAKE_DAMAGE,
            ]);
    }
    getTriggersEnds(params) {
        return super.getTriggersEnds(params)
            .concat([
                TRIGGER_ATTACHED_TAKES_DAMAGE,
            ]);
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
    }

    async takeDamage(selectedTarget, takenDamage, params) {
        await this.placeDamage(selectedTarget, takenDamage, params);

        const life = await selectedTarget.getLife();

        if (life <= 0) {
            await this.defeat(selectedTarget, params);
        }
    }
    async execute(params) {
        const {selectedTarget, takenDamage} = this;

        if (selectedTarget instanceof Array) {
            const takeDamage = async (target, index) => {
                if (takenDamage instanceof Array) {
                    await this.takeDamage(target, takenDamage[index], params);
                } else {
                    await this.takeDamage(target, takenDamage, params);
                }
            };

            const resolvesOverkill = typeof this.activation?.getOverkill === 'function' &&
                this.activation.getOverkill(params);

            if (resolvesOverkill) {
                for (const [index, target] of selectedTarget.entries()) {
                    await takeDamage(target, index);
                }
            } else {
                await Promise.all(selectedTarget.map(async (target, index) => {
                    const targetDamage = takenDamage instanceof Array ?
                        takenDamage[index] :
                        takenDamage;

                    await this.placeDamage(target, targetDamage, params);
                }));

                const targetsToDefeat = await Promise.all(
                    selectedTarget.map(async target => ({
                        target,
                        life: await target.getLife(),
                    }))
                );

                for (const {target, life} of targetsToDefeat) {
                    if (life <= 0) {
                        await this.defeat(target, params);
                    }
                }
            }
        } else {
            await this.takeDamage(selectedTarget, takenDamage, params);
        }
    }
}