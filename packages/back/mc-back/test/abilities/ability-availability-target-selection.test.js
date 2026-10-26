import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {getAbilitiesWithAvailability} from '../../src/utils/ability-availability.js';

describe('ability target selection metadata', () => {
    test('serializes the target selection mode exposed by the effect', async () => {
        const deck = {id: 'scenario-deck'};
        const effect = {
            selectedTarget: undefined,
            validTarget: {
                isMultipleTarget: () => false,
            },
            getTargetSelectionMode: () => 'deck',
            async getValidTarget() {
                return [deck];
            },
        };
        const ability = {
            effect,
            isAction: true,
            isAttack: false,
            isBasic: false,
            isThwart: false,
            prepareEffect() {},
            async canRun() {
                return true;
            },
            toObj() {
                return {isAction: true, name: 'Mirar un mazo'};
            },
        };
        const [serializedAbility] = await getAbilitiesWithAvailability({
            currentSide: {abilities: [ability]},
        }, {});

        assert.equal(serializedAbility.targetSelectionMode, 'deck');
        assert.deepEqual(serializedAbility.availableTargetIds, [
            deck.id,
        ]);
    });
});
