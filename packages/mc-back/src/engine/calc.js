import {CALC_COUNT, CALC_DAMAGE, CALC_DIFFERENT_RESOURCE_TYPE, CALC_RESOURCES, CALC_MULTIPLY_2, CALC_THREAT, CALC_TRAITS_COUNT} from "../constants/calc.js";
import {checkCondition, path} from "./utils.js";
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL, RESOURCE_WILD} from "../constants/resources.js";

export class Calc {
    constructor({
        target,
        formula,
        conditions,
        max,
        resourceType,
        strict,
        trait,
        plus,
        multiply,
    }) {
        this.target = target;
        this.formula = formula;
        this.conditions = conditions;
        this.max = max;
        this.resourceType = resourceType;
        this.strict = strict;
        this.trait = trait;
        this.plus = plus;
        this.multiply = multiply;
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
                0)
    }
    calculateFormula(params) {
        const {target, formula, trait} = this;

        const source = path(params, target);

        switch (formula) {
            case CALC_COUNT:
                return source.length;
            case CALC_TRAITS_COUNT:
                return source.filter(card => card.hasTrait(trait)).length;
            case CALC_DIFFERENT_RESOURCE_TYPE:
                return this.differentResourceType(source);
            case CALC_MULTIPLY_2:
                return source * 2;
            case CALC_THREAT:
                return source.threat;
            case CALC_DAMAGE:
                return source.damage;
            case CALC_RESOURCES:
                return source.reduce((sum, card) =>
                    sum + card.resources.filter(r => r === this.resourceType || (!this.strict && r === RESOURCE_WILD)).length, 0);
            default:
                return source;
        }
    }
    calculate(params) {
        const {max, plus, multiply} = this;

        let value = this.calculateFormula(params);

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