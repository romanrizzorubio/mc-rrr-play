import {OPERATOR_MAX, OPERATOR_MIN} from 'mc-shared';

import {checkCondition, path} from '../engine/utils.js';

const AGGREGATE_OPERATORS = new Set([OPERATOR_MAX, OPERATOR_MIN]);
const AGGREGATE_CONDITION_KEYS = new Set(['operator', 'defaultValue']);

export const filterTargetsByCondition = (targets, condition) =>
    condition ?
        targets.filter(target => checkCondition(target, condition)) :
        targets;

export const getConditionExcludePaths = condition => {
    if (!condition || Array.isArray(condition) ||
        condition.exclude === undefined) {
        return [];
    }

    const excludePaths = Array.isArray(condition.exclude) ?
        condition.exclude :
        [condition.exclude];
    if (excludePaths.length === 0 ||
        !excludePaths.every(excludePath =>
            typeof excludePath === 'string' &&
            excludePath.length > 0)) {
        throw new TypeError(
            'condition exclude must be a path or a list of paths.'
        );
    }

    return excludePaths;
};

export const getExcludedTargets = (excludePaths, params) =>
    excludePaths.flatMap(excludePath => {
        const values = path(params, excludePath);

        return Array.isArray(values) ?
            values.flat(Infinity) :
            values === undefined ? [] : [values];
    });

export const isExcludedTarget = (target, excludedTargets) =>
    excludedTargets.some(excludedTarget =>
        excludedTarget === target ||
        (target?.id !== undefined && excludedTarget?.id === target.id)
    );

const getAggregateCondition = (condition, property) => {
    if (!condition || typeof condition !== 'object' ||
        Array.isArray(condition) ||
        !AGGREGATE_OPERATORS.has(condition.operator)) {
        return undefined;
    }

    const {operator} = condition;
    if (Object.keys(condition).some(key =>
        !AGGREGATE_CONDITION_KEYS.has(key))) {
        throw new TypeError(
            `The ${operator} target condition for "${property}" has unsupported options.`
        );
    }

    const defaultValue = condition.defaultValue ??
        (operator === OPERATOR_MAX ? 0 : Number.MAX_SAFE_INTEGER);
    if (!Number.isFinite(defaultValue)) {
        throw new TypeError(
            `The ${operator} target condition for "${property}" requires a finite defaultValue.`
        );
    }

    return {
        property,
        defaultValue,
        operator,
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
        if (property === 'exclude') {
            return;
        }

        const aggregateCondition = getAggregateCondition(value, property);
        if (aggregateCondition) {
            selectionConditions.push(aggregateCondition);
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
    selectionConditions.reduce((candidates, {
        defaultValue,
        operator,
        property,
    }) => {
        if (!candidates.length) {
            return candidates;
        }

        const values = candidates.map(candidate => {
            const value = path(candidate, property);
            const comparableValue = value ?? defaultValue;
            if (!Number.isFinite(comparableValue)) {
                throw new TypeError(
                    `The ${operator} target condition requires a finite value for "${property}".`
                );
            }

            return comparableValue;
        });
        const selectedValue = operator === OPERATOR_MIN ?
            Math.min(...values) :
            Math.max(...values);

        return candidates.filter((_, index) =>
            values[index] === selectedValue);
    }, targets);
