import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TRIGGER_THIS_FLIP} from 'mc-shared';
import {TriggersFactory} from '../../src/factory/triggers/triggers-factory.js';
import {ThisFlipTrigger} from '../../src/triggers/this-flip-trigger.js';

describe('ThisFlipTrigger', () => {
    test('only matches the card that flipped and preserves its trigger context', async () => {
        const hulka = {id: 'hulka--hulka'};
        let abilityParams;
        let resolutionParams;
        const trigger = new TriggersFactory({}).createTrigger({
            ability: {
                canTrigger: params => {
                    abilityParams = params;
                    return true;
                },
                resolveAbility: async params => {
                    resolutionParams = params;
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
        const effect = {};
        const flipParams = {card: flippedHulka, effect};

        assert.equal(trigger.canTrigger(flipParams), true);
        assert.deepEqual(abilityParams, {
            ...flipParams,
            triggeredCard: flippedHulka,
            triggeredEffect: effect,
        });
        assert.deepEqual(flipParams, {card: flippedHulka, effect});
        await trigger.runCard(flipParams);
        assert.equal(resolutionParams.triggeredCard, abilityParams.triggeredCard);
        assert.equal(resolutionParams.triggeredEffect, abilityParams.triggeredEffect);
        assert.equal(resolutionParams.card, hulka);
        assert.equal(Boolean(trigger.canTrigger({
            card: {
                id: 'otro-villano',
                currentSide: {id: 'estado-de-locura'},
            },
        })), false);
    });
});
