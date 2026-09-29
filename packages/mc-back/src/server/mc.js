import {McRest} from "./rest/mc-rest.js";
import express from "express";
import {createServer} from "node:http";
import {Server} from "socket.io";
import {McSocket} from "./socket/mc-socket.js";

export class Mc {
    constructor() {
        this.app = null;
        this.socket = null;

        this.matches = {};

        this.mcRest = new McRest(this);
        this.mcSocket = new McSocket(this);
    }
    get dialog() {
        return this.mcSocket.dialogSocket;
    }
    getMatch(name) {
        return this.matches[name];
    }
    setMatch(match) {
        this.matches[match.name] = match;
    }
    init() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            connectionStateRecovery: {},
            cors: {
                origin: "*"
            }
        });

        this.mcRest.createEndpoints();

        this.io.on('connection', socket => {
            this.socket = socket;
            console.log('socket.recovered', socket.recovered)
        });

        this.server.listen(3000, () => {
            console.log('server running at http://localhost:3000');
        });
    }
}