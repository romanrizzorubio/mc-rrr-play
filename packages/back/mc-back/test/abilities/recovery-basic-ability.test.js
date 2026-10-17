import assert from 'node:assert/strict';
import {test} from 'node:test';

import {RecoveryBasicAbility} from '../../src/abilities/basic/recovery-basic-ability.js';
import {ActivationsFactory} from '../../src/factory/activations/activations-factory.js';

function createRecoveryAbility() {
    const match = {};
    match.activationsFactory = new ActivationsFactory(match);

    const ability = new RecoveryBasicAbility({
        card: {id: 'alter-ego', isAlterEgo: true},
        match,
    });
    ability.costs.canPay = async () => true;

    return ability;
}

test('recovery basic ability availability works for a damaged player', async () => {
    const ability = createRecoveryAbility();

    assert.equal(await ability.canRun({
        card: ability.card,
        player: {damage: 1},
    }), true);
});

test('recovery basic ability is unavailable when the player has no damage', async () => {
    const ability = createRecoveryAbility();

    assert.equal(await ability.canRun({
        card: ability.card,
        player: {damage: 0},
    }), false);
});
