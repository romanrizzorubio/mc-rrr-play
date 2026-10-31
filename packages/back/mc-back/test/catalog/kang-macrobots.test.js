import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_BOOST,
    CARD_TYPE_MINION,
    EFFECT_TOUGH,
    TARGET_VILLAIN,
    TRAIT_ROBOT,
    TRAIT_TEMPORAL,
} from 'mc-shared';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import temporal from '../../../mc-data/seed/catalog/sets/temporal.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';

describe('Macrobots', () => {
    test('registers three minions and gives Kang Tough from its boost ability', async () => {
        const setConfigs = new Map([
            ['standard', standard.config],
            ['temporal', temporal.config],
        ]);
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                data: {
                    async getSetConfig(id) {
                        return setConfigs.get(id);
                    },
                },
            },
            name: 'kang-macrobots-test',
        });
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Jugador',
            initial: true,
            superhero: factory.createSuperhero({
                ...structuredClone(blackPanther.config),
                cards: [],
                precon: [],
                nemesis: [],
                obligation: undefined,
            }),
        });
        player.initPlayer();
        const scenario = await factory.createScenario(structuredClone(kang.config));
        match.addScenario(scenario);
        await scenario.initScenario(match.createObligations(), false);

        const entry = kang.config.cards.find(({card}) =>
            card.params.name === 'Macrobots');
        assert.equal(entry.count, 3);
        assert.equal(entry.card.type, CARD_TYPE_MINION);
        assert.equal(entry.card.params.image, 'scenarios/kang/11017.png');
        assert.deepEqual(entry.card.params.traits, [TRAIT_ROBOT, TRAIT_TEMPORAL]);
        assert.equal(entry.card.params.attack, 2);
        assert.equal(entry.card.params.scheme, 1);
        assert.equal(entry.card.params.hitPoints, 4);
        assert.deepEqual(entry.card.params.keywords, {guard: true, retaliate: 1});
        assert.equal(entry.card.params.boost, 0);
        assert.equal(entry.card.params.boostAbility.type, ABILITY_BOOST);
        assert.deepEqual(entry.card.params.boostAbility.params.effect, {
            type: EFFECT_TOUGH,
            params: {target: TARGET_VILLAIN},
        });

        const macrobots = scenario.scenarioCards.filter(card =>
            card.name === 'Macrobots');
        assert.equal(macrobots.length, 3);
        assert.equal(typeof macrobots[0].boostAbility.effect.canRun, 'function');

        const boost = new ResolveBoostEffect({
            match,
            card: macrobots[0],
            enemyActivation: {boostCards: [macrobots[0]]},
        });
        await boost.runEffect({match, player});

        assert.equal(boost.resolved, true);
        assert.equal(match.villain.tough, 1);
    });

    test('Macrobots Guard blocks its engaged player but not a player in another scenario zone', async () => {
        const setConfigs = new Map([
            ['standard', standard.config],
            ['temporal', temporal.config],
        ]);
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                data: {
                    async getSetConfig(id) {
                        return setConfigs.get(id);
                    },
                },
            },
            name: 'kang-macrobots-zone-guard-test',
        });
        match.openDialog = async () => ({});
        match.refresh = async () => {};
        const factory = new MatchFactory(match);
        const players = [0, 1].map(index => {
            const player = match.createPlayer({
                name: `Jugador ${index + 1}`,
                initial: index === 0,
                superhero: factory.createSuperhero({
                    ...structuredClone(blackPanther.config),
                    cards: [],
                    precon: [],
                    nemesis: [],
                    obligation: undefined,
                }),
            });
            player.initPlayer();

            return player;
        });
        const scenario = await factory.createScenario(structuredClone(kang.config));
        match.addScenario(scenario);
        match.drawEncounterCards = async () => [];
        await scenario.initScenario(match.createObligations(), false);
        await scenario.advanceMainScheme(
            scenario.gameZone,
            2,
            match.initialPlayer
        );

        assert.notEqual(players[0].scenarioZone, players[1].scenarioZone);
        const macrobot = scenario.scenarioCards.find(card =>
            card.name === 'Macrobots');
        assert.ok(macrobot);
        await new EngageEffect({
            card: macrobot,
            controller: scenario,
            selectedTarget: players[0],
            match,
        }).runEffect({player: players[0]});

        assert.equal(macrobot.guard, true);
        assert.equal(macrobot.engaged, players[0]);
        assert.equal(players[0].hasGuard, true);
        assert.equal(players[1].hasGuard, false);
        assert.ok(match.getEnemiesFor(players[0]).includes(macrobot));
        assert.ok(!match.getEnemiesFor(players[1]).includes(macrobot));
        assert.equal(
            players[0].scenarioZone.currentVillain.canBeAttacked(players[0]),
            false
        );
        assert.equal(
            players[1].scenarioZone.currentVillain.canBeAttacked(players[1]),
            true
        );
    });
});
