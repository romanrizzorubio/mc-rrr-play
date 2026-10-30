import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {ScenarioRest} from '../../src/server/rest/scenario-rest.js';
import {AddAccelerationTokenEffect} from '../../src/effects/add-acceleration-token-effect.js';
import {MATCH_END_REASON_VILLAIN_DEFEATED} from 'mc-shared';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import hulk from '../../../mc-data/seed/catalog/heroes/hulk.js';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import temporal from '../../../mc-data/seed/catalog/sets/temporal.js';

const kangConfig = structuredClone(kang.config);

describe('Kang scenario', () => {
test('Kang catalog creates all printed villain and main-scheme stages', async () => {
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
        name: 'kang-catalog-test',
    });
    const scenario = await new MatchFactory(match).createScenario(kang.config);

    assert.deepEqual(kang.config.sets, ['standard']);
    assert.deepEqual(kang.config.defaultSets, ['temporal']);
    assert.equal(scenario.allVillains.length, 12);
    assert.deepEqual(
        scenario.allVillains.map(villain => villain.stage).sort(),
        [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3]
    );
    assert.equal(scenario.allMainSchemes.length, 7);
    assert.equal(scenario.excludeObligations, undefined);
    assert.ok(scenario.allVillains
        .filter(villain => villain.stage === 3)
        .every(villain => villain.card.final !== true));
    assert.equal(scenario.apart.length, 4);
    assert.ok(scenario.apart.every(card => card.name === 'El dominio de Kang'));

    const stageThreeSides = scenario.allMainSchemes
        .flatMap(scheme => scheme.sides)
        .filter(side => side.stage === 3);
    assert.equal(stageThreeSides.length, 8);
    assert.ok(stageThreeSides
        .filter(side => side.isMainScheme && side.final === false)
        .every(side => side.value === 9));
    assert.ok(stageThreeSides
        .filter(side => side.isMainScheme && side.final === false)
        .every(side => !Array.isArray(side.value)));
});

test('Temporal can be omitted from Kang as an optional modular set', async () => {
    const mc = {
        mcSocket: {send() {}},
        data: {
            async getScenarioConfig() {
                return structuredClone(kangConfig);
            },
            async getSetConfig(id) {
                return id === 'standard' ? standard.config : temporal.config;
            },
        },
    };
    const match = new Match({mc, name: 'kang-optional-temporal-test'});
    const scenarioRest = new ScenarioRest({mc});

    await scenarioRest.createScenario({
        match,
        scenario: 'kang',
        modularSets: [],
    });

    assert.deepEqual(kangConfig.sets, ['standard']);
    assert.deepEqual(kangConfig.defaultSets, ['temporal']);
    assert.deepEqual(
        match.scenario.sets.map(({name}) => name),
        [standard.config.name]
    );
    assert.deepEqual(match.creationConfig.scenario.defaultSets, []);
});

test('Kang setup excludes player Obligations and selects the stage I Villain', async () => {
    const setConfigs = new Map([
        ['standard', standard.config],
        ['temporal', temporal.config],
    ]);
    const match = new Match({
        mc: {
            mcSocket: {send() {}},
            dialog: {async openDialog() {return {};}},
            data: {
                async getSetConfig(id) {
                    return setConfigs.get(id);
                },
            },
        },
        name: 'kang-setup-test',
    });
    const factory = new MatchFactory(match);
    const superhero = factory.createSuperhero(blackPanther.config);
    match.createPlayer({name: 'Jugador 1', superhero, initial: true});
    const scenario = await factory.createScenario(kang.config);
    match.addScenario(scenario);

    await scenario.initScenario(match.createObligations(), false);

    assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 1);
    assert.equal(scenario.gameZone.currentVillain.stage, 1);
    assert.equal(scenario.gameZone.currentVillain.name, 'Kang (El Conquistador)');
    assert.equal(scenario.deck.cards.some(card => card.isObligation), false);
});

test('stage II setup splits players into distinct zones with local villains', async () => {
    const setConfigs = new Map([
        ['standard', standard.config],
        ['temporal', temporal.config],
    ]);
    const match = new Match({
        mc: {
            mcSocket: {send() {}},
            dialog: {async openDialog() {return {};}},
            data: {
                async getSetConfig(id) {
                    return setConfigs.get(id);
                },
            },
        },
        name: 'kang-split-setup-test',
    });
    match.openDialog = async () => ({});
    match.refresh = async () => {};
    const factory = new MatchFactory(match);
    for (let index = 0; index < 2; index++) {
        const superhero = factory.createSuperhero(blackPanther.config);
        const player = match.createPlayer({
            name: `Jugador ${index + 1}`,
            superhero,
            initial: index === 0,
        });
        player.gameZone = new PlayerZone({owner: player});
    }

    const scenario = await factory.createScenario(kang.config);
    match.addScenario(scenario);
    await scenario.initScenario(match.createObligations(), false);
    await scenario.advanceMainScheme(
        scenario.gameZone,
        2,
        match.initialPlayer
    );

    const splitZones = scenario.zones.filter(zone =>
        zone.currentScheme?.currentSide?.stage === 3);
    assert.equal(splitZones.length, 2);
    assert.equal(new Set(match.players.map(player =>
        player.scenarioZone)).size, 2);
    assert.ok(splitZones.every(zone => zone.currentVillain.stage === 2));
    assert.ok(match.players.every(player =>
        player.gameZone.encounters.length === 1));
    assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 2);

    const isolatedMainScheme = splitZones[0].currentScheme.currentSide;
    const centralMainScheme = scenario.gameZone.currentScheme.currentSide;
    const addAccelerationTokens = new AddAccelerationTokenEffect({
        count: 2,
        selectedTarget: isolatedMainScheme,
        match,
    });
    const openDialog = match.openDialog;
    match.openDialog = async dialog => ({
        selected: dialog.data.cards[0],
    });
    try {
        await addAccelerationTokens.runEffect({player: match.initialPlayer});
    } finally {
        match.openDialog = openDialog;
    }

    assert.equal(isolatedMainScheme.accelerationTokens, 0);
    assert.equal(centralMainScheme.accelerationTokens, 2);

    const finalVillain = scenario.findVillain({
        name: 'Kang (El Conquistador)',
        stage: 3,
    });
    const finishReasons = [];
    scenario.gameZone.addVillain(finalVillain);
    match.finishGame = async reason => finishReasons.push(reason);
    await scenario.selectVillain(match.initialPlayer, finalVillain);

    assert.deepEqual(finishReasons, [MATCH_END_REASON_VILLAIN_DEFEATED]);
});

