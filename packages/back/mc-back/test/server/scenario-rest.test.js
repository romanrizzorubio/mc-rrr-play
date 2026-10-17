import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Match} from '../../src/model/match/match.js';
import {ScenarioRest} from '../../src/server/rest/scenario-rest.js';

const scenarioConfig = {
    name: 'Rhino',
    villains: [],
    mainSchemes: [],
    cards: [],
    sets: ['standard', 'experimental-weapons'],
    defaultSets: ['legions-of-hydra', 'bomb-scare'],
};

const setConfigs = {
    standard: {name: 'standard', standard: true, cards: []},
    'bomb-scare': {name: 'Amenaza de bomba', standard: false, cards: []},
    'legions-of-hydra': {name: 'Legiones de Hydra', standard: false, cards: []},
    'experimental-weapons': {name: 'Armas experimentales', standard: false, cards: []},
    'the-doomsday-chair': {
        name: 'La Silla del Juicio Final',
        standard: false,
        cards: [],
    },
};

const createScenarioRest = () => {
    const mc = {
        data: {
            getScenarioConfig: async () => structuredClone(scenarioConfig),
            getSetConfig: async id => {
                if (!setConfigs[id]) {
                    throw new Error(`No set config found for "${id}"`);
                }
                return setConfigs[id];
            },
        },
    };
    const match = new Match({name: 'scenario-rest-test', mc});

    return {
        match,
        scenarioRest: new ScenarioRest({mc}),
    };
};

test('createScenario applies optional modular sets and retains required sets', async () => {
    const {match, scenarioRest} = createScenarioRest();

    await scenarioRest.createScenario({
        match,
        scenario: 'rhino',
        modularSets: ['the-doomsday-chair'],
    });

    assert.deepEqual(
        match.scenario.sets.map(({name}) => name),
        ['standard', 'Armas experimentales', 'La Silla del Juicio Final']
    );
    assert.deepEqual(
        match.creationConfig.scenario.sets,
        ['standard', 'experimental-weapons']
    );
    assert.deepEqual(
        match.creationConfig.scenario.defaultSets,
        ['the-doomsday-chair']
    );
});

test('createScenario defaults to the modular sets configured by the scenario', async () => {
    const {match, scenarioRest} = createScenarioRest();

    await scenarioRest.createScenario({
        match,
        scenario: 'rhino',
    });

    assert.deepEqual(
        match.scenario.sets.map(({name}) => name),
        ['standard', 'Armas experimentales', 'Legiones de Hydra', 'Amenaza de bomba']
    );
});

test('createScenario removes optional modular sets without removing required sets', async () => {
    const {match, scenarioRest} = createScenarioRest();

    await scenarioRest.createScenario({
        match,
        scenario: 'rhino',
        modularSets: [],
    });

    assert.deepEqual(
        match.scenario.sets.map(({name}) => name),
        ['standard', 'Armas experimentales']
    );
});

test('createScenario rejects a standard set submitted as a modular selection', async () => {
    const {match, scenarioRest} = createScenarioRest();

    await assert.rejects(
        scenarioRest.createScenario({
            match,
            scenario: 'rhino',
            modularSets: ['standard'],
        }),
        /no es un conjunto modular/
    );
});
