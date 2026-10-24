import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {EFFECT_CHAINED, EFFECT_DEAL_DAMAGE, TARGET_ENEMY} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {EffectsFactory} from '../../src/factory/effects/effects-factory.js';

describe('effect instances per ability resolution', () => {
    test('clones the whole tree while preserving selected nested targets', async () => {
        const match = {triggerCards: {}};
        const effectsFactory = new EffectsFactory({match});
        const nestedEffect = effectsFactory.createEffect({
            type: EFFECT_DEAL_DAMAGE,
            params: {
                damage: 2,
                target: TARGET_ENEMY,
            },
        });
        const effect = effectsFactory.createEffect({
            type: EFFECT_CHAINED,
            params: {
                effects: [nestedEffect],
            },
        });
        const selectedTarget = {id: 'selected-target'};
        nestedEffect.selectedTarget = selectedTarget;

        const ability = new Ability({
            effect,
            match,
        });
        const resolvedTrees = [];
        ability.canRun = async (params, effectInstance) => {
            assert.notStrictEqual(effectInstance, effect);
            assert.notStrictEqual(effectInstance.effects[0], nestedEffect);
            assert.strictEqual(
                effectInstance.effects[0].selectedTarget,
                selectedTarget
            );
            assert.ok(
                params.preselectedEffectTargets.has(effectInstance.effects[0])
            );

            if (resolvedTrees.length) {
                assert.equal(effectInstance.effects[0].runtimeResult, undefined);
            } else {
                effectInstance.effects[0].runtimeResult = 'first resolution';
            }
            resolvedTrees.push(effectInstance);

            return true;
        };

        const params = {
            arrowPaid: true,
            cancelEffects: true,
            player: {},
            preselectedEffectTargets: new Set([nestedEffect]),
            preselectedTarget: true,
        };
        await ability.resolveAbility(params);
        await ability.resolveAbility(params);

        assert.notStrictEqual(resolvedTrees[1], resolvedTrees[0]);
        assert.notStrictEqual(
            resolvedTrees[1].effects[0],
            resolvedTrees[0].effects[0]
        );
    });
});
