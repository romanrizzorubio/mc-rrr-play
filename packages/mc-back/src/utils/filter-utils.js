import {Calc} from '../engine/calc.js';
import {checkCondition, path} from '../engine/utils.js';

const operators = {
    '<': (value, limit) => value < limit,
    '<=': (value, limit) => value <= limit,
    '>': (value, limit) => value > limit,
    '>=': (value, limit) => value >= limit,
    '===': (value, limit) => value === limit,
    '!==': (value, limit) => value !== limit,
};
const numericOperators = new Set(['<', '<=', '>', '>=']);

export const checkFilter = async (target, filter, params) => {
    const staticFilter = {};
    const calculatedFilters = [];

    Object.entries(filter).forEach(([property, condition]) => {
        if (condition &&
            typeof condition === 'object' &&
            !Array.isArray(condition) &&
            (Object.hasOwn(condition, 'operator') ||
                Object.hasOwn(condition, 'paramsCalc'))) {
            const {operator, paramsCalc} = condition;
            const compare = Object.hasOwn(operators, operator) ?
                operators[operator] :
                undefined;

            if (!compare ||
                !paramsCalc ||
                typeof paramsCalc !== 'object' ||
                Array.isArray(paramsCalc)) {
                throw new TypeError(
                    `El filtro calculado de "${property}" no es válido.`
                );
            }

            calculatedFilters.push({
                property,
                operator,
                compare,
                defaultValue: condition.defaultValue,
                paramsCalc,
            });
        } else {
            staticFilter[property] = condition;
        }
    });

    if (!checkCondition(target, staticFilter)) {
        return false;
    }

    for (const {
        property,
        operator,
        compare,
        defaultValue,
        paramsCalc,
    } of calculatedFilters) {
        const value = path(target, property);
        const calculatedValue = await new Calc(paramsCalc).calculate(params);
        const limit = calculatedValue === undefined ?
            defaultValue :
            calculatedValue;

        if (numericOperators.has(operator) &&
            (!Number.isFinite(value) || !Number.isFinite(limit))) {
            return false;
        }
        if (!compare(value, limit)) {
            return false;
        }
    }

    return true;
};
