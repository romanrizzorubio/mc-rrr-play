import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Match} from '../../src/model/match/match.js';
import {ScenarioRest} from '../../src/server/rest/scenario-rest.js';

const scenarioConfig = {
    name: 'Rhino',
    villains: [],
    mainSchemes: [],
    cards: [],
    sets: ['standard', 'legions-of-hydra'],
    defaultSets: ['bomb-scare'],
};

const setConfigs = {
    standard: {name: 'standard', standard: true, cards: []},
    'bomb-scare': {name: 'Amenaza de bomba', standard: false, cards: []},
    'legions-of-hydra': {name: 'Legiones de Hydra', standard: false, cards: []},
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

test('createScenario applies the selected modular sets and retains standard sets', async () => {
    const {match, scenarioRest} = createScenarioRest();

    await scenarioRest.createScenario({
        match,
        scenario: 'rhino',
        modularSets: ['the-doomsday-chair'],
    });

    assert.deepEqual(
        match.scenario.sets.map(({name}) => name),
        ['standard', 'La Silla del Juicio Final']
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
        ['standard', 'Legiones de Hydra', 'Amenaza de bomba']
    );
});

test('createScenario allows removing all optional modular sets', async () => {
    const {match, scenarioRest} = createScenarioRest();

    await scenarioRest.createScenario({
        match,
        scenario: 'rhino',
        modularSets: [],
    });

    assert.deepEqual(
        match.scenario.sets.map(({name}) => name),
        ['standard']
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
