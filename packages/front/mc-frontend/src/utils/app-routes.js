export const DECK_ROUTE_NAMES = new Set([
    'decks',
    'decks-create',
    'decks-edit-new',
    'decks-edit',
]);

export const APP_ROUTES = [
    { name: 'match', pattern: 'match/:id' },
    {
        name: 'matches',
        pattern: '',
    },
    {
        name: 'create-match',
        pattern: 'create-match',
    },
    {
        name: 'match-legacy',
        pattern: 'match',
    },
    {
        name: 'decks',
        pattern: 'decks',
    },
    {
        name: 'decks-create',
        pattern: 'decks/create',
    },
    {
        name: 'decks-edit-new',
        pattern: 'decks/edit',
    },
    {
        name: 'decks-edit',
        pattern: 'decks/edit/:id',
    },
    {
        name: 'not-found',
        pattern: '*',
    },
];

const NAVIGATION_PATHS = {
    matches: '/',
    'create-match': '/create-match',
    match: '/match',
    decks: '/decks',
};

export const getNavigationPath = route =>
    NAVIGATION_PATHS[route] || route;

export const getMatchPath = id => `/match/${encodeURIComponent(id)}`;
