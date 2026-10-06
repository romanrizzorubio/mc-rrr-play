import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {
    DIALOG_ENCOUNTERS_REVEAL,
    MATCH_END_REASON_MAIN_SCHEME_COMPLETED,
} from 'mc-shared';

import {Match} from '../../src/model/match/match.js';
import {Scenario} from '../../src/model/match/scenario.js';
import {MainSchemeBCard} from '../../src/model/printed/main-scheme-b-card.js';

test('main scheme B cards default to non-final', () => {
    assert.equal(new MainSchemeBCard({}).final, false);
});

test('main scheme B cards serialize their scheme type', () => {
    assert.equal(new MainSchemeBCard({}).toObj().isMainScheme, true);
});

function createSchemeSide({
    final,
    id = 'scheme-side',
    name = 'Main scheme',
    stage = 1,
    threat = 0,
    value,
    initial,
    accelerationTokens = 0,
}) {
    return {
        accelerationTokens,
        final,
        id,
        initial,
        isMainScheme: true,
        name,
        stage,
        threat,
        value,
        initScheme() {
            this.threat = this.initial;
        },
        async removeAttached() {},
        toObj() {
            return {id: this.id, name: this.name, stage: this.stage};
        },
    };
}

function createScenario({final = false, nextScheme} = {}) {
    const currentSide = createSchemeSide({
        final,
        id: 'completed-stage',
        name: 'Completed scheme',
        threat: 5,
        value: 5,
    });
    const currentScheme = {
        currentSide,
        endTriggers(force) {
            this.endedTriggers = force;
        },
        id: 'current-main-scheme',
    };
    const match = {
        gameOverReason: null,
        name: 'main-scheme-match',
        phase: 'villain',
        playing: true,
        removedCards: [],
        dialogs: [],
        sequence: [],
        initialPlayer: {name: 'First player'},
        dispatchedEvents: [],
        mc: {
            mcSocket: {
                dispatch(...args) {
                    match.dispatchedEvents.push(args);
                },
            },
        },
        async openDialog(dialog) {
            this.dialogs.push(dialog);
            this.sequence.push(dialog.title);
        },
        async refresh() {
            this.refreshCount = (this.refreshCount || 0) + 1;
        },
        async finishGame(reason) {
            this.playing = false;
            this.gameOverReason = reason;
            if (this.phase === 'players' && this.currentTurnPlayer) {
                this.mc.mcSocket.dispatch(this.name, EVENTS.TURN.END, {gameOver: true});
            }
            await this.refresh();
        },
        removeCard(card) {
            this.removedCards.push(card);
        },
    };
    const scenario = new Scenario({
        mainSchemes: nextScheme ? [nextScheme] : [],
        match,
        name: 'test-scenario',
        scenarioCards: [],
        sets: [],
        villains: [],
    });
    scenario.gameZone = {currentScheme};
    scenario.revealedMainSchemeSides = [];
    scenario.revealMainSchemeSide = async (side, player) => {
        scenario.revealedMainSchemeSides.push({player, side});
        match.sequence.push(`effects:${side.id}`);
    };

    return {currentScheme, currentSide, match, scenario};
}

function createNextScheme() {
    const aSide = createSchemeSide({
        id: 'next-stage-a',
        name: 'Next scheme',
        stage: 2,
    });
    const bSide = createSchemeSide({
        final: false,
        id: 'next-stage-b',
        initial: 3,
        name: 'Next scheme',
        stage: 2,
    });
    return {
        aSide,
        bSide,
        scheme: {
            selectedSide: 0,
            sides: [aSide, bSide],
            get currentSide() {
                return this.sides[this.selectedSide];
            },
            async flip({selectedFormTarget}) {
                this.selectedSide = this.sides.indexOf(selectedFormTarget);
            },
        },
    };
}

