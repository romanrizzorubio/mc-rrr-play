import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ATTACKED, TRIGGER_YOU_ANY_ATTACK} from 'mc-shared';
import {ForcedResponseAbility} from '../../src/abilities/response/forced-response-ability.js';
import {StunEffect} from '../../src/effects/stun-effect.js';

test('forced response does not pay its arrow cost when its attacked target is defeated', async () => {
    let paidCosts = 0;
    const minion = {
        abilities: [],
        id: 'defeated-minion',
        isInPlay: false,
        isMinion: true,
        isStunned: false,
        name: 'Defeated Minion',
        async refresh() {},
        stun() {
            this.isStunned = true;
        },
    };
    const attackEffect = {
        isAttack: true,
        selectedTarget: minion,
    };
    const attack = {
        effect: attackEffect,
        selectedTarget: minion,
    };
    const match = {triggerCards: {}};
    const ability = new ForcedResponseAbility({
        arrow: {
            cost: {},
            paymentCancelled: false,
            async canPay() {
                return true;
            },
            async pay() {
                paidCosts++;
                return true;
            },
        },
        effect: new StunEffect({
            match,
            target: TARGET_ATTACKED,
        }),
        match,
        trigger: TRIGGER_YOU_ANY_ATTACK,
    });
    ability.card = {id: 'superhuman-strength'};
    const params = {
        attack,
        card: ability.card,
        effect: attackEffect,
        match,
        player: {},
    };

    assert.equal(await ability.canTrigger(params), false);

    await ability.resolveAbility(params);

    assert.equal(paidCosts, 0);
    assert.equal(minion.isStunned, false);
});
