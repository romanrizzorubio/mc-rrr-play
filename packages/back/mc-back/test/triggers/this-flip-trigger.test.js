import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TRIGGER_THIS_FLIP} from 'mc-shared';
import {TriggersFactory} from '../../src/factory/triggers/triggers-factory.js';
import {ThisFlipTrigger} from '../../src/triggers/this-flip-trigger.js';

test('ThisFlipTrigger only matches the card that flipped', () => {
    const hulka = {id: 'hulka--hulka'};
    let abilityParams;
    const trigger = new TriggersFactory({}).createTrigger({
        ability: {
            canTrigger: params => {
                abilityParams = params;
                return true;
            },
        },
        card: hulka,
        type: TRIGGER_THIS_FLIP,
    });

    assert.ok(trigger instanceof ThisFlipTrigger);
    assert.equal(trigger.canTrigger({card: hulka}), true);
    const flippedHulka = {
        id: '--jennifer_walters--hulka--hulka--hulka',
        currentSide: hulka,
    };
    const flipParams = {card: flippedHulka};

    assert.equal(trigger.canTrigger(flipParams), true);
    assert.equal(abilityParams, flipParams);
    assert.equal(Boolean(trigger.canTrigger({
        card: {
            id: 'otro-villano',
            currentSide: {id: 'estado-de-locura'},
        },
    })), false);
});
