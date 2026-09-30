import {DoIfEffect} from './do-if-effect.js';

export class DoIfCardGameEffect extends DoIfEffect {
    constructor({
// DoIfEffect
        condition,
        effect: _effect,
        effectNot: _effectNot
    }) {
        super(arguments[0]);

        this.condition = condition;
    }
    checkCondition(params) {
        params.cardCondition = this.match.searchCard(this.condition);

        return params.cardCondition;
    }
}