test('stage III completion searches and stores an aside card under unused stage IV', async () => {
    const setConfigs = new Map([
        ['standard', standard.config],
        ['temporal', temporal.config],
    ]);
    const match = new Match({
        mc: {
            mcSocket: {send() {}},
            dialog: {async openDialog() {return {};}},
            data: {
                async getSetConfig(id) {
                    return setConfigs.get(id);
                },
            },
        },
        name: 'kang-stage-three-completion-test',
    });
    match.openDialog = async dialog => ({
        selected: dialog.data?.cards?.[0],
    });
    match.refresh = async () => {};
    const factory = new MatchFactory(match);
    const players = [
        match.createPlayer({
            name: 'Pantera Negra',
            superhero: factory.createSuperhero(blackPanther.config),
            initial: true,
        }),
        match.createPlayer({
            name: 'Hulk',
            superhero: factory.createSuperhero(hulk.config),
        }),
    ];
    players.forEach(player => {
        player.gameZone = new PlayerZone({owner: player});
    });

    const scenario = await factory.createScenario(kang.config);
    match.addScenario(scenario);
    await scenario.initScenario(match.createObligations(), false);
    await scenario.advanceMainScheme(
        scenario.gameZone,
        2,
        players[0]
    );

    const splitZone = scenario.zones.find(zone =>
        zone.currentScheme?.currentSide.stage === 3);
    const stageFour = scenario.findMainScheme(4);
    const asideCard = scenario.apart.find(card =>
        card.name === 'El dominio de Kang');
    splitZone.currentScheme.currentSide.threat = 9;
    await scenario.completeMainScheme(
        splitZone.currentScheme.currentSide,
        {player: splitZone.players[0]}
    );

    assert.equal(stageFour.faceDown.length, 1);
    assert.strictEqual(stageFour.faceDown[0].card, asideCard);
    assert.equal(scenario.apart.filter(card =>
        card.name === 'El dominio de Kang').length, 3);
});

test('stage IV reveals facedown Kang plans and engages each player nemesis minion', async () => {
    const setConfigs = new Map([
        ['standard', standard.config],
        ['temporal', temporal.config],
    ]);
    const match = new Match({
        mc: {
            mcSocket: {send() {}},
            dialog: {async openDialog() {return {};}},
            data: {
                async getSetConfig(id) {
                    return setConfigs.get(id);
                },
            },
        },
        name: 'kang-stage-four-test',
    });
    match.openDialog = async () => ({});
    match.refresh = async () => {};
    const factory = new MatchFactory(match);
    const players = [
        match.createPlayer({
            name: 'Pantera Negra',
            superhero: factory.createSuperhero(blackPanther.config),
            initial: true,
        }),
        match.createPlayer({
            name: 'Hulk',
            superhero: factory.createSuperhero(hulk.config),
        }),
    ];
    players.forEach(player => {
        player.gameZone = new PlayerZone({owner: player});
    });

    const scenario = await factory.createScenario(kang.config);
    match.addScenario(scenario);
    await scenario.initScenario(match.createObligations(), false);
    match.initNemesis();

    const [blackPantherMinion, hulkMinion] = players.map(player =>
        player.superhero.nemesis.find(card =>
            card.isMinion && card.isNemesis));
    const stageFour = scenario.findMainScheme(4);
    const facedownPlanIndex = scenario.apart.findIndex(card =>
        card.name === 'El dominio de Kang');
    assert.ok(facedownPlanIndex >= 0);
    const facedownPlan = scenario.apart.splice(facedownPlanIndex, 1)[0];
    stageFour.addFaceDown(facedownPlan);

    await scenario.advanceMainScheme(
        scenario.gameZone,
        4,
        players[0],
        stageFour
    );

    assert.equal(stageFour.faceDown.length, 0);
    assert.ok(scenario.gameZone.sideSchemes.includes(facedownPlan));
    assert.equal(scenario.gameZone.currentVillain.stage, 3);

    assert.equal(blackPantherMinion.name, 'Killmonger');
    assert.equal(hulkMinion.name, 'Abominación');
    assert.strictEqual(blackPantherMinion.engaged, players[0]);
    assert.strictEqual(hulkMinion.engaged, players[1]);
    assert.ok(players.every(player =>
        !player.superhero.nemesis.some(card =>
            card.isMinion && card.isNemesis)));
});
});
