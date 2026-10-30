import {ENDPOINTS} from 'mc-endpoints';
import {MatchLobbyService} from './match-lobby-service.js';
import {MatchLobbyStartService} from './match-lobby-start-service.js';

export class MatchLobbyRest {
    constructor({
        app,
        data,
        matchService,
        authServiceUrl = process.env.AUTH_SERVICE_URL || 'https://localhost:3003',
    }) {
        this.app = app;
        this.lobbyService = new MatchLobbyService({data, authServiceUrl});
        this.startService = new MatchLobbyStartService({
            data,
            matchService,
            lobbyService: this.lobbyService,
        });
    }
    createEndpoints() {
        this.app.get(
            ENDPOINTS.MATCH.LOBBIES,
            this.handle(() => this.lobbyService.list()),
        );
        this.app.post(
            ENDPOINTS.MATCH.LOBBIES,
            this.handle(req => this.lobbyService.create(req), 201),
        );
        this.app.get(
            ENDPOINTS.MATCH_LOBBY.GET,
            this.handle(req => this.lobbyService.get(req)),
        );
        this.app.post(
            ENDPOINTS.MATCH_LOBBY.JOIN,
            this.handle(req => this.lobbyService.join(req)),
        );
        this.app.post(
            ENDPOINTS.MATCH_LOBBY.LEAVE,
            this.handle(req => this.lobbyService.leave(req)),
        );
        this.app.post(
            ENDPOINTS.MATCH_LOBBY.START,
            this.handle(req => this.startService.start(req)),
        );
        this.app.delete(
            ENDPOINTS.MATCH_LOBBY.DELETE,
            this.handle(req => this.lobbyService.delete(req)),
        );
    }
    handle(callback, status = 200) {
        return (req, res, next) => {
            Promise.resolve()
                .then(() => callback(req))
                .then(body => res.status(status).json(body))
                .catch(next);
        };
    }
}
