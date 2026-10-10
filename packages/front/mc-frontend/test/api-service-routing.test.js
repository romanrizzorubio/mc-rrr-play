import assert from 'node:assert/strict';
import {test} from 'node:test';

import {ENDPOINTS} from 'mc-endpoints';
import {Api} from '../src/components/api/api.js';

test('routes catalog, creation, and deck endpoints to their services', async () => {
    const api = new Api({
        match: 'http://localhost:3000',
        matchCreation: 'http://localhost:3001',
        deck: 'http://localhost:3002',
    });
    const originalFetch = globalThis.fetch;
    const requestedUrls = [];
    globalThis.fetch = async url => {
        requestedUrls.push(url.href);

        return new Response('[]', {
            headers: {'Content-Type': 'application/json'},
        });
    };

    try {
        await api.get({endpoint: ENDPOINTS.MATCH.GET_HEROES_LIST});
        await api.get({
            endpoint: `${ENDPOINTS.DECK.GET_CATALOG}?hero=spiderman`,
        });
        await api.get({
            endpoint: `${ENDPOINTS.DECK.LIST}?hero=spiderman&legal=true`,
        });
        await api.post({
            endpoint: ENDPOINTS.MATCH.CREATE,
            params: {name: 'game-1'},
        });
        await api.post({
            endpoint: ENDPOINTS.PLAYER.FLIP,
            params: {player: 'Peter'},
        });
    } finally {
        globalThis.fetch = originalFetch;
    }

    assert.deepEqual(requestedUrls, [
        'http://localhost:3001/get-heroes-list',
        'http://localhost:3002/deck-catalog?hero=spiderman',
        'http://localhost:3002/decks?hero=spiderman&legal=true',
        'http://localhost:3001/create-match',
        'http://localhost:3000/player-flip',
    ]);
});
