import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {MongoDataStore} from '../index.js';

describe('hero list precon aspect metadata', () => {
    test('returns only the selected precon aspect with each hero', async () => {
        const storedHeroes = [
            {
                _id: 'hero-with-precon',
                name: 'Héroe',
                folder: 'hero',
                config: {
                    precon: [
                        {aspect: 'basic'},
                        {aspect: 'leadership'},
                    ],
                },
            },
            {
                _id: 'hero-without-aspect',
                name: 'Otro héroe',
                config: {
                    precon: [{classification: 'basic'}],
                },
            },
        ];
        let projection;
        const collection = {
            find: (_filter, options) => {
                projection = options.projection;
                return {
                    sort() {
                        return this;
                    },
                    toArray: async () => storedHeroes,
                };
            },
        };
        const store = new MongoDataStore();
        store.database = {collection: () => collection};

        const heroes = await store.getHeroesList();

        assert.deepEqual(projection, {
            _id: 1,
            name: 1,
            folder: 1,
            'config.precon.aspect': 1,
        });
        assert.deepEqual(heroes, [
            {
                id: 'hero-with-precon',
                name: 'Héroe',
                folder: 'hero',
                preconAspect: 'leadership',
            },
            {
                id: 'hero-without-aspect',
                name: 'Otro héroe',
            },
        ]);
    });
});
