import {AuthServiceClient} from './auth-service-client.js';
import {createMatchLobbyError} from './utils/match-lobby-error.js';
import {getLobbyPlayerSeats} from 'mc-data';

export class MatchLobbyService {
    constructor({
        data,
        authServiceUrl = process.env.AUTH_SERVICE_URL || 'https://localhost:3003',
    }) {
        this.data = data;
        this.authServiceUrl = authServiceUrl;
    }
    error(message, statusCode) {
        return createMatchLobbyError(message, statusCode);
    }
    async authenticate(req) {
        return AuthServiceClient.authenticate(
            req.headers.cookie,
            this.authServiceUrl,
        );
    }
    async validatePlayer(player, user) {
        if (!player || typeof player.hero !== 'string' || !player.hero.trim()) {
            throw this.error('Debes seleccionar un superhéroe.', 400);
        }
        const hero = player.hero.trim();

        let heroConfig;
        try {
            heroConfig = await this.data.getHeroConfig(hero);
        } catch {
            throw this.error(`No se encontró el superhéroe "${hero}".`, 400);
        }

        let aspect = heroConfig.aspect;
        if (player.deckId !== undefined && player.deckId !== null && player.deckId !== '') {
            if (typeof player.deckId !== 'string' || !player.deckId.trim()) {
                throw this.error('El mazo seleccionado no es válido.', 400);
            }
            const deckId = player.deckId.trim();

            try {
                const deckConfig = await this.data.getDeckConfig(deckId, hero);
                aspect = deckConfig.aspect;
            } catch (error) {
                throw this.error(error.message || 'El mazo seleccionado no es válido.', 400);
            }
        }

        return {
            userId: user.id,
            name: user.name,
            hero,
            deckId: player.deckId?.trim() || null,
            aspect: aspect || '',
        };
    }
    async validateScenario(scenario) {
        if (!scenario || typeof scenario.scenario !== 'string' ||
            !scenario.scenario.trim()) {
            throw this.error('Debes seleccionar un escenario.', 400);
        }
        const scenarioId = scenario.scenario.trim();

        const scenarios = await this.data.getScenariosList();
        const scenarioInfo = scenarios.find(({folder}) =>
            folder === scenarioId);
        if (!scenarioInfo) {
            throw this.error(`No se encontró el escenario "${scenarioId}".`, 400);
        }

        let scenarioConfig;
        try {
            scenarioConfig = await this.data.getScenarioConfig(scenarioId);
        } catch {
            throw this.error(`No se encontró el escenario "${scenarioId}".`, 400);
        }

        const configuredDefaultSets = scenarioConfig.defaultSets || [];
        let selectedModularSets = scenario.modularSets;
        if (selectedModularSets === undefined) {
            selectedModularSets = [];
            for (const id of configuredDefaultSets) {
                try {
                    if ((await this.data.getSetConfig(id)).standard === false) {
                        selectedModularSets.push(id);
                    }
                } catch {
                    throw this.error(`No se encontró el conjunto "${id}".`, 400);
                }
            }
        }
        if (!Array.isArray(selectedModularSets) ||
            selectedModularSets.some(id => typeof id !== 'string' || !id)) {
            throw this.error('La selección de conjuntos modulares no es válida.', 400);
        }
        if (new Set(selectedModularSets).size !== selectedModularSets.length) {
            throw this.error('La selección de conjuntos modulares contiene duplicados.', 400);
        }
        for (const id of selectedModularSets) {
            let setConfig;
            try {
                setConfig = await this.data.getSetConfig(id);
            } catch {
                throw this.error(`No se encontró el conjunto "${id}".`, 400);
            }
            if (setConfig.standard !== false) {
                throw this.error(`"${id}" no es un conjunto modular seleccionable.`, 400);
            }
        }

        return {
            id: scenarioId,
            name: scenarioInfo.name,
            modularSets: [...selectedModularSets],
        };
    }
    async formatLobby(lobby) {
        const [heroes, modularSets] = await Promise.all([
            this.data.getHeroesList(),
            this.data.getModularSetsList(),
        ]);
        const heroNames = new Map(heroes.map(hero => [
            hero.id || hero.folder,
            hero.name,
        ]));
        const modularSetNames = new Map(modularSets.map(set => [
            set.id,
            set.name,
        ]));
        const matchIdentity = lobby.startedMatch || lobby.startingMatch;

        return {
            id: lobby.id,
            name: lobby.name,
            status: lobby.status,
            maxPlayers: lobby.maxPlayers,
            ownerId: lobby.creatorId,
            players: getLobbyPlayerSeats(lobby).map(player => ({
                id: player.id,
                userId: player.userId,
                name: player.name,
                hero: player.hero,
                heroName: heroNames.get(player.hero) || player.hero,
                aspect: player.aspect,
                deckId: player.deckId ?? null,
            })),
            scenarioName: lobby.scenario.name,
            expert: lobby.expert,
            autoSave: lobby.autoSave !== false,
            modularSetNames: lobby.scenario.modularSets.map(id =>
                modularSetNames.get(id) || id),
            matchId: matchIdentity?.id || null,
        };
    }
    async create(req) {
        const user = await this.authenticate(req);
        const {
            name: requestedName,
            maxPlayers,
            scenario,
            expert = false,
            autoSave = true,
        } = req.body || {};
        const name = typeof requestedName === 'string' ? requestedName.trim() : '';

        if (!name || name.length > 80) {
            throw this.error('El nombre de la sala debe tener entre 1 y 80 caracteres.', 400);
        }
        if (!Number.isInteger(maxPlayers) || maxPlayers < 1 || maxPlayers > 4) {
            throw this.error('El número máximo de jugadores debe estar entre 1 y 4.', 400);
        }
        if (typeof expert !== 'boolean') {
            throw this.error('La dificultad seleccionada no es válida.', 400);
        }
        if (typeof autoSave !== 'boolean') {
            throw this.error('La opción Guardado automático no es válida.', 400);
        }

        const validatedScenario = await this.validateScenario(scenario);

        const lobby = await this.data.createMatchLobby({
            name,
            maxPlayers,
            creatorId: user.id,
            scenario: validatedScenario,
            expert,
            autoSave,
        });

        return this.formatLobby(lobby);
    }
    async list() {
        const lobbies = await this.data.getWaitingMatchLobbies();

        return Promise.all(lobbies.map(lobby => this.formatLobby(lobby)));
    }
    async get(req) {
        await this.authenticate(req);
        const lobby = await this.data.getMatchLobby(req.params.id);
        if (!lobby) {
            throw this.error('No se encontró la sala.', 404);
        }

        return this.formatLobby(lobby);
    }
    async join(req) {
        const user = await this.authenticate(req);
        const lobby = await this.data.getMatchLobby(req.params.id);
        if (!lobby) {
            throw this.error('No se encontró la sala.', 404);
        }
        if (lobby.status !== 'waiting') {
            throw this.error('La sala ya no está esperando jugadores.', 409);
        }
        if (lobby.players.length >= lobby.maxPlayers) {
            throw this.error('La sala está completa.', 409);
        }
        if (lobby.players.some(({hero}) => hero === req.body?.hero)) {
            throw this.error('Ese superhéroe ya está seleccionado en la sala.', 409);
        }

        const player = await this.validatePlayer(req.body, user);
        const updatedLobby = await this.data.joinMatchLobby(lobby.id, player);
        if (updatedLobby) {
            return this.formatLobby(updatedLobby);
        }

        const latestLobby = await this.data.getMatchLobby(lobby.id);
        if (!latestLobby) {
            throw this.error('No se encontró la sala.', 404);
        }
        if (latestLobby.players.some(({hero}) => hero === player.hero)) {
            throw this.error('Ese superhéroe ya está seleccionado en la sala.', 409);
        }
        if (latestLobby.players.length >= latestLobby.maxPlayers) {
            throw this.error('La sala está completa.', 409);
        }

        throw this.error('La sala ya no está esperando jugadores.', 409);
    }
    async leave(req) {
        const user = await this.authenticate(req);
        const lobby = await this.data.getMatchLobby(req.params.id);
        if (!lobby) {
            throw this.error('No se encontró la sala.', 404);
        }
        if (lobby.creatorId === user.id) {
            throw this.error('El creador no puede abandonar la sala.', 403);
        }
        if (lobby.status !== 'waiting') {
            throw this.error('Solo se puede abandonar una sala en espera.', 409);
        }
        if (!lobby.players.some(({userId}) => userId === user.id)) {
            throw this.error('No formas parte de esta sala.', 404);
        }

        const updatedLobby = await this.data.leaveMatchLobby(lobby.id, user.id);
        if (updatedLobby) {
            return this.formatLobby(updatedLobby);
        }

        throw this.error('La sala ya no está esperando jugadores.', 409);
    }
    async removePlayer(req) {
        const user = await this.authenticate(req);
        const lobby = await this.data.getMatchLobby(req.params.id);
        if (!lobby) {
            throw this.error('No se encontró la sala.', 404);
        }

        const player = getLobbyPlayerSeats(lobby).find(({id}) =>
            id === req.params.playerId
        );
        if (!player) {
            throw this.error('No se encontró la inscripción.', 404);
        }
        if (lobby.creatorId !== user.id && player.userId !== user.id) {
            throw this.error('Solo el jugador inscrito o el creador pueden eliminar esta inscripción.', 403);
        }
        if (lobby.status !== 'waiting') {
            throw this.error('Solo se pueden eliminar inscripciones de una sala en espera.', 409);
        }

        const updatedLobby = await this.data.removeMatchLobbyPlayer(
            lobby.id,
            player.userId,
            player.hero,
        );
        if (updatedLobby) {
            return this.formatLobby(updatedLobby);
        }

        const latestLobby = await this.data.getMatchLobby(lobby.id);
        if (!latestLobby) {
            throw this.error('No se encontró la sala.', 404);
        }
        if (latestLobby.status !== 'waiting') {
            throw this.error('Solo se pueden eliminar inscripciones de una sala en espera.', 409);
        }
        if (!getLobbyPlayerSeats(latestLobby).some(({id}) =>
            id === req.params.playerId
        )) {
            throw this.error('No se encontró la inscripción.', 404);
        }

        throw this.error('La inscripción ya no se puede eliminar.', 409);
    }
    async delete(req) {
        const user = await this.authenticate(req);
        const lobby = await this.data.getMatchLobby(req.params.id);
        if (!lobby) {
            throw this.error('No se encontró la sala.', 404);
        }
        if (lobby.creatorId !== user.id) {
            throw this.error('Solo el creador puede eliminar la sala.', 403);
        }
        if (lobby.status !== 'waiting') {
            throw this.error('Solo se puede eliminar una sala en espera.', 409);
        }
        if (await this.data.deleteMatchLobby(lobby.id, user.id)) {
            return {id: lobby.id};
        }

        throw this.error('La sala ya no está esperando o ya fue eliminada.', 409);
    }
}
