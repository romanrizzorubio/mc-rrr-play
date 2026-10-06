import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_BOOST_DEALT} from 'mc-shared';
import {Attack} from '../../src/activations/attack.js';
import {DealBoostEffect} from '../../src/effects/deal-boost-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemyActivationEffect} from '../../src/effects/enemy-activation-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';
import {Match} from '../../src/model/match/match.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../src/utils/match-serialization.js';

test('DealBoostEffect adds an extra card to its selected enemy activation', async () => {
    const boostCard = {};
    let dialogCount = 0;
    const enemyActivation = {
        boostCards: [],
        enemy: {
            isVillain: true,
            name: 'Klaw',
        },
    };
    const effect = new DealBoostEffect({
        match: {
            triggerCards: {},
            async drawEncounterCards() {
                return [boostCard];
            },
            async openDialog() {
                dialogCount++;

                return {};
            },
        },
    });

    await effect.runEffect({
        effect: enemyActivation,
        player: {},
    });

    assert.deepEqual(enemyActivation.boostCards, [boostCard]);
    assert.equal(dialogCount, 0);
});

test('an enemy activation shows all dealt boost cards face down together', async () => {
    const dialogs = [];
    const activation = new EnemyActivationEffect({
        enemy: {
            isVillain: true,
            name: 'Klaw',
        },
        match: {
            async openDialog(dialog) {
                dialogs.push(dialog);
            },
            triggerCards: {},
        },
    });
    activation.boostCards = [{}, {}];

    await activation.showBoostCards();

    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].dialogType, DIALOG_BOOST_DEALT);
    assert.equal(dialogs[0].title, 'Klaw recibe 2 cartas de aumento');
    assert.deepEqual(dialogs[0].data, {
        allowHideFuture: true,
        cardCount: 2,
    });
});

test('boost-dealt notification preference hides later announcements in the same match', async () => {
    const dialogs = [];
    const match = {
        skipBoostDealtNotification: false,
        async openDialog(dialog) {
            dialogs.push(dialog);

            return {
                skipBoostDealtNotification: true,
            };
        },
        triggerCards: {},
    };
    const activation = new EnemyActivationEffect({
        enemy: {
            isVillain: true,
            name: 'Klaw',
        },
        match,
    });
    activation.boostCards = [{}];

    await activation.showBoostCards();
    await activation.showBoostCards();

    assert.equal(match.skipBoostDealtNotification, true);
    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].data.allowHideFuture, true);
});

test('boost-dealt notification preference persists with the match', () => {
    const match = new Match({
        mc: {},
        name: 'boost-dealt-preference',
    });
    match.skipBoostDealtNotification = true;

    const restoredMatch = restoreMatch(serializeMatch(match), {});

    assert.equal(restoredMatch.skipBoostDealtNotification, true);
});

test('multiple boost cards resolve left to right in the boost dialog', async () => {
    const dialogs = [];
    const resolutions = [];
    const match = {
        async openDialog(dialog) {
            dialogs.push(dialog);
        },
        triggerCards: {},
    };
    const activation = new EnemyActivationEffect({
        enemy: {
            isVillain: true,
            name: 'Klaw',
        },
        match,
        selectedTarget: {},
    });
    activation.boostCards = [1, 2].map(index => ({
        boost: index,
        boostAbility: {
            async resolveAbility({enemyActivation}) {
                assert.equal(enemyActivation, activation);
                resolutions.push(index);
            },
        },
        async discard() {},
        isMainScheme: false,
        isSideScheme: false,
        toObj() {
            return {
                boost: index,
                image: `boost-${index}.png`,
                name: `Aumento ${index}`,
            };
        },
    }));

    const totalBoost = await activation.resolveBoostCards({player: {}});

    assert.equal(totalBoost, 3);
    assert.deepEqual(resolutions, [1, 2]);
    assert.deepEqual(dialogs.map(({dialogType}) => dialogType), [
        DIALOG_BOOST_DEALT,
        DIALOG_BOOST_DEALT,
    ]);
    assert.deepEqual(dialogs[0].data.cards.map(card => card?.card.name || null), [
        'Aumento 1',
        null,
    ]);
    assert.equal(dialogs[0].data.cards[0].card.boost, 1);
    assert.equal(dialogs[0].data.cards[0].hasBoostAbility, true);
    assert.equal(dialogs[0].data.cumulativeBoost, 1);
    assert.deepEqual(dialogs[1].data.cards.map(card => card?.card.name || null), [
        'Aumento 1',
        'Aumento 2',
    ]);
    assert.equal(dialogs[1].data.cards[1].card.boost, 2);
    assert.equal(dialogs[1].data.cards[1].hasBoostAbility, true);
    assert.equal(dialogs[1].data.cumulativeBoost, 3);
});

test('boost abilities receive the current activation', async () => {
    const attackActivation = {};
    let resolvedActivation;
    const effect = new ResolveBoostEffect({
        activation: attackActivation,
        card: {
            boost: 0,
            boostAbility: {
                async resolveAbility(params) {
                    resolvedActivation = params.activation;
                },
            },
        },
        enemyActivation: {},
    });

    await effect.execute({});

    assert.equal(resolvedActivation, attackActivation);
});

test('attack activations register delayed effects on their attack effect', () => {
    const effect = new EnemyAttackEffect();
    const activation = new Attack({effect});
    const delayedEffect = {};

    activation.createDelayedEffect(delayedEffect);

    assert.deepEqual(effect.delayedEffects, [delayedEffect]);
});

test('a minion put into play by its boost ability is not discarded afterward', async () => {
    const player = {};
    let discarded = false;
    const boostCard = {
        boost: 0,
        boostAbility: {
            async resolveAbility({card}) {
                card.controller = player;
            },
        },
        get isInPlay() {
            return Boolean(this.controller);
        },
        async discard() {
            discarded = true;
        },
        toObj() {
            return {};
        },
    };
    const match = {
        triggerCards: {},
        async openDialog() {
            return {};
        },
    };
    const activation = new EnemyActivationEffect({
        enemy: {isVillain: true},
        match,
        selectedTarget: player,
    });
    activation.boostCards = [boostCard];

    await activation.resolveBoostCards({player});

    assert.equal(discarded, false);
});
