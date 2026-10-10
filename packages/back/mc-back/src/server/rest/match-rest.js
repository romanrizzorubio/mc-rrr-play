import {EVENTS, INTERNAL_ENDPOINTS} from 'mc-endpoints';
import {Match} from '../../model/match/match.js';
import {randomUUID} from 'node:crypto';
import {MatchFactory} from '../../factory/match-factory.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../utils/match-serialization.js';

const hasCreationConfig = creationConfig =>
    Array.isArray(creationConfig?.players) &&
    creationConfig.players.length > 0 &&
    creationConfig.players.every(player => player.name && player.config) &&
    creationConfig.scenario &&
    Array.isArray(creationConfig.scenario.villains) &&
    Array.isArray(creationConfig.scenario.mainSchemes) &&
    Array.isArray(creationConfig.scenario.cards);

export class MatchRest {
    constructor(rest) {
        this.rest = rest;
        this.resettingMatches = new Set();
    }
    get mc() {
        return this.rest.mc;
    }
    async createMatchFromCreationConfig(currentMatch, creationConfig) {
        const match = new Match({
            mc: this.mc,
            name: currentMatch.name,
            id: currentMatch.id,
        });
        match.creationConfig = structuredClone(creationConfig);
        match.expert = currentMatch.expert ??
            creationConfig.expert ??
            false;

        const matchFactory = new MatchFactory(match);
        creationConfig.players.forEach(playerConfig => {
            const config = structuredClone(playerConfig.config);
            const superhero = matchFactory.createSuperhero(config);

            match.createPlayer({
                name: playerConfig.name,
                superhero,
                initial: playerConfig.initial,
                config,
            });
        });

        const scenarioConfig = structuredClone(creationConfig.scenario);
        const scenario = await matchFactory.createScenario(scenarioConfig);
        match.addScenario(scenario);

        return match;
    }
    createEndpoints() {
        this.rest.get(
            INTERNAL_ENDPOINTS.MATCH.GET_MATCHES_LIST,
            this.getMatchesList.bind(this)
        );
        this.rest.post(INTERNAL_ENDPOINTS.MATCH.CREATE, this.createMatch.bind(this));
        this.rest.post(INTERNAL_ENDPOINTS.MATCH.INIT, this.initMatch.bind(this));
        this.rest.post(INTERNAL_ENDPOINTS.MATCH.RESET, this.resetMatch.bind(this));
        this.rest.delete(INTERNAL_ENDPOINTS.MATCH.DELETE, this.deleteMatch.bind(this));
    }
    createMatch({name}) {
        if (this.mc.getMatch(name)) {
            throw new Error(`Ya existe una partida llamada "${name}".`);
        }

        const match = new Match({
            name,
            id: randomUUID(),
            mc: this.mc,
        });

        this.mc.setMatch(match);

        return match.toObj();
    }
    async resetMatch(params) {
        if (!params.id) {
            const error = new Error('Falta el ID de la partida que se quiere reiniciar.');
            error.statusCode = 400;
            throw error;
        }

        const currentMatch = this.mc.getMatchById(params.id);
        if (!currentMatch) {
            const error = new Error(`No existe la partida "${params.id}".`);
            error.statusCode = 404;
            throw error;
        }
        if (params.match && params.match !== currentMatch) {
            const error = new Error(
                `El ID "${params.id}" no corresponde a la partida "${params.match.name}".`
            );
            error.statusCode = 409;
            throw error;
        }
        if (this.resettingMatches.has(currentMatch.name)) {
            const error = new Error(`La partida "${currentMatch.name}" ya se está reiniciando.`);
            error.statusCode = 409;
            throw error;
        }

        this.resettingMatches.add(currentMatch.name);
        try {
            let match;
            if (hasCreationConfig(currentMatch.creationConfig)) {
                match = await this.createMatchFromCreationConfig(
                    currentMatch,
                    currentMatch.creationConfig
                );
            } else if (currentMatch.creationSnapshot) {
                match = restoreMatch(currentMatch.creationSnapshot, this.mc);
            } else if (!currentMatch.initialized) {
                match = restoreMatch(serializeMatch(currentMatch), this.mc);
            } else {
                match = new Match({
                    mc: this.mc,
                    name: currentMatch.name,
                    id: currentMatch.id,
                });
                const matchFactory = new MatchFactory(match);
                currentMatch.players.forEach(player => {
                    const superhero = matchFactory.createSuperhero(player.config);
                    match.createPlayer({
                        name: player.name,
                        superhero,
                        initial: player.initial,
                        config: player.config,
                    });
                });

                if (!currentMatch.scenario) {
                    throw new Error(
                        `La partida "${currentMatch.name}" no tiene escenario.`
                    );
                }
                const scenarioConfig = {
                    ...await this.mc.data.getScenarioConfig(currentMatch.scenario.name),
                };
                const configuredSets = scenarioConfig.sets || [];
                const configuredDefaultSets = scenarioConfig.defaultSets || [];
                const configuredSetIds = new Set([
                    ...configuredSets,
                    ...configuredDefaultSets,
                ]);
                const activeSetIds = new Set((currentMatch.scenario.sets || []).flatMap(set =>
                    (set.cards || [])
                        .map(card => card.card?.set)
                        .filter(Boolean)
                ));
                const setIds = new Set([...configuredSetIds, ...activeSetIds]);
                const setConfigs = new Map(await Promise.all([...setIds].map(async id => [
                    id,
                    await this.mc.data.getSetConfig(id),
                ])));
                const isSelected = id =>
                    setConfigs.get(id).standard !== false || activeSetIds.has(id);
                const selectedModularSetIds = [...activeSetIds].filter(id =>
                    setConfigs.get(id).standard === false
                );

                scenarioConfig.sets = configuredSets.filter(isSelected);
                scenarioConfig.defaultSets = [
                    ...configuredDefaultSets.filter(isSelected),
                    ...selectedModularSetIds.filter(id => !configuredSetIds.has(id)),
                ];
                const scenario = await matchFactory.createScenario(scenarioConfig);
                match.addScenario(scenario);
                match.expert = currentMatch.expert ?? false;
            }

            match.id = currentMatch.id;
            match.name = currentMatch.name;
            match.expert = currentMatch.expert ??
                currentMatch.creationConfig?.expert ??
                match.expert ??
                false;
            if (match.creationConfig) {
                match.creationConfig.expert = match.expert;
            }
            delete match.creationSnapshot;

            currentMatch.playing = false;
            this.mc.mcSocket.dialogSocket.clearPending(currentMatch.name);
            this.mc.mcSocket.dispatch(
                currentMatch.name,
                EVENTS.TURN.END,
                {reset: true}
            );
            this.mc.setMatch(match);
            params.match = match;
            match.initializing = true;
            try {
                await this.mc.persistMatch(match);
                await match.initMatch(match.expert);

                return await match.toObjWithPlayableHands();
            } finally {
                match.initializing = false;
            }
        } finally {
            this.resettingMatches.delete(currentMatch.name);
        }
    }
    getMatchesList() {
        return Object.values(this.mc.matches).map(match => ({
            ...(match.id ? {id: match.id} : {}),
            name: match.name,
            initialized: match.initialized,
            initializing: match.initializing,
            playing: match.playing,
            scenario: match.scenario?.name ?? '',
            players: match.players.map(player => ({
                name: player.name,
                hero: player.superhero.mainName,
                aspect: player.config.aspect,
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
            match.expert = expert ?? false;
            match.creationConfig ??= {players: [], scenario: null, expert: false};
            match.creationConfig.expert = match.expert;
            await match.initMatch(match.expert);

            return await match.toObjWithPlayableHands();
        } finally {
            match.initializing = false;
        }
    }
}