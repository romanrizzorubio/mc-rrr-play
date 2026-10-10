import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DoIfCardGameEffect} from '../../src/effects/do-if-card-game-effect.js';

test('a missing matching branch resolves without blocking the effect', async () => {
    let effectNotRuns = 0;
    const effectNot = {
        getEffectProperty() {
            return 'secondary';
        },
        setEffectProperty() {},
        async runEffect() {
            effectNotRuns++;
        },
    };
    const effect = new DoIfCardGameEffect({
        condition: {name: 'M.O.D.O.K.'},
        effectNot,
        match: {
            searchCard() {
                return {name: 'M.O.D.O.K.'};
            },
        },
    });

    assert.equal(effect.getEffectProperty('title', {}), undefined);
    effect.setEffectProperty('title', 'primary', {});
    await effect.execute({});

    assert.equal(effectNotRuns, 0);
});
