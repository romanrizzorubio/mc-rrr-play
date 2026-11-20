import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_LIST,
    DIALOG_PAY_COST,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_WILD,
} from 'mc-shared';
import {SpendEffect} from '../../src/effects/spend-effect.js';
import {Player} from '../../src/model/match/player.js';

describe('same-type resource payments', () => {
    const createPlayer = (response, cardsToPay = {
        generators: [],
        hand: [],
    }) => {
        const player = Object.create(Player.prototype);
        player.getCardsToPay = async () => cardsToPay;
        player.openDialog = async dialog => {
            player.dialog = dialog;

            return response;
        };
        player.hand = {
            cards: cardsToPay.hand,
            getCard: cardId => cardsToPay.hand.find(card =>
                card.id === cardId),
        };

        return player;
    };

    test('rejects payments that mix resource types', async () => {
        const player = createPlayer({
            paid: {generators: [], hand: []},
            resources: [RESOURCE_ENERGY, RESOURCE_MENTAL],
        });

        await assert.rejects(
            player.spendResources(
                [RESOURCE_ANY, RESOURCE_ANY],
                undefined,
                new Set(),
                {sameType: true},
            ),
            /recursos del mismo tipo/,
        );
        assert.equal(player.dialog.data.sameType, true);
    });

    test('explains an unavailable resource cost instead of opening the payment dialog', async () => {
        const mental = {
            card: {getResources: () => [RESOURCE_MENTAL]},
            id: 'mental',
            isPlaying: false,
            toObj: () => ({id: 'mental'}),
        };
        const physical = {
            card: {getResources: () => [RESOURCE_ENERGY]},
            id: 'energy',
            isPlaying: false,
            toObj: () => ({id: 'energy'}),
        };
        const player = createPlayer(
            {selected: {id: 0}},
            {generators: [], hand: [mental, physical]}
        );
        const cardToPay = {
            name: 'Test action',
            toObj: () => ({name: 'Test action'}),
        };
        const effect = new SpendEffect({
            isCost: true,
            resources: [RESOURCE_MENTAL, RESOURCE_MENTAL],
            selectedTarget: player,
        });

        const payment = await effect.preparePayment(
            {card: cardToPay, isCost: true},
            {
                getRemainingResources: () => undefined,
                getResourcePaymentExcludedCardIds: () => new Set(),
            }
        );

        assert.equal(payment, undefined);
        assert.equal(player.dialog.dialogType, DIALOG_LIST);
        assert.equal(player.dialog.title, 'Coste no pagado');
        assert.equal(
            player.dialog.subtitle,
            `No tienes suficientes recursos de tipo [${RESOURCE_MENTAL}] para pagar este coste.`
        );
        assert.equal(player.dialog.data.card.name, 'Test action');
        assert.equal(player.dialog.data.options, undefined);
        assert.equal(player.dialog.hideOk, undefined);
    });

    test('explains when enough resources exist but not in one required type', async () => {
        const resources = [RESOURCE_ENERGY, RESOURCE_MENTAL].map(
            (resource, index) => ({
                card: {getResources: () => [resource]},
                id: `resource-${index}`,
                isPlaying: false,
            })
        );
        const player = createPlayer(
            {selected: {id: 0}},
            {generators: [], hand: resources}
        );

        const payment = await player.spendResources(
            [RESOURCE_ANY, RESOURCE_ANY],
            undefined,
            new Set(),
            {isCost: true, sameType: true}
        );

        assert.equal(payment, undefined);
        assert.equal(player.dialog.dialogType, DIALOG_LIST);
        assert.match(player.dialog.subtitle, /del mismo tipo/);
    });

    test('does not assign a wild resource to a type that cannot meet its requirement', async () => {
        const resources = [RESOURCE_WILD, RESOURCE_ENERGY].map(
            (resource, index) => ({
                card: {getResources: () => [resource]},
                id: `resource-${index}`,
                isPlaying: false,
            })
        );
        const player = createPlayer(
            {selected: {id: 0}},
            {generators: [], hand: resources}
        );

        const payment = await player.spendResources(
            [RESOURCE_MENTAL, RESOURCE_ANY],
            undefined,
            new Set(),
            {isCost: true, sameType: true}
        );

        assert.equal(payment, undefined);
        assert.equal(player.dialog.dialogType, DIALOG_LIST);
    });

    test('accepts a same-type payment when a wild resource can match it', async () => {
        const resources = [RESOURCE_MENTAL, RESOURCE_WILD].map(
            (resource, index) => ({
                card: {getResources: () => [resource]},
                id: `resource-${index}`,
                isPlaying: false,
                toObj: () => ({id: `resource-${index}`}),
            })
        );
        const player = createPlayer({
            paid: {generators: [], hand: resources},
            resources: [RESOURCE_MENTAL, RESOURCE_MENTAL],
            fullyPaid: true,
        }, {generators: [], hand: resources});

        const payment = await player.spendResources(
            [RESOURCE_ANY, RESOURCE_ANY],
            undefined,
            new Set(),
            {isCost: true, sameType: true}
        );

        assert.equal(player.dialog.dialogType, DIALOG_PAY_COST);
        assert.deepEqual(payment.resources, [
            RESOURCE_MENTAL,
            RESOURCE_MENTAL,
        ]);
    });

    test('checks conditional resources against the card whose cost is paid', async () => {
        const resourceCard = {
            card: {
                getResources: cardToPay =>
                    cardToPay?.id === 'target-card' ?
                        [RESOURCE_MENTAL, RESOURCE_MENTAL] :
                        [],
            },
            id: 'conditional-resources',
            isPlaying: false,
            toObj: () => ({id: 'conditional-resources'}),
        };
        const player = createPlayer(
            {paid: {generators: [], hand: []}, resources: [RESOURCE_MENTAL, RESOURCE_MENTAL]},
            {generators: [], hand: [resourceCard]}
        );
        const cardToPay = {
            id: 'target-card',
            toObj: () => ({id: 'target-card'}),
        };

        const payment = await player.spendResources(
            [RESOURCE_MENTAL, RESOURCE_MENTAL],
            cardToPay,
            new Set(),
            {isCost: true}
        );

        assert.equal(player.dialog.dialogType, DIALOG_PAY_COST);
        assert.deepEqual(payment.resources, [
            RESOURCE_MENTAL,
            RESOURCE_MENTAL,
        ]);
    });

    test('accepts payments whose icons all have the same type', async () => {
        const player = createPlayer({
            paid: {generators: [], hand: []},
            resources: [RESOURCE_MENTAL, RESOURCE_MENTAL],
            fullyPaid: true,
        });

        const payment = await player.spendResources(
            [RESOURCE_ANY, RESOURCE_ANY],
            undefined,
            new Set(),
            {sameType: true},
        );

        assert.equal(player.dialog.data.sameType, true);
        assert.deepEqual(payment.resources, [RESOURCE_MENTAL, RESOURCE_MENTAL]);
    });

    test('rejects a full payment that does not cover every required icon', async () => {
        const player = createPlayer({
            paid: {generators: [], hand: []},
            resources: [RESOURCE_MENTAL],
            fullyPaid: true,
        });

        await assert.rejects(
            player.spendResources(
                [RESOURCE_ANY, RESOURCE_ANY],
                undefined,
                new Set(),
                {sameType: true},
            ),
            /no cubre todos los recursos del mismo tipo/,
        );
    });
});
