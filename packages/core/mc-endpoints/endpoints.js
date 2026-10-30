export const ENDPOINTS = {
    MATCH: {
        CREATE: '/create-match',
        DELETE: '/delete-match',
        GET_HEROES_LIST: '/get-heroes-list',
        GET_MATCHES_LIST: '/get-matches-list',
        GET_SCENARIOS_LIST: '/get-scenarios-list',
        GET_MODULAR_SETS_LIST: '/get-modular-sets-list',
        LOBBIES: '/match-lobbies',
        REQUEST_ACTION: '/request-action',
        RESPOND_ACTION: '/respond-action',
        COMPLETE_ACTION: '/complete-action',
        INIT: '/init-match',
        RESET: '/reset-match',
    },
    USER: {
        ACTIVATE: '/activate',
        ACTIVATION_EMAIL: '/activation',
        CHANGE_PASSWORD: '/password/change',
        LOGIN: '/login',
        LOGOUT: '/logout',
        ME: '/me',
        PASSWORD_RESET_EMAIL: '/password-reset',
        REGISTER: '/register',
        REQUEST_PASSWORD_RESET: '/password-reset/request',
        RESET_PASSWORD: '/password-reset',
        UPDATE_PROFILE: '/profile',
        USERS: '/users',
        USER_SEARCH: '/users/search',
        USER_BY_ID: '/users/:id',
        USER_PASSWORD_RESET: '/users/:id/password-reset',
        USER_BAN: '/users/:id/ban',
        USER_UNBAN: '/users/:id/unban',
        USER_RESTORE: '/users/:id/restore',
        USER_PERMANENT_DELETE: '/users/:id/permanent',
        FRIENDS: '/friends',
        FRIEND: '/friends/:id',
    },
    PLAYER: {
        CREATE: '/create-player',
        FLIP: '/player-flip',
        PLAY_CARD: '/play-card',
        RESOLVE_ABILITY: '/resolve-ability',
    },
    SCENARIO: {
        CREATE: '/create-scenario',
    },
    MATCH_LOBBY: {
        GET: '/match-lobbies/:id',
        JOIN: '/match-lobbies/:id/join',
        LEAVE: '/match-lobbies/:id/leave',
        START: '/match-lobbies/:id/start',
        DELETE: '/match-lobbies/:id',
    },
    DECK: {
        GET_HEROES_LIST: '/deck-heroes-list',
        GET_CATALOG: '/deck-catalog',
        LIST: '/decks',
        FAVORITE: '/decks/:id/favorite',
        SAVE_REPOSITORY: '/decks/save-repository',
        RESTORE_REPOSITORY: '/decks/restore-repository',
    },
};

export const INTERNAL_ENDPOINTS = {
    MATCH: {
        CREATE: '/internal/create-match',
        DELETE: '/internal/delete-match',
        GET_MATCHES_LIST: '/internal/get-matches-list',
        INIT: '/internal/init-match',
        RESET: '/internal/reset-match',
    },
    PLAYER: {
        CREATE: '/internal/create-player',
    },
    SCENARIO: {
        CREATE: '/internal/create-scenario',
    },
};

export {EVENTS, REFRESH_EVENTS} from './events.js';