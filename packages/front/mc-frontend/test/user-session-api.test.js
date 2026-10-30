import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {ENDPOINTS} from 'mc-endpoints';
import {UserSessionApi} from '../src/utils/user-session-api.js';

describe('UserSessionApi', () => {
    test('includes credentials when fetching the current user', async () => {
        const originalFetch = globalThis.fetch;
        let requestedUrl;
        let requestedOptions;
        globalThis.fetch = async (url, options) => {
            requestedUrl = url.href;
            requestedOptions = options;

            return new Response(JSON.stringify({
                user: {id: 'user-1', email: 'player@example.test', name: 'Player'},
            }), {
                headers: {'Content-Type': 'application/json'},
            });
        };

        try {
            const api = new UserSessionApi('http://localhost:3003');

            assert.deepEqual(await api.getCurrentUser(), {
                id: 'user-1',
                email: 'player@example.test',
                name: 'Player',
            });
            assert.equal(requestedUrl, `http://localhost:3003${ENDPOINTS.USER.ME}`);
            assert.equal(requestedOptions.credentials, 'include');
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test('treats an expired session as a signed-out user', async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = async () => new Response(JSON.stringify({
            error: {message: 'Sesión no válida.', status: 401},
        }), {
            status: 401,
            headers: {'Content-Type': 'application/json'},
        });

        try {
            const api = new UserSessionApi('http://localhost:3003');

            assert.equal(await api.getCurrentUser(), null);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });

    test('sends logout to the user service', async () => {
        const originalFetch = globalThis.fetch;
        let requestedUrl;
        let requestedMethod;
        globalThis.fetch = async (url, options) => {
            requestedUrl = url.href;
            requestedMethod = options.method;

            return new Response(JSON.stringify({ok: true}), {
                headers: {'Content-Type': 'application/json'},
            });
        };

        try {
            const api = new UserSessionApi('http://localhost:3003');

            await api.logout();

            assert.equal(requestedUrl, `http://localhost:3003${ENDPOINTS.USER.LOGOUT}`);
            assert.equal(requestedMethod, 'POST');
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
