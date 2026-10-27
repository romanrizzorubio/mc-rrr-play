import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TRIGGER_ATTACHED_ACTIVATES} from 'mc-shared';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemyActivationEffect} from '../../src/effects/enemy-activation-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {TriggersFactory} from '../../src/factory/triggers/triggers-factory.js';
import {AttachedActivatesTrigger} from '../../src/triggers/attached-activates-trigger.js';

describe('Attached enemy activation trigger', () => {
    test('opens a response window at the end of each enemy activation', () => {
        const activation = new EnemyActivationEffect({
            enemy: {id: 'yellow-jacket'},
        });
        const attack = new EnemyAttackEffect({
            enemy: {id: 'yellow-jacket'},
            match: {
                activationsFactory: {
                    createActivation: () => ({
                        getTriggersEnds: () => [],
                    }),
                },
            },
        });
        const scheme = new EnemySchemeEffect({
            enemy: {id: 'yellow-jacket', isCharacter: true},
            match: {
                activationsFactory: {
                    createActivation: () => ({
                        getTriggersEnds: () => [],
                    }),
                },
            },
        });

        assert.ok(!activation.getTriggersEnds().includes(TRIGGER_ATTACHED_ACTIVATES));
        assert.ok(!attack.getTriggersEnds().includes(TRIGGER_ATTACHED_ACTIVATES));
        assert.ok(!scheme.getTriggersEnds().includes(TRIGGER_ATTACHED_ACTIVATES));
        activation.resolved = true;
        attack.resolved = true;
        scheme.resolved = true;
        assert.ok(activation.getTriggersEnds().includes(TRIGGER_ATTACHED_ACTIVATES));
        assert.ok(attack.getTriggersEnds().includes(TRIGGER_ATTACHED_ACTIVATES));
        assert.ok(scheme.getTriggersEnds().includes(TRIGGER_ATTACHED_ACTIVATES));
    });

    test('registers the attachment-aware trigger in the trigger factory', () => {
        const trigger = new TriggersFactory({}).createTrigger({
            type: TRIGGER_ATTACHED_ACTIVATES,
        });

        assert.ok(trigger instanceof AttachedActivatesTrigger);
    });

    test('only matches an activation by the attachment host', async () => {
        const attachedEnemy = {id: 'yellow-jacket'};
        const otherEnemy = {id: 'other-enemy'};
        const trigger = new AttachedActivatesTrigger({
            card: {attachedTo: attachedEnemy},
            ability: {
                async canTrigger() {
                    return true;
                },
            },
        });

        assert.equal(await trigger.canTrigger({
            effect: {character: attachedEnemy, resolved: true},
        }), true);
        assert.equal(await trigger.canTrigger({
            effect: {character: otherEnemy, resolved: true},
        }), false);
    });

    test('does not trigger for skipped, canceled, or interrupted activations', async () => {
        const attachedEnemy = {id: 'yellow-jacket'};
        const trigger = new AttachedActivatesTrigger({
            card: {attachedTo: attachedEnemy},
            ability: {
                async canTrigger() {
                    return true;
                },
            },
        });
        const incompleteActivations = [
            {character: attachedEnemy, resolved: false},
            {character: attachedEnemy, resolved: true, canceled: true},
            {
                character: attachedEnemy,
                resolved: false,
                activationInterrupted: true,
            },
        ];

        for (const effect of incompleteActivations) {
            assert.equal(await trigger.canTrigger({effect}), false);
        }
    });

    test('does not trigger after the attachment leaves its host', async () => {
        const trigger = new AttachedActivatesTrigger({
            card: {},
            ability: {
                async canTrigger() {
                    return true;
                },
            },
        });

        assert.equal(await trigger.canTrigger({
            effect: {character: {id: 'yellow-jacket'}, resolved: true},
        }), false);
    });
});
