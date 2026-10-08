import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_ENCOUNTERS_REVEAL} from 'mc-shared';

import {Scenario} from '../../src/model/match/scenario.js';

function createScenarioForDifficulty() {
    const sideA = {
        content: {
            villains: [1, 2],
            villainsExpert: [2],
        },
        id: 'stage-1A',
        name: 'Plan inicial',
        stage: 1,
        toObj() {
            return {id: this.id, name: this.name, stage: this.stage};
        },
    };
    const sideB = {
        id: 'stage-1B',
        name: 'Plan inicial',
        stage: 1,
        initScheme() {},
        toObj() {
            return {id: this.id, name: this.name, stage: this.stage};
        },
    };
    const currentScheme = {
        get currentSide() {
            return this.selectedSide === 0 ? sideA : sideB;
        },
        selectedSide: 0,
        async flip() {
            this.selectedSide = 1;
        },
        async setup() {},
    };
    const standardSet = {
        standard: true,
        cards: [{name: 'Standard card'}],
        expertSet: [{name: 'Expert card'}],
    };
    const scenario = new Scenario({
        mainSchemes: [currentScheme],
        match: {
            initialPlayer: {name: 'Initial player'},
            async openDialog() {},
        },
        name: 'difficulty-test',
        scenarioCards: [],
        sets: [standardSet],
        villains: [{stage: 1}, {stage: 2}],
    });
    scenario.selectVillain = async () => {};
    scenario.revealMainSchemeSide = async () => {};

    return scenario;
}

test('scenario setup shows stage 1A and 1B before resolving their effects', async () => {
    const player = {name: 'Initial player'};
    const events = [];
    const dialogs = [];
    let setupParams;
    let revealedSide;
    let revealedPlayer;
    const sideA = {
        content: {
            villains: [1],
            villainsExpert: [1],
        },
        id: 'stage-1A',
        name: 'Plan inicial',
        stage: 1,
        toObj() {
            return {id: this.id, name: this.name, stage: this.stage};
        },
    };
    const sideB = {
        id: 'stage-1B',
        name: 'Plan inicial',
        stage: 1,
        initScheme() {
            events.push('init-scheme');
        },
        toObj() {
            return {id: this.id, name: this.name, stage: this.stage};
        },
    };
    const currentScheme = {
        get currentSide() {
            return this.selectedSide === 0 ? sideA : sideB;
        },
        selectedSide: 0,
        async flip() {
            events.push('flip');
            this.selectedSide = 1;
        },
        async setup(params) {
            events.push('setup');
            setupParams = params;
        },
    };
    const scenario = new Scenario({
        mainSchemes: [currentScheme],
        match: {
            initialPlayer: player,
            async openDialog(dialog) {
                dialogs.push(dialog);
                events.push(dialog.title);
            },
        },
        name: 'setup-test',
        scenarioCards: [],
        sets: [],
        villains: [{stage: 1}],
    });
    scenario.selectVillain = async () => {};
    scenario.revealMainSchemeSide = async (side, revealPlayer) => {
        events.push('reveal');
        revealedSide = side;
        revealedPlayer = revealPlayer;
    };

    await scenario.initScenario([], false);

    assert.deepEqual(setupParams, {player});
    assert.deepEqual(events, [
        'Mostrando el Plan principal',
        'setup',
        'flip',
        'init-scheme',
        'Mostrando el Plan principal',
        'reveal',
    ]);
    assert.deepEqual(dialogs.map(({dialogType, title, data}) => ({
        dialogType,
        title,
        card: data.card,
        horizontal: data.horizontal,
    })), [
        {
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: 'Mostrando el Plan principal',
            card: {id: 'stage-1A', name: 'Plan inicial', stage: 1},
            horizontal: true,
        },
        {
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: 'Mostrando el Plan principal',
            card: {id: 'stage-1B', name: 'Plan inicial', stage: 1},
            horizontal: true,
        },
    ]);
    assert.equal(revealedSide, sideB);
    assert.equal(revealedPlayer, player);
});

test('standard setup keeps standard cards and villains', async () => {
    const scenario = createScenarioForDifficulty();

    await scenario.initScenario([], false);

    assert.deepEqual(scenario.deck.cards.map(card => card.name).sort(), [
        'Standard card',
    ]);
    assert.deepEqual(scenario.villains.map(villain => villain.stage), [1, 2]);
});

test('expert setup adds the expert set and uses expert villain stages', async () => {
    const scenario = createScenarioForDifficulty();

    await scenario.initScenario([], true);

    assert.deepEqual(scenario.deck.cards.map(card => card.name).sort(), [
        'Expert card',
        'Standard card',
    ]);
    assert.deepEqual(scenario.villains.map(villain => villain.stage), [2]);
});
