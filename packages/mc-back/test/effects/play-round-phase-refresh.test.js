import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {Engine} from '../../src/engine/engine.js';
import {PlayMatchEffect} from '../../src/effects/play-match-effect.js';
import {Match} from '../../src/model/match/match.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../src/utils/match-serialization.js';

test('ending a player turn runs the villain phase before the next round', async () => {
    let finishTurn;
    let signalTurnListenerReady;
    const turnListenerReady = new Promise(resolve => {
        signalTurnListenerReady = resolve;
    });
    const phaseSnapshots = [];
    const villainSteps = [];
    const player = {
        name: 'Hulka',
        async runEndPlayersPhase() {},
    };
    const match = {
        phase: 'players',
        turnIndex: 0,
        endPlayerIndex: 0,
        villainPhaseStep: 0,
        currentPlayer: player,
        players: [player],
        orderedPlayers: [player],
        triggerCards: {},
        async persist() {},
        async refresh() {
            phaseSnapshots.push({
                currentTurnPlayer: this.currentTurnPlayer?.name ?? null,
                phase: this.phase,
            });
        },
        listen(endpoint, callback, once) {
            assert.equal(endpoint, EVENTS.TURN.END);
            assert.equal(once, true);
            finishTurn = callback;
            signalTurnListenerReady();
        },
    };
    const effect = new PlayMatchEffect({match});
    const previousRound = Engine.currentRound;

    const round = effect.execute({});
    const roundEffect = Engine.currentRound;

    roundEffect.playersPhase.endLimit = async () => {};
    roundEffect.villainPhase.stepAccelerateScheme = async () => {
        villainSteps.push('place-threat');
    };
    roundEffect.villainPhase.stepActivations = async () => {
        villainSteps.push('enemy-activations');
    };
    roundEffect.villainPhase.stepDealEncounters = async () => {
        villainSteps.push('deal-encounters');
    };
    roundEffect.villainPhase.stepRevealEncounters = async () => {
        villainSteps.push('reveal-encounters');
    };
    roundEffect.villainPhase.runEndVillainPhase = () => {
        villainSteps.push('advance-first-player');
        roundEffect.playing = false;
    };
    roundEffect.villainPhase.endLimit = async () => {};
    roundEffect.endLimit = async () => {};

    try {
        await turnListenerReady;
        finishTurn({player: player.name});
        await round;
    } finally {
        Engine.currentRound = previousRound;
    }

    assert.deepEqual(villainSteps, [
        'place-threat',
        'enemy-activations',
        'deal-encounters',
        'reveal-encounters',
        'advance-first-player',
    ]);
    assert.deepEqual(phaseSnapshots, [
        {currentTurnPlayer: 'Hulka', phase: 'players'},
        {currentTurnPlayer: null, phase: 'players'},
        {currentTurnPlayer: null, phase: 'villain'},
        {currentTurnPlayer: null, phase: 'round-complete'},
    ]);
});

test('restoring a match in the villain phase resumes from its saved villain step', async () => {
    const player = {
        name: 'Hulka',
        initial: true,
        encounters: [],
    };
    const savedMatch = new Match({
        mc: {},
        name: 'restored-villain-phase',
    });
    Object.assign(savedMatch, {
        initialized: true,
        phase: 'villain',
        playing: true,
        players: [player],
        villainPhaseStep: 3,
    });

    const match = restoreMatch(serializeMatch(savedMatch), {});
    const villainSteps = [];
    let playersPhaseRuns = 0;
    const previousRound = Engine.currentRound;
    const effect = new PlayMatchEffect({match});
    const running = effect.execute({});
    const roundEffect = Engine.currentRound;
    const runEndVillainPhase = roundEffect.villainPhase.runEndVillainPhase.bind(
        roundEffect.villainPhase
    );

    match.persist = async () => {};
    match.refresh = async () => {};
    roundEffect.playersPhase.runEffect = async () => {
        playersPhaseRuns++;
    };
    roundEffect.villainPhase.runTracedStep = async (step, action) => {
        villainSteps.push(step);
        await action();
    };
    roundEffect.villainPhase.runEndVillainPhase = () => {
        runEndVillainPhase();
        roundEffect.playing = false;
    };
    roundEffect.villainPhase.endLimit = async () => {};
    roundEffect.endLimit = async () => {};

    try {
        await running;
    } finally {
        Engine.currentRound = previousRound;
    }

    assert.deepEqual(villainSteps, [
        'reveal-encounters',
        'advance-first-player',
    ]);
    assert.equal(playersPhaseRuns, 0);
    assert.equal(match.phase, 'round-complete');
    assert.equal(match.villainPhaseStep, 0);
});
