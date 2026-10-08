import assert from 'node:assert/strict';
import test from 'node:test';

import {TARGET_ALL_PLAYERS} from 'mc-shared';
import {ForEachEffect} from '../../src/effects/for-each-effect.js';

function createPlayer(id, eligible = true) {
    return {
        id,
        isPlayer: true,
        eligible,
    };
}

function createEffect(players, initialPlayer, resolvedPlayers) {
    const match = {
        players,
        initialPlayer,
        effectsFactory: {
            parseEffect() {
                return {
                    async canRun() {
                        return true;
                    },
                    async runEffect({player}) {
                        resolvedPlayers.push(player.id);
                    },
                    isResolved() {
                        return true;
                    },
                    isFullResolved() {
                        return true;
                    },
                };
            },
        },
    };

    return new ForEachEffect({
        effectDefinition: {type: 'test'},
        condition: {
            eligible: true,
            exclude: [
                'effects.0.attacks.*.selectedTarget',
                'effects.0.attacks.*.defender.owner',
            ],
        },
        match,
        target: TARGET_ALL_PLAYERS,
    });
}

test('ForEach preserves target order with per-player context', async () => {
    const firstPlayer = createPlayer('first');
    const secondPlayer = createPlayer('second');
    const attackedPlayer = createPlayer('attacked');
    const resolvedPlayers = [];
    const effect = createEffect(
        [firstPlayer, secondPlayer, attackedPlayer],
        secondPlayer,
        resolvedPlayers
    );
    const params = {
        effects: [{
            attacks: [{
                selectedTarget: attackedPlayer,
            }],
        }],
        player: firstPlayer,
    };

    assert.equal(await effect.canRun(params), true);
    await effect.prepare(params);

    assert.deepEqual(effect.selectedTarget, [firstPlayer, secondPlayer]);

    await effect.execute(params);

    assert.deepEqual(resolvedPlayers, ['first', 'second']);
    assert.equal(effect.results.length, 2);
});

test('ForEach is unavailable when its condition excludes every target', async () => {
    const firstPlayer = createPlayer('first');
    const secondPlayer = createPlayer('second');
    const effect = createEffect(
        [firstPlayer, secondPlayer],
        firstPlayer,
        []
    );
    const params = {
        effects: [{
            attacks: [
                {selectedTarget: firstPlayer},
                {selectedTarget: secondPlayer},
            ],
        }],
        player: firstPlayer,
    };

    assert.notEqual(await effect.canRun(params), true);
});

test('ForEach excludes targets resolved from paths in condition', async () => {
    const firstPlayer = createPlayer('first');
    const secondPlayer = createPlayer('second');
    const resolvedPlayers = [];
    const effect = createEffect(
        [firstPlayer, secondPlayer],
        firstPlayer,
        resolvedPlayers
    );
    const params = {
        effects: [{
            attacks: [
                {defender: {owner: firstPlayer}},
                {selectedTarget: {id: secondPlayer.id}},
            ],
        }],
        player: firstPlayer,
    };

    assert.notEqual(await effect.canRun(params), true);
});

test('ForEach requires valid exclusion paths', () => {
    assert.throws(() => new ForEachEffect({
        effectDefinition: {type: 'test'},
        condition: {
            exclude: ['effects.0.attacks.*.selectedTarget', ''],
        },
        match: {},
    }), /exclude must be a path or a list of paths/);
});
