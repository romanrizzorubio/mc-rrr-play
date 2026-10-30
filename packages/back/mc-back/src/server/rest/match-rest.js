import {EVENTS, INTERNAL_ENDPOINTS} from 'mc-endpoints';
import {Match} from '../../model/match/match.js';
import {randomUUID} from 'node:crypto';
import {MatchFactory} from '../../factory/match-factory.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../utils/match-serialization.js';
import {AuthServiceClient} from '../../utils/auth-service-client.js';

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
    async getStartingLobby(match, cookie) {
        const user = await AuthServiceClient.authenticate(cookie);
        if (user.id !== match.creatorUserId) {
            const error = new Error('Solo el creador puede configurar esta partida.');
            error.statusCode = 403;
            throw error;
        }

        const lobby = await this.mc.data.getMatchLobby(match.lobbyId);
        if (!lobby || lobby.status !== 'starting' ||
            lobby.creatorId !== match.creatorUserId) {
            const error = new Error('La sala ya no está disponible para iniciar.');
            error.statusCode = 409;
            throw error;
        }

        return lobby;
    }
    async createMatchFromCreationConfig(currentMatch, creationConfig) {
        const match = new Match({
            mc: this.mc,
            name: currentMatch.name,
            id: currentMatch.id,
            lobbyId: currentMatch.lobbyId,
            creatorUserId: currentMatch.creatorUserId,
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
                id: playerConfig.id ??
                    currentMatch.players.find(player =>
                        player.name === playerConfig.name &&
                        player.userId === playerConfig.userId)?.id,
                name: playerConfig.name,
                userId: playerConfig.userId,
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
    async createMatch({name, lobbyId, cookie}) {
        let creatorUserId;
        let startingMatch;
        if (lobbyId) {
            const user = await AuthServiceClient.authenticate(cookie);
            const lobby = await this.mc.data.getMatchLobby(lobbyId);
            startingMatch = lobby?.startingMatch;
            if (!lobby || lobby.status !== 'starting' ||
                lobby.creatorId !== user.id || startingMatch?.name !== name) {
                const error = new Error('La sala no puede iniciar una partida con esta configuración.');
                error.statusCode = 403;
                throw error;
            }
            creatorUserId = user.id;
        }
        const existingMatch = this.mc.getMatch(name);
        if (existingMatch) {
            if (lobbyId && existingMatch.lobbyId === lobbyId &&
                existingMatch.creatorUserId === creatorUserId &&
                existingMatch.id === startingMatch.id) {
                return existingMatch.toObj();
            }

            const error = new Error(`Ya existe una partida llamada "${name}".`);
            error.statusCode = 409;
            throw error;
        }

        const match = new Match({
            name,
            id: lobbyId ? startingMatch.id : randomUUID(),
            mc: this.mc,
            ...(lobbyId ? {lobbyId, creatorUserId} : {}),
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
        const user = await AuthServiceClient.authenticate(params.cookie);
        if (currentMatch.creatorUserId !== user.id) {
            const error = new Error('Solo el creador puede reiniciar esta partida.');
            error.statusCode = 403;
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
                    lobbyId: currentMatch.lobbyId,
                    creatorUserId: currentMatch.creatorUserId,
                });
                const matchFactory = new MatchFactory(match);
                currentMatch.players.forEach(player => {
                    const superhero = matchFactory.createSuperhero(player.config);
                    match.createPlayer({
                        id: player.id,
                        name: player.name,
                        userId: player.userId,
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
                const isSelectedDefaultSet = id =>
                    setConfigs.get(id).standard !== false || activeSetIds.has(id);
                const selectedModularSetIds = [...activeSetIds].filter(id =>
                    setConfigs.get(id).standard === false
                );

                scenarioConfig.sets = configuredSets;
                scenarioConfig.defaultSets = [
                    ...configuredDefaultSets.filter(isSelectedDefaultSet),
                    ...selectedModularSetIds.filter(id => !configuredSetIds.has(id)),
                ];
                const scenario = await matchFactory.createScenario(scenarioConfig);
                match.addScenario(scenario);
                match.expert = currentMatch.expert ?? false;
            }

            match.id = currentMatch.id;
            match.name = currentMatch.name;
            match.creatorUserId = currentMatch.creatorUserId;
            match.lobbyId = currentMatch.lobbyId;
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
    async getMatchesList({cookie}) {
        const user = await AuthServiceClient.authenticate(cookie);
        const scenarios = await this.mc.data.getScenariosList();
        const scenarioNames = new Map(scenarios.map(scenario => [
            scenario.folder,
            scenario.name,
        ]));

        return Object.values(this.mc.matches)
            .filter(match => match.creatorUserId === user.id ||
                match.players.some(player => player.userId === user.id))
            .map(match => ({
                ...(match.id ? {id: match.id} : {}),
                name: match.name,
                ...(match.creatorUserId ? {creatorUserId: match.creatorUserId} : {}),
                initialized: match.initialized,
                initializing: match.initializing,
                playing: match.playing,
                scenario: match.scenario?.name ?? '',
                scenarioName: scenarioNames.get(match.scenario?.name) ??
                    match.scenario?.name ?? '',
                players: match.players.map(player => ({
                    ...(player.id ? {id: player.id} : {}),
                    ...(player.userId ? {userId: player.userId} : {}),
                    name: player.name,
                    hero: player.superhero.mainName,
                    aspect: player.config.aspect,
                })),
            }));
    }
    async deleteMatch({name, cookie}) {
        if (typeof name !== 'string' || !name.trim()) {
            const error = new Error('Falta el nombre de la partida que se quiere eliminar.');
            error.statusCode = 400;
            throw error;
        }
        const user = await AuthServiceClient.authenticate(cookie);
        let match = this.mc.getMatch(name);
        if (!match) {
            const snapshot = await this.mc.data.getMatchSnapshot(name);
            match = this.mc.getMatch(name) ||
                (snapshot ? restoreMatch(snapshot, this.mc) : null);
            if (!match) {
                return {name};
            }
        }
        if (match.name !== name) {
            const error = new Error('El nombre no corresponde a la partida que se quiere eliminar.');
            error.statusCode = 409;
            throw error;
        }
        if (match.creatorUserId !== user.id) {
            const error = new Error('Solo el creador puede eliminar esta partida.');
            error.statusCode = 403;
            throw error;
        }

        await this.mc.deleteMatch(name);

        return {name};
    }
    async initMatch(params) {
        const {match} = params;

        if (match.initializing) {
            throw new Error(`La partida "${match.name}" ya se está inicializando.`);
        }

        match.initializing = true;
        try {
            const lobby = match.lobbyId ?
                await this.getStartingLobby(match, params.cookie) :
                null;
            match.expert = lobby?.expert ?? params.expert ?? false;
            match.creationConfig ??= {players: [], scenario: null, expert: false};
            match.creationConfig.expert = match.expert;
            await match.initMatch(match.expert);

            return await match.toObjWithPlayableHands();
        } finally {
            match.initializing = false;
        }
    }
}