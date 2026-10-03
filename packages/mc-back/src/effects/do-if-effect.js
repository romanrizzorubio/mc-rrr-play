import {checkCondition, path} from '../engine/utils.js';

import {Effect} from './effect.js';

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
    prepareChildEffect(effect, selectedTarget = this.selectedTarget) {
        if (!effect) {
            return;
        }

        effect.attack = this.attack;
        effect.selectedTarget = effect.target === this.target ? selectedTarget : undefined;
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

        this.prepareChildEffect(this.effect);
        this.prepareChildEffect(this.effectNot);
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