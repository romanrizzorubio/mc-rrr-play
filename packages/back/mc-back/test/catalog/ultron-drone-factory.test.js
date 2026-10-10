import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_WHEN_REVEALED,
    CALC_TRAITS_COUNT,
    EFFECT_PLACE_THREAT,
    TRAIT_DRONE,
} from 'mc-shared';
import {Calc} from '../../src/engine/calc.js';
import ultron from '../../../mc-data/seed/catalog/scenarios/ultron.js';

test('Fábrica de drones counts drones in the match when revealed', () => {
    const factory = ultron.config.cards.find(({card}) =>
        card.params.name === 'Fábrica de drones').card;
    const whenRevealed = factory.params.abilities.find(({type}) =>
        type === ABILITY_WHEN_REVEALED);
    const placeThreat = whenRevealed.params.effect.params.effects.find(({type}) =>
        type === EFFECT_PLACE_THREAT);
    const paramsCalc = placeThreat.params.paramsCalc;
    const drones = [
        {traits: [TRAIT_DRONE]},
        {traits: []},
        {traits: [TRAIT_DRONE]},
    ];

    assert.equal(paramsCalc.formula, CALC_TRAITS_COUNT);
    assert.equal(paramsCalc.target, 'player.match.minions');
    assert.equal(new Calc(paramsCalc).calculate({
        player: {
            match: {
                minions: drones,
            },
        },
    }), 2);
});
