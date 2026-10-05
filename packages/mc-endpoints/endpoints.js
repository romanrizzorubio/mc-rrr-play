export const ENDPOINTS = {
    MATCH: {
        CREATE: '/create-match',
        DELETE: '/delete-match',
        GET_HEROES_LIST: '/get-heroes-list',
        GET_MATCHES_LIST: '/get-matches-list',
        GET_SCENARIOS_LIST: '/get-scenarios-list',
        GET_MODULAR_SETS_LIST: '/get-modular-sets-list',
        INIT: '/init-match',
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
};

export {EVENTS, REFRESH_EVENTS} from './events.js';