import {path} from '../engine/utils.js';

const MAX_OPERATOR = 'max';
const MAX_CONDITION_KEYS = new Set(['operator', 'defaultValue']);

const getMaxCondition = (condition, property) => {
    if (!condition || typeof condition !== 'object' ||
        Array.isArray(condition) || condition.operator !== MAX_OPERATOR) {
        return undefined;
    }

    if (Object.keys(condition).some(key => !MAX_CONDITION_KEYS.has(key))) {
        throw new TypeError(
            `The max target condition for "${property}" has unsupported options.`
        );
    }

    const defaultValue = condition.defaultValue ?? 0;
    if (!Number.isFinite(defaultValue)) {
        throw new TypeError(
            `The max target condition for "${property}" requires a finite defaultValue.`
        );
    }

    return {
        property,
        defaultValue,
    };
};

export const splitTargetCondition = condition => {
    if (!condition || Array.isArray(condition)) {
        return {
            condition,
            selectionConditions: [],
        };
    }

    const targetCondition = {};
    const selectionConditions = [];

    Object.entries(condition).forEach(([property, value]) => {
        const maxCondition = getMaxCondition(value, property);
        if (maxCondition) {
            selectionConditions.push(maxCondition);
        } else {
            targetCondition[property] = value;
        }
    });

    return {
        condition: targetCondition,
        selectionConditions,
    };
};

export const filterTargetCandidates = (targets, selectionConditions) =>
    selectionConditions.reduce((candidates, {property, defaultValue}) => {
        if (!candidates.length) {
            return candidates;
        }

        const values = candidates.map(candidate => {
            const value = path(candidate, property);
            const comparableValue = value ?? defaultValue;
            if (!Number.isFinite(comparableValue)) {
                throw new TypeError(
                    `The max target condition requires a finite value for "${property}".`
                );
            }

            return comparableValue;
        });
        const maxValue = Math.max(...values);

        return candidates.filter((_, index) => values[index] === maxValue);
    }, targets);
