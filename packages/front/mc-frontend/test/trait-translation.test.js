import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TRAIT_AVENGER} from 'mc-shared';
import {translateTrait} from '../src/utils/traits.js';

test('translates the Avenger trait to Spanish', () => {
    assert.equal(translateTrait(TRAIT_AVENGER), 'Vengador');
});

test('preserves unknown trait labels', () => {
    assert.equal(translateTrait('custom trait'), 'custom trait');
});
