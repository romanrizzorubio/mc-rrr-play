import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CLASSIFICATION_BASIC} from 'mc-shared';
import {compareDeckPoolCards} from '../src/utils/deck-card-pool-sort.js';
import {
    getCardTraits,
    matchesCardTraitFilter,
    NO_TRAITS_FILTER,
} from '../src/utils/deck-card-traits.js';

const cards = [
    {
        id: 'justice-1',
        name: 'B',
        type: 'event',
        aspect: 'justice',
        traits: ['attack', 'thwart'],
        cost: 3,
        maxAddCount: 2,
    },
    {
        id: 'basic-1',
        name: 'A',
        type: 'ally',
        classification: CLASSIFICATION_BASIC,
        traits: ['avenger'],
        cost: 1,
        maxAddCount: 0,
    },
    {
        id: 'leadership-1',
        name: 'C',
        type: 'resource',
        aspect: 'leadership',
        traits: ['armor'],
        cost: 2,
        maxAddCount: 1,
    },
];

const sortIds = (column, direction = 'asc') => cards
    .slice()
    .sort((left, right) => compareDeckPoolCards(left, right, column, direction))
    .map(({id}) => id);

describe('deck card pool sorting', () => {
    test('sorts available cards by each displayed column value', () => {
        assert.deepEqual(sortIds('name'), ['basic-1', 'justice-1', 'leadership-1']);
        assert.deepEqual(sortIds('type'), ['basic-1', 'justice-1', 'leadership-1']);
        assert.deepEqual(sortIds('aspect'), ['basic-1', 'justice-1', 'leadership-1']);
        assert.deepEqual(sortIds('traits'), ['leadership-1', 'justice-1', 'basic-1']);
        assert.deepEqual(sortIds('cost'), ['basic-1', 'leadership-1', 'justice-1']);
        assert.deepEqual(sortIds('copies'), ['basic-1', 'leadership-1', 'justice-1']);
    });

    test('reverses sort direction while keeping ties alphabetical', () => {
        assert.deepEqual(sortIds('cost', 'desc'), [
            'justice-1',
            'leadership-1',
            'basic-1',
        ]);
        const tiedCards = [
            {id: 'z-card', name: 'Zulu', cost: 2},
            {id: 'a-card', name: 'Alpha', cost: 2},
        ];

        assert.deepEqual(
            tiedCards.sort((left, right) =>
                compareDeckPoolCards(left, right, 'cost', 'desc')).map(({name}) => name),
            ['Alpha', 'Zulu'],
        );
    });

    test('normalizes and filters cards by all their traits or by missing traits', () => {
        const cardWithStringTrait = {traits: 'avenger'};
        const cardWithoutTraits = {traits: []};

        assert.deepEqual(getCardTraits(cards[0]), ['attack', 'thwart']);
        assert.deepEqual(getCardTraits(cardWithStringTrait), ['avenger']);
        assert.equal(matchesCardTraitFilter(cards[0], 'attack'), true);
        assert.equal(matchesCardTraitFilter(cards[0], 'defender'), false);
        assert.equal(matchesCardTraitFilter(cardWithoutTraits, NO_TRAITS_FILTER), true);
        assert.equal(matchesCardTraitFilter(cardWithStringTrait, NO_TRAITS_FILTER), false);
    });
});
