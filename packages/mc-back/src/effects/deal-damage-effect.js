import {Effect} from "./effect.js";
import {TakeDamageEffect} from "./take-damage-effect.js";
import {TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE} from "../triggers/attached-would-dealt-damage-trigger.js";

export const EFFECT_DEAL_DAMAGE = 'deal-damage';
export class DealDamageEffect extends Effect {
    constructor({
        damage,
        overkill = false,
    }) {
        super(arguments[0]);

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

        return super.getTriggersParams({
            ...params,
            card: selectedTarget,
        });
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

        const takeDamageEffect = new TakeDamageEffect({
            selectedTarget,
            damage,
            match: this.match,
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