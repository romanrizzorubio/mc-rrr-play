import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TRIGGER_WOULD_ADD_ACCELERATION_TOKEN} from 'mc-shared';
import {AddAccelerationTokenEffect} from '../../src/effects/add-acceleration-token-effect.js';

test('adding acceleration tokens opens a would-add interrupt window', () => {
    const effect = new AddAccelerationTokenEffect({count: 2});

    assert.ok(effect.getTriggersWould().includes(
        TRIGGER_WOULD_ADD_ACCELERATION_TOKEN
    ));
});

test('replacement acceleration effect preserves the pending token count', async () => {
    let added = 0;
    const target = {
        addAccelerationToken(count) {
            added += count;
        },
        async refresh() {},
    };
    const originalEffect = {
        getCount() {
            return 3;
        },
    };
    const replacement = new AddAccelerationTokenEffect({
        countFromEffect: true,
        selectedTarget: target,
    });

    await replacement.execute({triggeredEffect: originalEffect});

    assert.equal(added, 3);
});
