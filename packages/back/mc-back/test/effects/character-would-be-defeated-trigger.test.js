import assert from 'node:assert/strict';
import test from 'node:test';

import {CharacterWouldBeDefeatedTrigger} from '../../src/triggers/character-would-be-defeated-trigger.js';

test('CharacterWouldBeDefeatedTrigger accepts its owner player as the target', async () => {
    const superhero = {currentSide: {}};
    const player = {
        isPlayer: true,
        superhero,
    };
    const trigger = new CharacterWouldBeDefeatedTrigger({
        ability: {
            async canTrigger() {
                return true;
            },
        },
        card: {owner: player},
    });

    assert.equal(await trigger.canTrigger({
        effect: {selectedTarget: player},
    }), true);
    assert.equal(await trigger.canTrigger({
        effect: {selectedTarget: {isPlayer: true, superhero: {}}},
    }), undefined);
});
