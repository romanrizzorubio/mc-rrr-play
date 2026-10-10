import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_ENCOUNTERS_DEALT} from 'mc-shared';
import {PlayVillainPhaseEffect} from '../../src/effects/play-villain-phase-effect.js';

test('encounter dealt dialog reports extra cards from hazard icons', async () => {
    let dealtCards = 0;
    const dialogs = [];
    const player = {
        superhero: {name: 'Hulka'},
        encounters: [],
        gameZone: {
            dealEncounterCard(cards) {
                player.encounters.push(...cards);
            },
            async refresh() {},
        },
    };
    const match = {
        hazardIcons: 1,
        orderedPlayers: [player],
        players: [player],
        triggerCards: {},
        async drawEncounterCards() {
            dealtCards++;
            return [{id: `encounter-${dealtCards}`}];
        },
        async openDialog(dialog) {
            dialogs.push(dialog);
        },
    };
    const phase = new PlayVillainPhaseEffect({match});

    await phase.stepDealEncounters();

    assert.equal(player.encounters.length, 2);
    assert.equal(dialogs[0].dialogType, DIALOG_ENCOUNTERS_DEALT);
    assert.equal(dialogs[0].data.hazardIcons, 1);
    assert.deepEqual(dialogs[0].data.encounters, [{
        name: 'Hulka',
        count: 2,
        hazardIcons: 1,
    }]);
});

test('encounter dealt dialog assigns each hazard icon to the receiving player', async () => {
    let dealtCards = 0;
    let dialog;
    const createPlayer = name => {
        const player = {
            superhero: {name},
            encounters: [],
        };
        player.gameZone = {
            dealEncounterCard(cards) {
                player.encounters.push(...cards);
            },
            async refresh() {},
        };

        return player;
    };
    const players = ['Hulka', 'Mapache Cohete'].map(createPlayer);
    const match = {
        hazardIcons: 3,
        orderedPlayers: players,
        players,
        triggerCards: {},
        async drawEncounterCards() {
            dealtCards++;
            return [{id: `encounter-${dealtCards}`}];
        },
        async openDialog(options) {
            dialog = options;
        },
    };
    const phase = new PlayVillainPhaseEffect({match});

    await phase.stepDealEncounters();

    assert.deepEqual(dialog.data.encounters, [
        {name: 'Hulka', count: 4, hazardIcons: 3},
        {name: 'Mapache Cohete', count: 1, hazardIcons: 0},
    ]);
});
