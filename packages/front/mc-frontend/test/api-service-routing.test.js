import assert from 'node:assert/strict';
import {test} from 'node:test';

import {ENDPOINTS} from 'mc-endpoints';
import {Api} from '../src/components/api/api.js';

test('routes catalog and creation endpoints to the creation service', async () => {
    const api = new Api({
        match: 'http://localhost:3000',
        matchCreation: 'http://localhost:3001',
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
        'http://localhost:3001/create-match',
        'http://localhost:3000/player-flip',
    ]);
});
