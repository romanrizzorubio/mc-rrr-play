import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {DeckServiceClient} from '../src/services/deck-service-client.js';

describe('deck service client', () => {
    test('preserves the service path prefix when calling through a gateway', async () => {
        const originalFetch = globalThis.fetch;
        let requestedUrl;
        globalThis.fetch = async url => {
            requestedUrl = new URL(url).href;

            return {
                ok: true,
                status: 200,
                json: async () => [],
            };
        };

        try {
            const client = new DeckServiceClient('https://mc-rrr.com/api/deck/');
            await client.getDecks();

            assert.equal(
                requestedUrl,
                'https://mc-rrr.com/api/deck/decks',
            );
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test('sends multiple selected aspects in the single aspect field', async () => {
        const originalFetch = globalThis.fetch;
        let requestBody;
        let requestCredentials;
        globalThis.fetch = async (_url, {body, credentials}) => {
            requestBody = JSON.parse(body);
            requestCredentials = credentials;

            return {
                ok: true,
                status: 200,
                json: async () => requestBody,
            };
        };

        try {
            const client = new DeckServiceClient('http://localhost:3002');
            await client.saveDeck({
                name: 'Mazo de Spiderwoman',
                heroId: 'spiderwoman',
                aspect: ['aggression', 'justice'],
                cards: [],
            });

            assert.deepEqual(requestBody.aspect, ['aggression', 'justice']);
            assert.equal(Object.hasOwn(requestBody, 'aspects'), false);
            assert.equal(requestCredentials, 'include');
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test('clones only deck content and sends it as a new deck', async () => {
        const originalFetch = globalThis.fetch;
        let requestBody;
        globalThis.fetch = async (_url, {body}) => {
            requestBody = JSON.parse(body);

            return {
                ok: true,
                status: 201,
                json: async () => ({id: 'new-deck'}),
            };
        };

        try {
            const client = new DeckServiceClient('http://localhost:3002');
            const result = await client.cloneDeck({
                id: 'source-deck',
                name: 'Mazo compartido',
                heroId: 'spiderwoman',
                aspect: ['aggression', 'justice'],
                cards: [{id: 'card-1', count: 2}],
                creatorId: 'source-user',
                canEdit: false,
            });

            assert.deepEqual(requestBody, {
                name: 'Clon de Mazo compartido',
                heroId: 'spiderwoman',
                aspect: ['aggression', 'justice'],
                cards: [{id: 'card-1', count: 2}],
            });
            assert.equal(result.id, 'new-deck');
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test('keeps cloned deck names within the service limit', async () => {
        const originalFetch = globalThis.fetch;
        let requestBody;
        globalThis.fetch = async (_url, {body}) => {
            requestBody = JSON.parse(body);

            return {
                ok: true,
                status: 201,
                json: async () => ({id: 'new-deck'}),
            };
        };

        try {
            const client = new DeckServiceClient('http://localhost:3002');
            await client.cloneDeck({
                name: 'M'.repeat(100),
                heroId: 'ironman',
                aspect: 'leadership',
                cards: [],
            });

            assert.equal(requestBody.name.length, 100);
            assert.ok(requestBody.name.startsWith('Clon de '));
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test('adds and removes a favorite using the deck-specific endpoint', async () => {
        const originalFetch = globalThis.fetch;
        const requests = [];
        globalThis.fetch = async (url, {method, credentials}) => {
            requests.push({url: new URL(url).pathname, method, credentials});

            return {
                ok: true,
                status: 200,
                json: async () => ({isFavorite: method === 'POST'}),
            };
        };

        try {
            const client = new DeckServiceClient('http://localhost:3002');
            await client.setDeckFavorite('shared/deck', true);
            await client.setDeckFavorite('shared/deck', false);

            assert.deepEqual(requests, [
                {
                    url: '/decks/shared%2Fdeck/favorite',
                    method: 'POST',
                    credentials: 'include',
                },
                {
                    url: '/decks/shared%2Fdeck/favorite',
                    method: 'DELETE',
                    credentials: 'include',
                },
            ]);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
