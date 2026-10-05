import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {MATCH_END_REASON_VILLAIN_DEFEATED} from 'mc-shared';

import {Scenario} from '../../src/model/match/scenario.js';

test('replacing a villain stage removes old responses and registers the new stage', async () => {
    const match = {
        async openDialog() {
            assert.equal(match.scenario.villain, nextVillain);
            return {};
        },
        isUniqueCard() {
            return false;
        },
        triggerCards: {},
    };
    const oldVillain = {
        attached: [],
        accelerationTokens: 0,
        confused: 0,
        counters: 0,
        endTriggers() {
            delete match.triggerCards[this.id];
        },
        exhausted: false,
        faceDown: [],
        id: 'rhino-stage-1',
        name: 'Rino',
        selectedSide: 0,
        stunned: 0,
        tough: 0,
    };
    const nextVillain = {
        abilities: [],
        attached: [],
        attachedTo: null,
        controller: null,
        faceDown: [],
        id: 'rhino-stage-2',
        isAlly: false,
        isAttachment: false,
        isAttachable: false,
        isEncounterCard: true,
        isInPlay: false,
        isMain: true,
        isMinion: false,
        isPlayerCard: false,
        isSideScheme: false,
        isTreachery: false,
        isVillain: true,
        name: 'Rino',
        owner: null,
        selectedSide: 0,
        stunned: 0,
        surge: false,
        tough: 0,
        triggers: {},
        async initTriggers() {
            match.triggerCards[this.id] = this;
        },
        async refresh() {},
        toObj() {
            return {id: this.id, name: this.name};
        },
    };
    const player = {
        gameZone: {
            addToGameZone() {},
            async refresh() {},
        },
    };
    const scenario = new Scenario({
        mainSchemes: [],
        match,
        name: 'Rino',
        scenarioCards: [],
        sets: [],
        villains: [nextVillain],
    });

    match.scenario = scenario;
    scenario.gameZone = {
        addToGameZone() {},
        cards: [],
        currentVillain: oldVillain,
        async refresh() {},
    };
    match.triggerCards[oldVillain.id] = oldVillain;

    await scenario.selectVillain(player);

    assert.equal(scenario.villain, nextVillain);
    assert.equal(match.triggerCards[oldVillain.id], undefined);
    assert.equal(match.triggerCards[nextVillain.id], nextVillain);
});

test('defeating the final villain stage marks the match as won', async () => {
    const emitted = [];
    const finished = [];
    const villain = {
        toObj() {
            return {id: 'rhino-stage-2'};
        },
    };
    const match = {
        mc: {
            mcSocket: {
                send(...params) {
                    emitted.push(params);
                },
            },
        },
        name: 'rhino-match',
        async finishGame(reason) {
            finished.push(reason);
        },
    };
    const scenario = new Scenario({
        mainSchemes: [],
        match,
        name: 'Rino',
        scenarioCards: [],
        sets: [],
        villains: [],
    });
    scenario.gameZone = {
        currentVillain: villain,
        toObj() {
            return {};
        },
    };
    scenario.toObj = () => ({name: scenario.name});

    await scenario.selectVillain();

    assert.deepEqual(finished, [MATCH_END_REASON_VILLAIN_DEFEATED]);
    assert.deepEqual(emitted, [[
        match.name,
        EVENTS.SCENARIO.DEFEAT,
        {name: scenario.name},
    ]]);
});
