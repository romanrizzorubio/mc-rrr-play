import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    TRAIT_AVENGER,
    TRAIT_GENIUS,
    TRAIT_HEROFORHIRE,
    TRAIT_PERSONA,
    TRAIT_SCIENTIST,
    TRAIT_SUPERPOWER,
} from 'mc-shared';
import {translateTrait} from '../src/utils/traits.js';

test('translates the Avenger trait to Spanish', () => {
    assert.equal(translateTrait(TRAIT_AVENGER), 'Vengador');
});

test('translates the Genius trait to Spanish', () => {
    assert.equal(translateTrait(TRAIT_GENIUS), 'Genio');
});

test('translates the Persona trait to Spanish', () => {
    assert.equal(translateTrait(TRAIT_PERSONA), 'Individuo');
});

test('translates the Hero for Hire trait to Spanish', () => {
    assert.equal(translateTrait(TRAIT_HEROFORHIRE), 'Héroe de alquiler');
});

test('translates the Scientist trait to Spanish', () => {
    assert.equal(translateTrait(TRAIT_SCIENTIST), 'Científico');
});

test('translates the Superpower trait to Spanish', () => {
    assert.equal(translateTrait(TRAIT_SUPERPOWER), 'Superpoder');
});

test('preserves unknown trait labels', () => {
    assert.equal(translateTrait('custom trait'), 'custom trait');
});
