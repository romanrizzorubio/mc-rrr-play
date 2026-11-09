import {ENDPOINTS, EVENTS, INTERNAL_ENDPOINTS} from 'mc-endpoints';
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
        this.exitingMatches = new Set();
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
            autoSave: currentMatch.autoSave !== false,
        });
        match.creationConfig = structuredClone(creationConfig);
        match.creationConfig.autoSave = match.autoSave;
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
        this.rest.post(ENDPOINTS.MATCH.SAVE, this.saveMatch.bind(this));
        this.rest.post(ENDPOINTS.MATCH.EXIT, this.exitMatch.bind(this));
        this.rest.delete(INTERNAL_ENDPOINTS.MATCH.DELETE, this.deleteMatch.bind(this));
    }
    async createMatch({name, lobbyId, cookie, autoSave = true}) {
        if (typeof autoSave !== 'boolean') {
            const error = new Error('La opción Guardado automático no es válida.');
            error.statusCode = 400;
            throw error;
        }

        let creatorUserId;
        let startingMatch;
        let matchAutoSave = autoSave;
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
            matchAutoSave = lobby.autoSave !== false;
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
            autoSave: matchAutoSave,
        });

        this.mc.setMatch(match);

        return match.toObj();
    }
    async saveMatch({match, cookie}) {
        if (!match) {
            const error = new Error('No se encontró la partida que se quiere guardar.');
            error.statusCode = 404;
            throw error;
        }
        if (!match.initialized || match.initializing) {
            const error = new Error('La partida todavía no está lista para guardarse.');
            error.statusCode = 409;
            throw error;
        }
        if (this.exitingMatches.has(match.name) ||
            this.resettingMatches.has(match.name)) {
            const error = new Error('La partida está cambiando de estado y no se puede guardar.');
            error.statusCode = 409;
            throw error;
        }

        const user = await AuthServiceClient.authenticate(cookie);
        if (!match.players.some(player => player.userId === user.id)) {
            const error = new Error('No tienes un jugador en esta partida.');
            error.statusCode = 403;
            throw error;
        }
        if (this.mc.mcSocket.dialogSocket.hasPending(match.name)) {
            const error = new Error('Termina la decisión pendiente antes de guardar la partida.');
            error.statusCode = 409;
            throw error;
        }
        if (this.exitingMatches.has(match.name) ||
            this.resettingMatches.has(match.name)) {
            const error = new Error('La partida está cambiando de estado y no se puede guardar.');
            error.statusCode = 409;
            throw error;
        }

        await this.mc.persistMatch(match);

        return {id: match.id, name: match.name};
    }
    async exitMatch(params) {
        const {match} = params;
        if (!match) {
            const error = new Error('No se encontró la partida de la que se quiere salir.');
            error.statusCode = 404;
            throw error;
        }

        const user = await AuthServiceClient.authenticate(params.cookie);
        if (match.creatorUserId !== user.id) {
            const error = new Error('Solo el creador puede cerrar la partida para todos.');
            error.statusCode = 403;
            throw error;
        }
        if (match.autoSave !== false) {
            const error = new Error(
                'La salida global solo está disponible con guardado automático desactivado.',
            );
            error.statusCode = 409;
            throw error;
        }
        if (!match.initialized || match.initializing) {
            const error = new Error('La partida todavía no ha terminado la preparación.');
            error.statusCode = 409;
            throw error;
        }
        if (this.exitingMatches.has(match.name) ||
            this.resettingMatches.has(match.name)) {
            const error = new Error(`La partida "${match.name}" ya está cambiando de estado.`);
            error.statusCode = 409;
            throw error;
        }

        this.exitingMatches.add(match.name);
        try {
            await this.mc.waitForPersistence(match.name);
            let matchToResume = match;
            if (match.autoSave === false) {
                const snapshot = await this.mc.data.getMatchSnapshot(match.name);
                if (!snapshot) {
                    const error = new Error('No hay un guardado al que volver.');
                    error.statusCode = 409;
                    throw error;
                }

                matchToResume = restoreMatch(snapshot, this.mc);
                if (matchToResume.name !== match.name ||
                    matchToResume.id !== match.id) {
                    const error = new Error('El guardado no corresponde a esta partida.');
                    error.statusCode = 409;
                    throw error;
                }

                match.playing = false;
                this.mc.mcSocket.dialogSocket.clearPending(match.name);
                this.mc.mcSocket.dispatch(
                    match.name,
                    EVENTS.TURN.END,
                    {reset: true},
                );
                this.mc.setMatch(matchToResume);
                params.match = matchToResume;
            }

            await this.mc.mcSocket.closeMatch(match.name);
            if (matchToResume !== match &&
                matchToResume.initialized &&
                !matchToResume.gameOverReason) {
                matchToResume.startMatch().catch(error => {
                    if (this.mc.getMatch(match.name) === matchToResume) {
                        console.error(
                            `Failed to resume saved match "${match.name}" after creator exit`,
                            error,
                        );
                    }
                });
            }

            return {id: match.id, name: match.name};
        } finally {
            this.exitingMatches.delete(match.name);
        }
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
        if (this.resettingMatches.has(currentMatch.name) ||
            this.exitingMatches.has(currentMatch.name)) {
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
            match.autoSave = currentMatch.autoSave !== false;
            if (match.creationConfig) {
                match.creationConfig.expert = match.expert;
                match.creationConfig.autoSave = match.autoSave;
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
                if (match.autoSave !== false) {
                    await this.mc.persistMatch(match);
                }
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
                autoSave: match.autoSave !== false,
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
            match.autoSave = lobby?.autoSave ?? match.autoSave ?? true;
            match.creationConfig ??= {
                players: [], scenario: null, expert: false, autoSave: true,
            };
            match.creationConfig.expert = match.expert;
            match.creationConfig.autoSave = match.autoSave !== false;
            await match.initMatch(match.expert);

            return await match.toObjWithPlayableHands();
        } finally {
            match.initializing = false;
        }
    }
}