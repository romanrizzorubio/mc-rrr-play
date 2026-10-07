import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {MATCH_END_REASON_VILLAIN_DEFEATED} from 'mc-shared';

import {Scenario} from '../../src/model/match/scenario.js';

test('replacing a villain stage removes old responses and registers the new stage', async () => {
    const dialogs = [];
    const match = {
        async openDialog(dialog) {
            dialogs.push(dialog);
            assert.equal(match.scenario.villain, dialog.title ?
                oldVillain :
                nextVillain);
            return {};
        },
        isUniqueCard() {
            return false;
        },
        triggerCards: {},
    };
    const oldVillain = {
        attached: [],
        accelerationTokens: 2,
        confused: 1,
        counters: 3,
        damage: 7,
        endTriggers() {
            delete match.triggerCards[this.id];
        },
        exhausted: false,
        faceDown: [{id: 'face-down-card'}],
        id: 'rhino-stage-1',
        modifyHitPoints: 10,
        name: 'Rino',
        selectedSide: 0,
        stunned: 1,
        tough: 1,
        toObj() {
            return {id: this.id, name: this.name};
        },
    };
    const attachment = {attachedTo: oldVillain};
    oldVillain.attached.push(attachment);
    const nextVillain = {
        abilities: [],
        accelerationTokens: 0,
        attached: [],
        attachedTo: null,
        controller: null,
        confused: 0,
        counters: 0,
        damage: 0,
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
        modifyHitPoints: 0,
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
    assert.equal(nextVillain.modifyHitPoints, 10);
    assert.equal(nextVillain.attached[0], attachment);
    assert.equal(attachment.attachedTo, nextVillain);
    assert.equal(nextVillain.stunned, 1);
    assert.equal(nextVillain.confused, 1);
    assert.equal(nextVillain.tough, 1);
    assert.equal(nextVillain.counters, 3);
    assert.equal(nextVillain.accelerationTokens, 2);
    assert.deepEqual(nextVillain.faceDown, oldVillain.faceDown);
    assert.equal(nextVillain.damage, 0);
    assert.equal(match.triggerCards[oldVillain.id], undefined);
    assert.equal(match.triggerCards[nextVillain.id], nextVillain);
    assert.equal(dialogs[0].title, 'Rino ha sido derrotado');
    assert.deepEqual(dialogs[0].data.card, {id: oldVillain.id, name: oldVillain.name});
    assert.equal(dialogs[1].title, undefined);
});

test('defeating the final villain stage marks the match as won', async () => {
    const emitted = [];
    const finished = [];
    const dialogs = [];
    const villain = {
        name: 'Rino',
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
        async openDialog(dialog) {
            dialogs.push(dialog);
        },
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
    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].title, 'Rino ha sido derrotado');
    assert.deepEqual(dialogs[0].data.card, {id: 'rhino-stage-2'});
    assert.deepEqual(emitted, [[
        match.name,
        EVENTS.SCENARIO.DEFEAT,
        {name: scenario.name},
    ]]);
});
