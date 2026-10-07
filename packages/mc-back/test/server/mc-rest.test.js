import assert from 'node:assert/strict';
import express from 'express';
import {test} from 'node:test';

import {ENDPOINTS} from 'mc-endpoints';
import {McRest} from '../../src/server/rest/mc-rest.js';

const runRestRequest = async (mc, path) => {
    const app = express();
    const rest = new McRest({
        getMatch: () => undefined,
        ...mc,
        app,
    });
    rest.createEndpoints();

    const server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        listener.once('error', reject);
    });
    const {port} = server.address();

    try {
        return await fetch(`http://127.0.0.1:${port}${path}`);
    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    }
};

test('REST errors return their client status and a JSON message', async () => {
    const validationError = Object.assign(
        new Error('La solicitud no es válida.'),
        {status: 422}
    );
    const response = await runRestRequest({
        data: {
            getHeroesList: async () => {
                throw validationError;
            },
        },
    }, ENDPOINTS.MATCH.GET_HEROES_LIST);

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
            data: {
                getHeroesList: async () => {
                    throw internalError;
                },
            },
        }, ENDPOINTS.MATCH.GET_HEROES_LIST);
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
    const response = await runRestRequest({
        data: {
            getHeroesList: async () => [],
        },
    }, '/not-a-route');

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
        error: {
            message: 'No se encontró la ruta solicitada.',
            status: 404,
        },
    });
});
