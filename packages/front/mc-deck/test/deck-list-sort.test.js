import assert from 'node:assert/strict';
import {test} from 'node:test';

import {compareDeckListItems} from '../src/utils/deck-list-sort.js';

const decks = [
    {
        id: 'deck-c',
        name: 'Rocket',
        heroName: 'Spider-Man',
        aspect: 'justice',
        validation: {size: 42},
    },
    {
        id: 'deck-a',
        name: 'Alpha',
        heroName: 'Iron Man',
        aspect: 'leadership',
        validation: {size: 45},
    },
    {
        id: 'deck-b',
        name: 'Bravo',
        heroName: 'Carol Danvers',
        aspect: 'basic',
        validation: {size: 40},
    },
];

const sortIds = (column, direction = 'asc') => decks
    .slice()
    .sort((left, right) => compareDeckListItems(left, right, column, direction))
    .map(({id}) => id);

test('sorts created decks by every data column', () => {
    assert.deepEqual(sortIds('name'), ['deck-a', 'deck-b', 'deck-c']);
    assert.deepEqual(sortIds('hero'), ['deck-b', 'deck-a', 'deck-c']);
    assert.deepEqual(sortIds('aspect'), ['deck-b', 'deck-c', 'deck-a']);
    assert.deepEqual(sortIds('size'), ['deck-b', 'deck-c', 'deck-a']);
});

test('reverses each selected column sort', () => {
    assert.deepEqual(sortIds('name', 'desc'), ['deck-c', 'deck-b', 'deck-a']);
    assert.deepEqual(sortIds('hero', 'desc'), ['deck-c', 'deck-a', 'deck-b']);
    assert.deepEqual(sortIds('aspect', 'desc'), ['deck-a', 'deck-c', 'deck-b']);
    assert.deepEqual(sortIds('size', 'desc'), ['deck-a', 'deck-c', 'deck-b']);
});

test('keeps equal values alphabetical when sorting in descending order', () => {
    const tiedDecks = [
        {...decks[0], id: 'z-deck', name: 'Zulu', validation: {size: 42}},
        {...decks[1], id: 'a-deck', name: 'Alpha', validation: {size: 42}},
    ];

    assert.deepEqual(
        tiedDecks
            .sort((left, right) =>
                compareDeckListItems(left, right, 'size', 'desc'))
            .map(({name}) => name),
        ['Alpha', 'Zulu'],
    );
});
