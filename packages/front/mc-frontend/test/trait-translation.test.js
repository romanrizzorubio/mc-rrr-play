import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TRAIT_AVENGER, TRAIT_HEROFORHIRE, TRAIT_PERSONA} from 'mc-shared';
import {translateTrait} from '../src/utils/traits.js';

test('translates the Avenger trait to Spanish', () => {
    assert.equal(translateTrait(TRAIT_AVENGER), 'Vengador');
});

test('translates the Persona trait to Spanish', () => {
    assert.equal(translateTrait(TRAIT_PERSONA), 'Individuo');
});

test('translates the Hero for Hire trait to Spanish', () => {
    assert.equal(translateTrait(TRAIT_HEROFORHIRE), 'Héroe de alquiler');
});

test('preserves unknown trait labels', () => {
    assert.equal(translateTrait('custom trait'), 'custom trait');
});
