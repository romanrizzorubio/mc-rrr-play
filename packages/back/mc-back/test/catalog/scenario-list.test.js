import assert from 'node:assert/strict';
import {test} from 'node:test';

import {MongoDataStore} from '../../../mc-data/index.js';

test('scenario list is returned alphabetically by Spanish name', async () => {
    const records = [
        {
            config: {defaultSets: [], sets: ['standard']},
            folder: 'rhino',
            name: 'Rino',
        },
        {
            config: {defaultSets: [], sets: ['standard']},
            folder: 'klaw',
            name: 'Klaw',
        },
        {
            config: {defaultSets: ['masters-of-evil'], sets: ['standard']},
            folder: 'angel',
            name: 'Ángel',
        },
    ];
    const dataStore = new MongoDataStore();
    dataStore.database = {
        collection() {
            return {
                find() {
                    return {
                        async toArray() {
                            return records;
                        },
                    };
                },
            };
        },
    };

    const scenarios = await dataStore.getScenariosList();

    assert.deepEqual(
        scenarios.map(({name}) => name),
        ['Ángel', 'Klaw', 'Rino']
    );
});
