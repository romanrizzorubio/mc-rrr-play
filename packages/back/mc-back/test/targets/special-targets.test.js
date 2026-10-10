import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PLACE_DISCARD_PILE,
    PLACE_IN_PLAY,
    TARGET_BY_TITLE,
} from 'mc-shared';
import {PlaceThreatEffect} from '../../src/effects/place-threat-effect.js';

test('TARGET_BY_TITLE searches only the configured locations', () => {
    const card = {name: 'Legiones de Hydra'};
    const match = {
        searchCards: () => [],
        schemes: [],
        characters: [],
    };
    const effect = new PlaceThreatEffect({
        locations: [PLACE_IN_PLAY],
        match,
        target: TARGET_BY_TITLE,
        threat: 2,
        title: card.name,
    });
    effect.ability = {effect};
    const params = {
        player: {
            deck: {
                cards: [],
                discardPile: [card],
            },
        },
    };

    assert.deepEqual(effect.getValidTarget(params), []);

    effect.locations = [PLACE_DISCARD_PILE];

    assert.deepEqual(effect.getValidTarget(params), [card]);
});
