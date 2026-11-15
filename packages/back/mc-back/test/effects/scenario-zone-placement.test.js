import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CALC_COUNT,
    CALC_STAGE,
    DIALOG_PAY_COST,
    DIALOG_USE_CARD,
    PRIORITY_RESPONSE,
    RESOURCE_MENTAL,
    TARGET_ALL_PLAYERS,
    TARGET_ANY_PLAYER,
    TARGET_ENEMY,
    TARGET_INITIAL_PLAYER,
    TARGET_INITIAL_PLAYER_SUPERHERO,
    TARGET_SELECTED_PLAYER_CHARACTERS,
    TARGET_SCHEME,
    TARGET_VILLAIN,
    TRIGGER_YOUR_SUPERHERO_FLIPS,
} from 'mc-shared';
import justiceEvents from '../../../mc-data/seed/catalog/aspects/justice/events.js';
import justiceSupports from '../../../mc-data/seed/catalog/aspects/justice/supports.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import sheHulk from '../../../mc-data/seed/catalog/heroes/she-hulk.js';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import {Ability} from '../../src/abilities/core/ability.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {DrawEffect} from '../../src/effects/draw-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {Calc} from '../../src/engine/calc.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';
import {getEnemiesFor, getVillainFor} from '../../src/utils/match-zone-utils.js';

