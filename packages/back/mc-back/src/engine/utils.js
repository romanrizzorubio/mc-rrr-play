const PATH_ARRAY_WILDCARD = '*';

export const checkCondition = (obj, condition) => {
    if (Array.isArray(condition)) {
        return condition.some(alternative =>
            checkCondition(obj, alternative));
    }

    return Object.keys(condition).every(key => {
        const value = condition[key];
        if (key === 'not') {
            return !checkCondition(obj, value);
        }

        const param = path(obj, key);
        if (Array.isArray(param) &&
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            Object.keys(value).length === 1 &&
            Object.prototype.hasOwnProperty.call(value, 'every')) {
            return param.every(item => checkCondition(item, value.every));
        }

        if (value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            typeof value.path === 'string' &&
            typeof value.operator === 'string') {
            const comparedValue = path(obj, value.path);
            if (!Number.isFinite(param) ||
                !Number.isFinite(comparedValue)) {
                return false;
            }

            switch (value.operator) {
                case 'eq':
                    return param === comparedValue;
                case 'gt':
                    return param > comparedValue;
                case 'gte':
                    return param >= comparedValue;
                case 'lt':
                    return param < comparedValue;
                case 'lte':
                    return param <= comparedValue;
                default:
                    throw new Error(
                        `Unsupported condition comparison operator "${value.operator}".`
                    );
            }
        }

        return checkValue(param, value);
    });
};
export const checkNumber = (value, condition) => {
    if (typeof condition === 'string') {
        const matcher = condition.substring(0, 1);
        const valCondition = parseInt(condition.substring(1, condition.length));

        if (matcher === '>') {
            return value > valCondition;
        } else if (matcher === '<') {
            return value < valCondition;
        }
    } else {
        return value === condition;
    }
};
export const checkValue = (value, condition) => {
    if (value instanceof Array) {
        if (condition instanceof Array) {
            return value
                .some(p =>
                    condition
                        .some(c =>
                            c === p));
        }
        return value.some(p => p === condition);
    } else if (typeof value === 'string' &&
        condition &&
        typeof condition === 'object' &&
        !Array.isArray(condition) &&
        condition.operator === 'matchesTitle' &&
        typeof condition.value === 'string' &&
        condition.value.length) {
        return value === condition.value ||
            (value.startsWith(`${condition.value} (`) && value.endsWith(')'));
    } else if (Number.isInteger(value)) {
        return checkNumber(value, condition);
    }

    return value === condition;
};
export const path = (obj, par) => {
    if (obj) {
        const parts = par.split('.');
        let first = parts.shift();
        if (first === PATH_ARRAY_WILDCARD) {
            if (!Array.isArray(obj)) {
                return [];
            }

            return obj.flatMap(value => {
                const resolved = parts.length ?
                    path(value, parts.join('.')) :
                    value;
                if (resolved === undefined) {
                    return [];
                }

                return Array.isArray(resolved) ?
                    resolved.flat(Infinity) :
                    [resolved];
            });
        }

        if (!isNaN(first)) {
            first = parseInt(first);
        }
        const val = obj[first];

        if (val !== undefined) {
            if (parts.length) {
                return path(val, parts.join('.'));
            }

            return val;
        }
    }
};
export const pathSet = (obj, par, value) => {
    if (obj) {
        const parts = par.split('.');
        let first = parts.shift();
        const isNumber = !isNaN(first);
        if (isNumber) {
            first = parseInt(first);
        }
        if (parts.length) {
            if (obj[first] === undefined) {
                obj[first] = isNumber ? [] : {};
            }

            pathSet(obj[first], parts.join('.'), value);
        } else {
            obj[first] = value;
        }
    }
};
export const random = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1) + min);
};
