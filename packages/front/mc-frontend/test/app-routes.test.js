import assert from 'node:assert/strict';
import {test} from 'node:test';

import {parseParams, testRoute} from 'lit-element-router/utility/router-utility.js';
import {
    APP_ROUTES,
    DECK_ROUTE_NAMES,
    getNavigationPath,
} from '../src/utils/app-routes.js';

const matchedRoute = path => APP_ROUTES.find(route =>
    route.pattern !== '*' && testRoute(path, route.pattern));

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
});
