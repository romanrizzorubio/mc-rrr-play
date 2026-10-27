import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {PlaceCountersEffect} from '../../src/effects/place-counters-effect.js';

describe('PlaceCountersEffect maxCounters', () => {
    test('limits the total counter count instead of only limiting each placement', () => {
        const card = {
            counters: 2,
            placeCounters(count) {
                this.counters += count;
            },
            refresh() {},
        };
        const effect = new PlaceCountersEffect({
            counters: 5,
            maxCounters: 4,
            match: {},
            selectedTarget: card,
        });

        effect.execute({});

        assert.equal(card.counters, 4);
    });

    test('rejects invalid limits and counter amounts', () => {
        assert.throws(() => new PlaceCountersEffect({
            counters: 1,
            maxCounters: -1,
            match: {},
        }), TypeError);

        const effect = new PlaceCountersEffect({
            counters: -1,
            maxCounters: 4,
            match: {},
            selectedTarget: {
                counters: 0,
                placeCounters() {},
                refresh() {},
            },
        });

        assert.throws(() => effect.execute({}), TypeError);
    });
});
