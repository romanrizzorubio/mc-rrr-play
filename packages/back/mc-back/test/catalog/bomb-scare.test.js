import assert from 'node:assert/strict';
import {test} from 'node:test';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';

test('Amenaza de bomba is listed as a selectable modular set', async () => {
    const {sets} = await loadCatalog();
    const bombScare = sets.find(({_id}) => _id === 'bomb-scare');

    assert.ok(bombScare);
    assert.equal(bombScare.config.name, 'Amenaza de bomba');
    assert.equal(bombScare.config.standard, false);
});
