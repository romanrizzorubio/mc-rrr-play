import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_EFFECT} from 'mc-shared';
import {Ability} from '../../src/abilities/core/ability.js';
import {CancelEncounterEffect} from '../../src/effects/cancel-encounter-effect.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DiscardFromDeckEffect} from '../../src/effects/discard-from-deck-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';

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

test('does not reset an effect used as an external selected target', () => {
    const encounterCard = {
        isEncounterCard: true,
        isTreachery: true,
    };
    const revealEffect = new RevealEncounterEffect({
        match: {
            triggerCards: {},
        },
        selectedTarget: encounterCard,
    });
    const cancelEffect = new CancelEncounterEffect({
        full: true,
        match: {
            triggerCards: {},
        },
        target: TARGET_EFFECT,
    });
    cancelEffect.selectedTarget = revealEffect;

    cancelEffect.resetResolutionState({
        preserveSelectedTarget: true,
    });

    assert.strictEqual(revealEffect.selectedTarget, encounterCard);
});
