import assert from 'node:assert/strict';
import express from 'express';
import {test} from 'node:test';

import {ENDPOINTS, INTERNAL_ENDPOINTS} from 'mc-endpoints';
import {createMatchCreationApp} from '../src/match-creation-app.js';

const listen = async app => {
    const server = await new Promise((resolve, reject) => {
        const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
        listener.once('error', reject);
    });

    return {
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        }),
    };
};

test('catalog endpoints are served by the match creation service', async () => {
    const service = await listen(createMatchCreationApp({
        data: {
            getHeroesList: async () => [{name: 'Spider-Man'}],
            getScenariosList: async () => [{name: 'Rhino'}],
            getModularSetsList: async () => [{id: 'bomb-scare'}],
        },
    }));

    try {
        const response = await fetch(`${service.url}${ENDPOINTS.MATCH.GET_HEROES_LIST}`);

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), [{name: 'Spider-Man'}]);
    } finally {
        await service.close();
    }
});

test('match creation requests are proxied to the match service with the match header', async () => {
    const upstream = express();
    upstream.use(express.json());
    let forwardedRequest;
    upstream.post('/internal/create-match', (req, res) => {
        forwardedRequest = {
            match: req.headers.match,
            body: req.body,
        };
        res.status(201).json({name: req.body.name});
    });

    const matchService = await listen(upstream);
    const creationService = await listen(createMatchCreationApp({
        data: {},
        matchServiceUrl: matchService.url,
    }));

    try {
        const response = await fetch(`${creationService.url}${ENDPOINTS.MATCH.CREATE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                match: 'game-1',
            },
            body: JSON.stringify({name: 'game-1'}),
        });

        assert.equal(response.status, 201);
        assert.deepEqual(await response.json(), {name: 'game-1'});
        assert.deepEqual(forwardedRequest, {
            match: 'game-1',
            body: {name: 'game-1'},
        });
    } finally {
        await creationService.close();
        await matchService.close();
    }
});

test('match reset requests are proxied to the reset endpoint with the match header', async () => {
    const upstream = express();
    upstream.use(express.json());
    let forwardedRequest;
    upstream.post(INTERNAL_ENDPOINTS.MATCH.RESET, (req, res) => {
        forwardedRequest = {
            match: req.headers.match,
            body: req.body,
        };
        res.status(200).json({id: req.body.id});
    });

    const matchService = await listen(upstream);
    const creationService = await listen(createMatchCreationApp({
        data: {},
        matchServiceUrl: matchService.url,
    }));

    try {
        const response = await fetch(`${creationService.url}${ENDPOINTS.MATCH.RESET}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                match: 'game-1',
            },
            body: JSON.stringify({id: 'stable-match-id'}),
        });

        assert.equal(response.status, 200);
        assert.deepEqual(await response.json(), {id: 'stable-match-id'});
        assert.deepEqual(forwardedRequest, {
            match: 'game-1',
            body: {id: 'stable-match-id'},
        });
    } finally {
        await creationService.close();
        await matchService.close();
    }
});

test('returns 502 when the match service cannot be reached', async () => {
    const unavailableMatchService = await listen(express());
    await unavailableMatchService.close();
    const service = await listen(createMatchCreationApp({
        data: {},
        matchServiceUrl: unavailableMatchService.url,
    }));

    try {
        const response = await fetch(`${service.url}${ENDPOINTS.MATCH.CREATE}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: 'game-1'}),
        });

        assert.equal(response.status, 502);
        assert.deepEqual(await response.json(), {
            error: {
                message: `No se pudo conectar con mc-back en ${unavailableMatchService.url}.`,
                status: 502,
            },
        });
    } finally {
        await service.close();
    }
});

test('the match service URL must use HTTP or HTTPS', () => {
    assert.throws(() => createMatchCreationApp({
        data: {},
        matchServiceUrl: 'file:///tmp/match-service',
    }), /MATCH_SERVICE_URL must use http:\/\/ or https:\/\//);
});
