import assert from 'node:assert/strict';
import {test} from 'node:test';

import {parseApiResponse} from '../src/utils/api-response.js';

const createResponse = ({ok, status, contentType, json}) => ({
    ok,
    status,
    headers: {
        get: () => contentType,
    },
    json,
});

test('parses successful JSON responses', async () => {
    const payload = {name: 'match'};
    const response = createResponse({
        ok: true,
        status: 200,
        contentType: 'application/json; charset=utf-8',
        json: async () => payload,
    });

    assert.equal(await parseApiResponse(response), payload);
});

test('uses the JSON error message and HTTP status for failed requests', async () => {
    const response = createResponse({
        ok: false,
        status: 500,
        contentType: 'application/json; charset=utf-8',
        json: async () => ({
            error: {
                message: 'Error interno del servidor.',
                status: 500,
            },
        }),
    });

    await assert.rejects(parseApiResponse(response), error => {
        assert.equal(error.message, 'Error interno del servidor.');
        assert.equal(error.status, 500);

        return true;
    });
});

test('reports non-JSON HTTP errors without trying to parse the response body', async () => {
    const response = createResponse({
        ok: false,
        status: 502,
        contentType: 'text/html',
        json: async () => {
            throw new SyntaxError('Unexpected token <');
        },
    });

    await assert.rejects(parseApiResponse(response), error => {
        assert.match(error.message, /HTTP 502/);
        assert.equal(error.status, 502);

        return true;
    });
});
