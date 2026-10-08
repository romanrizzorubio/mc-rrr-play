import {checkCondition, path} from '../engine/utils.js';

import {Effect} from './effect.js';

export class ForEachEffect extends Effect {
    constructor({effectDefinition, condition, ...params}) {
        super({...params, condition: undefined});

        if (!effectDefinition || typeof effectDefinition !== 'object' ||
            Array.isArray(effectDefinition)) {
            throw new TypeError('ForEachEffect requires an effect definition.');
        }
        if (condition && (typeof condition !== 'object' ||
            Array.isArray(condition))) {
            throw new TypeError('ForEachEffect condition must be an object.');
        }
        if (condition?.exclude !== undefined) {
            const excludePaths = Array.isArray(condition.exclude) ?
                condition.exclude :
                [condition.exclude];
            if (excludePaths.length === 0 ||
                !excludePaths.every(excludePath =>
                    typeof excludePath === 'string' &&
                    excludePath.length > 0)) {
                throw new TypeError(
                    'ForEachEffect condition exclude must be a path or a list of paths.'
                );
            }
        }

        this.effectDefinition = effectDefinition;
        this.condition = condition;
        this.results = [];
        this.refreshTarget = false;
    }
    filterTarget(target, params) {
        if (!super.filterTarget(target, params)) {
            return false;
        }

        if (!this.condition) {
            return true;
        }

        const {exclude, ...targetCondition} = this.condition;
        if (exclude) {
            const excludePaths = Array.isArray(exclude) ? exclude : [exclude];
            const excludedTargets = excludePaths.flatMap(excludePath => {
                const values = path(params, excludePath);
                return Array.isArray(values) ?
                    values.flat(Infinity) :
                    values === undefined ? [] : [values];
            });
            if (excludedTargets.some(excludedTarget =>
                excludedTarget === target ||
                (target.id !== undefined &&
                    excludedTarget?.id === target.id)
            )) {
                return false;
            }
        }

        return Object.keys(targetCondition).length === 0 ||
            checkCondition(target, targetCondition);
    }
    async getTargets(params) {
        const validTargets = await super.getValidTarget(params);

        return validTargets.length === 1 && Array.isArray(validTargets[0]) ?
            validTargets[0] :
            validTargets;
    }
    createTargetEffect() {
        const effect = this.match.effectsFactory.parseEffect(this.effectDefinition);
        if (!effect) {
            throw new Error('ForEachEffect could not create its nested effect.');
        }

        effect.ability = this.ability;

        return effect;
    }
    getTargetParams(params, target) {
        const isPlayer = target?.isPlayer;

        return {
            ...params,
            ...(isPlayer ? {player: target, targetPlayer: target} : {}),
            forEachTarget: target,
        };
    }
    async canRun(params) {
        const targets = await this.getTargets(params);

        return this.promisesSequentialSome(targets, async target => {
            const effect = this.createTargetEffect();

            return effect.canRun(this.getTargetParams(params, target));
        });
    }
    async prepare(params) {
        this.selectedTarget = await this.getTargets(params);
    }
    async execute(params) {
        this.results = [];
        const targets = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            this.selectedTarget ? [this.selectedTarget] : [];

        for (const target of targets) {
            const effect = this.createTargetEffect();
            const targetParams = this.getTargetParams(params, target);
            if (effect.target === this.target) {
                effect.selectedTarget = target;
                effect.refreshTarget = false;
            }

            await effect.runEffect(targetParams);
            this.results.push(effect);

            if (effect.paymentCancelled) {
                this.paymentCancelled = true;
                return false;
            }
        }
    }
    isResolved() {
        return this.results.some(effect => effect.isResolved());
    }
    isFullResolved() {
        return this.results.every(effect => effect.isFullResolved());
    }
}
