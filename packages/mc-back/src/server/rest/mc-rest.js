import bodyParser from 'body-parser';
import cors from 'cors';

import {MatchRest} from './match-rest.js';
import {PlayerRest} from './player-rest.js';
import {ScenarioRest} from './scenario-rest.js';


export class McRest {
    constructor(mc) {
        this.mc = mc;

        this.matchRest = new MatchRest(this);
        this.playerRest = new PlayerRest(this);
        this.scenarioRest = new ScenarioRest(this);
    }
    createEndpoints() {
        this.mc.app.use(cors());
        this.mc.app.use(bodyParser.json()); // for parsing application/json
        this.mc.app.use((req, res, next) => {
            next();
        });

        this.matchRest.createEndpoints();
        this.playerRest.createEndpoints();
        this.scenarioRest.createEndpoints();

        this.mc.app.use((_req, res) => {
            res.status(404).json({
                error: {
                    message: 'No se encontró la ruta solicitada.',
                    status: 404,
                },
            });
        });
        this.mc.app.use((error, _req, res, next) => {
            if (res.headersSent) {
                return next(error);
            }

            const requestedStatus = error.statusCode ?? error.status;
            const status = Number.isInteger(requestedStatus) &&
                requestedStatus >= 400 &&
                requestedStatus <= 599 ?
                requestedStatus :
                500;
            const message = status < 500 ?
                error.message || 'Solicitud no válida.' :
                'Error interno del servidor.';

            if (status >= 500) {
                console.error('REST request failed', error);
            }

            res.status(status).json({
                error: {
                    message,
                    status,
                },
            });
        });
    }
    getMatch(name) {
        return this.mc.getMatch(name);
    }
    get(endpoint, callback) {
        this.mc.app.get(endpoint, (req, res, next) => {
            Promise.resolve()
                .then(() => callback({
                    match: this.getMatch(req.headers.match),
                }))
                .then(response => res.send(response))
                .catch(next);
        });
    }
    post(endpoint, callback) {
        this.mc.app.post(endpoint, (req, res, next) => {
            const params = {
                ...req.body,
                match: this.getMatch(req.headers.match),
            };

            Promise.resolve()
                .then(() => callback(params))
                .then(async response => {
                    const match = params.match ||
                        (params.name && this.getMatch(params.name));
                    if (match && match.initialized) {
                        await this.mc.persistMatch(match);
                    }
                    res.send(response);
                })
                .catch(next);
        });
    }
    delete(endpoint, callback) {
        this.mc.app.delete(endpoint, (req, res, next) => {
            Promise.resolve()
                .then(() => callback(req.body))
                .then(response => res.send(response))
                .catch(next);
        });
    }
}