export const ENDPOINTS = {
    MATCH: {
        CREATE: '/create-match',
        GET_HEROES_LIST: '/get-heroes-list',
        GET_SCENARIOS_LIST: '/get-scenarios-list',
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