import {TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,EFFECT_TAKE_DAMAGE} from 'mc-shared';

import {Effect} from './effect.js';

export class DealDamageEffect extends Effect {
    constructor(params) {
        super(params);
        const {damage, overkill: _overkill = false} = params;

        this.baseDamage = damage;

        this.damage = undefined;
        this.dealtDamage = 0;
        this.preventDamage = 0;
        this.takenDamage = 0;
        this.excessDamage = 0;
    }
    checkTrigger(params) {
        if (this.damage instanceof Array) {
            if (this.preventDamage instanceof Array) {
                return this.damage.some((d, index) => d > this.preventDamage[index]);
            }
            return this.damage.some(d => d > this.preventDamage);
        }
        return this.damage > this.preventDamage;
    }
    getTriggersParams(params) {
        const {selectedTarget} = this;

        const newParams = super.getTriggersParams(params);

        if (!newParams.card) {
            newParams.card = selectedTarget;
        }

        return newParams;
    }
    getTriggersEnds() {
        return super.getTriggersEnds();
    }
    getTriggersWould() {
        return super.getTriggersWould()
            .concat([
                TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
            ]);
    }
    async prepare(params) {
        this.damage = undefined;

        await super.prepare(params);

        if (this.damage === undefined) {
            if (this.paramsCalc) {
                this.damage = this.calculate(params);
            } else {
                this.damage = this.baseDamage || params.damage;
            }
        }

        const {isAttack, activation} = this;

        if (isAttack && activation) {
            if (activation.getOverkill(params)) {
                await activation.applyOverkill(params);
            }
        }
    }
    async execute(params) {
        const {selectedTarget, damage} = this;

        const takeDamageEffect = this.match.effectsFactory.createEffect({
            type: EFFECT_TAKE_DAMAGE,
            selectedTarget,
            damage,
            ability: this.ability,
            activation: this.activation,
        });

        await takeDamageEffect.runEffect(params);

        this.takenDamage = takeDamageEffect.takenDamage;

        if (this.activation) {
            this.activation.takenDamage = this.takenDamage;
        }
    }
}