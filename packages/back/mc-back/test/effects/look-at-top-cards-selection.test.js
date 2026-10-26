import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    TARGET_ALL_DECKS,
    TARGET_ENCOUNTER_DECK,
} from 'mc-shared';
import {LookAtTopCardsEffect} from '../../src/effects/look-at-top-cards-effect.js';

describe('look-at-top-cards target selection', () => {
    test('offers deck selection for a general deck target', () => {
        const effect = new LookAtTopCardsEffect({
            target: TARGET_ALL_DECKS,
        });

        assert.equal(effect.getTargetSelectionMode(), 'deck');
    });

    test('does not offer deck selection for a specific deck target', () => {
        const effect = new LookAtTopCardsEffect({
            target: TARGET_ENCOUNTER_DECK,
        });

        assert.equal(effect.getTargetSelectionMode(), undefined);
    });
});
