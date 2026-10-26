import {RemoveTraitEffect} from '../effects/remove-trait-effect.js';
import {refreshCharacter} from './character-utils.js';

export async function addCharacterTraits(effect, params, traits) {
    const {match, selectedTarget, target} = effect;

    const selectedTargets = Array.isArray(selectedTarget) ?
        selectedTarget.flat(Infinity) :
        [selectedTarget];

    for (const character of new Set(selectedTargets)) {
        if (!character || !Array.isArray(character.extraTraits)) {
            continue;
        }

        const traitsToAdd = [...new Set(traits)]
            .filter(trait => !character.traits.includes(trait));

        if (!traitsToAdd.length) {
            continue;
        }

        character.extraTraits.push(...traitsToAdd);

        if (params.lasting) {
            const cleanup = new RemoveTraitEffect({
                match,
                target,
                traits: traitsToAdd,
            });
            params.lasting.registerCleanup(cleanup, character);
        }

        await refreshCharacter(character);
    }
}
