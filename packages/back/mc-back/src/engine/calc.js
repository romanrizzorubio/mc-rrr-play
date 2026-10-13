import {
    CALC_TRAITS_COUNT,
    CALC_BOOST_ICONS,
    CALC_RESOURCES,
    CALC_MULTIPLY_2,
    CALC_HALF_ROUNDED_DOWN,
    CALC_THREAT,
    CALC_DAMAGE,
    CALC_ATTACK,
    CALC_COUNT,
    CALC_DIFFERENT_RESOURCE_TYPE,
    CALC_IF,
    CALC_ALL,
    CALC_STAGE,
    TARGET_MAIN_SCHEME,
    TARGET_VILLAIN,
RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL, RESOURCE_WILD} from 'mc-shared';

import {checkCondition, path} from './utils.js';

const CALCULATION_MAP = {
    [CALC_BOOST_ICONS]: source => {
        if (!Array.isArray(source)) {
            throw new Error('CALC_BOOST_ICONS requiere que el objetivo resuelva a una lista.');
        }

        return source.reduce((sum, card) => sum + (card.boost ?? 0), 0);
    },
    [CALC_COUNT]: (source, {target, conditions}) => {
        if (!Array.isArray(source)) {
            throw new Error(`CALC_COUNT requiere que "${target}" resuelva a una lista.`);
        }

        if (!conditions) {
            return source.length;
        }

        const filters = Array.isArray(conditions) ? conditions : [conditions];

        return source.filter(item =>
            filters.some(condition => checkCondition(item, condition))).length;
    },
    [CALC_HALF_ROUNDED_DOWN]: source =>
        Math.floor((Array.isArray(source) ? source.length : source) / 2),
    [CALC_TRAITS_COUNT]: (source, {target, trait}) => {
        if (!Array.isArray(source)) {
            throw new Error(
                `CALC_TRAITS_COUNT requiere que "${target}" resuelva a una lista.`
            );
        }

        return source.filter(card => (card.traits || []).includes(trait)).length;
    },
    [CALC_DIFFERENT_RESOURCE_TYPE]: (source, calc) =>
        calc.differentResourceType(source),
    [CALC_IF]: (source, {ifTrue, ifFalse}) => source ? ifTrue : ifFalse,
    [CALC_MULTIPLY_2]: source => source * 2,
    [CALC_THREAT]: source => source.threat,
    [CALC_STAGE]: (source, {target}) => {
        if (!Number.isFinite(source?.stage)) {
            throw new Error(`CALC_STAGE requiere una etapa numérica en "${target}".`);
        }

        return source.stage;
    },
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

        let source;
        if (formula === CALC_STAGE) {
            switch (target) {
                case TARGET_VILLAIN:
                    source = path(params, 'match.villain');
                    break;
                case TARGET_MAIN_SCHEME:
                    source = path(params, 'match.mainScheme');
                    break;
                default:
                    throw new Error(
                        `CALC_STAGE requiere TARGET_VILLAIN o TARGET_MAIN_SCHEME; se recibió "${target}".`
                    );
            }
        } else {
            source = path(params, target);
        }

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