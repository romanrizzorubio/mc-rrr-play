import {ENDPOINTS} from 'mc-endpoints';

export class ConfigMatch {
    constructor(api) {
        this.api = api;
    }
    async createMatch({name}) {
        this.api.beginMatch(name);
        const match = await this.api.post({
            endpoint: ENDPOINTS.MATCH.CREATE,
            params: {
                name,
            }
        });

        this.api.markMatchReady();
        await this.api.joinMatch(true);

        return match;
    }
    deleteMatch(name) {
        return this.api.delete({
            endpoint: ENDPOINTS.MATCH.DELETE,
            params: {name},
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
    getMatchesList() {
        return this.api.get({
            endpoint: ENDPOINTS.MATCH.GET_MATCHES_LIST,
        });
    }
    getScenariosList() {
        return this.api.get({
            endpoint: ENDPOINTS.MATCH.GET_SCENARIOS_LIST,
        });
    }
    getModularSetsList() {
        return this.api.get({
            endpoint: ENDPOINTS.MATCH.GET_MODULAR_SETS_LIST,
        });
    }
    async initMatch(expert) {
        const match = await this.api.post({
            endpoint: ENDPOINTS.MATCH.INIT,
            params: {
                expert
            }
        });

        return match;
    }
    listenMatch(callback) {
        this.api.listenMatch(callback);
    }
}