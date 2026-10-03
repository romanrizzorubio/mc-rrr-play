import {EVENTS} from 'mc-endpoints';

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
        io.on('connection', socket => this.handleConnection(socket));
    }
    roomName(matchName) {
        return `mc-match:${matchName}`;
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
    }
    async joinMatch(socket, params) {
        const matchName = params?.match;
        if (!matchName) {
            throw new Error('Falta el identificador de la partida al unirse al socket.');
        }

        const match = this.mc.getMatch(matchName);
        if (!match) {
            throw new Error(`No existe la partida "${matchName}" en el backend.`);
        }

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

            const handled = endpoint === EVENTS.DIALOG.RESPONSE ?
                this.dialogSocket.respond(matchName, params) :
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