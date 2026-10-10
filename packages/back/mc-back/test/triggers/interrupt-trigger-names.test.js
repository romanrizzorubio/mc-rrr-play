import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_ALL_CHARACTERS} from 'mc-shared';
import {InterruptAbility} from '../../src/abilities/interrupt/interrupt-ability.js';
import {
    AttachedWouldDealtDamageTrigger
} from '../../src/triggers/attached-would-dealt-damage-trigger.js';
import {
    CharacterWouldTakeDamageTrigger
} from '../../src/triggers/character-would-take-damage-trigger.js';
import {VillainAttacksTrigger} from '../../src/triggers/villain-attacks-trigger.js';
import {
    VillainAttacksYouTrigger
} from '../../src/triggers/villain-attacks-you-trigger.js';
import {VillainSchemesTrigger} from '../../src/triggers/villain-schemes-trigger.js';

const createInterruptAbility = () => new InterruptAbility({
    match: {},
    name: 'Capacidad configurada',
    trigger: 'INTERRUPT_TRIGGER',
});
const createTrigger = (TriggerClass, ability) => new TriggerClass({
    ability,
    card: {},
    trigger: 'INTERRUPT_TRIGGER',
});

test('interrupt event names are provided by their concrete triggers', () => {
    const ability = createInterruptAbility();
    const villain = {name: 'Duende Verde'};
    const villainParams = {effect: {character: villain}};
    const attachedDamageTrigger = createTrigger(
        AttachedWouldDealtDamageTrigger,
        ability
    );
    const attachedDamageParams = {
        effect: {
            damage: 2,
            selectedTarget: {name: 'Capitana Marvel'},
        },
    };
    const villainAttacksTrigger = createTrigger(VillainAttacksTrigger, ability);
    const villainAttacksYouTrigger = createTrigger(
        VillainAttacksYouTrigger,
        ability
    );
    const villainSchemesTrigger = createTrigger(VillainSchemesTrigger, ability);
    const target = {name: 'Capitana Marvel'};
    const match = {
        enemies: [],
        friends: [target],
    };
    const characterDamageTrigger = new CharacterWouldTakeDamageTrigger({
        ability,
        card: {match},
        target: TARGET_ALL_CHARACTERS,
        trigger: 'INTERRUPT_TRIGGER',
    });
    const characterDamageParams = {
        effect: {
            damage: 5,
            selectedTarget: target,
            takenDamage: 3,
        },
        match,
    };

    assert.equal(
        villainAttacksTrigger.getName(villainParams),
        'Duende Verde va a atacar.'
    );
    assert.equal(
        villainAttacksYouTrigger.getName(villainParams),
        'Duende Verde te va a atacar.'
    );
    assert.equal(
        villainSchemesTrigger.getName(villainParams),
        'Duende Verde va a ejecutar el Plan.'
    );
    assert.equal(
        attachedDamageTrigger.getName(attachedDamageParams),
        'Capitana Marvel va a sufrir 2 de Daño.'
    );
    assert.equal(
        characterDamageTrigger.getName(characterDamageParams),
        'Capitana Marvel va a sufrir 3 de Daño.'
    );
});

test('non-interrupt abilities keep their configured trigger title', () => {
    const trigger = createTrigger(VillainAttacksYouTrigger, {
        isInterrupt: false,
        getTitle: () => 'Respuesta configurada',
    });

    assert.equal(
        trigger.getName({effect: {character: {name: 'Duende Verde'}}}),
        'Respuesta configurada'
    );
});
