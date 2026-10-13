import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    TRIGGER_ENEMY_ATTACKS_YOU,
    TRIGGER_VILLAIN_ACTIVATES,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_VILLAIN_SCHEMES,
} from 'mc-shared';
import {Scheme} from '../../src/activations/scheme.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {TRIGGER_MAP} from '../../src/factory/triggers/triggers-map.js';
import {VillainActivatesTrigger} from '../../src/triggers/villain-activates-trigger.js';

test('villain activates trigger is emitted for attacks and schemes', () => {
    const attack = new EnemyAttackEffect({
        enemy: {isVillain: true},
        match: {},
    });
    attack.activation = {
        getTriggersInit: () => [],
    };
    const attackTriggers = attack.getTriggersInit();
    const schemeTriggers = new Scheme({effect: {}}).getTriggersInit();

    assert.ok(attackTriggers.includes(TRIGGER_VILLAIN_ACTIVATES));
    assert.ok(attackTriggers.includes(TRIGGER_VILLAIN_ATTACKS));
    assert.ok(schemeTriggers.includes(TRIGGER_VILLAIN_ACTIVATES));
    assert.ok(schemeTriggers.includes(TRIGGER_VILLAIN_SCHEMES));
    assert.ok(attackTriggers.includes(TRIGGER_VILLAIN_ATTACKS_YOU));
    assert.ok(attackTriggers.includes(TRIGGER_ENEMY_ATTACKS_YOU));
    assert.equal(TRIGGER_MAP[TRIGGER_VILLAIN_ACTIVATES], VillainActivatesTrigger);
});

test('villain activates trigger excludes minion activations', () => {
    const trigger = new VillainActivatesTrigger({
        ability: {canTrigger: () => true},
        trigger: TRIGGER_VILLAIN_ACTIVATES,
    });

    assert.equal(
        trigger.canTrigger({
            effect: {
                character: {isVillain: true},
            },
        }),
        true
    );
    assert.equal(
        trigger.canTrigger({
            effect: {
                character: {isVillain: false},
            },
        }),
        false
    );
});
