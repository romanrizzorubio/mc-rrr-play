import { Manager } from "https://cdn.socket.io/4.7.2/socket.io.esm.min.js";
import {endpoints} from "../../misc/endpoints.js";
export const METHODS = {
    GET: 'GET',
    POST: 'POST',
}
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
        this.socket = this.manager.socket("/"); // main namespace
        this.socket.on("connect", () => {
            console.log('this.socket.recovered', this.socket.recovered);
        });
    }
    listen({event, callback}) {
        this.socket.on(event, callback);
    }
    listenCard(callback) {
        this.listen({
            event: endpoints.card.refresh,
            callback: params => {
                callback(params)
            }
        });
    }
    listenDeck(callback) {
        this.listen({
            event: endpoints.deck.refresh,
            callback,
        });
    }
    listenHand(callback) {
        this.listen({
            event: endpoints.hand.refresh,
            callback,
        });
    }
    listenMatch(callback) {
        this.listen({
            event: endpoints.match.refresh,
            callback,
        });
    }
    listenPlayer(callback) {
        this.listen({
            event: endpoints.player.refresh,
            callback: params => {
                callback(params)
            }
        });
    }
    listenPlayerZone(callback) {
        this.listen({
            event: endpoints.playerZone.refresh,
            callback: params => {
                callback(params)
            }
        });
    }
    listenScenario(callback) {
        this.listen({
            event: endpoints.scenario.refresh,
            callback
        });
    }
    listenScenarioZone(callback) {
        this.listen({
            event: endpoints.scenarioZone.refresh,
            callback: params => {
                callback(params);
            }
        });
    }
    listenTurn(callback) {
        this.listen({
            event: endpoints.turn.init,
            callback
        });
    }
    get(params) {
        return this.request({
            ...params,
            method: METHODS.GET,
        })
    }
    post(params) {
        return this.request({
            ...params,
            method: METHODS.POST,
            body: JSON.stringify(params.params),
        })
    }
    async request(params) {
        const {match} = this;
        const {endpoint} = params;
        const options = {
            ...params,
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
                match,
            },
        };

        const response = await fetch(`${this.httpHost}/${endpoint}`, options);

        return await response.json();
    }
    send({endpoint, event, params}) {
        return new Promise((resolve, reject) => {
            if (event) {
                this.listen({
                    event,
                    callback: resolve,
                })
            }
            this.socket.emit(endpoint, params);
        })
    }
}