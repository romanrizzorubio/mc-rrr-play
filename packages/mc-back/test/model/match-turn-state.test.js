import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Match} from '../../src/model/match/match.js';

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
