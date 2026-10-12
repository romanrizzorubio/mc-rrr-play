import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
} from 'mc-shared';
import {Player} from '../../src/model/match/player.js';

test('differentTypes resource payments reject duplicate resource types', async () => {
    const player = Object.create(Player.prototype);
    player.getCardsToPay = async () => ({
        generators: [],
        hand: [],
    });
    player.openDialog = async () => ({
        paid: {
            generators: [],
            hand: [],
        },
        resources: [RESOURCE_ENERGY, RESOURCE_ENERGY],
    });

    await assert.rejects(
        player.spendResources(
            [RESOURCE_ANY, RESOURCE_ANY],
            undefined,
            new Set(),
            {differentTypes: true}
        ),
        /recursos de tipos distintos/
    );
});

test('differentTypes resource payments accept distinct resource types', async () => {
    const player = Object.create(Player.prototype);
    player.getCardsToPay = async () => ({
        generators: [],
        hand: [],
    });
    let dialog;
    player.openDialog = async value => {
        dialog = value;
        return {
            paid: {
                generators: [],
                hand: [],
            },
            resources: [RESOURCE_ENERGY, RESOURCE_MENTAL],
        };
    };

    const result = await player.spendResources(
        [RESOURCE_ANY, RESOURCE_ANY],
        undefined,
        new Set(),
        {differentTypes: true}
    );

    assert.equal(dialog.data.differentTypes, true);
    assert.deepEqual(result.resources, [RESOURCE_ENERGY, RESOURCE_MENTAL]);
});
