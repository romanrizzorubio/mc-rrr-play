import {INTERNAL_ENDPOINTS} from 'mc-endpoints';
import {Match} from '../../model/match/match.js';

export class MatchRest {
    constructor(rest) {
        this.rest = rest;
    }
    get mc() {
        return this.rest.mc;
    }
    createEndpoints() {
        this.rest.get(
            INTERNAL_ENDPOINTS.MATCH.GET_MATCHES_LIST,
            this.getMatchesList.bind(this)
        );
        this.rest.post(INTERNAL_ENDPOINTS.MATCH.CREATE, this.createMatch.bind(this));
        this.rest.post(INTERNAL_ENDPOINTS.MATCH.INIT, this.initMatch.bind(this));
        this.rest.delete(INTERNAL_ENDPOINTS.MATCH.DELETE, this.deleteMatch.bind(this));
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