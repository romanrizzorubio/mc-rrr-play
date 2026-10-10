import assert from 'node:assert/strict';
import {test} from 'node:test';

import aggressionResources from '../../../back/mc-data/seed/catalog/aspects/aggression/resources.js';
import justiceResources from '../../../back/mc-data/seed/catalog/aspects/justice/resources.js';
import leadershipResources from '../../../back/mc-data/seed/catalog/aspects/leadership/resources.js';
import protectionResources from '../../../back/mc-data/seed/catalog/aspects/protection/resources.js';
import {getPrintedResourceTypes} from '../src/utils/deck-resources.js';

test('keeps flat printed resource lists unchanged', () => {
    assert.deepEqual(getPrintedResourceTypes(['e', 'm', 'w']), ['e', 'm', 'w']);
});

test('shows the unconditional printed resources without conditional bonuses', () => {
    const resources = [
        {
            condition: {'card.set': 'justice'},
            resources: ['w', 'w'],
        },
        {resources: ['w']},
    ];

    assert.deepEqual(getPrintedResourceTypes(resources), ['w']);
});

test('shows the printed wild resource for every Power of an Aspect card', () => {
    const cards = [
        aggressionResources[0],
        justiceResources[0],
        leadershipResources[0],
        protectionResources[0],
    ];

    cards.forEach(({card: {params}}) => {
        assert.deepEqual(getPrintedResourceTypes(params.resources), ['w']);
    });
});

test('does not treat a conditional resource bonus as printed when no fallback exists', () => {
    assert.deepEqual(getPrintedResourceTypes([{
        condition: {'card.classification': 'protection'},
        resources: ['w', 'w'],
    }]), []);
});
