import {randomUUID} from 'node:crypto';
import {EVENTS} from 'mc-endpoints';
import {AuthServiceClient} from '../../utils/auth-service-client.js';
import {findPlayerSeat} from '../../utils/player-seat.js';

import {DialogSocket} from './dialog-socket.js';

export class McSocket {
    constructor(mc) {
        this.mc = mc;

        this.io = null;
        this.listeners = new Map();
        this.dialogSocket = new DialogSocket(this);
    }
    init(io) {
        this.io = io;
        io.use((socket, next) => {
            AuthServiceClient.authenticate(socket.handshake.headers.cookie).then(
                user => {
                    socket.data.user = {id: user.id, name: user.name};
                    next();
                },
                next,
            );
        });
        io.on('connection', socket => this.handleConnection(socket));
    }
    roomName(matchName) {
        return `mc-match:${matchName}`;
    }
    isMatchAvailable(match) {
        return this.mc.getMatch(match.name) === match &&
            !this.mc.deletingMatches.has(match.name);
    }
    handleConnection(socket) {
        socket.on(EVENTS.MATCH.JOIN, (params, acknowledge) => {
            this.joinMatch(socket, params).then(
                response => this.acknowledge(acknowledge, response),
                error => {
                    console.error('Failed to join Socket.IO match room', error);
                    this.acknowledge(acknowledge, {
                        ok: false,
                        error: error.message,
                    });
                },
            );
        });

        [EVENTS.TURN.END, EVENTS.DIALOG.RESPONSE].forEach(endpoint => {
            socket.on(endpoint, (params, acknowledge) => {
                this.handleClientEvent(socket, endpoint, params, acknowledge);
            });
        });
        socket.on(EVENTS.CHAT.SEND, (params, acknowledge) => {
            this.handleChatMessage(socket, params, acknowledge);
        });
    }
    async joinMatch(socket, params) {
        const requestedMatch = params?.match;
        if (!requestedMatch) {
            throw new Error('Falta el identificador de la partida al unirse al socket.');
        }

        const match = this.mc.getMatch(requestedMatch);
        if (!match) {
            throw new Error(`No existe la partida "${requestedMatch}" en el backend.`);
        }
        const userId = socket.data.user?.id;
        if (!userId || !match.players.some(player => player.userId === userId)) {
            const error = new Error('No tienes un jugador en esta partida.');
            error.statusCode = 403;
            throw error;
        }
        const matchName = match.name;

        const previousMatch = socket.data.match;
        if (previousMatch && previousMatch !== matchName) {
            await socket.leave(this.roomName(previousMatch));
        }
        await socket.join(this.roomName(matchName));
        socket.data.match = matchName;
        if (match.initialized) {
            const matchState = await match.toObjWithPlayableHands();
            socket.emit(EVENTS.MATCH.REFRESH, matchState);
        }
        socket.emit(EVENTS.CHAT.STATE, match.getChatState());
        this.dialogSocket.resendPending(matchName, socket);

        return {ok: true};
    }
    listen(matchName, endpoint, callback, once = false) {
        let matchListeners = this.listeners.get(matchName);
        if (!matchListeners) {
            matchListeners = new Map();
            this.listeners.set(matchName, matchListeners);
        }

        let endpointListeners = matchListeners.get(endpoint);
        if (!endpointListeners) {
            endpointListeners = new Set();
            matchListeners.set(endpoint, endpointListeners);
        }

        const listener = {callback, once};
        endpointListeners.add(listener);

        return () => this.removeListener(matchName, endpoint, listener);
    }
    removeListener(matchName, endpoint, listener) {
        const matchListeners = this.listeners.get(matchName);
        const endpointListeners = matchListeners?.get(endpoint);

        if (!endpointListeners) {
            return;
        }

        endpointListeners.delete(listener);
        if (!endpointListeners.size) {
            matchListeners.delete(endpoint);
        }
        if (!matchListeners.size) {
            this.listeners.delete(matchName);
        }
    }
    dispatch(matchName, endpoint, params) {
        const endpointListeners = this.listeners.get(matchName)?.get(endpoint);
        if (!endpointListeners?.size) {
            return false;
        }

        for (const listener of [...endpointListeners]) {
            if (listener.once) {
                this.removeListener(matchName, endpoint, listener);
            }
            listener.callback(params);
        }

        return true;
    }
    handleClientEvent(socket, endpoint, params, acknowledge) {
        try {
            const matchName = params?.match;
            if (!matchName) {
                throw new Error('Falta el identificador de la partida en el evento.');
            }
            if (!socket.rooms.has(this.roomName(matchName))) {
                throw new Error('El socket no está unido a esa partida.');
            }
            const match = this.mc.getMatch(matchName);
            const userId = socket.data.user?.id;
            if (!match || !userId ||
                !match.players.some(player => player.userId === userId)) {
                throw new Error('No tienes un jugador en esta partida.');
            }

            if (endpoint === EVENTS.TURN.END) {
                const ownedPlayers = match.players.filter(player => player.userId === userId);
                const player = params.player ?
                    findPlayerSeat(match.players, params.player) :
                    (ownedPlayers.length === 1 ? ownedPlayers[0] : undefined);
                if (!player || player.userId !== userId ||
                    player !== match.currentTurnPlayer) {
                    throw new Error('Solo el jugador del turno puede finalizarlo.');
                }
            }
            if (endpoint === EVENTS.TURN.END && match.actionRequest) {
                throw new Error('No se puede finalizar el turno mientras haya una solicitud de acción activa.');
            }
            const handled = endpoint === EVENTS.DIALOG.RESPONSE ?
                this.dialogSocket.respond(matchName, params, userId) :
                this.dispatch(matchName, endpoint, params);
            if (!handled) {
                throw new Error(endpoint === EVENTS.TURN.END ?
                    'No hay ningún turno esperando para finalizar.' :
                    'No hay ningún diálogo esperando esa respuesta.');
            }

            if (endpoint === EVENTS.DIALOG.RESPONSE) {
                // Keep the current modal alive until the resumed effect can emit its next prompt.
                setImmediate(() => this.acknowledge(acknowledge, {ok: true}));
            } else {
                this.acknowledge(acknowledge, {ok: true});
            }
        } catch (error) {
            this.acknowledge(acknowledge, {
                ok: false,
                error: error.message,
            });
        }
    }
    handleChatMessage(socket, params, acknowledge) {
        try {
            const matchName = params?.match;
            const roomName = matchName && this.roomName(matchName);
            if (!matchName || !socket.rooms.has(roomName)) {
                throw new Error('El socket no está unido a esa partida.');
            }

            const match = this.mc.getMatch(matchName);
            const user = socket.data.user;
            if (!match || !user?.id ||
                !match.players.some(player => player.userId === user.id)) {
                throw new Error('No tienes un jugador en esta partida.');
            }
            if (!match.chatEnabled) {
                throw new Error('El chat está deshabilitado durante la resolución de Peligro.');
            }

            const text = typeof params.message === 'string' ?
                params.message.trim() :
                '';
            if (!text || text.length > 500) {
                throw new Error('El mensaje debe tener entre 1 y 500 caracteres.');
            }

            const message = {
                id: randomUUID(),
                userId: user.id,
                userName: user.name,
                text,
                sentAt: new Date().toISOString(),
            };
            match.addChatMessage(message);
            this.send(matchName, EVENTS.CHAT.MESSAGE, message);
            this.acknowledge(acknowledge, {ok: true});
        } catch (error) {
            this.acknowledge(acknowledge, {
                ok: false,
                error: error.message,
            });
        }
    }
    acknowledge(acknowledge, response) {
        if (typeof acknowledge === 'function') {
            acknowledge(response);
        }
    }
    send(matchName, endpoint, params) {
        if (!this.io) {
            throw new Error('Socket.IO todavía no está inicializado.');
        }

        this.io.to(this.roomName(matchName)).emit(endpoint, params);
    }
}