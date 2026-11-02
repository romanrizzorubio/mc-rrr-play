import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {seedCatalog} from '../seed/catalog-seeder.js';

describe('catalog seeding', () => {
    test('replaces packaged records and deletes only the retired rino2 scenario', async () => {
        const replacements = [];
        const deletions = [];
        const database = {
            collection(name) {
                return {
                    async deleteOne(filter) {
                        deletions.push({collection: name, filter});
                    },
                    async replaceOne(filter, replacement, options) {
                        replacements.push({collection: name, filter, replacement, options});
                    },
                };
            },
        };

        await seedCatalog(database, {
            heroes: [{_id: 'wasp', name: 'Avispa'}],
            scenarios: [{_id: 'rhino', name: 'Rino'}],
        });

        assert.deepEqual(replacements, [
            {
                collection: 'heroes',
                filter: {_id: 'wasp'},
                replacement: {_id: 'wasp', name: 'Avispa'},
                options: {upsert: true},
            },
            {
                collection: 'scenarios',
                filter: {_id: 'rhino'},
                replacement: {_id: 'rhino', name: 'Rino'},
                options: {upsert: true},
            },
        ]);
        assert.deepEqual(deletions, [
            {collection: 'scenarios', filter: {_id: 'rino2'}},
        ]);
    });
});
