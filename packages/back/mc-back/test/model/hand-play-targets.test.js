import assert from 'node:assert/strict';
import test from 'node:test';

import {TARGET_ALLY, TARGET_ENEMY, TARGET_YOU} from 'mc-shared';
import {AttachEffect} from '../../src/effects/attach-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {Effect} from '../../src/effects/effect.js';
import {Hand} from '../../src/model/match/hand.js';

function createCard({
    ability,
    attach = TARGET_YOU,
    canPlay = true,
    id,
    isEvent = false,
    isResource = false,
    isSupport = false,
    isUpgrade = false,
    targets = [],
}) {
    const printedCard = {
        attach,
        isResource,
        getAttachConfig() {
            return {target: attach};
        },
        createAttachEffect() {
            return {
                async getValidTarget() {
                    return targets;
                },
            };
        },
    };

    return {
        abilities: ability ? [ability] : [],
        card: printedCard,
        id,
        isAlly: false,
        isEvent,
        isSupport,
        isUpgrade,
        async canPlay() {
            return canPlay;
        },
        toObj() {
            return {id};
        },
    };
}

function createHand(cards) {
    const owner = {match: {}};
    const hand = new Hand(owner);
    hand.cards = cards;

    return hand;
}

test('serializes valid card targets for playable events and keeps the play zone as a fallback', async () => {
    const target = {id: 'villain-1', parentId: 'villain-parent'};
    const eventAbility = {
        effect: {
            async getValidTarget(params) {
                assert.equal(params.player, hand.owner);
                assert.equal(params.card, event);
                assert.equal(params.playCardEffect.card, event);
                return [target];
            },
        },
        prepareEffect() {},
        async canRun() {
            return true;
        },
    };
    const event = createCard({
        ability: eventAbility,
        id: 'damage-event',
        isEvent: true,
    });
    const fallbackEvent = createCard({
        ability: {
            effect: {
                async getValidTarget() {
                    return [];
                },
            },
            prepareEffect() {},
            async canRun() {
                return true;
            },
        },
        id: 'draw-event',
        isEvent: true,
    });
    const hand = createHand([event, fallbackEvent]);

    const [serializedEvent, serializedFallback] =
        await hand.toObjWithPlayability();

    assert.deepEqual(serializedEvent.playableTargetIds, [
        'villain-1',
        'villain-parent',
    ]);
    assert.equal(serializedEvent.playableInGameZone, false);
    assert.deepEqual(serializedFallback.playableTargetIds, []);
    assert.equal(serializedFallback.playableInGameZone, true);
});

test('resolves event enemy targets with the live target resolver', async () => {
    const target = {
        abilities: [],
        id: 'villain-1',
        parentId: 'villain-parent',
    };
    const match = {enemies: [target]};
    const event = createCard({
        ability: {
            effect: new DealDamageEffect({
                damage: 2,
                match,
                target: TARGET_ENEMY,
            }),
            prepareEffect() {},
            async canRun() {
                return true;
            },
        },
        id: 'damage-event',
        isEvent: true,
    });
    const hand = createHand([event]);
    hand.owner.match = match;

    const [serializedEvent] = await hand.toObjWithPlayability();

    assert.deepEqual(serializedEvent.playableTargetIds, [
        'villain-1',
        'villain-parent',
    ]);
    assert.equal(serializedEvent.playableInGameZone, false);
});

test('includes valid targets from nested event effects', async () => {
    const target = {id: 'villain-1'};
    const nestedEffect = new Effect({
        match: {},
        target: TARGET_ENEMY,
    });
    nestedEffect.getValidTarget = async () => [target];

    const event = createCard({
        ability: {
            effect: Object.assign(new Effect({match: {}}), {
                effects: [nestedEffect],
                async getValidTarget() {
                    return [];
                },
            }),
            prepareEffect() {},
            async canRun() {
                return true;
            },
        },
        id: 'nested-damage-event',
        isEvent: true,
    });
    const hand = createHand([event]);

    const [serializedEvent] = await hand.toObjWithPlayability();

    assert.deepEqual(serializedEvent.playableTargetIds, ['villain-1']);
    assert.equal(serializedEvent.playableInGameZone, false);
});

test('serializes attachment targets for linked upgrades and the play zone for unlinked cards', async () => {
    const targets = [
        {id: 'ally-1'},
        {id: 'ally-2', parentId: 'ally-parent'},
    ];
    const linkedUpgrade = createCard({
        attach: TARGET_ALLY,
        id: 'linked-upgrade',
        isUpgrade: true,
        targets,
    });
    const unlinkedUpgrade = createCard({
        id: 'unlinked-upgrade',
        isUpgrade: true,
    });
    const support = createCard({
        id: 'support',
        isSupport: true,
    });
    const hand = createHand([linkedUpgrade, unlinkedUpgrade, support]);
    const match = {players: [hand.owner]};
    hand.owner.allies = targets;
    hand.owner.match = match;
    linkedUpgrade.canAttach = () => true;
    linkedUpgrade.card.createAttachEffect = card => new AttachEffect({
        card,
        canAttach: card.canAttach.bind(card),
        match,
        target: TARGET_ALLY,
    });

    const [serializedLinked, serializedUnlinked, serializedSupport] =
        await hand.toObjWithPlayability();

    assert.deepEqual(serializedLinked.playableTargetIds, [
        'ally-1',
        'ally-2',
        'ally-parent',
    ]);
    assert.equal(serializedLinked.playableInGameZone, false);
    assert.deepEqual(serializedUnlinked.playableTargetIds, []);
    assert.equal(serializedUnlinked.playableInGameZone, true);
    assert.deepEqual(serializedSupport.playableTargetIds, []);
    assert.equal(serializedSupport.playableInGameZone, true);
});

test('does not serialize drop destinations for a card that cannot be played', async () => {
    const card = createCard({
        canPlay: false,
        id: 'unplayable-event',
        isEvent: true,
        ability: {
            effect: {
                async getValidTarget() {
                    assert.fail('Unplayable cards must not resolve play targets.');
                },
            },
            prepareEffect() {},
            async canRun() {
                return true;
            },
        },
    });
    const hand = createHand([card]);

    const [serializedCard] = await hand.toObjWithPlayability();

    assert.equal(serializedCard.playable, false);
    assert.deepEqual(serializedCard.playableTargetIds, []);
    assert.equal(serializedCard.playableInGameZone, false);
});
