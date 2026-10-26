import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CLASSIFICATION_BASIC} from 'mc-shared';
import {
    getAspectClass,
    getCardCategoryClass,
} from '../src/utils/deck-presentation.js';

describe('deck card presentation', () => {
    test('maps true aspects and basic classifications to separate row classes', () => {
        assert.equal(getAspectClass('basic'), '');
        assert.equal(getAspectClass('aggression'), 'aspect-aggression');
        assert.equal(getAspectClass('justice'), 'aspect-justice');
        assert.equal(getAspectClass('protection'), 'aspect-protection');
        assert.equal(getAspectClass('leadership'), 'aspect-leadership');
        assert.equal(getAspectClass('pool'), 'aspect-pool');
        assert.equal(
            getCardCategoryClass({classification: CLASSIFICATION_BASIC}),
            'card-basic',
        );
    });

    test('does not add styling classes for unknown aspects', () => {
        assert.equal(getAspectClass('hero'), '');
    });
});
