import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_FIRST_PLAYER_ACTION,
    ABILITY_FORCED_RESPONSE,
    ABILITY_SPECIAL,
    CALC_COUNTERS,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    DIALOG_REVEAL_CARDS,
    DIALOG_SELECT_TARGET,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_ENGAGE,
    EFFECT_EXHAUST,
    EFFECT_PLACE_COUNTERS,
    EFFECT_REMOVE_COUNTER,
    EFFECT_REMOVE_THREAT,
    EFFECT_RESOLVE_SPECIAL_ABILITY,
    EFFECT_SHOW_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_STORE_BOOST,
    STATUS_STALWART,
    STATUS_STUNNED,
    STATUS_CONFUSED,
    STATUS_TOUGH,
    TARGET_CONDITION_CARD,
    TARGET_ENVIRONMENT,
    TARGET_MAIN_SCHEME,
    TARGET_PLAYER_FEWEST_MINIONS,
    TARGET_SUPPORT_YOU_CONTROL,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TRAIT_BADOON,
    TRIGGER_ENGAGE_PLAYER,
    TRIGGER_THIS_ACTIVATES,
    TRIGGER_THIS_SCHEME,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {FirstPlayerActionAbility} from '../../src/abilities/actions/first-player-action-ability.js';
import {SpecialAbility} from '../../src/abilities/misc/special-ability.js';
import {ConfuseEffect} from '../../src/effects/confuse-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {ReplaceStatusEffect} from '../../src/effects/replace-status-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';
import {ResolveSpecialAbilityEffect} from '../../src/effects/resolve-special-ability-effect.js';
import {StunEffect} from '../../src/effects/stun-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {getAbilitiesWithAvailability} from '../../src/utils/ability-availability.js';

const SET = 'brotherhood-of-badoon';
const SPEAR_NAME = 'Lanza de Drang';
const SHIP_NAME = 'Nave badoon';

