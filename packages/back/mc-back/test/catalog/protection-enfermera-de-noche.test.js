import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';

describe('La Enfermera de Noche', () => {
    test('is marked as a unique card', async () => {
        const catalog = await loadCatalog();
        const nurse = catalog.aspects.find(({_id}) =>
            _id === 'protection-enfermera-de-noche');

        assert.ok(nurse);
        assert.equal(nurse.card.params.unique, true);
    });
});
