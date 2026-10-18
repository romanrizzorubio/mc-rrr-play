import assert from 'node:assert/strict';
import {test} from 'node:test';

import {CardEnterPlayTrigger} from '../../src/triggers/card-enter-play-trigger.js';

const createTrigger = params => new CardEnterPlayTrigger({
    ability: {
        canTrigger() {
            return true;
        },
    },
    card: {},
    cardCondition: {
        isEnvironment: true,
    },
    trigger: 'CARD_ENTER_PLAY',
    ...params,
});

test('CardEnterPlayTrigger can match the before-enter window with a boolean flag', async () => {
    const trigger = createTrigger({beforeEnterPlay: true});

    assert.equal(await trigger.canTrigger({
        card: {isEnvironment: true, isInPlay: false},
    }), true);
    assert.equal(await trigger.canTrigger({
        card: {isEnvironment: true, isInPlay: true},
    }), undefined);
});

test('CardEnterPlayTrigger applies its card condition', async () => {
    const trigger = createTrigger();

    assert.equal(await trigger.canTrigger({
        card: {isEnvironment: true, isInPlay: true},
    }), true);
    assert.equal(await trigger.canTrigger({
        card: {isEnvironment: false, isInPlay: true},
    }), undefined);
});

test('CardEnterPlayTrigger forwards the entered card as triggeredCard', async () => {
    const enteredCard = {isEnvironment: true, isInPlay: true};
    const trigger = createTrigger();
    let params;

    trigger.ability.resolveAbility = async resolutionParams => {
        params = resolutionParams;
    };

    await trigger.runCard({
        card: enteredCard,
    });

    assert.strictEqual(params.triggeredCard, enteredCard);
});
