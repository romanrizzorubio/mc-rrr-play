import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TRIGGER_ATTACHED_TAKES_DAMAGE} from 'mc-shared';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {AttachedTakesDamageTrigger} from '../../src/triggers/attached-takes-damage-trigger.js';

test('attached takes damage triggers only when that character actually takes damage', async () => {
    const villain = {id: 'villain'};
    const ally = {id: 'ally'};
    const trigger = new AttachedTakesDamageTrigger({
        card: {attachedTo: villain},
        ability: {
            async canTrigger() {
                return true;
            },
        },
    });

    assert.equal(await trigger.canTrigger({
        effect: {
            selectedTarget: [villain, ally],
            takenDamage: [1, 0],
        },
    }), true);
    assert.equal(await trigger.canTrigger({
        effect: {
            selectedTarget: [villain, ally],
            takenDamage: [0, 1],
        },
    }), false);
    assert.equal(await trigger.canTrigger({
        effect: {
            selectedTarget: ally,
            takenDamage: 1,
        },
    }), false);
});

test('attached damage trigger follows damage to the next same-title villain stage', async () => {
    const villain = {
        id: 'villain-stage-2',
        isInPlay: true,
        isVillain: true,
        name: 'Rino',
    };
    const defeatedStage = {
        id: 'villain-stage-1',
        isInPlay: false,
        isVillain: true,
        name: 'Rino',
    };
    const trigger = new AttachedTakesDamageTrigger({
        card: {attachedTo: villain},
        ability: {
            async canTrigger() {
                return true;
            },
        },
    });

    assert.equal(await trigger.canTrigger({
        effect: {
            match: {villain},
            selectedTarget: defeatedStage,
            takenDamage: 1,
        },
    }), true);
    assert.equal(await trigger.canTrigger({
        effect: {
            match: {villain},
            selectedTarget: {
                id: 'other-villain',
                isInPlay: false,
                isVillain: true,
                name: 'Otro villano',
            },
            takenDamage: 1,
        },
    }), false);
});

test('take damage effects expose the attached-character response window', () => {
    const effect = new TakeDamageEffect({
        match: {triggerCards: {}},
        selectedTarget: {id: 'villain'},
        damage: 1,
    });

    assert.deepEqual(effect.getTriggersEnds(), [TRIGGER_ATTACHED_TAKES_DAMAGE]);
});
