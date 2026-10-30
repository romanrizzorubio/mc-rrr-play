import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    WouldAddAccelerationTokenTrigger,
} from '../../src/triggers/would-add-acceleration-token-trigger.js';

describe('WouldAddAccelerationTokenTrigger', () => {
test('filters source schemes and non-scheme targets', () => {
    const sourceCard = {isScheme: true};
    const otherScheme = {isScheme: true};
    const otherCard = {isScheme: false};
    const trigger = new WouldAddAccelerationTokenTrigger({
        ability: {canTrigger: () => true},
        card: sourceCard,
        triggerParams: {
            excludeSourceCard: true,
        },
    });

    assert.equal(trigger.canTrigger({
        effect: {selectedTarget: sourceCard},
    }), false);
    assert.equal(trigger.canTrigger({
        effect: {selectedTarget: otherCard},
    }), false);
    assert.equal(trigger.canTrigger({
        effect: {selectedTarget: otherScheme},
    }), true);
});
});
