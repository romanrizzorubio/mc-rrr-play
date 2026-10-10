import assert from 'node:assert/strict';
import {test} from 'node:test';

import {PlayPlayersPhaseEffect} from '../../src/effects/play-players-phase-effect.js';
import {PlayTurnEffect} from '../../src/effects/play-turn-effect.js';

test('starts each player turn with fresh trigger state', async () => {
    const players = [
        {name: 'Hulka'},
        {name: 'Thor'},
    ];
    const match = {
        endPlayerIndex: 0,
        orderedPlayers: players,
        playing: true,
        turnIndex: 0,
        turnStartProcessed: false,
        async persist() {},
    };
    const turnEffects = [];
    const turnStartStates = [];
    const originalRunEffect = PlayTurnEffect.prototype.runEffect;
    PlayTurnEffect.prototype.runEffect = async function({player}) {
        turnEffects.push(this);
        turnStartStates.push(match.turnStartProcessed);
        match.currentTurnPlayer = player;
        match.turnStartProcessed = true;
    };

    try {
        const effect = new PlayPlayersPhaseEffect({match});
        effect.endLimit = async () => {};
        effect.runEndPlayersPhase = async () => {};
        await effect.execute({});
    } finally {
        PlayTurnEffect.prototype.runEffect = originalRunEffect;
    }

    assert.equal(new Set(turnEffects).size, players.length);
    assert.deepEqual(turnStartStates, [false, false]);
    assert.equal(match.turnStartProcessed, false);
    assert.equal(match.turnIndex, 0);
});
