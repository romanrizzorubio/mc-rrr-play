import {ABILITY_ACTION} from 'mc-shared';
import {ENDPOINTS, INTERNAL_ENDPOINTS} from 'mc-endpoints';
import {MatchFactory} from '../../factory/match-factory.js';
import {logGameTrace} from '../../utils/game-trace.js';
import {AuthServiceClient} from '../../utils/auth-service-client.js';
import {getLobbyPlayerSeats} from 'mc-data';
import {
    findPlayerSeat,
    getPlayerSeatId,
    isActionRequestSeat,
} from '../../utils/player-seat.js';

let abilityTraceSequence = 0;

export class PlayerRest {
    constructor(rest) {
        this.rest = rest;
    }
    get mc() {
        return this.rest.mc;
    }
    async getAuthenticatedPlayer(
        {match, cookie, player: requestedPlayer},
        {authorizeAction = true} = {},
    ) {
        if (!match) {
            const error = new Error('No se encontró la partida solicitada.');
            error.statusCode = 404;
            throw error;
        }

        const user = await AuthServiceClient.authenticate(cookie);
        const ownedPlayers = match.players.filter(candidate => candidate.userId === user.id);
        const player = requestedPlayer ?
            findPlayerSeat(ownedPlayers, requestedPlayer) :
            (ownedPlayers.length === 1 ? ownedPlayers[0] : undefined);
        if (!ownedPlayers.length) {
            const error = new Error('No tienes un jugador en esta partida.');
            error.statusCode = 403;
            throw error;
        }
        if (!player || player.userId !== user.id) {
            const error = new Error('No puedes actuar como otro jugador.');
            error.statusCode = 403;
            throw error;
        }

        if (authorizeAction) {
            this.assertPlayerCanAct(match, player);
        }

        return player;
    }
    assertPlayerCanAct(match, player) {
        if (match.initialized === undefined) {
            return;
        }
        if (!match.initialized || match.phase !== 'players' ||
            match.gameOverReason) {
            const error = new Error('Solo se pueden realizar acciones durante la fase de jugador.');
            error.statusCode = 409;
            throw error;
        }

        const request = match.actionRequest;
        if (request?.status === 'pending') {
            const error = new Error('Hay una solicitud de acción pendiente de respuesta.');
            error.statusCode = 409;
            throw error;
        }
        if (request?.status === 'accepted') {
            if (!isActionRequestSeat(match, request, 'target', player)) {
                const error = new Error('La acción fue concedida a otro jugador.');
                error.statusCode = 403;
                throw error;
            }
            return;
        }
        if (getPlayerSeatId(match.currentTurnPlayer) !== getPlayerSeatId(player)) {
            const error = new Error('Solo el jugador del turno puede realizar acciones.');
            error.statusCode = 403;
            throw error;
        }
    }
    async refreshPlayer(match, player) {
        const matchState = await match.refresh();
        const refreshedPlayer = findPlayerSeat(
            matchState.players,
            getPlayerSeatId(player),
        );

        if (!refreshedPlayer) {
            throw new Error(`No se encontró al jugador "${player.name}" en la actualización de la partida.`);
        }

        return refreshedPlayer;
    }
    createEndpoints() {
        this.rest.post(
            INTERNAL_ENDPOINTS.PLAYER.CREATE,
            this.createPlayer.bind(this)
        );
        this.rest.post(ENDPOINTS.PLAYER.FLIP, this.flip.bind(this));
        this.rest.post(ENDPOINTS.PLAYER.PLAY_CARD, this.playCard.bind(this));
        this.rest.post(ENDPOINTS.PLAYER.RESOLVE_ABILITY, this.resolveAbility.bind(this));
        this.rest.post(
            ENDPOINTS.MATCH.REQUEST_ACTION,
            this.requestAction.bind(this),
        );
        this.rest.post(
            ENDPOINTS.MATCH.RESPOND_ACTION,
            this.respondAction.bind(this),
        );
        this.rest.post(
            ENDPOINTS.MATCH.COMPLETE_ACTION,
            this.completeAction.bind(this),
        );
    }
    async createPlayer(params) {
        const {match} = params;
        let {name, hero, initial, deckId} = params;
        let userId;
        let id;

        if (match?.lobbyId) {
            const user = await AuthServiceClient.authenticate(params.cookie);
            if (user.id !== match.creatorUserId) {
                const error = new Error('Solo el creador puede configurar esta partida.');
                error.statusCode = 403;
                throw error;
            }

            const lobby = await this.mc.data.getMatchLobby(match.lobbyId);
            if (!lobby || lobby.status !== 'starting' ||
                lobby.creatorId !== match.creatorUserId) {
                const error = new Error('La sala ya no está disponible para configurar jugadores.');
                error.statusCode = 409;
                throw error;
            }
            const lobbyPlayer = getLobbyPlayerSeats(lobby)[match.players.length];
            if (!lobbyPlayer) {
                const error = new Error('La sala no tiene más jugadores registrados.');
                error.statusCode = 409;
                throw error;
            }

            ({id, name, hero, deckId, userId} = lobbyPlayer);
            initial = match.players.length === 0;
        } else if (params.cookie) {
            const user = await AuthServiceClient.authenticate(params.cookie);
            name = user.name;
            userId = user.id;
        }

        const matchFactory = new MatchFactory(match);

        if (name && hero) {
            const heroConfig = await this.mc.data.getHeroConfig(hero);
            if (deckId) {
                const deckConfig = await this.mc.data.getDeckConfig(deckId, hero);
                heroConfig.precon = deckConfig.cards;
                heroConfig.aspect = deckConfig.aspect;
            }
            const creationPlayerConfig = structuredClone(heroConfig);
            const heroCreated = matchFactory.createSuperhero(heroConfig);
            if (id && match.players.some(player => player.id === id)) {
                const error = new Error('Ya existe este jugador en la partida.');
                error.statusCode = 409;
                throw error;
            }
            if (heroCreated.mainName && match.players.some(player =>
                player.superhero.mainName === heroCreated.mainName)) {
                const error = new Error('Ese superhéroe ya está seleccionado en la partida.');
                error.statusCode = 409;
                throw error;
            }
            if (userId && !match.lobbyId) {
                const ownedPlayers = match.players.filter(player => player.userId === userId);
                if (ownedPlayers.length) {
                    const accountName = name;
                    ownedPlayers.forEach((player, index) => {
                        player.name = `${accountName} (${index + 1})`;
                        const storedPlayer = match.creationConfig?.players.find(config =>
                            config.id === player.id);
                        if (storedPlayer) {
                            storedPlayer.name = player.name;
                        }
                    });
                    name = `${accountName} (${ownedPlayers.length + 1})`;
                }
            }
            const player = match.createPlayer({
                id,
                name,
                userId,
                superhero: heroCreated,
                initial,
                config: heroConfig
            });
            match.creationConfig ??= {players: [], scenario: null, expert: false};
            match.creationConfig.players.push({
                id: player.id,
                name,
                ...(userId ? {userId} : {}),
                initial: initial ?? false,
                config: creationPlayerConfig,
            });

            return player.toObj();
        }
    }
    async flip(params) {
        const {match} = params;
        const player = await this.getAuthenticatedPlayer(params);
        await player.flip(true);

        return this.refreshPlayer(match, player);
    }
    async playCard(params) {
        const {match, cardId, targetId} = params;
        const player = await this.getAuthenticatedPlayer(params);

        await player.playCard({
            cardId,
            abilityType: ABILITY_ACTION,
            targetId,
        });

        return this.refreshPlayer(match, player);
    }
    async resolveAbility(params) {
        const {match, card, ability, targetId, resourcePayment} = params;
        const player = await this.getAuthenticatedPlayer(params);
        const traceId = `ability-${++abilityTraceSequence}`;

        logGameTrace('ability.resolve.start', {
            traceId,
            match: match.name,
            player: player?.name,
        });

        let outcome = 'failed';
        try {
            if (targetId === undefined) {
                await player.resolveAbility(
                    card,
                    ability,
                    undefined,
                    resourcePayment
                );
            } else {
                await player.resolveAbility(
                    card,
                    ability,
                    targetId,
                    resourcePayment
                );
            }
            const result = await this.refreshPlayer(match, player);
            outcome = 'completed';
            return result;
        } finally {
            logGameTrace('ability.resolve.end', {
                traceId,
                outcome,
            });
        }
    }
    async requestAction(params) {
        const {match, targetPlayer} = params;
        const requester = await this.getAuthenticatedPlayer(params);
        const targetIdentifier = typeof targetPlayer === 'string' ?
            targetPlayer.trim() :
            '';

        if (!targetIdentifier) {
            const error = new Error('Debes seleccionar al jugador al que pides una acción.');
            error.statusCode = 400;
            throw error;
        }
        if (match.actionRequest) {
            const error = new Error('Ya hay una solicitud de acción activa.');
            error.statusCode = 409;
            throw error;
        }
        if (match.phase !== 'players' ||
            getPlayerSeatId(match.currentTurnPlayer) !== getPlayerSeatId(requester)) {
            const error = new Error('Solo el jugador del turno puede solicitar una acción.');
            error.statusCode = 403;
            throw error;
        }

        const target = findPlayerSeat(match.players, targetIdentifier);
        if (!target) {
            const error = new Error('No se encontró al jugador solicitado en esta partida.');
            error.statusCode = 404;
            throw error;
        }
        if (!target.userId || getPlayerSeatId(target) === getPlayerSeatId(requester)) {
            const error = new Error('Debes solicitar la acción a otro jugador de la partida.');
            error.statusCode = 400;
            throw error;
        }

        match.actionRequest = {
            requester: requester.name,
            requesterId: getPlayerSeatId(requester),
            requesterUserId: requester.userId,
            target: target.name,
            targetId: getPlayerSeatId(target),
            targetUserId: target.userId,
            status: 'pending',
        };

        return match.refresh();
    }
    async respondAction(params) {
        const {match, accept} = params;
        const player = await this.getAuthenticatedPlayer(params, {
            authorizeAction: false,
        });
        const request = match.actionRequest;

        if (typeof accept !== 'boolean') {
            const error = new Error('La respuesta a la solicitud de acción no es válida.');
            error.statusCode = 400;
            throw error;
        }
        if (!request || request.status !== 'pending') {
            const error = new Error('No hay una solicitud de acción pendiente.');
            error.statusCode = 409;
            throw error;
        }
        if (!isActionRequestSeat(match, request, 'target', player)) {
            const error = new Error('Solo el jugador solicitado puede responder.');
            error.statusCode = 403;
            throw error;
        }

        if (accept) {
            request.status = 'accepted';
        } else {
            match.actionRequest = null;
        }

        return match.refresh();
    }
    async completeAction(params) {
        const {match} = params;
        const player = await this.getAuthenticatedPlayer(params, {
            authorizeAction: false,
        });
        const request = match.actionRequest;

        if (!request || request.status !== 'accepted') {
            const error = new Error('No hay una solicitud de acción aceptada.');
            error.statusCode = 409;
            throw error;
        }
        if (!isActionRequestSeat(match, request, 'target', player)) {
            const error = new Error('Solo el jugador solicitado puede finalizar la acción.');
            error.statusCode = 403;
            throw error;
        }

        match.actionRequest = null;

        return match.refresh();
    }
}