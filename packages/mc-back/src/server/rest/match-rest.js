import {ENDPOINTS} from 'mc-endpoints';
import {Match} from '../../model/match/match.js';

export class MatchRest {
    constructor(rest) {
        this.rest = rest;
    }
    get mc() {
        return this.rest.mc;
    }
    createEndpoints() {
        this.rest.get(ENDPOINTS.MATCH.GET_HEROES_LIST, this.getHeroesList.bind(this));
        this.rest.get(ENDPOINTS.MATCH.GET_SCENARIOS_LIST, this.getScenariosList.bind(this));
        this.rest.post(ENDPOINTS.MATCH.CREATE, this.createMatch.bind(this));
        this.rest.post(ENDPOINTS.MATCH.INIT, this.initMatch.bind(this));
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
        return this.mc.data.getHeroesList();
    }
    getScenariosList() {
        return this.mc.data.getScenariosList();
    }
    async initMatch(params) {
        const {match, expert} = params;

        await match.initMatch(expert);

        return match.toObjWithPlayableHands();
    }
}