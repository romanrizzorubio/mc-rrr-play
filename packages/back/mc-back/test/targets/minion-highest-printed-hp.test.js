import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_MINION_HIGHEST_PRINTED_HP} from 'mc-shared';
import {AttachEffect} from '../../src/effects/attach-effect.js';

test('highest printed HP target is selected among minions the attachment can attach to', async () => {
    const minion = (id, printedHP, currentHP, attached = []) => ({
        id,
        abilities: [],
        attached,
        currentSide: {
            card: {hitPoints: printedHP},
            hitPoints: currentHP,
        },
    });
    const blockedHighest = minion('blocked-highest', 10, 10, [
        {card: {id: 'bio-upgrade'}},
    ]);
    const highestEligible = minion('highest-eligible', 8, 8);
    const tiedEligible = minion('tied-eligible', 8, 8);
    const modifiedHP = minion('modified-hp', 7, 20);
    const match = {
        minions: [blockedHighest, highestEligible, tiedEligible, modifiedHP],
    };
    const attachment = {
        canAttach(target) {
            return !target.attached.some(card => card.card.id === 'bio-upgrade');
        },
    };
    const effect = new AttachEffect({
        card: attachment,
        match,
        target: TARGET_MINION_HIGHEST_PRINTED_HP,
    });

    assert.deepEqual(await effect.getValidTarget({match}), [
        highestEligible,
        tiedEligible,
    ]);
});
