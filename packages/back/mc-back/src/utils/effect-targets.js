import {Effect} from '../effects/effect.js';

function getNestedEffects(value) {
    if (value instanceof Effect) {
        return [value];
    }

    return Array.isArray(value) ?
        value.flatMap(nested => getNestedEffects(nested)) :
        [];
}

export async function getEffectTargetEntries(
    effect,
    params,
    visited = new Set()
) {
    if (!effect || typeof effect.getValidTarget !== 'function' ||
        visited.has(effect)) {
        return [];
    }
    visited.add(effect);

    const targets = await effect.getValidTarget(params);
    const entries = [{
        effect,
        targets,
    }];
    const nestedParams = {
        ...params,
        parentTargets: targets.flat(Infinity),
    };
    const nestedEffects = Object.values(effect)
        .flatMap(value => getNestedEffects(value));

    for (const nestedEffect of nestedEffects) {
        entries.push(...await getEffectTargetEntries(
            nestedEffect,
            nestedParams,
            visited
        ));
    }

    return entries;
}
