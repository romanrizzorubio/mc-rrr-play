import assert from 'node:assert/strict';
import express from 'express';
import {describe, test} from 'node:test';

import {INTERNAL_ENDPOINTS} from 'mc-endpoints';
import {McRest} from '../../src/server/rest/mc-rest.js';
import {AuthServiceClient} from '../../src/utils/auth-service-client.js';

const runRestRequest = async (mc, path) => {
    const app = express();
    const rest = new McRest({
        getMatch: () => undefined,
        data: {getScenariosList: async () => []},
        ...mc,
        app,
    });
    rest.createEndpoints();

    const server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        listener.once('error', reject);
    });
    const {port} = server.address();

    const authenticate = AuthServiceClient.authenticate;
    AuthServiceClient.authenticate = async () => ({
        id: 'test-user',
        name: 'Test User',
    });
    try {
        return await fetch(`http://127.0.0.1:${port}${path}`, {
            headers: {cookie: 'session=test-user'},
        });
    } finally {
        AuthServiceClient.authenticate = authenticate;
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    }
};

describe('McRest', () => {
    test('manual-save POST requests skip snapshots but still update lobby state', async () => {
        const registered = [];
        const persisted = [];
        const lobbyUpdates = [];
        const match = {
            name: 'manual-match',
            initialized: true,
            autoSave: false,
            lobbyId: 'lobby-id',
        };
        const rest = new McRest({
            app: {
                post: (path, handler) => registered.push({path, handler}),
            },
            getMatch: name => name === match.name ? match : undefined,
            persistMatch: async value => persisted.push(value),
            data: {
                markMatchLobbyStarted: async (...args) =>
                    lobbyUpdates.push(args),
            },
        });
        rest.post('/test-update', async params => {
            assert.strictEqual(params.match, match);

            return {ok: true};
        });
        const {handler} = registered[0];
        const response = await new Promise((resolve, reject) => {
            handler(
                {
                    body: {},
                    headers: {match: match.name, cookie: 'session=player'},
                },
                {send: resolve},
                reject,
            );
        });

        assert.deepEqual(response, {ok: true});
        assert.deepEqual(persisted, []);
        assert.deepEqual(lobbyUpdates, [[match.lobbyId, {
            id: match.id,
            name: match.name,
        }]]);
    });

    test('REST errors return their client status and a JSON message', async () => {
        const validationError = Object.assign(
            new Error('La solicitud no es válida.'),
            {status: 422}
        );
        const response = await runRestRequest({
            matches: new Proxy({}, {
                ownKeys: () => {
                    throw validationError;
                },
            }),
        }, INTERNAL_ENDPOINTS.MATCH.GET_MATCHES_LIST);

        assert.equal(response.status, 422);
        assert.match(response.headers.get('content-type'), /application\/json/);
        assert.deepEqual(await response.json(), {
            error: {
                message: 'La solicitud no es válida.',
                status: 422,
            },
        });
    });

    test('unexpected REST errors return a sanitized JSON 500', async () => {
        const internalError = new TypeError('Internal implementation detail.');
        const originalConsoleError = console.error;
        const loggedErrors = [];
        let response;

        console.error = (...args) => loggedErrors.push(args);
        try {
            response = await runRestRequest({
                matches: new Proxy({}, {
                    ownKeys: () => {
                        throw internalError;
                    },
                }),
            }, INTERNAL_ENDPOINTS.MATCH.GET_MATCHES_LIST);
        } finally {
            console.error = originalConsoleError;
        }

        assert.equal(response.status, 500);
        assert.deepEqual(await response.json(), {
            error: {
                message: 'Error interno del servidor.',
                status: 500,
            },
        });
        assert.equal(loggedErrors[0][1], internalError);
    });

    test('unknown REST routes return a JSON 404', async () => {
        const response = await runRestRequest({matches: {}}, '/not-a-route');

        assert.equal(response.status, 404);
        assert.deepEqual(await response.json(), {
            error: {
                message: 'No se encontró la ruta solicitada.',
                status: 404,
            },
        });
    });
});
