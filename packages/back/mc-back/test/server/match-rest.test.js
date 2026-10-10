import assert from 'node:assert/strict';
import {test} from 'node:test';

import {MatchRest} from '../../src/server/rest/match-rest.js';

test('getMatchesList includes each player hero and selected aspect', () => {
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
