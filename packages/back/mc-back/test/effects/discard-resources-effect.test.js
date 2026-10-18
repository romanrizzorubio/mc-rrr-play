import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_YOU,
} from 'mc-shared';
import {DiscardResourcesEffect} from '../../src/effects/discard-resources-effect.js';
import {Player} from '../../src/model/match/player.js';
import {CostPaymentSession} from '../../src/utils/cost-payment-session.js';

const createHandCard = (id, resources) => ({
    id,
    card: {
        getPrintedResources: () => resources,
        getResources: () => resources,
    },
    isPlaying: false,
    resources,
    toObj() {
        return {id: this.id, resources: this.resources};
    },
});

const createPlayer = cards => {
    const discarded = [];
    const player = Object.create(Player.prototype);
    player.hand = {
        cards: cards.slice(),
        getCard(cardId) {
            return this.cards.find(card => card.id === cardId);
        },
        async refresh() {},
        discardHand(card) {
            const index = this.cards.indexOf(card);
            if (index > -1) {
                this.cards.splice(index, 1);
            }
        },
    };
    player.deck = {
        async discard(card) {
            discarded.push(card);
        },
        refresh() {},
    };

    return {discarded, player};
};

test('discard resource payment exposes only printed hand icons and no generators', async () => {
    const doubleResource = createHandCard(
        'double',
        [RESOURCE_MENTAL, RESOURCE_PHYSICAL]
    );
    const wild = createHandCard('wild', [RESOURCE_WILD]);
    const {player} = createPlayer([doubleResource, wild]);
    let dialog;
    player.openDialog = async options => {
        dialog = options;

        return {
            paid: {
                generators: [],
                hand: [{id: doubleResource.id}],
            },
            resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
        };
    };
    player.getResourceGenerators = async () => {
        throw new Error('resource generators must not be queried');
    };

    const payment = await player.discardResources([
        [RESOURCE_ANY],
        [RESOURCE_ANY],
    ]);

    assert.equal(dialog.data.resourcePaymentMode, 'discard');
    assert.deepEqual(dialog.data.cards.generators, []);
    assert.deepEqual(dialog.data.cards.hand[0].resources, [
        RESOURCE_MENTAL,
        RESOURCE_PHYSICAL,
    ]);
    assert.deepEqual(payment.hand, [doubleResource]);
    assert.equal(payment.allowWildConversion, false);
});

test('discard resource effect discards a double-resource card once', async () => {
    const doubleResource = createHandCard(
        'double',
        [RESOURCE_MENTAL, RESOURCE_PHYSICAL]
    );
    const {player, discarded} = createPlayer([doubleResource]);
    const effect = new DiscardResourcesEffect({
        match: {triggerCards: {}},
        resourceRequirements: [
            [RESOURCE_MENTAL],
            [RESOURCE_PHYSICAL],
        ],
        selectedTarget: player,
        target: TARGET_YOU,
    });
    player.discardResources = async () => ({
        allowWildConversion: false,
        generators: [],
        hand: [doubleResource, doubleResource],
        printedResources: true,
        resourceRequirements: [
            [RESOURCE_MENTAL],
            [RESOURCE_PHYSICAL],
        ],
        resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
    });

    await effect.execute({player});

    assert.deepEqual(discarded, [doubleResource]);
    assert.deepEqual(player.hand.cards, []);
    assert.deepEqual(effect.cards, [doubleResource]);
});

test('discard resources cannot convert a printed wild icon', async () => {
    const wild = createHandCard('wild', [RESOURCE_WILD]);
    const {player} = createPlayer([wild]);
    const effect = new DiscardResourcesEffect({
        match: {triggerCards: {}},
        resourceRequirements: [[RESOURCE_ENERGY]],
        selectedTarget: player,
        target: TARGET_YOU,
    });

    assert.equal(await effect.canRun({match: effect.match, player}), false);
});

test('cost payment session preserves wild conversion for normal payments', () => {
    const wild = createHandCard('wild', [RESOURCE_WILD]);
    const effect = {resources: [RESOURCE_ENERGY]};
    const session = new CostPaymentSession();

    session.stagePayment(
        effect,
        {
            generators: [],
            hand: [wild],
            resources: [RESOURCE_ENERGY],
        },
        {card: {}}
    );

    assert.deepEqual(session.getPayment(effect).hand, [wild]);
});

test('cost payment session rejects converted wild icons in discard mode', () => {
    const wild = createHandCard('wild', [RESOURCE_WILD]);
    const effect = {
        resourceRequirements: [[RESOURCE_MENTAL]],
    };
    const session = new CostPaymentSession();

    assert.throws(() => session.stagePayment(
        effect,
        {
            allowWildConversion: false,
            generators: [],
            hand: [wild],
            printedResources: true,
            resourceRequirements: [[RESOURCE_MENTAL]],
            resources: [RESOURCE_MENTAL],
        },
        {card: {}}
    ), /no está disponible/);
});

test('discard resource effect stages and commits through a cost payment session', async () => {
    const doubleResource = createHandCard(
        'double',
        [RESOURCE_MENTAL, RESOURCE_PHYSICAL]
    );
    const {player, discarded} = createPlayer([doubleResource]);
    const match = {triggerCards: {}};
    player.discardResources = async () => ({
        allowWildConversion: false,
        generators: [],
        hand: [doubleResource],
        printedResources: true,
        resourceRequirements: [
            [RESOURCE_MENTAL],
            [RESOURCE_PHYSICAL],
        ],
        resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
    });
    const effect = new DiscardResourcesEffect({
        match,
        resourceRequirements: [
            [RESOURCE_MENTAL],
            [RESOURCE_PHYSICAL],
        ],
        selectedTarget: player,
        target: TARGET_YOU,
    });

    const result = await new CostPaymentSession().resolve(
        effect,
        {match, player},
        {requireAllCosts: true}
    );

    assert.equal(result.resolved, true);
    assert.deepEqual(discarded, [doubleResource]);
});