describe('scenario zone card placement', () => {
    async function createMatch(split = true) {
        const match = new Match({
            name: 'scenario-zone-placement',
            mc: {mcSocket: {send() {}}},
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        const players = [sheHulk, blackPanther].map((hero, index) => {
            const player = match.createPlayer({
                name: `Jugador ${index + 1}`,
                initial: index === 0,
                superhero: factory.createSuperhero({
                    ...hero.config,
                    cards: [],
                    precon: [],
                    obligation: undefined,
                }),
            });
            player.initPlayer();
            player.superhero.selectedSide = 1;
            player.deck.cards = [factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {name: `Carta restante ${index + 1}`, resources: [RESOURCE_MENTAL]},
            }, {owner: player})];
            return player;
        });
        match.currentPlayer = players[0];
        const scenario = await factory.createScenario({
            ...kang.config,
            separatePlayAreas: split,
            cards: standard.config.cards,
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);
        scenario.deck.cards = players.map((player, index) =>
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_TREACHERY,
                params: {name: `Encuentro ${index + 1}`, boost: 0},
            }, {owner: scenario}));
        if (split) {
            await scenario.advanceMainScheme(scenario.gameZone, 2, players[0]);
        }
        match.phase = 'player';
        match.playing = true;
        return {match, factory, players, scenario};
    }

    async function revealNemesis(match, player) {
        const scheme = player.superhero.nemesis.find(card => card.isSideScheme);
        assert.equal(scheme.name, 'Reto personal');
        await new RevealEncounterEffect({
            match,
            selectedTarget: scheme,
        }).runEffect({player});
        return scheme;
    }

    test('reveals a nemesis scheme in the affected player zone, not the hub or another player zone', async () => {
        const {match, players, scenario} = await createMatch();
        const [player, otherPlayer] = players;
        match.currentPlayer = otherPlayer;
        const scheme = await revealNemesis(match, player);

        assert.equal(scheme.controller, scenario);
        assert.equal(scheme.scenarioZone, player.scenarioZone);
        assert.ok(player.scenarioZone.cards.includes(scheme));
        assert.ok(!scenario.gameZone.cards.includes(scheme));
        assert.ok(!otherPlayer.scenarioZone.cards.includes(scheme));
        assert.ok(match.getSchemesFor(player).includes(scheme));
        assert.ok(!match.getSchemesFor(otherPlayer).includes(scheme));
        assert.equal(scheme.threat, 5);
        assert.equal(scheme.isInPlay, true);
        assert.equal(scheme.canRemoveThreat(), true);
    });

    test('puts ordinary side schemes in the resolving player zone and refreshes that zone', async () => {
        const {match, factory, players, scenario} = await createMatch();
        const player = players[1];
        const scheme = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
            params: {name: 'Plan secundario local', startingThreat: 2},
        }, {owner: scenario});
        const refreshedZones = [];
        scenario.zones.forEach(zone => {
            zone.refresh = async () => refreshedZones.push(zone);
        });

        await new PutPlayEffect({
            card: scheme,
            controller: scenario,
            match,
        }).runEffect({player});

        assert.equal(scheme.scenarioZone, player.scenarioZone);
        assert.deepEqual(refreshedZones, [player.scenarioZone]);
        assert.equal(scheme.threat, 2);
        assert.ok(!scenario.gameZone.cards.includes(scheme));
        assert.ok(!players[0].scenarioZone.cards.includes(scheme));
    });

    test('a discarded side scheme reenters in its new revealing player zone', async () => {
        const {match, players} = await createMatch();
        const scheme = await revealNemesis(match, players[0]);
        await scheme.discard();
        await new RevealEncounterEffect({
            match,
            selectedTarget: scheme,
        }).runEffect({player: players[1]});

        assert.equal(scheme.scenarioZone, players[1].scenarioZone);
        assert.ok(!players[0].scenarioZone.cards.includes(scheme));
        assert.ok(players[1].scenarioZone.cards.includes(scheme));
    });

    test('main scheme sides inherit their zone and Crisis remains local', async () => {
        const {match, players} = await createMatch();
        const scheme = await revealNemesis(match, players[0]);
        const firstMain = players[0].scenarioZone.currentScheme;
        const secondMain = players[1].scenarioZone.currentScheme;
        firstMain.currentSide.threat = 2;
        secondMain.currentSide.threat = 2;

        for (const main of [firstMain, secondMain]) {
            assert.equal(main.currentSide.scenarioZone, main.scenarioZone);
            assert.equal(main.currentSide.isInPlay, true);
            assert.ok(main.sides.filter(side => side !== main.currentSide)
                .every(side => !side.isInPlay));
        }
        assert.equal(firstMain.currentSide.canRemoveThreat(), false);
        assert.equal(secondMain.currentSide.canRemoveThreat(), true);
        const removal = new RemoveThreatEffect({
            match,
            target: TARGET_SCHEME,
            threat: 1,
        });
        assert.deepEqual(await removal.getValidTarget({player: players[0]}), [scheme]);
        assert.deepEqual(await removal.getValidTarget({player: players[1]}), [secondMain.currentSide]);
    });

    test('keeps a staged villain in its explicitly assigned zone during forced entry', async () => {
        const {match, players, scenario} = await createMatch();
        for (const player of players) {
            const zone = player.scenarioZone;
            assert.equal(zone.currentVillain.scenarioZone, zone);
            assert.ok(zone.cards.includes(zone.currentVillain));
            assert.ok(!scenario.gameZone.cards.includes(zone.currentVillain));
        }
        const villain = players[1].scenarioZone.currentVillain;
        await new PutPlayEffect({
            card: villain,
            controller: scenario,
            match,
        }).runEffect({player: players[0], force: true});
        assert.equal(villain.scenarioZone, players[1].scenarioZone);
        assert.ok(!players[0].scenarioZone.cards.includes(villain));
    });

    test('villain and enemy targets stay in the resolving player zone', async () => {
        const {match, players, scenario} = await createMatch();
        const [player] = players;
        const villain = player.scenarioZone.currentVillain;
        const targetEffect = new DealDamageEffect({
            match,
            target: TARGET_ENEMY,
            damage: 1,
        });

        assert.equal(getVillainFor(match, player), villain);
        assert.deepEqual(getEnemiesFor(match, player), [villain]);
        assert.deepEqual(await targetEffect.getValidTarget({player}), [villain]);

        player.scenarioZone.currentVillain = null;
        scenario.gameZone.currentVillain = {name: 'Villano de la zona general'};
        const villainEffect = new DealDamageEffect({
            match,
            target: TARGET_VILLAIN,
            damage: 1,
        });

        assert.equal(getVillainFor(match, player), undefined);
        assert.deepEqual(await villainEffect.getValidTarget({player}), []);
        assert.throws(() => new Calc({
            target: TARGET_VILLAIN,
            formula: CALC_STAGE,
        }).calculate({match, player}), {
            message: `CALC_STAGE requiere una etapa numérica en "${TARGET_VILLAIN}".`,
        });
    });

    test('enemy defenders and defense abilities are limited to the target zone', async () => {
        const {match, players} = await createMatch();
        const [player, otherPlayer] = players;
        const attack = new EnemyAttackEffect({
            match,
            enemy: player.scenarioZone.currentVillain,
            player,
            selectedTarget: player,
        });

        assert.deepEqual(attack.getOtherDefendingPlayers(player), []);
        assert.deepEqual(attack.getPlayerDefenders(otherPlayer, player), []);
        assert.equal(attack.canUseDefenseAbility(otherPlayer), false);

        player.scenarioZone.addPlayer(otherPlayer);

        assert.deepEqual(attack.getOtherDefendingPlayers(player), [otherPlayer]);
        assert.ok(attack.getPlayerDefenders(otherPlayer, player).length > 0);
        assert.equal(attack.canUseDefenseAbility(otherPlayer), true);
    });

    test('player-target selectors stay local except for initial player targets', async () => {
        const {match, players} = await createMatch();
        const [player, otherPlayer] = players;
        const anyPlayer = new DrawEffect({match, target: TARGET_ANY_PLAYER});
        const allPlayers = new DrawEffect({match, target: TARGET_ALL_PLAYERS});
        const initialPlayer = new DrawEffect({
            match,
            target: TARGET_INITIAL_PLAYER,
        });
        const initialPlayerSuperhero = new DrawEffect({
            match,
            target: TARGET_INITIAL_PLAYER_SUPERHERO,
        });
        const selectedCharacters = new DrawEffect({
            match,
            target: TARGET_SELECTED_PLAYER_CHARACTERS,
        });

        assert.deepEqual(await anyPlayer.getValidTarget({match, player}), [player]);
        assert.deepEqual(await allPlayers.getValidTarget({match, player}), [player]);
        assert.deepEqual(
            await initialPlayer.getValidTarget({match, player: otherPlayer}),
            [match.initialPlayer],
        );
        assert.deepEqual(
            await initialPlayerSuperhero.getValidTarget({
                match,
                player: otherPlayer,
            }),
            [match.initialPlayer.superhero],
        );
        assert.deepEqual(
            await selectedCharacters.getValidTarget({
                match,
                player,
                targetPlayer: otherPlayer,
            }),
            [],
        );

        player.scenarioZone.addPlayer(otherPlayer);
        assert.deepEqual(
            await anyPlayer.getValidTarget({match, player}),
            [player, otherPlayer],
        );
        assert.deepEqual(
            await allPlayers.getValidTarget({match, player}),
            [player, otherPlayer],
        );
        assert.deepEqual(
            await initialPlayer.getValidTarget({match, player: otherPlayer}),
            [match.initialPlayer],
        );
        assert.deepEqual(
            await initialPlayerSuperhero.getValidTarget({
                match,
                player: otherPlayer,
            }),
            [match.initialPlayer.superhero],
        );
        assert.deepEqual(
            await selectedCharacters.getValidTarget({
                match,
                player,
                targetPlayer: otherPlayer,
            }),
            [otherPlayer.superhero.currentSide],
        );
    });

    test('globalScope crosses trigger zones without widening player targets', async () => {
        const {match, players} = await createMatch();
        const [sourcePlayer, eventPlayer] = players;
        const card = {scenarioZone: sourcePlayer.scenarioZone};
        const localAbility = new Ability({card, match});
        const globalAbility = new Ability({
            card,
            globalScope: true,
            match,
        });

        assert.equal(localAbility.globalScope, false);
        assert.equal(match.isScenarioZoneAbilityAllowed(localAbility, {
            player: eventPlayer,
        }), false);
        assert.equal(globalAbility.globalScope, true);
        assert.equal(match.isScenarioZoneAbilityAllowed(globalAbility, {
            player: eventPlayer,
        }), true);

        const allPlayersEffect = new DrawEffect({
            ability: globalAbility,
            match,
            target: TARGET_ALL_PLAYERS,
        });
        assert.deepEqual(
            await allPlayersEffect.getValidTarget({player: eventPlayer}),
            [eventPlayer],
        );
    });

    test('player-target selectors still include all players when play areas are shared', async () => {
        const {match, players} = await createMatch(false);
        const [player, otherPlayer] = players;
        const anyPlayer = new DrawEffect({match, target: TARGET_ANY_PLAYER});
        const allPlayers = new DrawEffect({match, target: TARGET_ALL_PLAYERS});

        assert.deepEqual(
            await anyPlayer.getValidTarget({match, player}),
            [player, otherPlayer],
        );
        assert.deepEqual(
            await allPlayers.getValidTarget({match, player}),
            [player, otherPlayer],
        );
    });

    test('calculations over player match enemies use only that player zone', async () => {
        const {match, players} = await createMatch();
        const [player, otherPlayer] = players;
        const foreignMinion = {name: 'Esbirro de otra zona'};
        otherPlayer.minions.push(foreignMinion);
        const calc = new Calc({
            target: 'player.match.enemies',
            formula: CALC_COUNT,
        });

        assert.equal(calc.calculate({match, player}), 1);
        assert.ok(match.enemies.includes(foreignMinion));
    });

    test('Policía de barrio can move threat off the local nemesis scheme', async () => {
        const {match, factory, players} = await createMatch();
        const player = players[0];
        const scheme = await revealNemesis(match, player);
        const police = factory.cardsFactory.createGameCardFromConfig(
            justiceSupports.find(({_id}) => _id === 'justice-policia-de-barrio').card,
            {owner: player},
        );
        await new PutPlayEffect({match, card: police}).runEffect({player});
        const ability = police.abilities[0];

        assert.equal(await ability.canRun({player, card: police}), true);
        await ability.resolveAbility({player, card: police});

        assert.equal(ability.resolved, true);
        assert.equal(scheme.threat, 4);
        assert.equal(police.threat, 1);
        assert.equal(police.exhausted, true);
        assert.ok(player.scenarioZone.cards.includes(scheme));
    });

    test('offers Imponer la ley on an alter-ego to hero flip and removes local threat', async () => {
        const {match, factory, players} = await createMatch();
        const player = players[0];
        const scheme = await revealNemesis(match, player);
        const event = factory.cardsFactory.createGameCardFromConfig(
            justiceEvents.find(({_id}) => _id === 'justice-imponer-la-ley').card,
            {owner: player},
        );
        const resource = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso mental',
                resources: [RESOURCE_MENTAL],
            },
        }, {owner: player});
        player.hand.cards = [event, resource];
        await event.initTriggers();
        player.superhero.selectedSide = 0;
        let offered = 0;
        let dialogs = 0;
        match.openDialog = async dialog => {
            assert.ok(++dialogs < 20, `Repeated dialog: ${dialog.dialogType}`);
            if (dialog.dialogType === DIALOG_USE_CARD &&
                dialog.data.cards.some(card => card.id === event.id)) {
                offered++;
                return {selected: {id: event.id}};
            }
            if (dialog.dialogType === DIALOG_PAY_COST) {
                return {
                    paid: {
                        hand: [{id: resource.id}],
                        generators: [],
                    },
                    resources: [RESOURCE_MENTAL],
                };
            }
            return {};
        };

        await player.superhero.flip({player, selectedFormTarget: player.superhero.sides[1]});

        assert.equal(player.isHero, true);
        assert.equal(offered, 1);
        assert.equal(scheme.threat, 1);
        assert.ok(player.deck.discardPile.includes(event));
        assert.ok(player.deck.discardPile.includes(resource));
        assert.equal((await match._getTriggers(
            [TRIGGER_YOUR_SUPERHERO_FLIPS],
            PRIORITY_RESPONSE,
            {player, card: player.superhero},
        )).length, 0);
    });

    test('zone ownership and active main scheme sides survive serialization', async () => {
        const {match, players} = await createMatch();
        await revealNemesis(match, players[0]);
        delete match.persist;
        delete match.refresh;
        delete match.openDialog;
        const restored = restoreMatch(serializeMatch(match));
        const player = restored.players[0];
        const main = player.scenarioZone.currentScheme;
        const scheme = restored.getSideSchemesFor(player).find(card =>
            card.name === 'Reto personal');

        assert.equal(scheme.scenarioZone, player.scenarioZone);
        assert.equal(main.currentSide.scenarioZone, player.scenarioZone);
        assert.equal(main.currentSide.isInPlay, true);
        assert.ok(!restored.getSchemesFor(restored.players[1]).includes(scheme));
    });

    test('shared scenarios still place nemesis schemes in the common zone', async () => {
        const {match, players, scenario} = await createMatch(false);
        const scheme = await revealNemesis(match, players[0]);

        assert.equal(scheme.scenarioZone, scenario.gameZone);
        assert.ok(players.every(player => match.getSchemesFor(player).includes(scheme)));
    });
});
