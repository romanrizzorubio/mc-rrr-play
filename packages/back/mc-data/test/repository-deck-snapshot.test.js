import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    mergeDecksByUpdatedAt,
    mergeDeckSnapshots,
    newerRepositoryDeckEvents,
    parseRepositoryDeckSnapshot,
    serializeRepositoryDeckSnapshot,
} from '../utils/repository-deck-snapshot.js';

const deck = (id, updatedAt, name = id) => ({
    id,
    name,
    heroId: 'hero',
    aspect: 'justice',
    cards: [{id: 'card-1', count: 1}],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt,
});

test('serializes repository deck snapshots deterministically with timestamps', () => {
    const serialized = serializeRepositoryDeckSnapshot({
        decks: [
            deck('deck-b', '2026-01-02T00:00:00.000Z'),
            deck('deck-a', '2026-01-03T00:00:00.000Z'),
        ],
        deletions: [{id: 'deleted-deck', deletedAt: '2026-01-04T00:00:00.000Z'}],
    });

    assert.deepEqual(parseRepositoryDeckSnapshot(serialized), {
        decks: [
            deck('deck-a', '2026-01-03T00:00:00.000Z'),
            deck('deck-b', '2026-01-02T00:00:00.000Z'),
        ],
        deletions: [{id: 'deleted-deck', deletedAt: '2026-01-04T00:00:00.000Z'}],
    });
});

test('rejects duplicate IDs and invalid deck timestamps in repository snapshots', () => {
    const duplicateDecks = {
        decks: [deck('same', '2026-01-02T00:00:00.000Z')],
        deletions: [],
    };

    assert.throws(
        () => serializeRepositoryDeckSnapshot({
            decks: [...duplicateDecks.decks, ...duplicateDecks.decks],
            deletions: [],
        }),
        /aparece más de una vez/,
    );
    assert.throws(
        () => serializeRepositoryDeckSnapshot({
            decks: [deck('invalid-date', 'not-a-date')],
            deletions: [],
        }),
        /está incompleto/,
    );
    assert.throws(
        () => serializeRepositoryDeckSnapshot({
            decks: [deck('same', '2026-01-02T00:00:00.000Z')],
            deletions: [{id: 'same', deletedAt: '2026-01-03T00:00:00.000Z'}],
        }),
        /aparece como mazo y borrado/,
    );
});

test('merges repository and local deck events using the newest timestamp per ID', () => {
    const repositorySnapshot = {
        decks: [
            deck('repo-newer', '2026-01-04T00:00:00.000Z', 'Versión del repo'),
            deck('local-newer', '2026-01-02T00:00:00.000Z', 'Versión antigua local'),
            deck('repo-only', '2026-01-01T00:00:00.000Z'),
        ],
        deletions: [{id: 'deleted-local', deletedAt: '2026-01-04T00:00:00.000Z'}],
    };
    const localSnapshot = {
        decks: [
            deck('repo-newer', '2026-01-03T00:00:00.000Z', 'Versión antigua local'),
            deck('local-newer', '2026-01-03T00:00:00.000Z', 'Versión local'),
            deck('local-only', '2026-01-01T00:00:00.000Z'),
            deck('deleted-local', '2026-01-02T00:00:00.000Z'),
        ],
        deletions: [],
    };

    assert.deepEqual(
        mergeDeckSnapshots(repositorySnapshot, localSnapshot),
        {
            decks: [
                deck('local-newer', '2026-01-03T00:00:00.000Z', 'Versión local'),
                deck('local-only', '2026-01-01T00:00:00.000Z'),
                deck('repo-newer', '2026-01-04T00:00:00.000Z', 'Versión del repo'),
                deck('repo-only', '2026-01-01T00:00:00.000Z'),
            ],
            deletions: [{
                id: 'deleted-local',
                deletedAt: '2026-01-04T00:00:00.000Z',
            }],
        },
    );
});

test('treats explicit deletions as timestamped events during merge and restore', () => {
    const repositorySnapshot = {
        decks: [deck('keep-local', '2026-01-02T00:00:00.000Z')],
        deletions: [{id: 'repo-deleted', deletedAt: '2026-01-03T00:00:00.000Z'}],
    };
    const localSnapshot = {
        decks: [deck('repo-deleted', '2026-01-01T00:00:00.000Z')],
        deletions: [{id: 'keep-local', deletedAt: '2026-01-04T00:00:00.000Z'}],
    };

    assert.deepEqual(
        mergeDeckSnapshots(repositorySnapshot, localSnapshot),
        {
            decks: [],
            deletions: [
                {id: 'keep-local', deletedAt: '2026-01-04T00:00:00.000Z'},
                {id: 'repo-deleted', deletedAt: '2026-01-03T00:00:00.000Z'},
            ],
        },
    );
    assert.deepEqual(
        newerRepositoryDeckEvents(repositorySnapshot, localSnapshot).map(event => ({
            id: event.id,
            type: event.type,
        })),
        [{id: 'repo-deleted', type: 'deletion'}],
    );
});

test('keeps the explicit deletion when two events share a timestamp', () => {
    const deckVersion = deck('same-time', '2026-01-02T00:00:00.000Z');
    const deletion = {id: deckVersion.id, deletedAt: deckVersion.updatedAt};

    assert.deepEqual(
        mergeDeckSnapshots(
            {decks: [deckVersion], deletions: []},
            {decks: [], deletions: [deletion]},
        ),
        {decks: [], deletions: [deletion]},
    );
});

test('retains the existing deck-only timestamp merge helper', () => {
    assert.deepEqual(
        mergeDecksByUpdatedAt(
            [deck('same', '2026-01-01T00:00:00.000Z')],
            [deck('same', '2026-01-02T00:00:00.000Z', 'Versión local')],
        ),
        [deck('same', '2026-01-02T00:00:00.000Z', 'Versión local')],
    );
});
