import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TRIGGER_THIS_SCHEME} from 'mc-shared';
import {Scheme} from '../../src/activations/scheme.js';
import {ThisSchemeTrigger} from '../../src/triggers/this-scheme-trigger.js';
import {TriggersFactory} from '../../src/factory/triggers/triggers-factory.js';

test('ThisSchemeTrigger identifies the enemy whose scheme activation ended', () => {
    const madameHydra = {id: 'madame-hydra'};
    const activation = new Scheme({
        effect: {character: madameHydra},
    });
    const params = activation.getTriggersParams({});
    const trigger = new TriggersFactory({}).createTrigger({
        ability: {canTrigger: () => true},
        card: madameHydra,
        type: TRIGGER_THIS_SCHEME,
    });

    assert.deepEqual(activation.getTriggersEnds({}), [TRIGGER_THIS_SCHEME]);
    assert.equal(params.card, madameHydra);
    assert.ok(trigger instanceof ThisSchemeTrigger);
    assert.equal(trigger.canTrigger(params), true);
    assert.equal(Boolean(trigger.canTrigger({
        ...params,
        card: {id: 'another-enemy'},
    })), false);
});
