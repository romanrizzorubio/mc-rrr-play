import {
    CALC_TRAITS_COUNT,
    CALC_RESOURCES,
    CALC_MULTIPLY_2,
    CALC_THREAT,
    CALC_DAMAGE,
    CALC_ATTACK,
    CALC_COUNT,
    CALC_DIFFERENT_RESOURCE_TYPE,
    CALC_IF,
    CALC_ALL,
RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL, RESOURCE_WILD} from 'mc-shared';

import { path} from './utils.js';

const CALCULATION_MAP = {
    [CALC_COUNT]: source => source.length,
    [CALC_TRAITS_COUNT]: (source, {trait}) =>
        source.filter(card => (card.traits || []).includes(trait)).length,
    [CALC_DIFFERENT_RESOURCE_TYPE]: (source, calc) =>
        calc.differentResourceType(source),
    [CALC_IF]: (source, {ifTrue, ifFalse}) => source ? ifTrue : ifFalse,
    [CALC_MULTIPLY_2]: source => source * 2,
    [CALC_THREAT]: source => source.threat,
    [CALC_DAMAGE]: (source, {invert}) => {
        if (!invert) {
            return source.damage;
        }

        if (!Number.isFinite(source.hitPoints) || !Number.isFinite(source.damage)) {
            throw new Error('CALC_DAMAGE invert requiere vida y daño calculables.');
        }

        return source.hitPoints - source.damage;
    },
    [CALC_ALL]: source => {
        if (source.damage !== undefined) {
            return source.damage;
        }
        if (source.threat !== undefined) {
            return source.threat;
        }
        return source;
    },
    [CALC_ATTACK]: (source, {target}, params) => {
        if (!source || typeof source.getAttackValue !== 'function') {
            throw new Error(`No se encontró un personaje con ATQ calculable en "${target}".`);
        }
        return source.getAttackValue(params);
    },
    [CALC_RESOURCES]: (source, {resourceType, strict}) =>
        source.reduce((sum, card) =>
            sum + card.resources.filter(r =>
                r === resourceType || (!strict && r === RESOURCE_WILD)).length, 0),
};

export class Calc {
    constructor({
        target,
        formula,
        conditions,
        max,
        resourceType,
        strict,
        trait,
        ifTrue,
        ifFalse,
        plus,
        multiply,
        invert = false,
    }) {
        this.target = target;
        this.formula = formula;
        this.conditions = conditions;
        this.max = max;
        this.resourceType = resourceType;
        this.strict = strict;
        this.trait = trait;
        this.ifTrue = ifTrue;
        this.ifFalse = ifFalse;
        this.plus = plus;
        this.multiply = multiply;
        this.invert = invert;
    }
    differentResourceType(source) {
        const resources = source.reduce((res, card) => {
            card.resources.forEach(resource => {
                res[resource] = 1;
            });

            return res;
        }, {
            [RESOURCE_WILD]: 0,
            [RESOURCE_ENERGY]: 0,
            [RESOURCE_PHYSICAL]: 0,
            [RESOURCE_MENTAL]: 0,
        });

        return Object.keys(resources)
            .reduce((sum, resource) =>
                sum + resources[resource],
                0);
    }
    calculateFormula(params) {
        const {target, formula} = this;

        const source = path(params, target);
        if (Object.hasOwn(CALCULATION_MAP, formula)) {
            return CALCULATION_MAP[formula](source, this, params);
        }
        return source;
    }
    calculate(params) {
        const value = this.calculateFormula(params);
        if (value && typeof value.then === 'function') {
            return value.then(result => this.applyModifiers(result));
        }

        return this.applyModifiers(value);
    }
    applyModifiers(value) {
        const {max, plus, multiply} = this;

        if (multiply) {
            value *= multiply;
        }

        if (plus) {
            value += plus;
        }

        if (max && value > max) {
            value = max;
        }

        return value;
    }
}