import { Manager } from '/node_modules/socket.io-client/dist/socket.io.esm.min.js';

import {EVENTS} from 'mc-endpoints';

export const METHODS = {
    GET: 'GET',
    POST: 'POST',
};
export class Api {
    constructor() {
        this.wsHost = 'ws://localhost:3000';
        this.httpHost = 'http://localhost:3000';

        this.match = '';

        this.manager = null;
        this.socket = null;
    }
    init() {
        this.manager = new Manager(this.wsHost);
        this.socket = this.manager.socket('/'); // main namespace
        this.socket.on('connect', () => {
            console.log('this.socket.recovered', this.socket.recovered);
        });
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

        return await response.json();
    }
    send({endpoint, event, params}) {
        return new Promise((resolve) => {
            if (event) {
                this.listen({
                    event,
                    callback: resolve,
                });
            }
            this.socket.emit(endpoint, params);
        });
    }
}