describe('Hermandad de los Badoon scenario', () => {
    let catalogPromise;

    const getCatalog = () => {
        catalogPromise ??= loadCatalog();

        return catalogPromise;
    };

    const createGame = async ({expert = false, playerCount = 1} = {}) => {
        const catalog = await getCatalog();
        const setConfigs = new Map(catalog.sets.map(({_id, config}) =>
            [_id, config]));
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                data: {
                    async getSetConfig(id) {
                        const config = setConfigs.get(id);
                        if (!config) {
                            throw new Error(`Unknown encounter set: ${id}`);
                        }

                        return structuredClone(config);
                    },
                },
            },
            name: 'brotherhood-of-badoon-test',
            autoSave: false,
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_SELECT_TARGET &&
                dialog.data?.cards?.length) {
                return {selected: {id: dialog.data.cards[0].id}};
            }

            const option = dialog.data?.options?.[0];
            return option ? {selected: {id: option.id}} : {};
        };
        const factory = new MatchFactory(match);
        const heroConfig = catalog.heroes.find(({_id}) =>
            _id === 'blackpanther');
        assert.ok(heroConfig);

        for (let index = 0; index < playerCount; index++) {
            const superhero = factory.createSuperhero({
                ...structuredClone(heroConfig.config),
                cards: [],
                nemesis: [],
                precon: [],
            });
            superhero.selectedSide = 1;
            const player = match.createPlayer({
                name: `Player ${index + 1}`,
                initial: index === 0,
                superhero,
            });
            player.initPlayer();
        }

        const scenarioRecord = catalog.scenarios.find(({_id}) =>
            _id === SET);
        assert.ok(scenarioRecord);
        const scenario = await factory.createScenario(
            structuredClone(scenarioRecord.config)
        );
        match.addScenario(scenario);
        await match.initScenario(match.createObligations(), expert);
        await match.resolveSetupDecks();

        return {factory, match, players: match.players, scenario};
    };

    test('loads the normal and expert villain sequences, scheme stages, and required sets', async () => {
        const catalog = await getCatalog();
        const scenario = catalog.scenarios.find(({_id}) => _id === SET);

        assert.deepEqual(
            scenario.config.villains.map(({params}) => params.stage),
            [1, 2]
        );
        assert.deepEqual(
            scenario.config.expertVillains.map(({params}) => params.stage),
            [2, 3]
        );
        assert.deepEqual(
            scenario.config.mainSchemes.map(sides =>
                sides.map(({params}) => params.stage)),
            [[1, 1], [2, 2]]
        );
        assert.deepEqual(scenario.config.sets, ['standard', 'ship-command']);
        assert.deepEqual(scenario.config.defaultSets, ['band-of-badoon']);
    });

    test('Bloqueo orbital adds Hinder threat and lets the initial player exhaust Milano to remove threat', async () => {
        const catalog = await getCatalog();
        const scenarioConfig = catalog.scenarios.find(({_id}) => _id === SET)
            .config;
        const entry = scenarioConfig.cards.find(({card}) =>
            card.params.name === 'Bloqueo orbital');

        assert.ok(entry);
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(entry.card.params.set, SET);
        assert.equal(
            entry.card.params.image,
            `scenarios/${SET}/16066.png`
        );
        assert.equal(entry.card.params.startingThreat, 2);
        assert.deepEqual(entry.card.params.keywords.hinder, [2, true]);
        assert.deepEqual(entry.card.params.icons, {crisis: true});
        assert.equal(entry.card.params.boost, 1);
        assert.equal(
            entry.card.params.abilities[0].type,
            ABILITY_FIRST_PLAYER_ACTION
        );
        const actionConfig = entry.card.params.abilities[0].params;
        assert.equal(actionConfig.arrow.type, EFFECT_EXHAUST);
        assert.equal(actionConfig.arrow.params.target, TARGET_SUPPORT_YOU_CONTROL);
        assert.deepEqual(actionConfig.arrow.params.condition, {set: 'ship-command'});
        assert.equal(actionConfig.effect.type, EFFECT_REMOVE_THREAT);
        assert.equal(actionConfig.effect.params.target, TARGET_THIS);

        const {match, players, scenario} = await createGame({
            playerCount: 2,
        });
        const [initialPlayer, otherPlayer] = players;
        const milano = initialPlayer.supports.find(card =>
            card.name === 'Milano');
        const sideSchemes = scenario.deck.cards.filter(card =>
            card.name === 'Bloqueo orbital');
        assert.equal(sideSchemes.length, 1);
        const [sideScheme] = sideSchemes;

        assert.ok(milano);
        assert.ok(sideScheme);
        assert.equal(sideScheme.hinder, 4);
        await new PutPlayEffect({
            card: sideScheme,
            controller: scenario,
            match,
        }).runEffect({match, player: initialPlayer});
        assert.equal(sideScheme.threat, 6);

        const action = sideScheme.abilities.find(ability =>
            ability instanceof FirstPlayerActionAbility);
        assert.ok(action);
        assert.equal(action.effect.effectType, EFFECT_REMOVE_THREAT);
        assert.equal(typeof action.effect.canRun, 'function');
        assert.equal(await action.canRun({
            card: sideScheme,
            match,
            player: otherPlayer,
        }), false);

        const actionParams = {
            ability: action,
            card: sideScheme,
            match,
            player: initialPlayer,
        };
        const exhaustCost = await action.arrow.getEffect(actionParams);
        assert.deepEqual(exhaustCost.getValidTarget({
            ...actionParams,
            isCost: true,
        }), [milano]);

        await action.resolveAbility(actionParams);

        assert.equal(milano.exhausted, true);
        assert.equal(sideScheme.threat, 3);
    });

    test('Armada opresora adds its starting and Hinder threat and lets the initial player exhaust Milano to remove threat', async () => {
        const catalog = await getCatalog();
        const scenarioConfig = catalog.scenarios.find(({_id}) => _id === SET)
            .config;
        const entry = scenarioConfig.cards.find(({card}) =>
            card.params.name === 'Armada opresora');

        assert.ok(entry);
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(entry.card.params.set, SET);
        assert.equal(
            entry.card.params.image,
            `scenarios/${SET}/16068.png`
        );
        assert.equal(entry.card.params.startingThreat, 1);
        assert.deepEqual(entry.card.params.keywords.hinder, [3, true]);
        assert.deepEqual(entry.card.params.icons, {hazard: 1});
        assert.equal(entry.card.params.boost, 1);
        const [actionConfig] = entry.card.params.abilities;
        assert.equal(actionConfig.type, ABILITY_FIRST_PLAYER_ACTION);
        assert.equal(actionConfig.params.arrow.type, EFFECT_EXHAUST);
        assert.equal(
            actionConfig.params.arrow.params.target,
            TARGET_SUPPORT_YOU_CONTROL
        );
        assert.deepEqual(
            actionConfig.params.arrow.params.condition,
            {set: 'ship-command'}
        );
        assert.equal(actionConfig.params.effect.type, EFFECT_REMOVE_THREAT);
        assert.equal(actionConfig.params.effect.params.threat, 3);
        assert.equal(actionConfig.params.effect.params.target, TARGET_THIS);

        const {match, players, scenario} = await createGame({
            playerCount: 2,
        });
        const [initialPlayer, otherPlayer] = players;
        const milano = initialPlayer.supports.find(card =>
            card.name === 'Milano');
        const sideScheme = scenario.deck.cards.find(card =>
            card.name === 'Armada opresora');

        assert.ok(milano);
        assert.ok(sideScheme);
        assert.equal(sideScheme.hinder, 6);
        await new PutPlayEffect({
            card: sideScheme,
            controller: scenario,
            match,
        }).runEffect({match, player: initialPlayer});
        assert.equal(sideScheme.threat, 7);

        const action = sideScheme.abilities.find(ability =>
            ability instanceof FirstPlayerActionAbility);
        assert.ok(action);
        assert.equal(action.effect.effectType, EFFECT_REMOVE_THREAT);
        assert.equal(typeof action.effect.canRun, 'function');
        assert.equal(await action.canRun({
            card: sideScheme,
            match,
            player: otherPlayer,
        }), false);

        const actionParams = {
            ability: action,
            card: sideScheme,
            match,
            player: initialPlayer,
        };
        const exhaustCost = await action.arrow.getEffect(actionParams);
        assert.deepEqual(exhaustCost.getValidTarget({
            ...actionParams,
            isCost: true,
        }), [milano]);

        await action.resolveAbility(actionParams);

        assert.equal(milano.exhausted, true);
        assert.equal(sideScheme.threat, 4);
    });

    test('Bombardeo responds after villain phase step one and lets the initial player exhaust Milano', async () => {
        const catalog = await getCatalog();
        const scenarioConfig = catalog.scenarios.find(({_id}) => _id === SET)
            .config;
        const entry = scenarioConfig.cards.find(({card}) =>
            card.params.name === 'Bombardeo');

        assert.ok(entry);
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(entry.card.params.set, SET);
        assert.equal(
            entry.card.params.image,
            `scenarios/${SET}/16067.png`
        );
        assert.deepEqual(entry.card.params.startingThreat, [3, true]);
        assert.equal(entry.card.params.boost, 2);
        const [responseConfig, actionConfig] = entry.card.params.abilities;
        assert.equal(responseConfig.type, ABILITY_FORCED_RESPONSE);
        assert.equal(responseConfig.params.trigger, TRIGGER_VILLAIN_PHASE_STEP);
        assert.deepEqual(responseConfig.params.condition, {step: 1});
        assert.equal(
            responseConfig.params.effect.type,
            EFFECT_RESOLVE_SPECIAL_ABILITY
        );
        assert.equal(actionConfig.type, ABILITY_FIRST_PLAYER_ACTION);
        assert.equal(actionConfig.params.arrow.type, EFFECT_EXHAUST);
        assert.equal(
            actionConfig.params.arrow.params.target,
            TARGET_SUPPORT_YOU_CONTROL
        );
        assert.deepEqual(
            actionConfig.params.arrow.params.condition,
            {set: 'ship-command'}
        );
        assert.equal(actionConfig.params.effect.type, EFFECT_REMOVE_THREAT);
        assert.equal(actionConfig.params.effect.params.threat, 3);
        assert.equal(actionConfig.params.effect.params.target, TARGET_THIS);

        const {match, players, scenario} = await createGame({
            playerCount: 2,
        });
        const [initialPlayer, otherPlayer] = players;
        const milano = initialPlayer.supports.find(card =>
            card.name === 'Milano');
        const ship = scenario.gameZone.cards.find(card =>
            card.name === SHIP_NAME);
        const sideScheme = scenario.deck.cards.find(card =>
            card.name === 'Bombardeo');

        assert.ok(milano);
        assert.ok(ship);
        assert.ok(sideScheme);
        assert.equal(sideScheme.boost, 2);
        await new PutPlayEffect({
            card: sideScheme,
            controller: scenario,
            match,
        }).runEffect({match, player: initialPlayer});
        assert.equal(sideScheme.threat, 6);

        const action = sideScheme.abilities.find(ability =>
            ability instanceof FirstPlayerActionAbility);
        assert.ok(action);
        assert.equal(action.effect.effectType, EFFECT_REMOVE_THREAT);
        assert.equal(typeof action.effect.canRun, 'function');
        assert.equal(await action.canRun({
            card: sideScheme,
            match,
            player: otherPlayer,
        }), false);
        const actionParams = {
            ability: action,
            card: sideScheme,
            match,
            player: initialPlayer,
        };
        const exhaustCost = await action.arrow.getEffect(actionParams);
        assert.deepEqual(exhaustCost.getValidTarget({
            ...actionParams,
            isCost: true,
        }), [milano]);
        await action.resolveAbility(actionParams);
        assert.equal(milano.exhausted, true);
        assert.equal(sideScheme.threat, 3);

        const response = sideScheme.abilities.find(ability =>
            ability.abilityType === ABILITY_FORCED_RESPONSE);
        assert.ok(response);
        assert.equal(response.effect.effectType, EFFECT_RESOLVE_SPECIAL_ABILITY);
        assert.equal(await response.canRun({
            card: sideScheme,
            match,
            player: initialPlayer,
            step: 2,
        }), false);
        assert.equal(await response.canRun({
            card: sideScheme,
            match,
            player: initialPlayer,
            step: 1,
        }), true);
        await response.resolveAbility({
            card: sideScheme,
            match,
            player: initialPlayer,
            step: 1,
        });
        assert.equal(ship.counters, 1);
    });

    test('Orientación espacial has per-player starting threat and lets the initial player exhaust Milano to remove threat', async () => {
        const catalog = await getCatalog();
        const scenarioConfig = catalog.scenarios.find(({_id}) => _id === SET)
            .config;
        const entry = scenarioConfig.cards.find(({card}) =>
            card.params.name === 'Orientación espacial');

        assert.ok(entry);
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(entry.card.params.set, SET);
        assert.equal(
            entry.card.params.image,
            `scenarios/${SET}/16069.png`
        );
        assert.deepEqual(entry.card.params.startingThreat, [3, true]);
        assert.deepEqual(entry.card.params.icons, {amplification: 1});
        assert.equal(entry.card.params.boost, 3);

        const [actionConfig] = entry.card.params.abilities;
        assert.equal(actionConfig.type, ABILITY_FIRST_PLAYER_ACTION);
        assert.equal(actionConfig.params.arrow.type, EFFECT_EXHAUST);
        assert.equal(
            actionConfig.params.arrow.params.target,
            TARGET_SUPPORT_YOU_CONTROL
        );
        assert.deepEqual(
            actionConfig.params.arrow.params.condition,
            {set: 'ship-command'}
        );
        assert.equal(actionConfig.params.effect.type, EFFECT_REMOVE_THREAT);
        assert.equal(actionConfig.params.effect.params.threat, 3);
        assert.equal(actionConfig.params.effect.params.target, TARGET_THIS);

        const {match, players, scenario} = await createGame({
            playerCount: 2,
        });
        const [initialPlayer, otherPlayer] = players;
        const milano = initialPlayer.supports.find(card =>
            card.name === 'Milano');
        const sideScheme = scenario.deck.cards.find(card =>
            card.name === 'Orientación espacial');

        assert.ok(milano);
        assert.ok(sideScheme);
        assert.equal(sideScheme.boost, 3);
        await new PutPlayEffect({
            card: sideScheme,
            controller: scenario,
            match,
        }).runEffect({match, player: initialPlayer});
        assert.equal(sideScheme.threat, 6);

        const action = sideScheme.abilities.find(ability =>
            ability instanceof FirstPlayerActionAbility);
        assert.ok(action);
        assert.equal(action.effect.effectType, EFFECT_REMOVE_THREAT);
        assert.equal(typeof action.effect.canRun, 'function');
        assert.equal(await action.canRun({
            card: sideScheme,
            match,
            player: initialPlayer,
        }), true);
        assert.equal(await action.canRun({
            card: sideScheme,
            match,
            player: otherPlayer,
        }), false);

        const actionParams = {
            ability: action,
            card: sideScheme,
            match,
            player: initialPlayer,
        };
        const exhaustCost = await action.arrow.getEffect(actionParams);
        assert.deepEqual(exhaustCost.getValidTarget({
            ...actionParams,
            isCost: true,
        }), [milano]);

        await action.resolveAbility(actionParams);

        assert.equal(milano.exhausted, true);
        assert.equal(sideScheme.threat, 3);
    });

    test('sets up the Badoon ship and Milano and resolves Cannons after four uses', async () => {
        const {match, players, scenario} = await createGame({
            playerCount: 2,
        });
        const ship = scenario.gameZone.cards.find(card =>
            card.name === SHIP_NAME);
        const milano = players.flatMap(player => player.gameZone.cards)
            .find(card => card.name === 'Milano');
        const special = ship?.abilities.find(ability =>
            ability instanceof SpecialAbility);

        assert.ok(ship);
        assert.ok(milano);
        assert.ok(special);
        assert.equal(scenario.villain.stage, 1);
        assert.equal(ship.counters ?? 0, 0);

        await special.resolveAbility({match, player: players[0], card: ship});
        await special.resolveAbility({match, player: players[0], card: ship});
        await special.resolveAbility({match, player: players[0], card: ship});
        assert.equal(ship.counters, 3);
        assert.deepEqual(players.map(({superhero}) => superhero.damage), [0, 0]);

        const resolveCannons = new ResolveSpecialAbilityEffect({
            condition: {name: SHIP_NAME},
            filter: {name: SHIP_NAME},
            match,
            target: TARGET_ENVIRONMENT,
        });
        const dialogs = [];
        let damageAtAnnouncement;
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_REVEAL_CARDS) {
                damageAtAnnouncement = players.map(({superhero}) =>
                    superhero.damage
                );
                return {};
            }
            if (dialog.dialogType === DIALOG_SELECT_TARGET &&
                dialog.data?.cards?.length) {
                return {selected: {id: dialog.data.cards[0].id}};
            }

            const option = dialog.data?.options?.[0];

            return option ? {selected: {id: option.id}} : {};
        };
        await resolveCannons.runEffect({
            card: scenario.villain,
            player: players[0],
        });

        const [announcement] = dialogs.filter(({dialogType}) =>
            dialogType === DIALOG_REVEAL_CARDS);
        assert.ok(announcement);
        assert.equal(announcement.title, 'Cargar los cañones');
        assert.equal(
            announcement.subtitle,
            'La Nave badoon infligirá 2 de Daño indirecto a cada jugador.'
        );
        assert.equal(announcement.showToAll, true);
        assert.strictEqual(announcement.targetPlayer, players[0]);
        assert.deepEqual(
            announcement.data.cards.map(({id}) => id),
            [ship.id]
        );
        assert.equal(announcement.data.cards[0].name, SHIP_NAME);
        assert.ok(announcement.data.cards[0].image);
        assert.equal(
            announcement.data.cards[0].image,
            ship.toObj({player: players[0]}).image
        );
        assert.deepEqual(damageAtAnnouncement, [0, 0]);
        assert.equal(ship.counters, 0);
        assert.deepEqual(players.map(({superhero}) => superhero.damage), [2, 2]);
        const cannonAnnouncementEffect = special.effect.thenEffect.effect
            .effects[0];
        assert.equal(cannonAnnouncementEffect.effectType, EFFECT_SHOW_CARDS);
        assert.equal(
            typeof cannonAnnouncementEffect.canRun,
            'function'
        );

        const mainScheme = scenario.mainScheme;
        const initialPlayerAction = mainScheme.abilities.find(ability =>
            ability instanceof FirstPlayerActionAbility);
        assert.ok(initialPlayerAction);
        assert.equal(mainScheme.threat, 4);
        assert.strictEqual(match.initialPlayer, players[0]);
        assert.strictEqual(milano.controller, players[0]);
        const actionParams = {
            ability: initialPlayerAction,
            card: mainScheme,
            match,
            player: players[0],
        };
        assert.equal(milano.exhausted, false);
        const exhaustCost = await initialPlayerAction.arrow.getEffect(actionParams);
        const validMilanoTargets = exhaustCost.getValidTarget({
            ...actionParams,
            isCost: true,
        });
        assert.deepEqual(validMilanoTargets, [milano]);
        await initialPlayerAction.resolveAbility({
            match,
            player: players[0],
            card: mainScheme,
        });
        assert.equal(initialPlayerAction.resolved, true);
        assert.equal(milano.exhausted, true);
        assert.equal(mainScheme.threat, 1);
    });

    test('Badoon Engineer resolves Cannons after engagement, activation, and as a boost', async () => {
        const catalog = await getCatalog();
        const scenarioConfig = catalog.scenarios.find(({_id}) => _id === SET)
            .config;
        const engineerEntry = scenarioConfig.cards.find(({card}) =>
            card.params.name === 'Ingeniero badoon');
        assert.ok(engineerEntry);
        assert.equal(engineerEntry.count, 2);
        assert.equal(engineerEntry.card.type, CARD_TYPE_MINION);
        assert.equal(
            engineerEntry.card.params.image,
            `scenarios/${SET}/16065.png`
        );
        assert.deepEqual(engineerEntry.card.params.traits, [TRAIT_BADOON]);
        assert.equal(engineerEntry.card.params.set, SET);
        assert.deepEqual(
            [
                engineerEntry.card.params.attack,
                engineerEntry.card.params.scheme,
                engineerEntry.card.params.hitPoints,
                engineerEntry.card.params.boost,
            ],
            [1, 2, 3, 0]
        );
        assert.deepEqual(
            engineerEntry.card.params.abilities[0].params.trigger,
            [TRIGGER_ENGAGE_PLAYER, TRIGGER_THIS_ACTIVATES]
        );
        assert.deepEqual(
            engineerEntry.card.params.abilities[0].params.triggerParams,
            {referentialName: 'Ingeniero badoon'}
        );
        assert.equal(
            engineerEntry.card.params.boostAbility.type,
            ABILITY_BOOST
        );

        const {match, players, scenario} = await createGame();
        const [player] = players;
        match.openDialog = async ({data}) => {
            const card = data?.cards?.[0];
            if (card) {
                return {selected: {id: card.id}};
            }

            const option = data?.options?.[0];

            return option ? {selected: {id: option.id}} : {};
        };
        const engineer = scenario.deck.cards.find(card =>
            card.name === 'Ingeniero badoon');
        const ship = scenario.gameZone.cards.find(card =>
            card.name === SHIP_NAME);
        assert.ok(engineer);
        assert.ok(ship);
        assert.equal(typeof engineer.abilities[0].effect.canRun, 'function');
        assert.equal(
            engineer.abilities[0].effect.effectType,
            EFFECT_RESOLVE_SPECIAL_ABILITY
        );

        const engage = new EngageEffect({
            card: engineer,
            controller: scenario,
            match,
            selectedTarget: player,
            target: TARGET_YOU,
        });
        await engage.runEffect({match, player});
        assert.equal(ship.counters, 1);

        const activation = new EnemySchemeEffect({
            enemy: engineer,
            giveBoost: false,
            match,
            player,
            target: TARGET_MAIN_SCHEME,
        });
        await activation.runEffect({match, player});
        assert.equal(ship.counters, 2);

        const boost = new ResolveBoostEffect({
            card: engineer,
            enemyActivation: {boostCards: [engineer]},
            match,
        });
        await boost.runEffect({match, player});
        assert.equal(boost.resolved, true);
        assert.equal(ship.counters, 3);
    });

    test('only the Badoon Engineer that engages resolves its Forced Response', async () => {
        const {match, players, scenario} = await createGame();
        const [player] = players;
        match.openDialog = async ({data}) => {
            const card = data?.cards?.[0];
            if (card) {
                return {selected: {id: card.id}};
            }

            const option = data?.options?.[0];

            return option ? {selected: {id: option.id}} : {};
        };
        const engineers = scenario.deck.cards.filter(card =>
            card.name === 'Ingeniero badoon');
        const ship = scenario.gameZone.cards.find(card =>
            card.name === SHIP_NAME);

        assert.equal(engineers.length, 2);
        assert.ok(ship);
        assert.notEqual(engineers[0].id, engineers[1].id);

        for (const [index, engineer] of engineers.entries()) {
            const engage = new EngageEffect({
                card: engineer,
                controller: scenario,
                match,
                selectedTarget: player,
                target: TARGET_YOU,
            });
            await engage.runEffect({match, player});

            if (index === 0) {
                assert.deepEqual(engineer.abilities[0].triggerParams, {
                    referentialName: 'Ingeniero badoon',
                });
                const firstEngineerEngageTrigger = Object.values(
                    engineer.triggers[TRIGGER_ENGAGE_PLAYER]
                ).flat().find(trigger =>
                    trigger.ability === engineer.abilities[0]);
                assert.ok(firstEngineerEngageTrigger);
                assert.equal(
                    firstEngineerEngageTrigger.referentialName,
                    'Ingeniero badoon'
                );
                assert.equal(
                    await firstEngineerEngageTrigger.canTrigger({
                        card: engineers[1],
                        effect: {selectedTarget: player},
                        match,
                        player,
                    }),
                    false
                );
            }

            assert.equal(ship.counters, index + 1);
        }
    });

    test('offers the Milano action again when threat returns after it readies', async () => {
        const {match, players, scenario} = await createGame();
        const [player] = players;
        const mainScheme = scenario.mainScheme;
        const action = mainScheme.abilities.find(ability =>
            ability instanceof FirstPlayerActionAbility);
        const milano = player.gameZone.cards.find(card =>
            card.name === 'Milano');
        const getActionAvailability = async () => {
            const abilities = await getAbilitiesWithAvailability(
                mainScheme,
                player
            );

            return abilities.find(ability =>
                ability.name === action.name);
        };

        assert.ok(action);
        assert.ok(milano);
        assert.equal((await getActionAvailability()).disable, false);

        await action.resolveAbility({
            match,
            player,
            card: mainScheme,
        });

        assert.equal(milano.exhausted, true);
        assert.equal((await getActionAvailability()).disable, true);

        await player.readyAllCards();

        assert.equal(milano.exhausted, false);
        assert.strictEqual(milano.controller, player);
        assert.equal((await getActionAvailability()).disable, true);

        mainScheme.placeThreat(1);

        assert.equal((await getActionAvailability()).disable, false);
        const snapshot = await match.toObjWithPlayableHands();
        const actionSnapshot = snapshot.scenario.mainScheme.abilities.find(
            ability => ability.name === action.name
        );
        assert.equal(actionSnapshot.disable, false);
    });

    test('Drang II searches for the Spear, grants Stalwart, and stores later boosts facedown', async () => {
        const {match, players, scenario} = await createGame();
        const drangTwo = scenario.villains.find(card => card.stage === 2);
        assert.ok(drangTwo);
        scenario.gameZone.addVillain(drangTwo);
        const drang = scenario.villain;
        const whenRevealed = drangTwo?.abilities.find(ability =>
            ability.isWhenRevealed);

        assert.strictEqual(drang, drangTwo);
        assert.ok(whenRevealed);
        drang.stunned = 1;
        drang.confused = 1;

        await whenRevealed.resolveAbility({
            match,
            player: players[0],
            card: drangTwo,
        });

        const spear = drang.attached.find(card =>
            card.name === SPEAR_NAME);
        assert.ok(spear);
        assert.strictEqual(spear.attachedTo, drang);
        assert.equal(drang.attack, 4);
        assert.equal(drang.statusAvailable, STATUS_STALWART);
        assert.equal(drang.stunned, 0);
        assert.equal(drang.confused, 0);
        const stun = new StunEffect({match, target: TARGET_VILLAIN});
        const confuse = new ConfuseEffect({match, target: TARGET_VILLAIN});
        assert.ok(!await stun.canRun({player: players[0]}));
        assert.ok(!await confuse.canRun({player: players[0]}));
        assert.equal(drang.stunned, 0);
        assert.equal(drang.confused, 0);

        drang.setTough();
        const replaceStatus = new ReplaceStatusEffect({
            match,
            statuses: [STATUS_STUNNED, STATUS_CONFUSED, STATUS_TOUGH],
            target: TARGET_VILLAIN,
        });
        assert.ok(!await replaceStatus.canRun({player: players[0]}));
        assert.equal(drang.tough, 1);
        assert.equal(scenario.deck.cards.includes(spear), false);

        await whenRevealed.resolveAbility({
            match,
            player: players[0],
            card: drangTwo,
        });

        assert.equal(drang.faceDown.length, 1);
        assert.equal(drang.faceDown[0].isFutureBoost, true);
        assert.equal(
            whenRevealed.effect.effect.effectType,
            EFFECT_STORE_BOOST
        );

        await spear.discard();
        assert.notEqual(drang.statusAvailable, STATUS_STALWART);
        const stunAfterSpear = new StunEffect({
            match,
            target: TARGET_VILLAIN,
        });
        assert.equal(
            await stunAfterSpear.canRun({player: players[0]}),
            true
        );
        await stunAfterSpear.runEffect({player: players[0]});
        assert.equal(drang.stunned, 1);
    });

    test('Drang III resolves discarded minions in order against the least-engaged player', async () => {
        const {match, players, scenario} = await createGame({
            expert: true,
            playerCount: 2,
        });
        const drangThree = scenario.expertVillains.find(card =>
            card.stage === 3);
        const whenRevealed = drangThree?.abilities.find(ability =>
            ability.isWhenRevealed);
        const minions = scenario.deck.cards.filter(card =>
            card.name === 'Centinela badoon').slice(0, 2);
        const nonMinions = scenario.deck.cards.filter(card =>
            !card.isMinion && !card.setupKeyword).slice(0, 2);
        const filler = scenario.deck.cards.find(card =>
            !minions.includes(card) && !nonMinions.includes(card));

        assert.ok(whenRevealed);
        assert.equal(minions.length, 2);
        assert.equal(nonMinions.length, 2);
        assert.ok(filler);
        scenario.deck.cards = [
            minions[0],
            nonMinions[0],
            minions[1],
            nonMinions[1],
            filler,
        ];

        await whenRevealed.resolveAbility({
            match,
            player: players[0],
            card: drangThree,
        });

        assert.deepEqual(
            players.map(player =>
                player.gameZone.minions.map(({name}) => name)),
            [['Centinela badoon'], ['Centinela badoon']]
        );
        const discard = scenario.deck.discardPile;
        assert.ok(discard.length >= 2);
    });

    test('Drang responses and the main scheme resolve the named Special ability', async () => {
        const catalog = await getCatalog();
        const scenario = catalog.scenarios.find(({_id}) => _id === SET);
        const drangOne = scenario.config.villains[0].params;
        const drangTwo = scenario.config.villains[1].params;
        const drangThree = scenario.config.expertVillains[1].params;
        const schemeOneB = scenario.config.mainSchemes[0][1].params;
        const schemeTwoA = scenario.config.mainSchemes[1][0].params;
        const schemeTwoB = scenario.config.mainSchemes[1][1].params;
        const getCannons = params => params.abilities.find(ability =>
            ability.params.effect?.type === EFFECT_RESOLVE_SPECIAL_ABILITY ||
            ability.params.effect?.params?.effects?.some(effect =>
                effect.type === EFFECT_RESOLVE_SPECIAL_ABILITY));

        assert.ok(getCannons(drangOne));
        assert.ok(getCannons(drangTwo));
        assert.ok(getCannons(drangThree));
        assert.ok(getCannons(schemeOneB));
        assert.ok(getCannons(schemeTwoA));
        assert.ok(getCannons(schemeTwoB));
        assert.equal(
            getCannons(drangOne).params.trigger,
            TRIGGER_THIS_SCHEME
        );
        assert.equal(
            getCannons(drangTwo).params.trigger,
            TRIGGER_THIS_SCHEME
        );
        assert.equal(
            getCannons(drangThree).params.trigger,
            TRIGGER_THIS_ACTIVATES
        );
        assert.equal(
            getCannons(schemeOneB).params.trigger,
            TRIGGER_VILLAIN_PHASE_STEP
        );
        assert.equal(
            getCannons(schemeTwoB).params.trigger,
            TRIGGER_VILLAIN_PHASE_STEP
        );
        const cannonAbility = scenario.config.cards[0].card.params.abilities[0];
        assert.equal(cannonAbility.type, ABILITY_SPECIAL);
        assert.equal(cannonAbility.params.name, 'Cargar los cañones');
        assert.equal(
            cannonAbility.params.effect.type,
            EFFECT_PLACE_COUNTERS
        );
        const conditional = cannonAbility.params.effect.params.thenEffect.params;
        const cannonResolution = conditional.effect;
        assert.equal(cannonResolution.type, EFFECT_CHAINED);
        const announcement = cannonResolution.params.effects[0];
        assert.equal(announcement.type, EFFECT_SHOW_CARDS);
        assert.equal(announcement.params.target, TARGET_THIS);
        assert.equal(announcement.params.title, 'Cargar los cañones');
        const simultaneous = cannonResolution.params.effects[1];
        assert.equal(simultaneous.type, EFFECT_SIMULTANEOUS);
        assert.equal(
            simultaneous.params.effects[0].params.effect.type,
            EFFECT_ASSIGN_DAMAGE
        );
        assert.equal(
            simultaneous.params.effects[1].type,
            EFFECT_REMOVE_COUNTER
        );
        assert.deepEqual(
            simultaneous.params.effects[1].params.paramsCalc,
            {formula: CALC_COUNTERS, target: 'effect.ability.card'}
        );
        assert.deepEqual(
            scenario.config.cards[1].card.params.attach,
            {
                target: TARGET_CONDITION_CARD,
                condition: {name: 'Drang'},
            }
        );
        assert.equal(
            scenario.config.expertVillains[1].params.abilities[0]
                .params.effect.params.effects[0].type,
            EFFECT_DISCARD_FROM_DECK
        );
        assert.equal(
            scenario.config.expertVillains[1].params.abilities[0]
                .params.effect.params.effects[1].params.effectDefinition.type,
            EFFECT_ENGAGE
        );
        assert.equal(
            scenario.config.expertVillains[1].params.abilities[0]
                .params.effect.params.effects[1].params.effectDefinition.params.target,
            TARGET_PLAYER_FEWEST_MINIONS
        );
    });
});
