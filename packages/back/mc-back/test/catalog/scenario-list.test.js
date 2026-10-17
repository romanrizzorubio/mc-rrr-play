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
            config: {
                defaultSets: ['masters-of-evil'],
                sets: ['standard', 'experimental-weapons'],
            },
            folder: 'angel',
            name: 'Ángel',
        },
    ];
    const dataStore = new MongoDataStore();
    const setRecords = [
        {_id: 'standard', config: {name: 'standard'}},
        {_id: 'experimental-weapons', config: {name: 'Armas experimentales'}},
        {_id: 'masters-of-evil', config: {name: 'Maestros del mal'}},
    ];
    dataStore.database = {
        collection(name) {
            return {
                find(query = {}) {
                    const sourceRecords = name === 'scenarios' ? records : setRecords;
                    const ids = query._id?.$in;
                    const matchingRecords = ids ?
                        sourceRecords.filter(record => ids.includes(record._id)) :
                        sourceRecords;

                    return {
                        async toArray() {
                            return matchingRecords;
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
    assert.deepEqual(scenarios[0].requiredSets, [
        {id: 'standard', name: 'standard'},
        {id: 'experimental-weapons', name: 'Armas experimentales'},
    ]);
    assert.deepEqual(scenarios[0].defaultModularSets, ['masters-of-evil']);
});
