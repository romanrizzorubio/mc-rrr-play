import assert from 'node:assert/strict';
import test from 'node:test';

import {CALC_COUNT} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {DrawEffect} from '../../src/effects/draw-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

test('Superioridad numérica counts the allies selected for its arrow cost', async () => {
    const catalog = await loadCatalog();
    const entry = catalog.aspects.find(({_id}) =>
        _id === 'leadership-superioridad-numerica');
    assert.ok(entry);

    const matchFactory = new MatchFactory({triggerCards: {}});
    const cardsFactory = matchFactory.cardsFactory;
    const card = cardsFactory.createGameCard({
        card: cardsFactory.createCard(entry.card),
        owner: {},
    });
    const [ability] = card.abilities;
    const drawEffect = ability.effect;

    assert.ok(drawEffect instanceof DrawEffect);
    assert.deepEqual(drawEffect.paramsCalc, {
        target: 'effect.ability.arrow.cost.selectedTarget',
        formula: CALC_COUNT,
    });

    ability.arrow.cost.selectedTarget = [{id: 'ally-1'}, {id: 'ally-2'}];

    assert.equal(drawEffect.calculate({player: {}}), 2);
});
