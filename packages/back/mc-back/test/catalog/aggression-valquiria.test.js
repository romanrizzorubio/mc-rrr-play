import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';

describe('Valquiria', () => {
    test('is marked as a unique card', async () => {
        const catalog = await loadCatalog();
        const valkyrie = catalog.aspects.find(({_id}) =>
            _id === 'aggression-valquiria');

        assert.ok(valkyrie);
        assert.equal(valkyrie.card.params.unique, true);
    });
});