test('completing a non-final main scheme reveals and advances to the next stage', async () => {
    const {aSide, bSide, scheme: nextScheme} = createNextScheme();
    const {currentScheme, currentSide, match, scenario} = createScenario({nextScheme});
    const player = {name: 'Active player'};

    const advanced = await scenario.completeMainScheme(currentSide, {player});

    assert.equal(advanced, true);
    assert.equal(scenario.gameZone.currentScheme, nextScheme);
    assert.equal(scenario.mainSchemes.length, 0);
    assert.equal(nextScheme.currentSide, bSide);
    assert.equal(bSide.threat, 3);
    assert.equal(bSide.accelerationTokens, 0);
    assert.deepEqual(scenario.revealedMainSchemeSides, [
        {side: aSide, player},
        {side: bSide, player},
    ]);
    assert.equal(currentScheme.endedTriggers, true);
    assert.deepEqual(match.removedCards, [currentScheme]);
    assert.equal(match.refreshCount, 3);
    assert.deepEqual(match.dialogs.map(({dialogType, title, subtitle, data}) => ({
        dialogType,
        title,
        subtitle,
        card: data.card,
        horizontal: data.horizontal,
    })), [
        {
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: 'Completed scheme (1B)',
            subtitle: 'Etapa completada',
            card: {id: 'completed-stage', name: 'Completed scheme', stage: 1},
            horizontal: true,
        },
        {
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: 'Next scheme (2A)',
            subtitle: undefined,
            card: {id: 'next-stage-a', name: 'Next scheme', stage: 2},
            horizontal: true,
        },
        {
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: 'Next scheme (2B)',
            subtitle: undefined,
            card: {id: 'next-stage-b', name: 'Next scheme', stage: 2},
            horizontal: true,
        },
    ]);
    assert.deepEqual(match.sequence, [
        'Completed scheme (1B)',
        'Next scheme (2A)',
        'effects:next-stage-a',
        'Next scheme (2B)',
        'effects:next-stage-b',
    ]);
});

test('transfers acceleration tokens to the next main scheme stage', async () => {
    const {bSide, scheme: nextScheme} = createNextScheme();
    const {currentSide, scenario} = createScenario({nextScheme});
    currentSide.accelerationTokens = 2;

    await scenario.completeMainScheme(currentSide, {});

    assert.equal(bSide.accelerationTokens, 2);
});

test('completing a final main scheme ends the match even if another stage remains', async () => {
    const {scheme: nextScheme} = createNextScheme();
    const {currentScheme, currentSide, match, scenario} = createScenario({
        final: true,
        nextScheme,
    });

    const advanced = await scenario.completeMainScheme(currentSide, {});

    assert.equal(advanced, false);
    assert.equal(scenario.gameZone.currentScheme, currentScheme);
    assert.equal(match.playing, false);
    assert.equal(match.gameOverReason, MATCH_END_REASON_MAIN_SCHEME_COMPLETED);
    assert.equal(match.refreshCount, 1);
    assert.deepEqual(match.removedCards, []);
    assert.deepEqual(match.dialogs.map(({title}) => title), [
        'Completed scheme (1B)',
    ]);
});

test('completing the last main scheme ends the match when it is not marked final', async () => {
    const {currentSide, match, scenario} = createScenario();

    await scenario.completeMainScheme(currentSide, {});

    assert.equal(match.playing, false);
    assert.equal(match.gameOverReason, MATCH_END_REASON_MAIN_SCHEME_COMPLETED);
    assert.deepEqual(match.dialogs.map(({title}) => title), [
        'Completed scheme (1B)',
    ]);
});

test('losing during the player phase ends the waiting player turn', async () => {
    const {currentSide, match, scenario} = createScenario();
    match.phase = 'players';
    match.currentTurnPlayer = {name: 'Player'};

    await scenario.completeMainScheme(currentSide, {});

    assert.deepEqual(match.dispatchedEvents, [[
        match.name,
        EVENTS.TURN.END,
        {gameOver: true},
    ]]);
});

test('the main-scheme loss reason is included in match snapshots', () => {
    const match = new Match({
        mc: {},
        name: 'main-scheme-snapshot',
    });
    match.gameOverReason = MATCH_END_REASON_MAIN_SCHEME_COMPLETED;

    assert.equal(match.toObj().gameOverReason, MATCH_END_REASON_MAIN_SCHEME_COMPLETED);
});
