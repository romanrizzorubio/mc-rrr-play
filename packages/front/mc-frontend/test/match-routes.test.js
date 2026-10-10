import assert from 'node:assert/strict';
import {test} from 'node:test';

import {parseParams, testRoute} from 'lit-element-router/utility/router-utility.js';
import {APP_ROUTES, getMatchPath} from '../src/utils/app-routes.js';

const matchedRoute = path => APP_ROUTES.find(route =>
    route.pattern !== '*' && testRoute(path, route.pattern));

test('match pages resolve by stable id and the legacy path remains routable', () => {
    assert.equal(matchedRoute('/match/abc123')?.name, 'match');
    assert.deepEqual(
        parseParams('match/:id', '/match/abc123'),
        {id: 'abc123'},
    );
    assert.equal(matchedRoute('/match')?.name, 'match-legacy');
    assert.equal(getMatchPath('abc123'), '/match/abc123');
});
