import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CardEnterPlayTrigger} from '../../src/triggers/card-enter-play-trigger.js';

const createTrigger = ({ability = {}, ...params} = {}) => new CardEnterPlayTrigger({
    ability: {
        canTrigger() {
            return true;
        },
        ...ability,
    },
    card: {},
    cardCondition: {
        isEnvironment: true,
    },
    trigger: 'CARD_ENTER_PLAY',
    ...params,
});

describe('CardEnterPlayTrigger', () => {
    test('automatically matches the before-enter window for Interrupt abilities', async () => {
        const trigger = createTrigger({
            ability: {isInterrupt: true},
        });

        assert.equal(await trigger.canTrigger({
            card: {isEnvironment: true, isInPlay: false},
        }), true);
        assert.equal(await trigger.canTrigger({
            card: {isEnvironment: true, isInPlay: true},
        }), undefined);
    });

    test('matches the after-enter window for Response abilities', async () => {
        const trigger = createTrigger({
            ability: {isInterrupt: false},
        });

        assert.equal(await trigger.canTrigger({
            card: {isEnvironment: true, isInPlay: false},
        }), undefined);
        assert.equal(await trigger.canTrigger({
            card: {isEnvironment: true, isInPlay: true},
        }), true);
    });

    test('applies its card condition', async () => {
        const trigger = createTrigger();

        assert.equal(await trigger.canTrigger({
            card: {isEnvironment: true, isInPlay: true},
        }), true);
        assert.equal(await trigger.canTrigger({
            card: {isEnvironment: false, isInPlay: true},
        }), undefined);
    });

    test('forwards the entered card as triggeredCard', async () => {
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
});
