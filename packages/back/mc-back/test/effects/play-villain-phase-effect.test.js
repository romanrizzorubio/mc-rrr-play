import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_ENCOUNTERS_DEALT} from 'mc-shared';
import {PlayVillainPhaseEffect} from '../../src/effects/play-villain-phase-effect.js';

test('encounter dealt dialog reports extra cards from hazard icons', async () => {
    let dealtCards = 0;
    const dialogs = [];
    const knownCard = {
        id: 'encounter-1',
        toObj() {
            return {id: this.id};
        },
    };
    const unseenCard = {
        id: 'encounter-2',
        toObj() {
            return {id: this.id};
        },
    };
    const scenario = {
        deck: {
            knownCards: [knownCard],
        },
    };
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
        scenario,
        triggerCards: {},
        async drawEncounterCards() {
            dealtCards++;
            const card = dealtCards === 1 ? knownCard : unseenCard;
            scenario.deck.knownCards = [];
            return [card];
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
        cards: [
            {id: 'encounter-1', isFacedownCard: true, canPeekFacedown: true},
            {id: 'encounter-2', isFacedownCard: true, canPeekFacedown: false},
        ],
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
        scenario: {
            deck: {
                knownCards: [],
            },
        },
        triggerCards: {},
        async drawEncounterCards() {
            dealtCards++;
            return [{
                id: `encounter-${dealtCards}`,
                toObj() {
                    return {id: this.id};
                },
            }];
        },
        async openDialog(options) {
            dialog = options;
        },
    };
    const phase = new PlayVillainPhaseEffect({match});

    await phase.stepDealEncounters();

    assert.deepEqual(dialog.data.encounters, [
        {
            name: 'Hulka',
            count: 4,
            hazardIcons: 3,
            cards: [
                {id: 'encounter-1', isFacedownCard: true, canPeekFacedown: false},
                {id: 'encounter-3', isFacedownCard: true, canPeekFacedown: false},
                {id: 'encounter-4', isFacedownCard: true, canPeekFacedown: false},
                {id: 'encounter-5', isFacedownCard: true, canPeekFacedown: false},
            ],
        },
        {
            name: 'Mapache Cohete',
            count: 1,
            hazardIcons: 0,
            cards: [
                {id: 'encounter-2', isFacedownCard: true, canPeekFacedown: false},
            ],
        },
    ]);
});
