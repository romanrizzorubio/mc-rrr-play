import {INTERNAL_ENDPOINTS} from 'mc-endpoints';
import {createMatchLobbyError} from './utils/match-lobby-error.js';

export class MatchLobbyStartService {
    constructor({data, matchService, lobbyService}) {
        this.data = data;
        this.matchService = matchService;
        this.lobbyService = lobbyService;
        this.startTasks = new Map();
    }
    async callMatchService(endpoint, body, match, cookie, method = 'POST') {
        const headers = {
            'content-type': 'application/json',
            cookie,
            match: match || '',
        };
        let response;
        try {
            response = await fetch(new URL(endpoint, this.matchService), {
                method,
                headers,
                ...(method === 'GET' || method === 'HEAD' ? {} : {
                    body: JSON.stringify(body || {}),
                }),
            });
        } catch (cause) {
            throw createMatchLobbyError('No se pudo conectar con mc-back.', 502, {cause});
        }

        const responseText = await response.text();
        let responseBody;
        try {
            responseBody = responseText ? JSON.parse(responseText) : undefined;
        } catch {
            responseBody = undefined;
        }
        if (!response.ok) {
            throw createMatchLobbyError(
                responseBody?.error?.message || 'mc-back no pudo iniciar la partida.',
                responseBody?.error?.status || response.status,
            );
        }

        return responseBody;
    }
    async getStartResponse(lobby) {
        const identity = lobby.startingMatch || lobby.startedMatch || {
            id: lobby.id,
            name: lobby.name,
        };

        return {
            lobby: await this.lobbyService.formatLobby(lobby),
            matchId: identity.id,
            matchName: identity.name,
            expert: lobby.expert,
            autoSave: lobby.autoSave !== false,
        };
    }
    async configureMatchLobby(lobby, cookie) {
        const identity = lobby.startingMatch;
        if (!identity) {
            throw createMatchLobbyError(
                'La sala no tiene una identidad de partida persistida.',
                409,
            );
        }

        const createdMatch = await this.callMatchService(
            INTERNAL_ENDPOINTS.MATCH.CREATE,
            {name: identity.name, lobbyId: lobby.id},
            '',
            cookie,
        );
        if (createdMatch?.id !== identity.id || createdMatch?.name !== identity.name) {
            throw createMatchLobbyError(
                'mc-back devolvió una identidad distinta a la guardada.',
                409,
            );
        }

        let playerCount = Array.isArray(createdMatch.players) ?
            createdMatch.players.length :
            0;
        while (playerCount < lobby.players.length) {
            await this.callMatchService(
                INTERNAL_ENDPOINTS.PLAYER.CREATE,
                {initial: playerCount === 0},
                identity.name,
                cookie,
            );
            playerCount++;
        }
        if (!createdMatch.scenario) {
            await this.callMatchService(
                INTERNAL_ENDPOINTS.SCENARIO.CREATE,
                {},
                identity.name,
                cookie,
            );
        }

        const readyLobby = await this.data.markMatchLobbyReady(lobby.id);
        if (readyLobby) {
            return this.getStartResponse(readyLobby);
        }
        const latestLobby = await this.data.getMatchLobby(lobby.id);
        if (latestLobby?.status === 'started') {
            return this.getStartResponse(latestLobby);
        }

        throw createMatchLobbyError(
            'No se pudo confirmar la configuración de la sala.',
            409,
        );
    }
    async start(req) {
        const user = await this.lobbyService.authenticate(req);
        let lobby = await this.data.getMatchLobby(req.params.id);
        if (!lobby) {
            throw createMatchLobbyError('No se encontró la sala.', 404);
        }
        if (lobby.creatorId !== user.id) {
            throw createMatchLobbyError('Solo el creador puede iniciar la partida.', 403);
        }
        if (lobby.status === 'started') {
            return this.getStartResponse(lobby);
        }
        if (lobby.status === 'waiting') {
            if (!lobby.players.length) {
                throw createMatchLobbyError('Añade al menos un superhéroe antes de iniciar la partida.', 409);
            }
            const startingMatch = {
                id: lobby.id,
                name: lobby.name,
                configured: false,
            };
            const claimedLobby = await this.data.claimMatchLobbyStart(
                lobby.id,
                user.id,
                startingMatch,
            );
            if (claimedLobby) {
                lobby = claimedLobby;
            } else {
                lobby = await this.data.getMatchLobby(lobby.id);
            }
        }
        if (lobby?.status !== 'starting') {
            throw createMatchLobbyError('La sala ya no puede iniciarse.', 409);
        }

        const pendingStart = this.startTasks.get(lobby.id);
        if (pendingStart) {
            return pendingStart;
        }

        const task = this.configureMatchLobby(lobby, req.headers.cookie);
        this.startTasks.set(lobby.id, task);
        try {
            return await task;
        } finally {
            if (this.startTasks.get(lobby.id) === task) {
                this.startTasks.delete(lobby.id);
            }
        }
    }
}
