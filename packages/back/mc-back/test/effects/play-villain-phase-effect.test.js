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
    assert.deepEqual(dialogs[0].data.encounters, [{name: 'Hulka', count: 2}]);
});
