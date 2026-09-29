import {Effect} from "./effect.js";
import {checkCondition, path} from "../engine/utils.js";

export const EFFECT_DO_IF = 'do-if';
export class DoIfEffect extends Effect {
    constructor({
// DoIfEffect
        condition,
        source,
        effect,
        effectNot
    }) {
        super(arguments[0]);

        this.condition = condition;
        this.source = source;
        this.effect = effect;
        this.effectNot = effectNot;
    }
    get ability() {
        return super.ability;
    }
    set ability(ability) {
        super.ability = ability;

        if (this.effect) {
            this.effect.ability = ability;
        }

        if (this.effectNot) {
            this.effectNot.ability = ability;
        }
    }
    get isAttack() {
        return super.isAttack;
    }
    set isAttack(isAttack) {
        super.isAttack = isAttack;

        if (this.effect) {
            this.effect.isAttack = isAttack;
        }

        if (this.effectNot) {
            this.effectNot.isAttack = isAttack;
        }
    }
    get isDefense() {
        return super.isDefense;
    }
    set isDefense(isDefense) {
        super.isDefense = isDefense;

        if (this.effect) {
            this.effect.isDefense = isDefense;
        }

        if (this.effectNot) {
            this.effectNot.isDefense = isDefense;
        }
    }
    get isScheme() {
        return super.isScheme;
    }
    set isScheme(isScheme) {
        super.isScheme = isScheme;

        if (this.effect) {
            this.effect.isScheme = isScheme;
        }

        if (this.effectNot) {
            this.effectNot.isScheme = isScheme;
        }
    }
    get isThwart() {
        return super.isThwart;
    }
    set isThwart(isThwart) {
        super.isThwart = isThwart;

        if (this.effect) {
            this.effect.isThwart = isThwart;
        }

        if (this.effectNot) {
            this.effectNot.isThwart = isThwart;
        }
    }
    getEffectProperty(name, params) {
        const checked = this.checkCondition(params);

        return checked ? this.effect.getEffectProperty(name, params) : this.effectNot.getEffectProperty(name, params);
    }
    setEffectProperty(name, value, params) {
        const checked = this.checkCondition(params);

        return checked ? this.effect.setEffectProperty(name, value, params) : this.effectNot.setEffectProperty(name, value, params);
    }
    async prepare(params) {
        await super.prepare(params);

        if (this.effect) {
            this.effect.attack = this.attack;
            if (this.effect.target === this.target) {
                this.effect.selectedTarget = this.selectedTarget;
            }
        }

        if (this.effectNot) {
            this.effectNot.attack = this.attack;
            if (this.effectNot.target === this.target) {
                this.effectNot.selectedTarget = this.selectedTarget;
            }
        }
    }
    checkCondition(params) {
        return checkCondition(params, this.condition);
    }
    getSource(params) {
        return path(params, this.source);
    }
    async execute(params) {
        const checked = await this.checkCondition(params);

        if (checked) {
            return this.effect.runEffect(params);
        } else if (this.effectNot) {
            return this.effectNot.runEffect(params);
        }
    }
}