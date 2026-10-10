import {
    encodeSnapshotProperty,
    getSnapshotType,
    getSnapshotTypeByName,
    isMatchSnapshot,
    restoreSnapshotTypes,
    shouldIgnoreSnapshotProperty,
    VALID_TARGET_FILTER_MARKER,
} from './match-snapshot-types.js';

const serializationVersion = 2;

function encodeGraph(root) {
    const ids = new WeakMap();
    const nodes = [];

    const encodeValue = (value, owner, propertyName) => {
        if (value === undefined) {
            return {kind: 'undefined'};
        }
        if (typeof value === 'function') {
            throw new Error(`Cannot persist function property "${propertyName}"`);
        }
        if (typeof value === 'bigint') {
            return {kind: 'bigint', value: value.toString()};
        }
        if (typeof value === 'symbol') {
            throw new Error(`Cannot persist symbol property "${propertyName}"`);
        }
        if (value === null || typeof value !== 'object') {
            return value;
        }

        if (ids.has(value)) {
            return {ref: ids.get(value)};
        }

        const id = nodes.length;
        ids.set(value, id);
        nodes.push(null);

        if (Array.isArray(value)) {
            nodes[id] = {
                type: 'Array',
                items: value.map(item => encodeValue(item, value, '')),
                properties: [],
            };
        } else if (value instanceof Map) {
            nodes[id] = {
                type: 'Map',
                entries: [...value].map(([key, item]) => [
                    encodeValue(key, value, ''),
                    encodeValue(item, value, ''),
                ]),
            };
        } else if (value instanceof Set) {
            nodes[id] = {
                type: 'Set',
                items: [...value].map(item => encodeValue(item, value, '')),
            };
        } else if (value instanceof Date) {
            nodes[id] = {type: 'Date', value: value.getTime()};
        } else if (value instanceof RegExp) {
            nodes[id] = {
                type: 'RegExp',
                source: value.source,
                flags: value.flags,
                lastIndex: value.lastIndex,
            };
        } else {
            const prototype = Object.getPrototypeOf(value);
            const snapshotType = getSnapshotType(value);
            const type = snapshotType?.name ||
                (prototype === null ? 'null' : prototype.constructor.name);
            if (type !== 'Object' && type !== 'null' && !snapshotType) {
                throw new Error(`Cannot persist unsupported match snapshot type "${type}"`);
            }

            nodes[id] = {
                type,
                properties: Object.keys(value)
                    .filter(name => !shouldIgnoreSnapshotProperty(value, name))
                    .map(name => [
                        name,
                        encodeSnapshotProperty(value, name, value[name], encodeValue),
                    ]),
            };
        }

        return {ref: id};
    };

    return {
        version: serializationVersion,
        root: encodeValue(root),
        nodes,
    };
}

function decodeGraph(snapshot, context) {
    if (snapshot.version !== serializationVersion || !Array.isArray(snapshot.nodes)) {
        throw new Error(`Unsupported match snapshot version "${snapshot.version}"`);
    }

    const objects = snapshot.nodes.map(node => {
        switch (node.type) {
            case 'Array':
                return [];
            case 'Date':
                return new Date(node.value);
            case 'Map':
                return new Map();
            case 'null':
                return Object.create(null);
            case 'Object':
                return {};
            case 'RegExp':
                return new RegExp(node.source, node.flags);
            case 'Set':
                return new Set();
            default: {
                const snapshotType = getSnapshotTypeByName(node.type);
                if (!snapshotType) {
                    throw new Error(`Unknown match snapshot type "${node.type}"`);
                }
                return Object.create(snapshotType.ModelType.prototype);
            }
        }
    });

    const decodeValue = value => {
        if (value === null || typeof value !== 'object') {
            return value;
        }
        if (Object.hasOwn(value, 'ref')) {
            const object = objects[value.ref];
            if (!object) {
                throw new Error(`Invalid match snapshot reference "${value.ref}"`);
            }
            return object;
        }
        switch (value.kind) {
            case 'undefined':
                return undefined;
            case 'bigint':
                return BigInt(value.value);
            case 'valid-target-filter':
                return VALID_TARGET_FILTER_MARKER;
            default:
                throw new Error('Invalid value in match snapshot');
        }
    };

    snapshot.nodes.forEach((node, id) => {
        const object = objects[id];
        if (node.type === 'Array') {
            node.items.forEach((item, index) => {
                object[index] = decodeValue(item);
            });
        } else if (node.type === 'Map') {
            node.entries.forEach(([key, value]) => {
                object.set(decodeValue(key), decodeValue(value));
            });
        } else if (node.type === 'Set') {
            node.items.forEach(item => object.add(decodeValue(item)));
        } else if (node.properties) {
            node.properties.forEach(([name, value]) => {
                Object.defineProperty(object, name, {
                    configurable: true,
                    enumerable: true,
                    value: decodeValue(value),
                    writable: true,
                });
            });
        }
        if (node.type === 'RegExp') {
            object.lastIndex = node.lastIndex;
        }
    });

    restoreSnapshotTypes(objects, context);

    return decodeValue(snapshot.root);
}

export function serializeMatch(match) {
    return encodeGraph(match);
}

export function restoreMatch(snapshot, mc) {
    const match = decodeGraph(snapshot, {mc});
    if (!isMatchSnapshot(match)) {
        throw new Error('The stored snapshot does not contain a match');
    }

    return match;
}
