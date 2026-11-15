import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TARGET_PLAYER_FEWEST_MINIONS} from 'mc-shared';
import {groupTargets} from '../../src/targets/groups.js';

describe('player with fewest minions target', () => {
    test('returns only the player with the fewest engaged minions', () => {
        const players = [
            {minions: [{id: 'one'}, {id: 'two'}]},
            {minions: [{id: 'three'}]},
            {minions: []},
        ];

        assert.deepEqual(groupTargets[TARGET_PLAYER_FEWEST_MINIONS]({
            match: {players},
            player: players[0],
        }), [players[2]]);
    });

    test('returns all tied living players and excludes defeated players', () => {
        const players = [
            {minions: []},
            {minions: [], defeated: true},
            {minions: []},
            {minions: [{id: 'one'}]},
        ];

        assert.deepEqual(groupTargets[TARGET_PLAYER_FEWEST_MINIONS]({
            match: {players},
            player: players[0],
        }), [players[0], players[2]]);
    });

    test('uses the player game zone when the minion accessor is unavailable', () => {
        const players = [
            {gameZone: {minions: [{id: 'one'}]}},
            {gameZone: {minions: []}},
        ];

        assert.deepEqual(groupTargets[TARGET_PLAYER_FEWEST_MINIONS]({
            match: {players},
            player: players[0],
        }), [players[1]]);
    });
});
