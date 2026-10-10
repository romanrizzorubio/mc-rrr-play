import {DoIfEffect} from './do-if-effect.js';

export class DoIfHasDamageEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        condition: _condition,
        effect: _effect,
        effectNot: _effectNot,
// DoIfHasDamageEffect
        damage
    }) {
        super(arguments[0]);

        this.damage = damage;
    }

    checkCondition(card) {
        return card.damage >= this.damage;
    }
}