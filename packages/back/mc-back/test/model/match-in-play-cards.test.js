import assert from 'node:assert/strict';
import {test} from 'node:test';

import {CALC_TRAITS_COUNT, TRAIT_ASGARD} from 'mc-shared';
import {Calc} from '../../src/engine/calc.js';
import {Match} from '../../src/model/match/match.js';

test('match.inPlayCards includes game cards and attached cards exactly once', () => {
    const attachedUpgrade = {
        id: 'mjolnir',
        traits: [TRAIT_ASGARD],
        attached: [],
    };
    const villain = {
        id: 'villain',
        traits: [TRAIT_ASGARD],
        attached: [],
    };
    const mainScheme = {
        id: 'main-scheme',
        traits: [],
        attached: [],
    };
    const superhero = {
        id: 'thor',
        traits: [TRAIT_ASGARD],
        attached: [attachedUpgrade],
    };
    const support = {
        id: 'asgard',
        traits: [TRAIT_ASGARD],
        attached: [],
    };
    const minion = {
        id: 'minion',
        traits: [TRAIT_ASGARD],
        attached: [],
    };
    const match = new Match({mc: {}, name: 'asgard-cards'});

    match.scenario = {
        villain,
        mainScheme,
        gameZone: {
            inPlayCards: [villain, mainScheme],
        },
    };
    match.players = [{
        superhero,
        gameZone: {
            inPlayCards: [superhero, support],
        },
        minions: [minion],
    }];

    const inPlayCards = match.inPlayCards;
    const asgardCount = new Calc({
        formula: CALC_TRAITS_COUNT,
        target: 'match.inPlayCards',
        trait: TRAIT_ASGARD,
    });

    assert.equal(new Set(inPlayCards).size, inPlayCards.length);
    assert.ok(inPlayCards.includes(attachedUpgrade));
    assert.equal(asgardCount.calculate({match}), 5);
});
