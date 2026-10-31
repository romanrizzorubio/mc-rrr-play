import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {RemoveScenarioMainSchemeEffect} from '../../src/effects/remove-scenario-main-scheme-effect.js';

describe('Remove scenario main scheme effect', () => {
    test('discards the cards under the removed main scheme', async () => {
        const removedCards = [];
        const discardedUnder = [];
        const scheme = {
            endTriggers() {},
            async discardCardsUnder() {
                discardedUnder.push(true);
            },
            currentSide: {
                async removeAttached() {},
            },
        };
        const zone = {
            currentScheme: scheme,
            async refresh() {},
        };
        scheme.scenarioZone = zone;
        const match = {
            removeCard(card) {
                removedCards.push(card);
            },
        };
        const effect = new RemoveScenarioMainSchemeEffect({match});

        await effect.execute({card: scheme});

        assert.deepEqual(discardedUnder, [true]);
        assert.deepEqual(removedCards, [scheme]);
        assert.equal(zone.currentScheme, null);
    });
});
