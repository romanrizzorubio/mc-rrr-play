export const checkCondition = (obj, condition) => {
    return Object.keys(condition).every(key => {
        const value = condition[key];
        const param = path(obj, key);

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
    } else if (Number.isInteger(value)) {
        return checkNumber(value, condition);
    }

    return value === condition;
};
export const path = (obj, par) => {
    if (obj) {
        const parts = par.split('.');
        let first = parts.shift();
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
