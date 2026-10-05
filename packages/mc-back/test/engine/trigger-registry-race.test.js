import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PRIORITY_INTERRUPT,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';
import {Engine} from '../../src/engine/engine.js';

function createCard(id, canTrigger) {
    const trigger = {canTrigger};

    return {
        id,
        trigger,
        triggers: {
            [TRIGGER_VILLAIN_ATTACKS_YOU]: {
                [PRIORITY_INTERRUPT]: [trigger],
            },
        },
    };
}

test('trigger scanning skips cards removed while awaiting earlier triggers', async () => {
    const engine = new Engine();
    const match = {triggerCards: {}};
    const removedCard = createCard('removed-card', async () => true);
    const remainingCard = createCard('remaining-card', async () => true);
    const firstCard = createCard('first-card', async () => {
        await Promise.resolve();
        delete match.triggerCards[removedCard.id];

        return false;
    });

    engine.match = match;
    match.triggerCards[firstCard.id] = firstCard;
    match.triggerCards[removedCard.id] = removedCard;
    match.triggerCards[remainingCard.id] = remainingCard;

    const triggers = await engine._getTriggers(
        [TRIGGER_VILLAIN_ATTACKS_YOU],
        PRIORITY_INTERRUPT,
        {effect: {}}
    );

    assert.deepEqual(triggers, [remainingCard.trigger]);
});
