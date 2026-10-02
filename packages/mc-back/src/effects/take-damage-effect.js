import {TRIGGER_YOU_WOULD_TAKE_DAMAGE,EFFECT_DEFEAT,EFFECT_PLACE_DAMAGE} from 'mc-shared';

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

        if (damage < 1) {
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
    checkStatus() {
        const {selectedTarget} = this;

        return !selectedTarget.isTough;
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

        selectedTarget.removeTough();

        selectedTarget.refresh();
    }
    getTriggersWould() {
        return super.getTriggersWould()
            .concat([
                TRIGGER_YOU_WOULD_TAKE_DAMAGE,
            ]);
    }
    async takeDamage(selectedTarget, takenDamage, params) {
        const placeDamageEffect = this.match.effectsFactory.createEffect({
            type: EFFECT_PLACE_DAMAGE,
            selectedTarget,
            damage: takenDamage,
        });
        await placeDamageEffect.runEffect(params);

        if (selectedTarget.life <= 0) {
            const defeatEffect = this.match.effectsFactory.createEffect({
                type: EFFECT_DEFEAT,
                selectedTarget,
                ability: this.ability,
                activation: this.activation,
            });

            await defeatEffect.runEffect(params);
        }
    }
    async execute(params) {
        const {selectedTarget, takenDamage} = this;

        if (selectedTarget instanceof Array) {
            await Promise.all(selectedTarget.map(async (st, index) => {
                if (takenDamage instanceof Array) {
                    await this.takeDamage(st, takenDamage[index], params);
                } else {
                    await this.takeDamage(st, takenDamage, params);
                }
            }));
        } else {
            await this.takeDamage(selectedTarget, takenDamage, params);
        }
    }
}