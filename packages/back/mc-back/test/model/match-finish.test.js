import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {MATCH_END_REASON_VILLAIN_DEFEATED} from 'mc-shared';

import {Match} from '../../src/model/match/match.js';

test('finishing a match persists the outcome and releases the active player turn', async () => {
    const calls = [];
    const mc = {
        async persistMatch(match) {
            calls.push(['persist', match.gameOverReason]);
        },
        mcSocket: {
            dispatch(...params) {
                calls.push(['dispatch', ...params]);
            },
            send(...params) {
                calls.push(['send', ...params]);
            },
        },
    };
    const match = new Match({mc, name: 'match-finish'});
    match.phase = 'players';
    match.currentTurnPlayer = {name: 'Player'};

    await match.finishGame(MATCH_END_REASON_VILLAIN_DEFEATED);

    assert.equal(match.playing, false);
    assert.equal(match.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
    assert.deepEqual(calls, [
        ['dispatch', match.name, EVENTS.TURN.END, {gameOver: true}],
        ['persist', MATCH_END_REASON_VILLAIN_DEFEATED],
        ['send', match.name, EVENTS.MATCH.REFRESH, match.toObj()],
    ]);
});

test('finishing a match requires an end reason and is idempotent', async () => {
    const persistCalls = [];
    const mc = {
        async persistMatch() {
            persistCalls.push('persist');
        },
        mcSocket: {
            dispatch() {},
            send() {},
        },
    };
    const match = new Match({mc, name: 'match-finish'});
    match.players = [];

    await assert.rejects(match.finishGame(), /Falta el motivo/);

    await match.finishGame(MATCH_END_REASON_VILLAIN_DEFEATED);
    await match.finishGame('another-ending');

    assert.equal(match.gameOverReason, MATCH_END_REASON_VILLAIN_DEFEATED);
    assert.deepEqual(persistCalls, ['persist']);
});
