export function createEffectInstance(effect, {
    ability,
    preselectedEffectTargets,
    preserveNestedSelectedTargets = false,
    preserveSelectedTarget = false,
    reuseInstance = false,
    selectedTarget,
} = {}) {
    if (reuseInstance && effect) {
        const effectInstances = new Map();
        const addEffectAndChildren = currentEffect => {
            if (!currentEffect || effectInstances.has(currentEffect)) {
                return;
            }

            effectInstances.set(currentEffect, currentEffect);
            currentEffect.getResolutionChildEffects?.().forEach(
                addEffectAndChildren
            );
        };
        addEffectAndChildren(effect);

        return {
            effect,
            effectInstances,
            preselectedEffectTargets,
        };
    }

    if (!effect ||
        typeof effect.createInstance !== 'function' ||
        !effect._effectInstanceDefinition) {
        const effectInstances = new Map();
        if (effect) {
            effectInstances.set(effect, effect);
        }

        return {
            effect,
            effectInstances,
            preselectedEffectTargets,
        };
    }

    const effectInstances = new Map();
    const instance = effect.createInstance({ability}, effectInstances);
    if (!effectInstances.has(effect)) {
        effectInstances.set(effect, instance);
    }

    if (preserveSelectedTarget || preselectedEffectTargets?.has(effect)) {
        instance.selectedTarget = selectedTarget === undefined ?
            effect.selectedTarget :
            selectedTarget;
    }

    const resolvedPreselectedEffectTargets = preselectedEffectTargets &&
        new Set([...preselectedEffectTargets].map(preselectedEffect => {
            const effectInstance = effectInstances.get(preselectedEffect);
            if (!effectInstance) {
                throw new TypeError(
                    'A preselected effect does not belong to the ability effect tree.'
                );
            }

            return effectInstance;
        }));

    effectInstances.forEach((effectInstance, sourceEffect) => {
        if (sourceEffect === effect) {
            return;
        }
        if (preserveNestedSelectedTargets ||
            preselectedEffectTargets?.has(sourceEffect)) {
            effectInstance.selectedTarget = sourceEffect.selectedTarget;
        }
    });

    return {
        effect: instance,
        effectInstances,
        preselectedEffectTargets: resolvedPreselectedEffectTargets,
    };
}
