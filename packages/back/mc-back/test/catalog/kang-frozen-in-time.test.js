import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_FORCED_INTERRUPT,
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    DIALOG_LIST,
    DIALOG_USE_CARD,
    EFFECT_READY,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_TEMPORAL,
} from 'mc-shared';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import ironMan from '../../../mc-data/seed/catalog/heroes/ironman.js';
import msMarvel from '../../../mc-data/seed/catalog/heroes/ms-marvel.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import temporal from '../../../mc-data/seed/catalog/sets/temporal.js';
import runningInterference from '../../../mc-data/seed/catalog/sets/running-interference.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';

describe('Congelado en el tiempo', () => {
    const createGame = async ({copies = 1, superheroConfig = blackPanther.config} = {}) => {
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                data: {
                    async getSetConfig(id) {
                        return {standard, temporal}[id]?.config;
                    },
                },
            },
            name: 'frozen-in-time-test',
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }
            if (dialog.dialogType === DIALOG_LIST) {
                return {selected: {id: 0}};
            }
            return {};
        };
        const factory = new MatchFactory(match);
        const players = ['Jugador 1', 'Jugador 2'].map((name, index) => {
            const player = match.createPlayer({
                name,
                initial: index === 0,
                superhero: factory.createSuperhero({
                    ...superheroConfig,
                    cards: [],
                    precon: [],
                    nemesis: [],
                    obligation: undefined,
                }),
            });
            player.initPlayer();
            player.superhero.selectedSide = 1;
            return player;
        });
        match.currentPlayer = players[0];
        match.currentTurnPlayer = players[0];
        const config = structuredClone(kang.config);
        config.cards.find(({card}) => card.params.image.endsWith('11016.png')).count = copies;
        const scenario = await factory.createScenario(config);
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        match.playing = true;
        match.phase = 'players';
        const cards = scenario.scenarioCards.filter(card =>
            card.name === 'Congelado en el tiempo');
        return {match, factory, players, scenario, cards};
    };
    const reveal = async (match, scenario, card, player) => {
        scenario.deck.removeCardFromDeck(card);
        await new RevealEncounterEffect({match, card}).runEffect({match, player});
    };
    const ready = (match, player, target = TARGET_YOUR_SUPERHERO, params = {}) =>
        match.effectsFactory.createEffect({
            type: EFFECT_READY,
            params: {target, ...params},
        });

    test('the real scenario factory includes one Temporal attachment and compiles both abilities', async () => {
        const entry = kang.config.cards.find(({card}) =>
            card.params.name === 'Congelado en el tiempo');
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_ATTACHMENT);
        assert.equal(entry.card.params.image, 'scenarios/kang/11016.png');
        assert.deepEqual(entry.card.params.traits, [TRAIT_TEMPORAL]);
        assert.equal(entry.card.params.attach, TARGET_YOUR_SUPERHERO);
        assert.equal(entry.card.params.boost, 0);
        const {cards, scenario} = await createGame();
        assert.equal(cards.length, 1);
        const isInEncounterDeck = scenario.deck.cards.includes(cards[0]);
        const isDealtToPlayer = scenario.zones.some(zone =>
            zone.players.some(player => player.encounters.includes(cards[0])));
        assert.ok(isInEncounterDeck || isDealtToPlayer);
        assert.equal(entry.card.params.abilities[0].type, ABILITY_FORCED_INTERRUPT);
        assert.equal(cards[0].abilities[0].isInterrupt, true);
        for (const ability of [...cards[0].abilities, cards[0].boostAbility]) {
            assert.equal(typeof ability.effect.canRun, 'function');
        }
        const images = kang.config.cards.map(({card}) =>
            Number(card.params.image.match(/(\d+)\.png$/)[1]));
        assert.deepEqual(images, images.toSorted((a, b) => a - b));
    });

    for (const side of [0, 1]) {
        test(`revelation attaches to the resolving superhero in form ${side} and replaces their next ready`, async () => {
            const {match, players, scenario, cards: [card]} = await createGame();
            const player = players[1];
            player.superhero.selectedSide = side;
            await reveal(match, scenario, card, player);
            assert.equal(card.attachedTo, player.superhero);
            assert.equal(card.isInPlay, true);
            assert.equal(card.controller, scenario);
            assert.equal(card.owner, scenario);

            player.superhero.exhaust();
            const effect = ready(match, player);
            assert.equal(await effect.canRun({match, player}), true);
            assert.equal(card.isInPlay, true, 'Availability checks must not discard the card');
            await effect.runEffect({match, player: players[0]});
            assert.equal(players[0].superhero.exhausted, false);
            assert.equal(card.isInPlay, true, 'Another superhero must not consume the attachment');
            await effect.runEffect({match, player});
            assert.equal(player.superhero.exhausted, true);
            assert.equal(effect.resolved, false);
            assert.equal(card.attachedTo, undefined);
            assert.equal(card.isInPlay, false);
            assert.ok(scenario.deck.discardPile.includes(card));
            assert.equal(player.superhero.attached.includes(card), false);

            await effect.runEffect({match, player});
            assert.equal(player.superhero.exhausted, false);
            assert.equal(effect.resolved, true);
            assert.equal(effect.fullResolved, true);
        });
    }

    test('a hero-side ready matches its superhero host and already-ready attempts do not discard', async () => {
        const {match, players: [player], scenario, cards: [card]} = await createGame();
        await reveal(match, scenario, card, player);
        await ready(match, player).runEffect({match, player});
        assert.equal(card.isInPlay, true);
        player.superhero.exhaust();
        await ready(match, player, TARGET_YOUR_HERO).runEffect({match, player});
        assert.equal(player.superhero.exhausted, true);
        assert.equal(card.isInPlay, false);
        assert.ok(player.superhero.sides.every(side => side.exhausted));
    });

    test('end-of-phase preparation discards only one copy per ready attempt', async () => {
        const {match, players: [player], scenario, cards} = await createGame({copies: 2});
        for (const card of cards) {
            await reveal(match, scenario, card, player);
        }
        player.superhero.exhaust();
        player.getHandSize = async () => 0;
        await player.runEndPlayersPhase();
        assert.equal(player.superhero.exhausted, true);
        assert.equal(cards.filter(card => card.isInPlay).length, 1);
        await player.ready();
        assert.equal(player.superhero.exhausted, true);
        assert.equal(cards.filter(card => card.isInPlay).length, 0);
        await player.ready();
        assert.equal(player.superhero.exhausted, false);
    });

    test('a Reactor ARK action during the player turn pays its cost but replaces hero preparation', async () => {
        const {match, factory, players: [player], scenario, cards: [card]} =
            await createGame({superheroConfig: ironMan.config});
        await reveal(match, scenario, card, player);
        const reactor = factory.cardsFactory.createGameCardFromConfig(
            ironMan.config.cards.find(({card}) =>
                card.params.name === 'Reactor ARK').card,
            {owner: player},
        );
        await new PutPlayEffect({match, card: reactor})
            .runEffect({match, player});
        player.superhero.exhaust();
        assert.equal(match.phase, 'players');
        assert.equal(await reactor.abilities[0].canRun({match, player, card: reactor}), true);
        assert.equal(card.isInPlay, true);

        await player.resolveAbility(reactor.id, 0);

        assert.equal(reactor.exhausted, true, 'The ready action still pays its exhaust cost');
        assert.equal(reactor.isInPlay, true);
        assert.equal(player.superhero.exhausted, true);
        assert.ok(player.superhero.sides.every(side => side.exhausted));
        assert.equal(card.isInPlay, false);
        assert.equal(card.attachedTo, undefined);
        assert.ok(scenario.deck.discardPile.includes(card));
        assert.equal(reactor.abilities[0].effect.resolved, false);
        assert.equal(match.phase, 'players');

        await ready(match, player, TARGET_YOUR_HERO).runEffect({match, player});
        assert.equal(player.superhero.exhausted, false);
        assert.equal(reactor.exhausted, true);
    });

    test('a ready prohibition prevents the attempt without consuming the replacement attachment', async () => {
        const {match, factory, players: [player], scenario, cards: [card]} = await createGame();
        await reveal(match, scenario, card, player);
        const prohibition = factory.cardsFactory.createGameCardFromConfig(
            runningInterference.config.cards.find(({card}) =>
                card.params.name === 'Con las manos atadas').card,
        );
        await new RevealEncounterEffect({match, card: prohibition})
            .runEffect({match, player});
        player.superhero.exhaust();
        assert.equal(await ready(match, player).canRun({match, player}), false);
        await player.ready();
        assert.equal(player.superhero.exhausted, true);
        assert.equal(card.isInPlay, true);
        await prohibition.discard();
        await player.ready();
        assert.equal(player.superhero.exhausted, true);
        assert.equal(card.isInPlay, false);
    });

    test('a multi-character ready replaces only the host and does not fully resolve its Then clause', async () => {
        const {match, factory, players: [player], scenario, cards} = await createGame({copies: 2});
        for (const card of cards) {
            await reveal(match, scenario, card, player);
        }
        const ally = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {name: 'Aliado', hitPoints: 3, attack: 1, thwart: 1},
        });
        player.gameZone.addToGameZone(ally);
        ally.controller = player;
        ally.owner = player;
        ally.exhaust();
        player.superhero.exhaust();
        const effect = ready(match, player, TARGET_ALL_CHARACTERS_YOU_CONTROL, {
            thenEffect: ready(match, player),
        });
        await effect.runEffect({match, player});
        assert.equal(player.superhero.exhausted, true);
        assert.equal(ally.exhausted, false);
        assert.equal(cards.filter(card => card.isInPlay).length, 1);
        assert.equal(effect.resolved, true);
        assert.equal(effect.fullResolved, false);
        assert.equal(effect.thenEffect.resolved, false);
    });

    test('only the attached Ms. Marvel is prevented from readying', async () => {
        const {match, factory, players: [player, otherPlayer], scenario, cards: [card]} =
            await createGame({superheroConfig: msMarvel.config});
        await reveal(match, scenario, card, player);

        const allies = ['Aliado 1', 'Aliado 2'].map(name =>
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_ALLY,
                params: {name, hitPoints: 3, attack: 1, thwart: 1},
            }));
        for (const ally of allies) {
            player.gameZone.addToGameZone(ally);
            ally.controller = player;
            ally.owner = player;
            ally.exhaust();
        }
        player.superhero.exhaust();
        otherPlayer.superhero.exhaust();

        await otherPlayer.ready();
        assert.equal(otherPlayer.superhero.exhausted, false);
        assert.equal(card.isInPlay, true);

        const effect = ready(match, player, TARGET_ALL_CHARACTERS_YOU_CONTROL);
        await effect.runEffect({match, player});

        assert.equal(player.superhero.exhausted, true);
        assert.deepEqual(allies.map(ally => ally.exhausted), [false, false]);
        assert.equal(card.isInPlay, false);
        assert.equal(effect.resolved, true);
        assert.equal(effect.fullResolved, false);
    });

    for (const Activation of [EnemyAttackEffect, EnemySchemeEffect]) {
        test(`the Boost attaches during ${Activation.name} and survives boost cleanup`, async () => {
            const {match, players: [player], scenario, cards: [card]} = await createGame();
            if (Activation === EnemySchemeEffect) {
                player.superhero.selectedSide = 0;
            }
            scenario.deck.removeCardFromDeck(card);
            scenario.deck.cards.unshift(card);
            match.phase = 'villain';
            const activation = new Activation({
                match,
                enemy: match.villain,
                ...(Activation === EnemyAttackEffect ? {selectedTarget: player} : {}),
            });
            await activation.runEffect({player});
            assert.equal(activation.resolved, true);
            assert.ok(activation.boostCards.includes(card));
            assert.equal(card.attachedTo, player.superhero);
            assert.equal(card.isInPlay, true);
            assert.equal(card.controller, scenario);
            assert.equal(scenario.deck.discardPile.includes(card), false);
            player.superhero.exhaust();
            await player.ready();
            assert.equal(player.superhero.exhausted, true);
            assert.equal(card.isInPlay, false);
            assert.ok(scenario.deck.discardPile.includes(card));
        });
    }
});
