import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_ENCOUNTERS_REVEAL} from 'mc-shared';

import {Scenario} from '../../src/model/match/scenario.js';

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
        'Plan inicial (1A)',
        'setup',
        'flip',
        'init-scheme',
        'Plan inicial (1B)',
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
            title: 'Plan inicial (1A)',
            card: {id: 'stage-1A', name: 'Plan inicial', stage: 1},
            horizontal: true,
        },
        {
            dialogType: DIALOG_ENCOUNTERS_REVEAL,
            title: 'Plan inicial (1B)',
            card: {id: 'stage-1B', name: 'Plan inicial', stage: 1},
            horizontal: true,
        },
    ]);
    assert.equal(revealedSide, sideB);
    assert.equal(revealedPlayer, player);
});
