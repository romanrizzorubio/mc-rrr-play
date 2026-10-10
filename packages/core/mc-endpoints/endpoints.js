export const ENDPOINTS = {
    MATCH: {
        CREATE: '/create-match',
        DELETE: '/delete-match',
        GET_HEROES_LIST: '/get-heroes-list',
        GET_MATCHES_LIST: '/get-matches-list',
        GET_SCENARIOS_LIST: '/get-scenarios-list',
        GET_MODULAR_SETS_LIST: '/get-modular-sets-list',
        INIT: '/init-match',
        RESET: '/reset-match',
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
    DECK: {
        GET_HEROES_LIST: '/deck-heroes-list',
        GET_CATALOG: '/deck-catalog',
        LIST: '/decks',
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