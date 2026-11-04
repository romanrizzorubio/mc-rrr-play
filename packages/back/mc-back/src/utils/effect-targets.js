import {Effect} from '../effects/effect.js';

function getNestedEffects(value) {
    if (value instanceof Effect) {
        return [value];
    }

    return Array.isArray(value) ?
        value.flatMap(nested => getNestedEffects(nested)) :
        [];
}

async function getTargetEntries(
    effect,
    params,
    visited,
    deferred
) {
    if (!effect || typeof effect.getValidTarget !== 'function' ||
        visited.has(effect)) {
        return [];
    }
    visited.add(effect);

    const targets = await (effect.getTargetSelectionCandidates ?
        effect.getTargetSelectionCandidates(params) :
        effect.getValidTarget(params));
    const entries = [{
        deferred,
        effect,
        targets,
    }];
    const nestedParams = {
        ...params,
        parentTargets: targets.flat(Infinity),
    };
    const nestedEffects = effect.getTargetSelectionChildren ?
        await effect.getTargetSelectionChildren(params) :
        Object.values(effect).flatMap(value => getNestedEffects(value));
    const resolutionChildren = effect.getResolutionChildEffects ?
        effect.getResolutionChildEffects() :
        new Set(nestedEffects);

    for (const nestedEffect of nestedEffects) {
        entries.push(...await getTargetEntries(
            nestedEffect,
            nestedParams,
            visited,
            deferred || !resolutionChildren.has(nestedEffect)
        ));
    }

    return entries;
}

export async function getEffectTargetEntries(
    effect,
    params,
    visited = new Set()
) {
    return getTargetEntries(effect, params, visited, false);
}

export function getResolutionEffectTree(effect) {
    const effects = new Set();
    const addEffectAndChildren = currentEffect => {
        if (!currentEffect || effects.has(currentEffect)) {
            return;
        }

        effects.add(currentEffect);
        currentEffect.getResolutionChildEffects?.().forEach(
            addEffectAndChildren
        );
    };
    addEffectAndChildren(effect);

    return effects;
}

export function canPreselectEffectTarget(effect) {
    return Boolean(
        effect &&
        !effect.isTargetSelectionWrapper &&
        !effect.selectUpTo &&
        !effect.targetCountCalc &&
        (effect.selectCount === undefined || effect.selectCount === 1) &&
        !effect.validTarget?.isMultipleTarget?.({target: effect.target})
    );
}
