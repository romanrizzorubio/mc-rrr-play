import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Match} from '../../src/model/match/match.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';

test('amplification icons add a boost icon to every boost card in the activation', async () => {
    const dialogs = [];
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'amplification-icons-test',
    });
    match.scenario = {amplificationIcons: 2};
    match.openDialog = async dialog => dialogs.push(dialog);

    const boostCard = {
        boost: 1,
        toObj: () => ({name: 'Boost card'}),
        isMainScheme: false,
        isSideScheme: false,
    };
    const enemyActivation = {
        boostCards: [
            {...boostCard, boost: 2},
            boostCard,
        ],
        enemy: {name: 'Duende Verde'},
    };
    const effect = new ResolveBoostEffect({
        card: boostCard,
        cardIndex: 1,
        enemyActivation,
        match,
        previousBoost: 4,
        selectedTarget: {},
    });

    await effect.runEffect({player: {}});

    assert.equal(effect.value, 3);
    assert.equal(dialogs[0].data.cumulativeBoost, 7);
});
