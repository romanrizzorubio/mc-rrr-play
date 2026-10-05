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
        this.rest.get(ENDPOINTS.MATCH.GET_MATCHES_LIST, this.getMatchesList.bind(this));
        this.rest.get(ENDPOINTS.MATCH.GET_SCENARIOS_LIST, this.getScenariosList.bind(this));
        this.rest.get(
            ENDPOINTS.MATCH.GET_MODULAR_SETS_LIST,
            this.getModularSetsList.bind(this)
        );
        this.rest.post(ENDPOINTS.MATCH.CREATE, this.createMatch.bind(this));
        this.rest.post(ENDPOINTS.MATCH.INIT, this.initMatch.bind(this));
        this.rest.delete(ENDPOINTS.MATCH.DELETE, this.deleteMatch.bind(this));
    }
    createMatch({name}) {
        if (this.mc.getMatch(name)) {
            throw new Error(`Ya existe una partida llamada "${name}".`);
        }

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
    getMatchesList() {
        return Object.values(this.mc.matches).map(match => ({
            name: match.name,
            initialized: match.initialized,
            initializing: match.initializing,
            playing: match.playing,
            scenario: match.scenario?.name ?? '',
            players: match.players.map(player => ({
                name: player.name,
                hero: player.superhero.mainName,
            })),
        }));
    }
    getScenariosList() {
        return this.mc.data.getScenariosList();
    }
    getModularSetsList() {
        return this.mc.data.getModularSetsList();
    }
    async deleteMatch({name}) {
        if (!name) {
            throw new Error('Falta el nombre de la partida que se quiere eliminar.');
        }

        await this.mc.deleteMatch(name);

        return {name};
    }
    async initMatch(params) {
        const {match, expert} = params;

        if (match.initializing) {
            throw new Error(`La partida "${match.name}" ya se está inicializando.`);
        }

        match.initializing = true;
        try {
            await match.initMatch(expert);

            return await match.toObjWithPlayableHands();
        } finally {
            match.initializing = false;
        }
    }
}