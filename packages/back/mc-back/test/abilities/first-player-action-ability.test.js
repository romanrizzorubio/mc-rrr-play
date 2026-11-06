import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_FIRST_PLAYER_ACTION,
} from 'mc-shared';
import {FirstPlayerActionAbility} from '../../src/abilities/actions/first-player-action-ability.js';
import {ABILITY_MAP} from '../../src/factory/abilities/abilities-map.js';

describe('FirstPlayerActionAbility', () => {
    test('is registered as an action type', () => {
        assert.equal(ABILITY_MAP[ABILITY_FIRST_PLAYER_ACTION], FirstPlayerActionAbility);
    });

    test('is available only to the initial player', async () => {
        const initialPlayer = {isPlayer: true, id: 'initial'};
        const otherPlayer = {isPlayer: true, id: 'other'};
        const match = {initialPlayer};
        const ability = new FirstPlayerActionAbility({
            abilityType: ABILITY_FIRST_PLAYER_ACTION,
            card: {
                controller: {isPlayer: false},
                printedTextBlank: false,
            },
            effect: {canRun: async () => true},
            match,
            name: 'Initial Player action',
        });

        assert.equal(ability.isAction, true);
        assert.equal(await ability.canRun({player: initialPlayer}), true);
        assert.equal(await ability.canRun({player: otherPlayer}), false);
    });
});
