import assert from 'node:assert/strict';
import {test} from 'node:test';

import {getAspectClass} from '../src/utils/deck-presentation.js';

test('maps known deck aspects to their row styling classes', () => {
    assert.equal(getAspectClass('basic'), 'aspect-basic');
    assert.equal(getAspectClass('aggression'), 'aspect-aggression');
    assert.equal(getAspectClass('justice'), 'aspect-justice');
    assert.equal(getAspectClass('protection'), 'aspect-protection');
    assert.equal(getAspectClass('leadership'), 'aspect-leadership');
    assert.equal(getAspectClass('pool'), 'aspect-pool');
});

test('does not add styling classes for unknown aspects', () => {
    assert.equal(getAspectClass('hero'), '');
});
