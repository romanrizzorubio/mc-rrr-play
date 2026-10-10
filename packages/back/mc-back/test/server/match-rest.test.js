import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {Match} from '../../src/model/match/match.js';
import {MatchRest} from '../../src/server/rest/match-rest.js';

describe('MatchRest.getMatchesList', () => {
    test('includes each player hero and selected aspect', () => {
        const match = {
            name: 'match-with-aspect',
            initialized: true,
            initializing: false,
            playing: true,
            scenario: {name: 'Escenario'},
            players: [{
                name: 'Player',
                superhero: {mainName: 'Spider-Man'},
                config: {aspect: 'justice'},
            }],
        };
        const matchRest = new MatchRest({
            mc: {
                matches: {
                    [match.name]: match,
                },
            },
        });
        assert.deepEqual(matchRest.getMatchesList(), [{
            name: match.name,
            initialized: true,
            initializing: false,
            playing: true,
            scenario: 'Escenario',
            players: [{
                name: 'Player',
                hero: 'Spider-Man',
                aspect: 'justice',
            }],
        }]);
    });
});

describe('MatchRest.initMatch', () => {
    test('persists the expert option without creating a nested match snapshot', async () => {
        const match = new Match({name: 'compact-creation-config'});
        match.creationConfig.players.push({
            name: 'Player',
            initial: true,
            config: {sides: [], cards: [], precon: []},
        });
        match.creationConfig.scenario = {
            name: 'Scenario',
            villains: [],
            mainSchemes: [],
            cards: [],
        };
        match.initMatch = async expert => {
            match.initialized = true;
            match.expert = expert;
        };
        match.toObjWithPlayableHands = async () => ({name: match.name});

        const result = await new MatchRest({mc: {}}).initMatch({
            match,
            expert: true,
        });

        assert.deepEqual(result, {name: match.name});
        assert.equal(match.creationConfig.expert, true);
        assert.equal(Object.hasOwn(match, 'creationSnapshot'), false);
    });
});
