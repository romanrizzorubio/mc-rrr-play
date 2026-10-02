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
            Promise.resolve()
                .then(() => callback({
                    ...req.body,
                    match: this.getMatch(req.headers.match),
                }))
                .then(response => res.send(response))
                .catch(next);
        });
    }
}