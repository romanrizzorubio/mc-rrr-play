import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';

import {ENDPOINTS, INTERNAL_ENDPOINTS} from 'mc-endpoints';
import {MatchLobbyRest} from './match-lobby-rest.js';

const proxyRoutes = new Map([
    [ENDPOINTS.MATCH.CREATE, INTERNAL_ENDPOINTS.MATCH.CREATE],
    [ENDPOINTS.MATCH.DELETE, INTERNAL_ENDPOINTS.MATCH.DELETE],
    [ENDPOINTS.MATCH.GET_MATCHES_LIST, INTERNAL_ENDPOINTS.MATCH.GET_MATCHES_LIST],
    [ENDPOINTS.MATCH.INIT, INTERNAL_ENDPOINTS.MATCH.INIT],
    [ENDPOINTS.MATCH.RESET, INTERNAL_ENDPOINTS.MATCH.RESET],
    [ENDPOINTS.PLAYER.CREATE, INTERNAL_ENDPOINTS.PLAYER.CREATE],
    [ENDPOINTS.SCENARIO.CREATE, INTERNAL_ENDPOINTS.SCENARIO.CREATE],
]);

const upstreamConnectionErrors = new Set([
    'ECONNREFUSED',
    'ECONNRESET',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'ETIMEDOUT',
]);

const isUpstreamConnectionError = error => {
    const causes = [error, error?.cause, ...(error?.cause?.errors || [])];

    return causes.some(cause => upstreamConnectionErrors.has(cause?.code));
};

const sendError = (error, _req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    const requestedStatus = error.statusCode ?? error.status;
    const status = Number.isInteger(requestedStatus) &&
        requestedStatus >= 400 &&
        requestedStatus <= 599 ?
        requestedStatus :
        500;
    const message = status === 502 ?
        error.message :
        status < 500 ? error.message || 'Solicitud no válida.' : 'Error interno del servidor.';

    if (status >= 500) {
        console.error('Match creation request failed', error);
    }

    res.status(status).json({
        error: {
            message,
            status,
        },
    });
};

export const createMatchCreationApp = ({
    data,
    matchServiceUrl = process.env.MATCH_SERVICE_URL || 'https://localhost:3000',
    authServiceUrl = process.env.AUTH_SERVICE_URL || 'https://localhost:3003',
}) => {
    const matchService = new URL(matchServiceUrl);
    if (!['http:', 'https:'].includes(matchService.protocol)) {
        throw new Error('MATCH_SERVICE_URL must use http:// or https://');
    }

    const app = express();
    const protocol = process.env.USE_HTTPS === 'false' ? 'http' : 'https';
    const defaultOrigins = protocol === 'http' ?
        'http://localhost:8000,http://localhost:8100' :
        'https://localhost:8000,https://localhost:8100';
    const allowedOrigins = (
        process.env.FRONTEND_ORIGINS ||
        defaultOrigins
    ).split(',').map(origin => origin.trim()).filter(Boolean);
    app.use(cors({
        origin: allowedOrigins,
        credentials: true,
    }));
    app.use(bodyParser.json());
    app.get('/healthz', (_req, res) => {
        res.json({status: 'ok'});
    });
    app.get(ENDPOINTS.MATCH.GET_HEROES_LIST, async (_req, res, next) => {
        try {
            res.json(await data.getHeroesList());
        } catch (error) {
            next(error);
        }
    });
    app.get(ENDPOINTS.MATCH.GET_SCENARIOS_LIST, async (_req, res, next) => {
        try {
            res.json(await data.getScenariosList());
        } catch (error) {
            next(error);
        }
    });
    app.get(ENDPOINTS.MATCH.GET_MODULAR_SETS_LIST, async (_req, res, next) => {
        try {
            res.json(await data.getModularSetsList());
        } catch (error) {
            next(error);
        }
    });
    new MatchLobbyRest({
        app,
        data,
        matchService,
        authServiceUrl,
    }).createEndpoints();

    for (const [publicEndpoint, internalEndpoint] of proxyRoutes) {
        app.all(publicEndpoint, async (req, res, next) => {
            try {
                const headers = {
                    match: req.headers.match || '',
                    ...(req.headers.cookie ? {cookie: req.headers.cookie} : {}),
                };
                let body;
                if (req.method !== 'GET' && req.method !== 'HEAD') {
                    headers['content-type'] = 'application/json';
                    body = JSON.stringify(req.body);
                }

                const response = await fetch(new URL(internalEndpoint, matchService), {
                    method: req.method,
                    headers,
                    body,
                });
                const responseBody = await response.text();

                res.status(response.status)
                    .type(response.headers.get('content-type') || 'application/json')
                    .send(responseBody);
            } catch (error) {
                if (isUpstreamConnectionError(error)) {
                    const upstreamError = new Error(
                        `No se pudo conectar con mc-back en ${matchService.origin}.`,
                        {cause: error},
                    );
                    upstreamError.statusCode = 502;
                    next(upstreamError);
                    return;
                }
                next(error);
            }
        });
    }

    app.use((_req, res) => {
        res.status(404).json({
            error: {
                message: 'No se encontró la ruta solicitada.',
                status: 404,
            },
        });
    });
    app.use(sendError);

    return app;
};
