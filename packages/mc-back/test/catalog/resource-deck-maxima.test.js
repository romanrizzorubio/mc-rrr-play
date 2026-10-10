import assert from 'node:assert/strict';
import {test} from 'node:test';

import {PLACE_DECK, TARGET_DECK, TARGET_PLAYER} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';

test('card maximums identify their limiting target', async () => {
    const catalog = await loadCatalog();
    assert.equal(TARGET_DECK, PLACE_DECK);
    const expectedMaximums = new Map([
        ['basic-energy', {count: 1, target: TARGET_DECK}],
        ['basic-genius', {count: 1, target: TARGET_DECK}],
        ['basic-strength', {count: 1, target: TARGET_DECK}],
        ['aggression-the-power-of-aggression', {count: 2, target: TARGET_DECK}],
        ['justice-the-power-of-justice', {count: 2, target: TARGET_DECK}],
        ['leadership-el-poder-del-liderazgo', {count: 2, target: TARGET_DECK}],
        ['protection-el-poder-de-la-proteccion', {count: 2, target: TARGET_DECK}],
        ['basic-avengers-mansion', {count: 1, target: TARGET_PLAYER}],
        ['basic-helicarrier', {count: 1, target: TARGET_PLAYER}],
        ['aggression-entrenamiento-de-combate', {count: 1, target: TARGET_PLAYER}],
        ['justice-intuicion-heroica', {count: 1, target: TARGET_PLAYER}],
        ['justice-interrogation-room', {count: 1, target: TARGET_PLAYER}],
        ['leadership-inspiracion', {count: 3, target: TARGET_DECK}],
        ['protection-chaleco-blindado', {count: 1, target: TARGET_PLAYER}],
    ]);

    for (const [id, maximum] of expectedMaximums) {
        const entry = catalog.aspects.find(aspect => aspect._id === id);

        assert.ok(entry, `${id} is missing from the catalog`);
        assert.deepEqual(entry.card.params.maximum, maximum);
    }

    const captainMarvel = catalog.heroes.find(hero => hero._id === 'captain-marvel');
    assert.ok(captainMarvel);
    const energyChannel = captainMarvel.config.cards.find(({card}) =>
        card.params.name === 'Canalizar energía');
    assert.ok(energyChannel);
    assert.deepEqual(energyChannel.card.params.maximum, {
        count: 1,
        target: TARGET_PLAYER,
    });
});
