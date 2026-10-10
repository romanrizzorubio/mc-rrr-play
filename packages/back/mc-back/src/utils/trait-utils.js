import {RemoveTraitEffect} from '../effects/remove-trait-effect.js';

export async function addCharacterTraits(effect, params, traits) {
    const {match, selectedTarget, target} = effect;

    if (!selectedTarget || !Array.isArray(selectedTarget.extraTraits)) {
        return;
    }

    const traitsToAdd = [...new Set(traits)]
        .filter(trait => !selectedTarget.traits.includes(trait));

    if (!traitsToAdd.length) {
        return;
    }

    selectedTarget.extraTraits.push(...traitsToAdd);

    if (params.lasting) {
        const cleanup = new RemoveTraitEffect({
            match,
            target,
            traits: traitsToAdd,
        });
        params.lasting.registerCleanup(cleanup, selectedTarget);
    }

    await selectedTarget.refresh();
}
