import {endpoints} from "../../misc/endpoints.js";

export class ConfigMatch {
    constructor(api) {
        this.api = api;
    }
    createMatch({name}) {
        this.api.match = name;
        return this.api.post({
            endpoint: endpoints.match.create,
            params: {
                name,
            }
        });
    }
    async createPlayer(player) {
        return await this.api.post({
            endpoint: endpoints.player.create,
            params: player
        })
    }
    createScenario(scenario) {
        return this.api.post({
            endpoint: endpoints.scenario.create,
            params: scenario,
        })
    }
    getHeroesList() {
        return this.api.get({
            endpoint: endpoints.match.getHeroesList,
        })
    }
    getScenariosList() {
        return this.api.get({
            endpoint: endpoints.match.getScenariosList,
        });
    }
    initMatch(expert) {
        return this.api.post({
            endpoint: endpoints.match.init,
            params: {
                expert
            }
        })
    }
    listenMatch(callback) {
        this.api.listenMatch(callback);
    }
}