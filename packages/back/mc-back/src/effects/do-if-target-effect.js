import {DoIfEffect} from './do-if-effect.js';

export class DoIfTargetEffect extends DoIfEffect {
    constructor({
        candidateTarget,
        condition,
        ...params
    }) {
        super({
            ...params,
            condition,
        });
        this.candidateTarget = candidateTarget;
    }
    getMatchingTargets(params) {
        return this.validTarget.getValidTarget({
            ...params,
            ability: this.ability,
            condition: this.condition,
            effect: this,
            match: this.match,
            target: this.candidateTarget,
        });
    }
    async canRun(params) {
        const targets = this.getMatchingTargets(params);
        const effect = targets.length ? this.effect : this.effectNot;

        return effect ? effect.canRun(params) : true;
    }
    async prepare() {
        this.selectedTarget = undefined;
    }
    async execute(params) {
        const targets = this.getMatchingTargets(params);
        const effect = targets.length ? this.effect : this.effectNot;

        if (effect) {
            return effect.runEffect(params);
        }
    }
}
