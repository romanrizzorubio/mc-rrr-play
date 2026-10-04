import {createServer} from 'node:http';

import express from 'express';
import {Server} from 'socket.io';
import {MongoDataStore} from 'mc-data';

import {restoreMatch, serializeMatch} from '../utils/match-serialization.js';
import {McRest} from './rest/mc-rest.js';
import {McSocket} from './socket/mc-socket.js';

export class Mc {
    constructor() {
        this.app = null;

        this.matches = {};
        this.persistenceQueues = new Map();
        this.deletingMatches = new Set();
        this.data = new MongoDataStore();

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
    async persistMatch(match) {
        const assertMatchCanBePersisted = () => {
            if (this.deletingMatches.has(match.name) ||
                this.getMatch(match.name) !== match) {
                throw new Error(`La partida "${match.name}" ya no está disponible.`);
            }
        };
        assertMatchCanBePersisted();

        const save = () => this.data.saveMatchSnapshot(
            match.name,
            serializeMatch(match),
        );
        const previous = this.persistenceQueues.get(match.name);
        const persist = () => {
            assertMatchCanBePersisted();

            return save();
        };
        const pending = previous ? previous.then(persist, persist) : persist();
        this.persistenceQueues.set(match.name, pending);

        try {
            await pending;
        } finally {
            if (this.persistenceQueues.get(match.name) === pending) {
                this.persistenceQueues.delete(match.name);
            }
        }
    }
    async deleteMatch(name) {
        const match = this.getMatch(name);
        if (!match) {
            throw new Error(`No existe la partida "${name}".`);
        }
        if (match.initializing) {
            throw new Error(`No se puede eliminar la partida "${name}" mientras se inicializa.`);
        }
        if (this.deletingMatches.has(name)) {
            throw new Error(`La partida "${name}" ya se está eliminando.`);
        }

        this.deletingMatches.add(name);
        const removeSnapshot = () => this.data.deleteMatchSnapshot(name);
        const previous = this.persistenceQueues.get(name);
        const pending = previous ?
            previous.then(removeSnapshot, removeSnapshot) :
            removeSnapshot();
        this.persistenceQueues.set(name, pending);

        try {
            await pending;
            match.playing = false;
            if (this.matches[name] === match) {
                delete this.matches[name];
            }
            this.mcSocket.dialogSocket.clearPending(name);
        } finally {
            if (this.persistenceQueues.get(name) === pending) {
                this.persistenceQueues.delete(name);
            }
            this.deletingMatches.delete(name);
        }
    }
    async restoreMatches() {
        const snapshots = await this.data.getMatchSnapshots();

        snapshots.forEach(({_id, snapshot}) => {
            const match = restoreMatch(snapshot, this);
            if (match.name !== _id) {
                throw new Error(`Match snapshot id "${_id}" does not match "${match.name}"`);
            }
            this.setMatch(match);
        });

        Object.values(this.matches)
            .filter(match => match.initialized && match.playing)
            .forEach(match => {
                match.startMatch().catch(error => {
                    if (this.getMatch(match.name) === match) {
                        console.error(`Failed to resume match "${match.name}"`, error);
                    }
                });
            });
    }
    async init() {
        await this.data.connect();
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            connectionStateRecovery: {},
            cors: {
                origin: '*'
            }
        });

        this.mcRest.createEndpoints();
        this.mcSocket.init(this.io);
        await this.restoreMatches();

        this.server.listen(3000, () => {
            console.log('server running at http://localhost:3000');
        });
    }
    async close() {
        try {
            await Promise.all(this.persistenceQueues.values());
        } finally {
            await this.data.close();
        }
    }
}