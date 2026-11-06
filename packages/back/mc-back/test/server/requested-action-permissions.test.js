import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    CARD_TYPE_EVENT,
    CARD_TYPE_SUPPORT,
    EFFECT_FLIP,
    EFFECT_PUT_PLAY,
    TARGET_HERO_SIDE,
    TARGET_YOUR_SUPERHERO,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Deck} from '../../src/model/match/deck.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {PlayerRest} from '../../src/server/rest/player-rest.js';
import {getAbilitiesWithAvailability} from '../../src/utils/ability-availability.js';

describe('requested actions only grant Action abilities', () => {
    const createFixture = async () => {
        const {heroes} = await loadCatalog();
        const match = new Match({
            name: 'requested-actions',
            mc: {mcSocket: {send() {}}},
        });
        match.scenario = {
            gameZone: {cards: [], currentScheme: undefined},
            getCard() {},
        };
        const factory = new MatchFactory(match);
        const heroConfig = heroes.find(({_id}) => _id === 'captain-marvel');
        const superhero = factory.createSuperhero({
            ...heroConfig.config,
            precon: [],
        });
        superhero.selectedSide = superhero.sides.findIndex(side => side.isAlterEgo);
        const actor = match.createPlayer({
            name: 'Capitana Marvel',
            userId: 'actor',
            superhero,
        });
        actor.gameZone = new PlayerZone({owner: actor});
        actor.deck = new Deck({owner: actor, isPlayerDeck: true});
        actor.deck.cards.push({
            id: 'unused-deck-card',
            toObj: () => ({id: 'unused-deck-card'}),
        });
        actor.hand.refresh = async () => {};
        actor.gameZone.refresh = async () => {};
        superhero.refresh = async () => {};
        const current = {id: 'current', userId: 'current', name: 'Otro jugador'};
        match.currentTurnPlayer = current;
        match.initialized = true;
        match.phase = 'players';
        match.actionRequest = {
            requesterUserId: current.userId,
            targetUserId: actor.userId,
            status: 'accepted',
        };
        match.refresh = async () => ({
            players: [{id: actor.id, name: actor.name, userId: actor.userId}],
        });
        const support = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SUPPORT,
            params: {name: 'Apoyo de prueba', cost: 0},
        });
        const event = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Cambio por Acción',
                cost: 0,
                abilities: [{
                    type: ABILITY_ACTION,
                    params: {
                        effect: {
                            type: EFFECT_FLIP,
                            params: {
                                target: TARGET_YOUR_SUPERHERO,
                                formTarget: TARGET_HERO_SIDE,
                            },
                        },
                    },
                }],
            },
        });
        for (const card of [support, event]) {
            card.owner = actor;
            actor.hand.cards.push(card);
        }

        return {match, actor, superhero, support, event};
    };
    const authenticated = async callback => {
        const previousFetch = globalThis.fetch;
        globalThis.fetch = async () => ({
            ok: true,
            json: async () => ({user: {id: 'actor', name: 'Capitana Marvel'}}),
        });
        try {
            return await callback();
        } finally {
            globalThis.fetch = previousFetch;
        }
    };

    test('REST rejects voluntary flips, permanents and basic abilities with or without a target', async () => {
        const {match, actor, superhero, support} = await createFixture();
        const rest = new PlayerRest({});
        const params = {match, player: actor.userId, cookie: 'session=verified'};
        const basicIndex = superhero.currentSide.abilities.findIndex(ability => ability.isBasic);
        assert.ok(basicIndex >= 0);
        const originalSide = superhero.selectedSide;

        await authenticated(async () => {
            await assert.rejects(rest.flip(params), error => error.statusCode === 403);
            await assert.rejects(
                rest.playCard({...params, cardId: support.id}),
                error => error.statusCode === 403,
            );
            for (const targetId of [undefined, 'enemy']) {
                await assert.rejects(rest.resolveAbility({
                    ...params,
                    card: superhero.id,
                    ability: basicIndex,
                    targetId,
                }), error => error.statusCode === 403);
            }
        });
        assert.equal(superhero.selectedSide, originalSide);
        assert.equal(superhero.flipped, false);
        assert.ok(actor.hand.cards.includes(support));
        assert.equal(actor.gameZone.cards.includes(support), false);
    });

    test('a requested Action event can change identity without using the voluntary change', async () => {
        const {match, actor, superhero, event} = await createFixture();
        await authenticated(() => new PlayerRest({}).playCard({
            match,
            player: actor.userId,
            cookie: 'session=verified',
            cardId: event.id,
        }));
        assert.equal(superhero.isHero, true);
        assert.equal(superhero.flipped, false);
        assert.equal(actor.hand.cards.includes(event), false);
        assert.ok(actor.deck.discardPile.includes(event));
    });

    test('manual event play selects its Action rather than an earlier Response', async () => {
        const {match, actor, superhero, event} = await createFixture();
        let responseResolved = false;
        event.abilities.unshift({
            isAction: false,
            prepareToResolve: async () => ({canRun: true}),
            resolveAbility: async () => {
                responseResolved = true;
            },
        });
        await authenticated(() => new PlayerRest({}).playCard({
            match,
            player: actor.userId,
            cookie: 'session=verified',
            cardId: event.id,
        }));
        assert.equal(responseResolved, false);
        assert.equal(superhero.isHero, true);
        assert.equal(superhero.flipped, false);
    });

    test('a requested in-play Action can put a permanent into play by effect', async () => {
        const {match, actor, support} = await createFixture();
        const actionCard = new MatchFactory(match).cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SUPPORT,
            params: {
                name: 'Puesta en juego por Acción',
                cost: 0,
                abilities: [{
                    type: ABILITY_ACTION,
                    params: {
                        effect: {
                            type: EFFECT_PUT_PLAY,
                            params: {
                                cardSource: 'player.hand.cards',
                                cardCondition: {id: support.id},
                            },
                        },
                    },
                }],
            },
        }, {owner: actor});
        actionCard.controller = actor;
        actor.gameZone.cards.push(actionCard);
        await authenticated(() => new PlayerRest({}).resolveAbility({
            match,
            player: actor.userId,
            cookie: 'session=verified',
            card: actionCard.id,
            ability: 0,
        }));
        assert.ok(actor.gameZone.cards.includes(support));
        assert.equal(actor.hand.cards.includes(support), false);
    });

    test('basic abilities on an owned ally are not granted by a request', async () => {
        const {match, actor} = await createFixture();
        let resolved = false;
        const ally = {
            id: 'owned-ally',
            currentSide: {
                abilities: [{isBasic: true, isAction: false}],
            },
            resolveAbility() {
                resolved = true;
            },
        };
        actor.gameZone.cards.push(ally);
        for (const targetId of [undefined, 'enemy']) {
            await authenticated(() => assert.rejects(
                new PlayerRest({}).resolveAbility({
                    match,
                    player: actor.userId,
                    cookie: 'session=verified',
                    card: ally.id,
                    ability: 0,
                    targetId,
                }),
                error => error.statusCode === 403,
            ));
        }
        assert.equal(resolved, false);
    });

    test('own turn retains voluntary identity changes and normal permanent plays', async () => {
        const {match, actor, superhero, support} = await createFixture();
        match.actionRequest = null;
        match.currentTurnPlayer = actor;
        const rest = new PlayerRest({});
        const params = {match, player: actor.userId, cookie: 'session=verified'};
        await authenticated(async () => {
            await rest.flip(params);
            await rest.playCard({...params, cardId: support.id});
        });
        assert.equal(superhero.isHero, true);
        assert.equal(superhero.flipped, true);
        assert.ok(actor.gameZone.cards.includes(support));
    });

    test('availability disables basic abilities and permanents but not Actions during another turn', async () => {
        const {match, actor, event, support} = await createFixture();
        const createAbility = isAction => ({
            isAction,
            isBasic: !isAction,
            prepareEffect() {},
            canRun: async () => true,
            toObj: () => ({isAction, isBasic: !isAction}),
        });
        const card = {currentSide: {abilities: [
            createAbility(false),
            createAbility(true),
        ]}};
        const requested = await getAbilitiesWithAvailability(card, actor);
        assert.deepEqual(requested.map(ability => ability.disable), [true, false]);
        const hand = await actor.hand.toObjWithPlayability();
        assert.equal(hand.find(card => card.id === support.id).playable, false);
        assert.equal(hand.find(card => card.id === event.id).playable, true);
        assert.equal(hand.find(card => card.id === event.id).isEvent, true);
        assert.equal((await actor.toObjWithPlayableHand()).superhero.canFlip, false);

        match.actionRequest.status = 'pending';
        assert.equal((await actor.hand.toObjWithPlayability())
            .find(card => card.id === event.id).playable, false);
        match.actionRequest = null;
        assert.equal((await actor.hand.toObjWithPlayability())
            .find(card => card.id === event.id).playable, false);
        match.actionRequest = {
            requesterUserId: match.currentTurnPlayer.userId,
            targetUserId: 'different-player',
            status: 'accepted',
        };
        assert.equal((await actor.hand.toObjWithPlayability())
            .find(card => card.id === event.id).playable, false);

        match.currentTurnPlayer = actor;
        match.actionRequest = null;
        const own = await getAbilitiesWithAvailability(card, actor);
        assert.deepEqual(own.map(ability => ability.disable), [false, false]);
        assert.equal((await actor.hand.toObjWithPlayability())
            .find(card => card.id === support.id).playable, true);
        assert.equal((await actor.toObjWithPlayableHand()).superhero.canFlip, true);
    });
});
