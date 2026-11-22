import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
} from 'mc-shared';
import {Player} from '../../src/model/match/player.js';

describe('different-type resource payments', () => {
    const createResourceCard = (id, resource) => ({
        card: {getResources: () => [resource]},
        id,
        isPlaying: false,
        toObj: () => ({id}),
    });

    const createPlayer = (resources, paidResources) => {
        const hand = resources.map((resource, index) =>
            createResourceCard(`resource-${index}`, resource));
        const player = Object.create(Player.prototype);
        player.getCardsToPay = async () => ({
            generators: [],
            hand,
        });
        player.hand = {
            cards: hand,
            getCard: cardId => hand.find(card => card.id === cardId),
        };
        player.openDialog = async () => ({
            paid: {
                generators: [],
                hand: hand.map(({id}) => ({id})),
            },
            resources: paidResources,
        });

        return player;
    };

    test('rejects duplicate resource types', async () => {
        const player = createPlayer(
            [RESOURCE_ENERGY, RESOURCE_ENERGY],
            [RESOURCE_ENERGY, RESOURCE_ENERGY]
        );

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

    test('accepts distinct resource types', async () => {
        const player = createPlayer(
            [RESOURCE_ENERGY, RESOURCE_MENTAL],
            [RESOURCE_ENERGY, RESOURCE_MENTAL]
        );
        let dialog;
        const openDialog = player.openDialog;
        player.openDialog = async value => {
            dialog = value;

            return openDialog(value);
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
});
