import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    PRIORITY_CONSTANT,
    TARGET_EFFECT,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_YOUR_HERO_GET_ATTACK,
} from 'mc-shared';
import {ConstantAbility} from '../../src/abilities/misc/constant-ability.js';
import {GetAttackEffect} from '../../src/effects/get-attack-effect.js';
import {ModifyAttackValueEffect} from '../../src/effects/modify-attack-value-effect.js';
import {ResponseAbility} from '../../src/abilities/response/response-ability.js';
import {Trigger} from '../../src/triggers/base/trigger.js';

test('ability conditions are checked against the triggering effect', async () => {
    const ability = new ResponseAbility({
        condition: {
            'effect.isDefended': true,
            'effect.defender.isHero': true,
        },
        trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
        effect: {canRun: async () => true},
        match: {},
    });
    const player = {canAttack: () => false};

    assert.equal(await ability.canRun({
        player,
        effect: {
            isDefended: true,
            defender: {isHero: true},
        },
    }), true);
    assert.equal(await ability.canRun({
        player,
        effect: {
            isDefended: false,
            defender: {isHero: true},
        },
    }), false);
});

test('triggered modifiers do not inherit a fixed target from the triggering effect', async () => {
    const player = {};
    const hero = {attack: 2, name: 'Thor'};
    const villain = {attack: 2, modifyAttack: 0, name: 'Rino'};
    const match = {triggerCards: {}};
    const mjolnir = {
        id: 'mjolnir',
        name: 'Mjolnir',
        owner: player,
        triggers: {},
    };
    const ability = new ConstantAbility({
        card: mjolnir,
        effect: new ModifyAttackValueEffect({
            count: 1,
            match,
            target: TARGET_EFFECT,
        }),
        hideDialog: true,
        match,
        name: 'Mjolnir',
        trigger: TRIGGER_YOUR_HERO_GET_ATTACK,
    });
    const trigger = new Trigger({
        ability,
        card: mjolnir,
        trigger: TRIGGER_YOUR_HERO_GET_ATTACK,
    });

    mjolnir.triggers[TRIGGER_YOUR_HERO_GET_ATTACK] = {
        [PRIORITY_CONSTANT]: [trigger],
    };
    match.triggerCards[mjolnir.id] = mjolnir;

    const getAttackEffect = new GetAttackEffect({
        match,
        selectedTarget: hero,
    });
    await getAttackEffect.runEffect({
        fixedPreselectedTarget: true,
        match,
        player,
        selectedTarget: villain,
    });

    assert.equal(getAttackEffect.attack, 3);
    assert.equal(villain.modifyAttack, 0);
});
