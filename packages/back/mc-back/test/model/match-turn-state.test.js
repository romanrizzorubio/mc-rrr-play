import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Match} from '../../src/model/match/match.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';

test('match state exposes the phase and active turn player', () => {
    const match = new Match({mc: {}, name: 'match'});
    match.phase = 'players';
    match.currentTurnPlayer = {name: 'Hulka'};

    const state = match.toObj();

    assert.equal(state.phase, 'players');
    assert.equal(state.currentTurnPlayer, 'Hulka');

    delete match.currentTurnPlayer;
    assert.equal(match.toObj().currentTurnPlayer, null);
});

test('restoring a legacy snapshot marks its active player turn as started', () => {
    const match = new Match({mc: {}, name: 'match'});
    const player = {initial: true, name: 'Hulka'};
    match.players = [player];
    match.currentPlayer = player;
    match.currentTurnPlayer = player;
    match.phase = 'players';
    match.turnIndex = 0;
    delete match.turnStartProcessed;

    const restored = restoreMatch(serializeMatch(match), {});

    assert.equal(restored.turnStartProcessed, true);
    assert.equal(restored.currentTurnPlayer, restored.players[0]);
});

test('preserves turn-start processing state in snapshots', () => {
    const match = new Match({mc: {}, name: 'match'});
    const player = {initial: true, name: 'Hulka'};
    match.players = [player];
    match.currentPlayer = player;
    match.currentTurnPlayer = player;
    match.phase = 'players';
    match.turnIndex = 0;
    match.turnStartProcessed = true;

    const restored = restoreMatch(serializeMatch(match), {});

    assert.equal(restored.turnStartProcessed, true);
});

test('restoring a legacy snapshot between player turns keeps the start unprocessed', () => {
    const match = new Match({mc: {}, name: 'match'});
    const firstPlayer = {initial: true, name: 'Hulka'};
    const nextPlayer = {initial: false, name: 'Thor'};
    match.players = [firstPlayer, nextPlayer];
    match.currentPlayer = firstPlayer;
    match.phase = 'players';
    match.turnIndex = 1;
    delete match.turnStartProcessed;

    const restored = restoreMatch(serializeMatch(match), {});

    assert.equal(restored.turnStartProcessed, false);
});
