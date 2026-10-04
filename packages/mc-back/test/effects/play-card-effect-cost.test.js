import assert from 'node:assert/strict';
import {test} from 'node:test';

import {RESOURCE_MENTAL} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';

function createPlayCardEffect({calculatedCost, requirement = []}) {
    const card = {
        cost: 3,
        isUpgrade: false,
        requirement,
        toObj: () => ({name: 'Test card'}),
    };
    const calls = {
        dialogs: [],
        getCardsToPay: 0,
    };
    const player = {
        async getCardsToPay() {
            calls.getCardsToPay++;
            return {
                generators: [],
                hand: [],
            };
        },
        getCard: cardToGet => cardToGet,
        hand: {
            getCard: cardToGet => cardToGet,
        },
    };
    const effect = new PlayCardEffect({
        card,
        match: {},
    });

    effect.getCost = async () => calculatedCost;
    effect.openDialog = async options => {
        calls.dialogs.push(options);
        return {
            paid: {
                generators: [],
                hand: [],
            },
            resources: [],
        };
    };

    return {calls, effect, player};
}

test('does not prompt to pay a card whose calculated cost is zero', async () => {
    const {calls, effect, player} = createPlayCardEffect({
        calculatedCost: 0,
    });

    await effect.payCost({player});

    assert.equal(calls.dialogs.length, 0);
    assert.equal(calls.getCardsToPay, 0);
    assert.equal(effect.canceled, false);
});

test('still prompts for a resource requirement when calculated cost is zero', async () => {
    const {calls, effect, player} = createPlayCardEffect({
        calculatedCost: 0,
        requirement: [RESOURCE_MENTAL],
    });

    await effect.payCost({player});

    assert.equal(calls.dialogs.length, 1);
    assert.equal(calls.dialogs[0].data.cost, 0);
    assert.deepEqual(calls.dialogs[0].data.requirement, [RESOURCE_MENTAL]);
});

test('still prompts to pay a positive calculated cost', async () => {
    const {calls, effect, player} = createPlayCardEffect({
        calculatedCost: 2,
    });

    await effect.payCost({player});

    assert.equal(calls.dialogs.length, 1);
    assert.equal(calls.dialogs[0].data.cost, 2);
});

test('passes the play effect to card play validation', async () => {
    let validationParams;
    const card = {
        async canPlay(params) {
            validationParams = params;

            return true;
        },
    };
    const effect = new PlayCardEffect({
        card,
        match: {},
    });

    assert.equal(await effect.canRun({player: {}}), true);
    assert.equal(validationParams.playCardEffect, effect);
});
