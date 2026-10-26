import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {DeckServiceClient} from '../src/services/deck-service-client.js';

describe('deck service client', () => {
    test('sends multiple selected aspects in the single aspect field', async () => {
        const originalFetch = globalThis.fetch;
        let requestBody;
        globalThis.fetch = async (_url, {body}) => {
            requestBody = JSON.parse(body);

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
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
