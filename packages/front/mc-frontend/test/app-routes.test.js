import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {parseParams, testRoute} from 'lit-element-router/utility/router-utility.js';
import {
    APP_ROUTES,
    ADMIN_REQUIRED_ROUTE_NAMES,
    AUTH_REQUIRED_ROUTE_NAMES,
    DECK_ROUTE_NAMES,
    getGuestLandingRoute,
    getNavigationPath,
    getMatchLobbyPath,
    USER_AUTH_REQUIRED_ROUTE_NAMES,
    USER_ROUTE_NAMES,
} from '../src/utils/app-routes.js';

const matchedRoute = path => APP_ROUTES.find(route =>
    route.pattern !== '*' && testRoute(path, route.pattern));

describe('application routes', () => {
    test('deck pages resolve to distinct routes, including an optional edit id', () => {
        assert.equal(matchedRoute('/decks')?.name, 'decks');
        assert.equal(matchedRoute('/decks/create')?.name, 'decks-create');
        assert.equal(matchedRoute('/decks/edit')?.name, 'decks-edit-new');
        assert.equal(matchedRoute('/decks/edit/abc123')?.name, 'decks-edit');
        assert.equal(matchedRoute('/decks/edit/abc123')?.pattern, 'decks/edit/:id');
        assert.deepEqual(
            parseParams('decks/edit/:id', '/decks/edit/abc123'),
            {id: 'abc123'},
        );
    });

    test('routes and paths are available for match lobbies and user account views', () => {
        assert.equal(matchedRoute('/match-lobby/lobby-1')?.name, 'match-lobby');
        assert.deepEqual(
            parseParams('match-lobby/:id', '/match-lobby/lobby-1'),
            {id: 'lobby-1'},
        );
        assert.deepEqual([...USER_ROUTE_NAMES], [
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
        assert.deepEqual([...USER_AUTH_REQUIRED_ROUTE_NAMES], [
            'profile',
            'change-password',
            'users',
            'user-detail',
        ]);
        assert.deepEqual([...ADMIN_REQUIRED_ROUTE_NAMES], [
            'users',
            'user-detail',
        ]);
        assert.equal(getMatchLobbyPath('lobby 1'), '/match-lobby/lobby%201');
        assert.equal(getNavigationPath('login'), '/login');
        assert.equal(getNavigationPath('profile'), '/profile');
        assert.equal(getNavigationPath('users'), '/users');
    });

    test('each user page path resolves to its shell route', () => {
        const userPages = [
            ['login', '/login'],
            ['register', '/register'],
            ['activate', '/activate'],
            ['forgot-password', '/forgot-password'],
            ['reset-password', '/reset-password'],
            ['profile', '/profile'],
            ['change-password', '/change-password'],
            ['users', '/users'],
            ['user-detail', '/users/account-1'],
        ];

        userPages.forEach(([route, path]) => {
            assert.equal(matchedRoute(path)?.name, route);
        });
    });

    test('all deck routes activate the Mazos section and navigation uses absolute paths', () => {
        assert.deepEqual([...DECK_ROUTE_NAMES], [
            'decks',
            'decks-create',
            'decks-edit-new',
            'decks-edit',
        ]);
        assert.equal(getNavigationPath('decks'), '/decks');
        assert.equal(getNavigationPath('matches'), '/');
        assert.equal(getNavigationPath('/decks/create'), '/decks/create');
        assert.equal(AUTH_REQUIRED_ROUTE_NAMES.has('user-detail'), true);
        assert.equal(ADMIN_REQUIRED_ROUTE_NAMES.has('user-detail'), true);
    });

    test('guests land on public decks while matches remain account-only', () => {
        assert.equal(getGuestLandingRoute('matches'), 'decks');
        assert.equal(getGuestLandingRoute('decks'), 'decks');
        assert.equal(AUTH_REQUIRED_ROUTE_NAMES.has('matches'), false);
        assert.equal(AUTH_REQUIRED_ROUTE_NAMES.has('decks'), false);
        assert.equal(AUTH_REQUIRED_ROUTE_NAMES.has('match'), true);
        assert.equal(AUTH_REQUIRED_ROUTE_NAMES.has('profile'), true);
    });
});
