import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_BOOST_DEALT} from 'mc-shared';
import {Match} from '../../src/model/match/match.js';
import {CancelBoostIconsEffect} from '../../src/effects/cancel-boost-icons-effect.js';
import {ModifyBoostIconsEffect} from '../../src/effects/modify-boost-icons-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';

test('CancelBoostIconsEffect cancels all boost icons on the current card', async () => {
    const triggeredEffect = {
        boostValue: 5,
        card: {boost: 3},
        cancelledBoostIcons: 0,
    };
    const params = {
        player: {},
        triggeredEffect,
    };
    const effect = new CancelBoostIconsEffect({});

    assert.equal(await effect.canRun(params), true);
    effect.execute(params);

    assert.equal(triggeredEffect.boostValue, 0);
    assert.equal(triggeredEffect.cancelledBoostIcons, 5);
    assert.equal(params.cancelledBoostIcons, 5);
});

test('CancelBoostIconsEffect cannot cancel the same boost card twice', async () => {
    const triggeredEffect = {
        boostValue: 5,
        card: {boost: 3},
        cancelledBoostIcons: 0,
    };
    const params = {
        player: {},
        triggeredEffect,
    };
    const effect = new CancelBoostIconsEffect({});

    assert.equal(await effect.canRun(params), true);
    effect.execute(params);
    assert.equal(await effect.canRun(params), false);
    effect.execute(params);

    assert.equal(triggeredEffect.boostValue, 0);
    assert.equal(triggeredEffect.cancelledBoostIcons, 5);
    assert.equal(params.cancelledBoostIcons, 0);
});

test('CancelBoostIconsEffect can cancel amplification-generated icons without printed icons', async () => {
    const effect = new CancelBoostIconsEffect({});
    const triggeredEffect = {
        boostValue: 2,
        card: {boost: 0},
        cancelledBoostIcons: 0,
    };
    const params = {
        player: {},
        triggeredEffect,
    };

    assert.equal(await effect.canRun(params), true);
    effect.execute(params);
    assert.equal(triggeredEffect.boostValue, 0);
    assert.equal(triggeredEffect.cancelledBoostIcons, 2);
    assert.equal(params.cancelledBoostIcons, 2);
    assert.equal(await effect.canRun(params), false);
});

test('CancelBoostIconsEffect can only cancel boost icons that remain after earlier cancellations', async () => {
    const effect = new CancelBoostIconsEffect({});
    const triggeredEffect = {
        boostValue: 2,
        card: {boost: 3},
        cancelledBoostIcons: 1,
    };
    const params = {
        player: {},
        triggeredEffect,
    };

    assert.equal(await effect.canRun(params), true);
    effect.execute(params);
    assert.equal(triggeredEffect.boostValue, 0);
    assert.equal(triggeredEffect.cancelledBoostIcons, 3);
    assert.equal(params.cancelledBoostIcons, 2);
});

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

test('a boost ability reopens the multi-card dialog with its updated icon count', async () => {
    const dialogs = [];
    const boostCard = {
        boost: 1,
        boostAbility: {
            async resolveAbility({effect}) {
                await new ModifyBoostIconsEffect({
                    count: 1,
                    selectedTarget: effect,
                }).execute({});
            },
        },
        isMainScheme: false,
        isSideScheme: false,
        toObj() {
            return {boost: this.boost, name: 'Aumento con icono modificado'};
        },
    };
    const enemyActivation = {
        boostCards: [boostCard, {}],
        enemy: {name: 'Klaw'},
    };
    const match = {
        amplificationIcons: 0,
        async openDialog(dialog) {
            dialogs.push(dialog);
        },
    };
    const effect = new ResolveBoostEffect({
        card: boostCard,
        cardIndex: 0,
        enemyActivation,
        match,
        selectedTarget: {},
    });

    await effect.prepare({});
    await effect.execute({});

    assert.deepEqual(dialogs.map(({dialogType}) => dialogType), [
        DIALOG_BOOST_DEALT,
        DIALOG_BOOST_DEALT,
    ]);
    assert.equal(dialogs[0].title, 'Aumento 1/2');
    assert.equal(dialogs[1].title, 'Aumento actualizado');
    assert.equal(dialogs[0].subtitle, undefined);
    assert.equal(
        dialogs[1].subtitle,
        'Se muestran los iconos de aumento actualizados.'
    );
    assert.equal(dialogs[0].data.cards[0].card.boost, 1);
    assert.equal(dialogs[0].data.cumulativeBoost, 1);
    assert.equal(dialogs[1].data.cards[0].card.boost, 2);
    assert.equal(dialogs[1].data.cumulativeBoost, 2);
});
