import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    TRAIT_AVENGER,
    TRAIT_ELDER_OF_THE_UNIVERSE,
    TRAIT_GENIUS,
    TRAIT_HEROFORHIRE,
    TRAIT_PERSONA,
    TRAIT_SCIENTIST,
    TRAIT_SUPERPOWER,
} from 'mc-shared';
import {translateTrait} from '../src/utils/traits.js';

describe('trait translations', () => {
    test('translates the Avenger trait to Spanish', () => {
        assert.equal(translateTrait(TRAIT_AVENGER), 'Vengador');
    });

    test('translates the Elder of the Universe trait to Spanish', () => {
        assert.equal(translateTrait(TRAIT_ELDER_OF_THE_UNIVERSE), 'Primigenio');
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
});
