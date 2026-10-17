import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Ability} from '../../src/abilities/core/ability.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DiscardFromDeckEffect} from '../../src/effects/discard-from-deck-effect.js';

test('resets nested effect results and targets before checking a repeated ability', async () => {
    const match = {triggerCards: {}};
    const nestedEffect = new DiscardFromDeckEffect({
        count: 1,
        match,
    });
    const oldTarget = {id: 'old-target'};
    const oldCard = {id: 'old-card'};
    const selectedTarget = {id: 'preselected-target'};
    const effect = new ChainedEffect({
        effects: [nestedEffect],
        match,
    });
    effect.selectedTarget = selectedTarget;
    nestedEffect.selectedTarget = oldTarget;
    nestedEffect.cards = [oldCard];
    effect.canRun = async () => {
        assert.deepEqual(nestedEffect.cards, []);
        assert.equal(nestedEffect.selectedTarget, undefined);
        assert.strictEqual(effect.selectedTarget, selectedTarget);

        return true;
    };
    effect.runEffect = async () => {
        effect.resolved = true;
    };
    const ability = new Ability({effect, match});

    await ability.resolveAbility({
        arrowPaid: true,
        player: {},
        preselectedTarget: true,
    });
});
