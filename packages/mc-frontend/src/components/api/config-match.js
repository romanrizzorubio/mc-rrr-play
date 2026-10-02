import {ENDPOINTS} from 'mc-endpoints';

export class ConfigMatch {
    constructor(api) {
        this.api = api;
    }
    createMatch({name}) {
        this.api.match = name;
        return this.api.post({
            endpoint: ENDPOINTS.MATCH.CREATE,
            params: {
                name,
            }
        });
    }
    async createPlayer(player) {
        return await this.api.post({
            endpoint: ENDPOINTS.PLAYER.CREATE,
            params: player
        });
    }
    createScenario(scenario) {
        return this.api.post({
            endpoint: ENDPOINTS.SCENARIO.CREATE,
            params: scenario,
        });
    }
    getHeroesList() {
        return this.api.get({
            endpoint: ENDPOINTS.MATCH.GET_HEROES_LIST,
        });
    }
    getScenariosList() {
        return this.api.get({
            endpoint: ENDPOINTS.MATCH.GET_SCENARIOS_LIST,
        });
    }
    initMatch(expert) {
        return this.api.post({
            endpoint: ENDPOINTS.MATCH.INIT,
            params: {
                expert
            }
        });
    }
    listenMatch(callback) {
        this.api.listenMatch(callback);
    }
}