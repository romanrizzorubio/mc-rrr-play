import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_BOOST_DEALT, TARGET_VILLAIN} from 'mc-shared';
import {EnemyActivationEffect} from '../../src/effects/enemy-activation-effect.js';
import {StoreBoostEffect} from '../../src/effects/store-boost-effect.js';
import {FaceDown} from '../../src/model/match/facedown.js';
import {Match} from '../../src/model/match/match.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../src/utils/match-serialization.js';

const createBoostCard = (name, boost, discarded) => ({
    name,
    boost,
    isInPlay: false,
    async discard() {
        discarded.push(name);
    },
    toObj() {
        return {name, boost};
    },
});

test('stored boosts stay facedown and are resolved before the next activation boost', async () => {
    const discarded = [];
    const dialogs = [];
    const first = createBoostCard('Pending 1', 2, discarded);
    const second = createBoostCard('Pending 2', 3, discarded);
    const normal = createBoostCard('Normal', 1, discarded);
    const drawnCards = [first, second, normal];
    let refreshCount = 0;
    const villain = {
        isVillain: true,
        faceDown: [],
        addFaceDown(cards, {isFutureBoost}) {
            cards.forEach(card => {
                this.faceDown.push(new FaceDown({
                    attached: this,
                    card,
                    isFutureBoost,
                }));
            });
        },
        async refresh() {
            refreshCount++;
        },
    };
    const match = {
        villain,
        triggerCards: {},
        async drawEncounterCards(count = 1) {
            return drawnCards.splice(0, count);
        },
        async openDialog(dialog) {
            dialogs.push(dialog);

            return {};
        },
    };
    const storeEffect = new StoreBoostEffect({
        count: 2,
        match,
        target: TARGET_VILLAIN,
    });

    await storeEffect.runEffect({player: {}});

    assert.equal(villain.faceDown.length, 2);
    assert.ok(villain.faceDown.every(faceDown => faceDown.isFutureBoost));
    assert.equal(villain.faceDown[0].toObj().name, undefined);
    assert.equal(villain.faceDown[0].toObj().image, undefined);
    assert.equal(villain.faceDown[0].toObj().isEncounterCard, true);

    const activation = new EnemyActivationEffect({
        enemy: villain,
        match,
        selectedTarget: {},
    });
    await activation.dealBoostCards({player: {}});

    assert.deepEqual(activation.boostCards, [first, second, normal]);
    assert.equal(villain.faceDown.length, 0);
    assert.equal(refreshCount, 2);

    const boostTotal = await activation.resolveBoostCards({player: {}});

    assert.equal(boostTotal, 6);
    assert.deepEqual(discarded, ['Pending 1', 'Pending 2', 'Normal']);
    assert.equal(dialogs.length, 3);
    assert.ok(dialogs.every(({dialogType}) => dialogType === DIALOG_BOOST_DEALT));
});

test('ordinary facedown cards are not consumed as stored boosts', async () => {
    const ordinary = createBoostCard('Ordinary facedown', 4, []);
    const normal = createBoostCard('Normal', 1, []);
    const villain = {
        isVillain: true,
        faceDown: [],
        async refresh() {},
    };
    villain.faceDown.push(new FaceDown({
        attached: villain,
        card: ordinary,
    }));
    const match = {
        triggerCards: {},
        async drawEncounterCards() {
            return [normal];
        },
    };
    const activation = new EnemyActivationEffect({
        enemy: villain,
        match,
    });

    await activation.dealBoostCards({player: {}});

    assert.deepEqual(activation.boostCards, [normal]);
    assert.equal(villain.faceDown.length, 1);
});

test('stored boost markers survive match snapshot restoration', () => {
    const match = new Match({
        mc: {},
        name: 'stored-villain-boost',
    });
    const villain = {faceDown: []};
    villain.faceDown.push(new FaceDown({
        attached: villain,
        card: {name: 'Hidden boost'},
        isFutureBoost: true,
    }));
    match.scenario = {villain};

    const restoredMatch = restoreMatch(serializeMatch(match), {});
    const restoredBoost = restoredMatch.scenario.villain.faceDown[0];

    assert.ok(restoredBoost instanceof FaceDown);
    assert.equal(restoredBoost.isFutureBoost, true);
    assert.equal(restoredBoost.attached, restoredMatch.scenario.villain);
});
