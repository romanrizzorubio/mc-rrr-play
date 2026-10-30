export const DECK_ROUTE_NAMES = new Set([
    'decks',
    'decks-create',
    'decks-edit-new',
    'decks-edit',
]);

export const USER_ROUTE_NAMES = new Set([
    'login',
    'register',
    'activate',
    'forgot-password',
    'reset-password',
    'profile',
    'change-password',
    'users',
    'user-detail',
]);

export const USER_AUTH_REQUIRED_ROUTE_NAMES = new Set([
    'profile',
    'change-password',
    'users',
    'user-detail',
]);

export const ADMIN_REQUIRED_ROUTE_NAMES = new Set([
    'users',
    'user-detail',
]);

export const AUTH_REQUIRED_ROUTE_NAMES = new Set([
    'match',
    'match-lobby',
    ...USER_AUTH_REQUIRED_ROUTE_NAMES,
]);

export const getGuestLandingRoute = route =>
    route === 'matches' ? 'decks' : route;

export const APP_ROUTES = [
    { name: 'match', pattern: 'match/:id' },
    { name: 'match-lobby', pattern: 'match-lobby/:id' },
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
    { name: 'login', pattern: 'login' },
    { name: 'register', pattern: 'register' },
    { name: 'activate', pattern: 'activate' },
    { name: 'forgot-password', pattern: 'forgot-password' },
    { name: 'reset-password', pattern: 'reset-password' },
    { name: 'profile', pattern: 'profile' },
    { name: 'change-password', pattern: 'change-password' },
    { name: 'users', pattern: 'users' },
    { name: 'user-detail', pattern: 'users/:id' },
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
    login: '/login',
    register: '/register',
    activate: '/activate',
    'forgot-password': '/forgot-password',
    'reset-password': '/reset-password',
    profile: '/profile',
    'change-password': '/change-password',
    users: '/users',
};

export const getNavigationPath = route =>
    NAVIGATION_PATHS[route] || route;

export const getMatchPath = id => `/match/${encodeURIComponent(id)}`;

export const getMatchLobbyPath = id =>
    `/match-lobby/${encodeURIComponent(id)}`;
