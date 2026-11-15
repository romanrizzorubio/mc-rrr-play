import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {ENDPOINTS, EVENTS} from 'mc-endpoints';
import {Api} from '../src/components/api/api.js';

describe('Api match controls', () => {
    test('manual save and creator exit use the match service', async () => {
        const api = new Api({
            match: 'http://localhost:3000',
            matchCreation: 'http://localhost:3001',
            deck: 'http://localhost:3002',
            users: 'http://localhost:3003',
        });
        api.beginMatch('manual-game');
        const originalFetch = globalThis.fetch;
        const requestedUrls = [];
        globalThis.fetch = async url => {
            requestedUrls.push(url.href);

            return new Response('{"ok":true}', {
                headers: {'Content-Type': 'application/json'},
            });
        };

        try {
            await api.saveMatch();
            await api.exitMatch();
        } finally {
            globalThis.fetch = originalFetch;
        }

        assert.deepEqual(requestedUrls, [
            `http://localhost:3000${ENDPOINTS.MATCH.SAVE}`,
            `http://localhost:3000${ENDPOINTS.MATCH.EXIT}`,
        ]);
    });

    test('individual exit leaves the current socket room and clears match state', async () => {
        const api = new Api({
            match: 'http://localhost:3000',
            matchCreation: 'http://localhost:3001',
            deck: 'http://localhost:3002',
            users: 'http://localhost:3003',
        });
        api.beginMatch('manual-game');
        api.markMatchReady();
        api.joinedMatch = 'manual-game';
        let emitted;
        api.socket = {
            connected: true,
            timeout: () => ({
                emit: (event, params, acknowledge) => {
                    emitted = {event, params};
                    acknowledge(null, {ok: true});
                },
            }),
        };

        await api.leaveMatch();

        assert.deepEqual(emitted, {
            event: EVENTS.MATCH.LEAVE,
            params: {match: 'manual-game'},
        });
        assert.equal(api.match, '');
        assert.equal(api.matchReady, false);
        assert.equal(api.joinedMatch, '');
    });
});
