import { Manager } from '/node_modules/socket.io-client/dist/socket.io.esm.min.js';

import {EVENTS} from 'mc-endpoints';
import {parseApiResponse} from '../../utils/api-response.js';

export const METHODS = {
    DELETE: 'DELETE',
    GET: 'GET',
    POST: 'POST',
};

const SOCKET_ACK_TIMEOUT = 10000;

export class Api {
    constructor() {
        this.wsHost = 'ws://localhost:3000';
        this.httpHost = 'http://localhost:3000';

        this.match = '';
        this.matchReady = false;
        this.joinedMatch = '';
        this.joinPromise = null;
        this.connectionState = 'connecting';
        this.connectionListeners = new Set();
        this.errorListeners = new Set();

        this.manager = null;
        this.socket = null;
    }
    init() {
        this.manager = new Manager(this.wsHost, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            reconnectionDelayMax: 5000,
            timeout: SOCKET_ACK_TIMEOUT,
        });
        this.socket = this.manager.socket('/'); // main namespace
        this.socket.on('connect', () => {
            this.joinedMatch = '';
            if (this.matchReady) {
                this.joinMatch(true);
            } else {
                this.setConnectionState('connected');
            }
        });
        this.socket.on('disconnect', () => {
            this.joinedMatch = '';
            this.setConnectionState('disconnected');
        });
        this.socket.on('connect_error', () => {
            this.setConnectionState('disconnected');
        });
    }
    markMatchReady() {
        this.matchReady = true;
    }
    beginMatch(match) {
        this.match = match;
        this.matchReady = false;
        this.joinedMatch = '';
    }
    onConnectionState(callback) {
        this.connectionListeners.add(callback);
        callback(this.connectionState);

        return () => this.connectionListeners.delete(callback);
    }
    onCommunicationError(callback) {
        this.errorListeners.add(callback);

        return () => this.errorListeners.delete(callback);
    }
    setConnectionState(state) {
        this.connectionState = state;
        this.connectionListeners.forEach(callback => callback(state));
    }
    reportCommunicationError(error) {
        this.errorListeners.forEach(callback => callback(error));
    }
    joinMatch(forceRefresh = false) {
        if (!this.matchReady || !this.match || !this.socket?.connected) {
            return Promise.resolve(false);
        }
        if (this.joinPromise) {
            return this.joinPromise.then(joined =>
                forceRefresh || !joined || this.joinedMatch !== this.match ?
                    this.joinMatch(forceRefresh) :
                    joined);
        }
        if (!forceRefresh && this.joinedMatch === this.match) {
            return Promise.resolve(true);
        }

        const match = this.match;
        this.setConnectionState('syncing');
        const joinPromise = this.emitWithAck(EVENTS.MATCH.JOIN, {match})
            .then(() => {
                this.joinedMatch = match;
                this.setConnectionState('connected');
                return true;
            })
            .catch(error => {
                this.joinedMatch = '';
                this.setConnectionState('sync-error');
                this.reportCommunicationError(error);
                return false;
            })
            .finally(() => {
                if (this.joinPromise === joinPromise) {
                    this.joinPromise = null;
                }
            });

        this.joinPromise = joinPromise;

        return joinPromise;
    }
    listen({event, callback}) {
        this.socket.on(event, callback);
    }
    listenCard(callback) {
        this.listen({
            event: EVENTS.CARD.REFRESH,
            callback: params => {
                callback(params);
            }
        });
    }
    listenDeck(callback) {
        this.listen({
            event: EVENTS.DECK.REFRESH,
            callback,
        });
    }
    listenHand(callback) {
        this.listen({
            event: EVENTS.HAND.REFRESH,
            callback,
        });
    }
    listenMatch(callback) {
        this.listen({
            event: EVENTS.MATCH.REFRESH,
            callback,
        });
    }
    listenPlayer(callback) {
        this.listen({
            event: EVENTS.PLAYER.REFRESH,
            callback: params => {
                callback(params);
            }
        });
    }
    listenPlayerZone(callback) {
        this.listen({
            event: EVENTS.PLAYER_ZONE.REFRESH,
            callback: params => {
                callback(params);
            }
        });
    }
    listenScenario(callback) {
        this.listen({
            event: EVENTS.SCENARIO.REFRESH,
            callback
        });
    }
    listenScenarioZone(callback) {
        this.listen({
            event: EVENTS.SCENARIO_ZONE.REFRESH,
            callback: params => {
                callback(params);
            }
        });
    }
    get(params) {
        return this.request({
            ...params,
            method: METHODS.GET,
        });
    }
    post(params) {
        return this.request({
            ...params,
            method: METHODS.POST,
            body: JSON.stringify(params.params),
        });
    }
    delete(params) {
        return this.request({
            ...params,
            method: METHODS.DELETE,
            body: JSON.stringify(params.params),
        });
    }
    async request(params) {
        const {match} = this;
        const {endpoint} = params;
        const options = {
            ...params,
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                match,
            },
        };

        const response = await fetch(new URL(endpoint, this.httpHost), options);

        return parseApiResponse(response);
    }
    async send({endpoint, params = {}}) {
        const match = params.match || this.match;
        const synchronized = this.joinedMatch === match || await this.joinMatch();
        if (!synchronized || this.joinedMatch !== match) {
            throw new Error('La conexión todavía no está sincronizada con esta partida.');
        }

        return this.emitWithAck(endpoint, {
            ...params,
            match,
        });
    }
    emitWithAck(endpoint, params) {
        if (!this.socket?.connected) {
            return Promise.reject(new Error('No hay conexión con el servidor.'));
        }

        return new Promise((resolve, reject) => {
            this.socket.timeout(SOCKET_ACK_TIMEOUT).emit(endpoint, params, (error, response) => {
                if (error) {
                    reject(new Error(`El servidor no confirmó el evento "${endpoint}" a tiempo.`));
                } else if (!response?.ok) {
                    reject(new Error(response?.error || `El servidor rechazó el evento "${endpoint}".`));
                } else {
                    resolve(response);
                }
            });
        });
    }
}