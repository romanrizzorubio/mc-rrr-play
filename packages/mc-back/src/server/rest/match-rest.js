import {heroesList} from '../../../data/heroes/index.js';
import {scenariosList} from '../../../data/scenarios/index.js';
import {endpoints} from '../../constants/endpoints.js';
import {Match} from '../../model/match/match.js';

export class MatchRest {
    constructor(rest) {
        this.rest = rest;
    }
    get mc() {
        return this.rest.mc;
    }
    createEndpoints() {
        this.rest.get(endpoints.match.getHeroesList, this.getHeroesList.bind(this));
        this.rest.get(endpoints.match.getScenariosList, this.getScenariosList.bind(this));
        this.rest.post(endpoints.match.create, this.createMatch.bind(this));
        this.rest.post(endpoints.match.init, this.initMatch.bind(this));
    }
    createMatch({name}) {
        const match = new Match({
            name,
            mc: this.mc,
        });

        this.mc.setMatch(match);

        return match.toObj();
    }
    getHeroesList() {
        return heroesList;
    }
    getScenariosList() {
        return scenariosList;
    }
    async initMatch(params) {
        const {match, expert} = params;

        await match.initMatch(expert);

        return match.toObjWithPlayableHands();
    }
}