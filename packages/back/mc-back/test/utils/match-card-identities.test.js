import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_RESPONSE,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_UPGRADE,
    EFFECT_PLACE_COUNTERS,
    PRIORITY_RESPONSE,
    TARGET_YOUR_SUPERHERO,
    TRIGGER_ROUND_ENDS,
    TRIGGER_THIS_SPEND,
} from 'mc-shared';
import {PlaceCountersEffect} from '../../src/effects/place-counters-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Player} from '../../src/model/match/player.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';

describe('restored match card identities', () => {
    const mc = {mcSocket: {send() {}}};
    const cardConfig = (type = CARD_TYPE_UPGRADE, trigger = TRIGGER_ROUND_ENDS) => ({
        type,
        params: {
            id: 'shared-card',
            name: 'Shared Card',
            cost: 0,
            resources: [],
            abilities: [{
                type: ABILITY_RESPONSE,
                params: {
                    trigger,
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            counters: 1,
                            target: TARGET_YOUR_SUPERHERO,
                        },
                    },
                },
            }],
        },
    });
    const createFixture = () => {
        const match = new Match({name: 'two-hero-snapshot', mc});
        const factory = new MatchFactory(match);
        match.players = ['first', 'second'].map(id => {
            const superhero = factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_HERO,
                params: {id: `${id}-hero`, name: `${id} hero`, hitPoints: 10},
            });
            const player = new Player({
                id,
                userId: 'shared-account',
                name: id,
                superhero,
            });
            player.gameZone = new PlayerZone({owner: player});
            player.deck = {cards: [], discardPile: []};

            return player;
        });
        const cards = match.players.map(owner =>
            factory.cardsFactory.createGameCardFromConfig(cardConfig(), {index: 1, owner}));
        cards.forEach((card, index) => {
            card.controller = match.players[index];
            match.players[index].gameZone.cards.push(card);
        });

        return {match, factory, cards};
    };

    test('repairs legacy duplicate sources without crossing same-account hero contexts', async t => {
        const {match, factory, cards} = createFixture();
        await Promise.all(cards.map(card => card.initTriggers()));
        assert.equal(Object.keys(match.triggerCards).length, 1);
        const unique = factory.cardsFactory.createGameCardFromConfig(
            cardConfig(), {index: 8, owner: match.players[0]});
        match.players[0].deck.cards.push(unique);
        match.pendingEffect = new PlaceCountersEffect({
            match,
            selectedTarget: cards[1],
            target: TARGET_YOUR_SUPERHERO,
            counters: 2,
        });
        cards[1].attachedTo = match.players[1].superhero;
        match.players[1].superhero.attached.push(cards[1]);
        delete match.copyIndexesByCardId;

        const restored = restoreMatch(serializeMatch(match), mc);
        const first = restored.players[0].gameZone.cards[0];
        const second = restored.players[1].gameZone.cards[0];

        assert.equal(first.id, 'shared-card-1');
        assert.equal(second.id, 'shared-card-9');
        assert.equal(restored.players[0].deck.cards[0].id, 'shared-card-8');
        assert.equal(first.card.id, 'shared-card');
        assert.equal(second.card.id, 'shared-card');
        assert.strictEqual(first.owner, restored.players[0]);
        assert.strictEqual(second.owner, restored.players[1]);
        assert.strictEqual(second.controller, restored.players[1]);
        assert.strictEqual(restored.pendingEffect.selectedTarget, second);
        assert.strictEqual(second.attachedTo, restored.players[1].superhero);
        assert.strictEqual(restored.players[1].superhero.attached[0], second);
        assert.strictEqual(restored.triggerCards[first.id], first);
        assert.strictEqual(restored.triggerCards[second.id], second);
        const params = {
            player: restored.players[0],
            match: restored,
            effect: new PlaceCountersEffect({match: restored, counters: 1}),
        };
        const triggers = await first._getTriggers(
            [TRIGGER_ROUND_ENDS], PRIORITY_RESPONSE, params);
        assert.equal(triggers.length, 2);
        restored.players.forEach(player => t.mock.method(player.superhero, 'refresh', () => {}));
        for (const trigger of triggers) {
            await trigger.runCard(params);
            assert.strictEqual(trigger.ability.effect.selectedTarget, trigger.card.owner.superhero);
        }
        t.mock.restoreAll();
        assert.equal(restored.players[0].superhero.counters, 1);
        assert.equal(restored.players[1].superhero.counters, 1);

        const nextFactory = new MatchFactory(restored);
        const [next] = nextFactory._createCopies(cardConfig(), 1);
        assert.equal(next.id, 'shared-card-10');
        assert.strictEqual(nextFactory.copyIndexesByCardId, restored.copyIndexesByCardId);
        const restarted = restoreMatch(serializeMatch(restored), mc);
        assert.equal(restarted.copyIndexesByCardId.get('shared-card'), 10);
        assert.deepEqual(Object.keys(restarted.triggerCards).sort(), [first.id, second.id].sort());
    });

    test('reconstructs missing and persisted allocation indexes while preserving unique IDs', () => {
        const {match, cards} = createFixture();
        cards[1].id = 'shared-card-4';
        cards[1].index = 4;
        match.copyIndexesByCardId.set('shared-card', 12);
        const restored = restoreMatch(serializeMatch(match), mc);

        assert.equal(restored.players[0].gameZone.cards[0].id, cards[0].id);
        assert.equal(restored.players[1].gameZone.cards[0].id, cards[1].id);
        assert.equal(restored.copyIndexesByCardId.get('shared-card'), 12);
        assert.equal(new MatchFactory(restored)._createCopies(cardConfig(), 1)[0].id, 'shared-card-13');

        delete match.copyIndexesByCardId;
        const legacy = restoreMatch(serializeMatch(match), mc);
        assert.equal(new MatchFactory(legacy)._createCopies(cardConfig(), 1)[0].id, 'shared-card-5');
    });

    test('repairs side-derived IDs and keeps side and selected-target parent references', () => {
        const {match, factory} = createFixture();
        const config = {
            params: {
                sides: [{
                    type: CARD_TYPE_HERO,
                    params: {id: 'shared-hero', name: 'Shared Hero', hitPoints: 10},
                }, {
                    type: CARD_TYPE_ALTEREGO,
                    params: {id: 'shared-alterego', name: 'Shared Alterego', hitPoints: 10},
                }],
            },
        };
        const roots = match.players.map(owner =>
            factory.cardsFactory.createGameCardFromConfig(config, {index: 1, owner}));
        roots.forEach((root, index) => match.players[index].gameZone.cards.push(root));
        const side = roots[1].sides[1];
        side.parentId = roots[1].id;
        match.pendingEffect = new PlaceCountersEffect({match, selectedTarget: side});
        delete match.copyIndexesByCardId;
        const restored = restoreMatch(serializeMatch(match), mc);
        const first = restored.players[0].gameZone.cards[1];
        const second = restored.players[1].gameZone.cards[1];

        assert.equal(first.id, '--shared-hero-1--shared-alterego-1');
        assert.equal(second.id, '--shared-hero-2--shared-alterego-2');
        assert.strictEqual(second.sides[1].parent, second);
        assert.strictEqual(second.sides[1].owner, restored.players[1]);
        assert.equal(second.sides[1].parentId, second.id);
        assert.strictEqual(restored.pendingEffect.selectedTarget, second.sides[1]);
        assert.equal(second.sides[1].card.id, 'shared-alterego');
        assert.equal(
            new MatchFactory(restored)._createCopies(config, 1)[0].id,
            '--shared-hero-3--shared-alterego-3'
        );
    });

    test('recovers hand events but does not revive discarded stale triggers', async () => {
        const {match, factory} = createFixture();
        const events = match.players.map(owner =>
            factory.cardsFactory.createGameCardFromConfig(
                cardConfig(CARD_TYPE_EVENT), {index: 1, owner}));
        for (let index = 0; index < events.length; index++) {
            match.players[index].hand.cards.push(events[index]);
            await events[index].initTriggers();
        }
        const discarded = factory.cardsFactory.createGameCardFromConfig(
            cardConfig(CARD_TYPE_EVENT), {index: 5, owner: match.players[0]});
        await discarded.initTriggers();
        match.players[0].deck.discardPile.push(discarded);
        const staleUpgrade = factory.cardsFactory.createGameCardFromConfig(
            cardConfig(), {index: 6, owner: match.players[0]});
        await staleUpgrade.initTriggers();
        match.players[0].deck.discardPile.push(staleUpgrade);
        delete match.copyIndexesByCardId;

        const restored = restoreMatch(serializeMatch(match), mc);
        const sources = Object.values(restored.triggerCards);
        assert.equal(sources.length, 2);
        assert.ok(sources.includes(restored.players[0].hand.cards[0]));
        assert.ok(sources.includes(restored.players[1].hand.cards[0]));
        assert.ok(!sources.includes(restored.players[0].deck.discardPile[0]));
    });

    test('restores resource-card triggers from hand without workInHand', async () => {
        const {match, factory} = createFixture();
        const owner = match.players[0];
        const resource = factory.cardsFactory.createGameCardFromConfig({
            ...cardConfig(CARD_TYPE_RESOURCE),
            params: {
                ...cardConfig(CARD_TYPE_RESOURCE).params,
                id: 'hand-resource',
                name: 'Hand Resource',
            },
        }, {owner});
        owner.hand.addCard(resource);
        await new Promise(resolve => setImmediate(resolve));
        assert.equal(resource.abilities[0].workInHand, false);
        assert.ok(resource.hasAbilityTrigger(resource.abilities[0]));

        delete match.triggerCards[resource.id];
        const restored = restoreMatch(serializeMatch(match), mc);
        const restoredResource = restored.players[0].hand.cards[0];

        assert.ok(restoredResource.hasAbilityTrigger(restoredResource.abilities[0]));
        assert.strictEqual(restored.triggerCards[restoredResource.id], restoredResource);
    });

    test('reinitializes resource triggers missing from a legacy saved hand', () => {
        const {match, factory} = createFixture();
        const owner = match.players[0];
        const resource = factory.cardsFactory.createGameCardFromConfig(
            cardConfig(CARD_TYPE_RESOURCE, TRIGGER_THIS_SPEND),
            {owner},
        );
        owner.hand.cards.push(resource);

        assert.equal(resource.hasAbilityTrigger(resource.abilities[0]), false);
        const restored = restoreMatch(serializeMatch(match), mc);
        const restoredResource = restored.players[0].hand.cards[0];

        assert.equal(restoredResource.abilities[0].trigger, TRIGGER_THIS_SPEND);
        assert.ok(restoredResource.hasAbilityTrigger(restoredResource.abilities[0]));
        assert.strictEqual(restored.triggerCards[restoredResource.id], restoredResource);
    });

    test('rejects ambiguous ID-only selections rather than resuming with another hero target', () => {
        const {match, cards} = createFixture();
        match.pendingEffect = new PlaceCountersEffect({
            match,
            selectedTarget: {id: cards[1].id},
        });

        assert.throws(
            () => restoreMatch(serializeMatch(match), mc),
            /Cannot restore ambiguous selected target "shared-card-1"/
        );
    });
});
