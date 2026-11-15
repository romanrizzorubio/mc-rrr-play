import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {Effect} from '../../src/effects/effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';

describe('Composite effect availability', () => {
    function createFixture(available, Composite = ChainedEffect, withThen = false) {
        const resolved = [];
        const match = {triggerCards: {}};
        const player = {isPlayer: true};
        const createEffect = (name, canRun) => {
            const effect = new Effect({match});
            effect.canRun = async () => canRun;
            effect.execute = async () => {
                resolved.push(name);
            };
            return effect;
        };
        const effects = available.map((canRun, index) =>
            createEffect(`effect-${index}`, canRun));
        const thenEffect = withThen ? createEffect('then', true) : undefined;
        const effect = new Composite({effects, match, thenEffect});
        return {effect, effects, thenEffect, player, resolved};
    }

    for (const Composite of [ChainedEffect, SimultaneousEffect]) {
        test(`${Composite.name} is available when any part can resolve`, async () => {
            for (const available of [[true, false], [false, true], [true, true], [false, false]]) {
                const {effect, player} = createFixture(available, Composite);
                assert.equal(await effect.canRun({player}), available.some(Boolean));
            }
        });

        test(`${Composite.name} resolves the available parts without inventing a full resolution`, async () => {
            const {effect, effects, player, resolved} = createFixture([false, true], Composite);
            await effect.runEffect({player});
            assert.deepEqual(resolved, ['effect-1']);
            assert.equal(effects[0].resolved, false);
            assert.equal(effects[1].resolved, true);
            assert.equal(effect.resolved, true);
            assert.equal(effect.fullResolved, false);
        });

        test(`${Composite.name} still requires every part of a cost`, async () => {
            const {effect, player, resolved} = createFixture([false, true], Composite);
            assert.equal(await effect.canRun({player, isCost: true}), false);
            assert.equal(await effect.canRun({
                player,
                costPaymentSession: {requireAllCosts: true},
            }), false);
            await effect.runEffect({player, isCost: true});
            assert.deepEqual(resolved, []);
        });
    }

    test('triggered chains ignore their parent cost context but keep their own cost rules', async () => {
        const {effect, player} = createFixture([true, false]);
        const params = {
            player,
            isCost: true,
            costPaymentSession: {requireAllCosts: true},
            triggeredEffect: {},
        };

        assert.equal(await effect.canRun(params), true);

        effect.isCost = true;
        assert.equal(await effect.canRun(params), false);
    });

    test('Then does not prevent initiation or independent preceding effects from resolving', async () => {
        const {effect, thenEffect, player, resolved} = createFixture([false, true], ChainedEffect, true);
        assert.equal(await effect.canRun({player}), true);
        await effect.runEffect({player});
        assert.deepEqual(resolved, ['effect-1']);
        assert.equal(effect.resolved, true);
        assert.equal(effect.fullResolved, false);
        assert.equal(thenEffect.resolved, false);
    });

    test('Then is attempted only when all preceding effects fully resolve', async () => {
        const {effect, thenEffect, player, resolved} = createFixture([true, true], ChainedEffect, true);
        await effect.runEffect({player});
        assert.deepEqual(resolved, ['effect-0', 'effect-1', 'then']);
        assert.equal(effect.fullResolved, true);
        assert.equal(thenEffect.resolved, true);
    });

    test('a possible Then alone cannot initiate an otherwise unavailable ability', async () => {
        const {effect, thenEffect, player, resolved} = createFixture([false, false], ChainedEffect, true);
        assert.equal(await effect.canRun({player}), false);
        await effect.runEffect({player});
        assert.deepEqual(resolved, []);
        assert.equal(effect.resolved, false);
        assert.equal(thenEffect.resolved, false);
    });

    test('partial abilities do not preview an unavailable effect', async () => {
        const {effect, effects, player} = createFixture([false, true]);
        effects[0].confirmBeforeResolve = async () => {
            assert.fail('An unavailable effect must not request confirmation');
        };
        let confirmations = 0;
        effects[1].confirmBeforeResolve = async () => {
            confirmations++;
            return true;
        };
        assert.equal(await effect.confirmBeforeResolve({player}), true);
        assert.equal(confirmations, 1);
    });
});
