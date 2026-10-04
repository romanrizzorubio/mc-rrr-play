import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TRIGGER_THIS_ATTACK} from 'mc-shared';
import {Attack} from '../../src/activations/attack.js';
import {RetaliateTrigger} from '../../src/triggers/retaliate-trigger.js';

test('does not offer retaliation for an enemy removed from play by the attack', async () => {
    const target = {
        card: {retaliate: 1},
        isEnemy: true,
        isInPlay: true,
        getLife: async () => 3,
    };
    const match = {enemies: [target]};
    const attack = new Attack({
        effect: {
            character: {},
            match,
            ranged: false,
        },
    });
    const trigger = new RetaliateTrigger(attack, target);

    assert.equal(await trigger.canTrigger(), true);

    match.enemies = [];

    assert.equal(await trigger.canTrigger(), false);
});

test('allows retaliation from an in-play hero attacked by an enemy', async () => {
    const target = {
        card: {retaliate: 1},
        isEnemy: false,
        isInPlay: true,
        getLife: async () => 3,
    };
    const attack = new Attack({
        effect: {
            character: {},
            match: {enemies: []},
            ranged: false,
        },
    });
    const trigger = new RetaliateTrigger(attack, target);

    assert.equal(await trigger.canTrigger(), true);
});

test('does not apply retaliation after a friendly character leaves play', async () => {
    let retaliationApplied = false;
    const target = {
        card: {retaliate: 1},
        isEnemy: false,
        isInPlay: true,
        getLife: async () => 3,
    };
    const match = {
        enemies: [],
        effectsFactory: {
            createEffect: () => ({
                async runEffect() {
                    retaliationApplied = true;
                },
            }),
        },
    };
    const attack = new Attack({
        effect: {
            character: {},
            match,
            ranged: false,
        },
    });
    const trigger = new RetaliateTrigger(attack, target);

    target.isInPlay = false;

    await trigger.runTrigger({});

    assert.equal(retaliationApplied, false);
});

function createCharacter(name, retaliate, isEnemy = false) {
    return {
        card: {retaliate},
        isEnemy,
        isInPlay: true,
        name,
        async getLife() {
            return 10;
        },
    };
}

function createAttack(match, character, selectedTarget) {
    return new Attack({
        effect: {
            character,
            match,
            ranged: false,
            selectedTarget,
        },
    });
}

function createRetaliationMatch(enemies, appliedDamage) {
    return {
        enemies,
        effectsFactory: {
            createEffect: ({damage, selectedTarget}) => ({
                async runEffect() {
                    appliedDamage.push({
                        damage,
                        target: selectedTarget.name,
                    });
                },
            }),
        },
    };
}

test('retaliation from one attack does not carry over to the response attack', async () => {
    const appliedDamage = [];
    const panther = createCharacter('Pantera Negra', 1);
    const rhino = createCharacter('Rino', 0, true);
    const match = createRetaliationMatch([rhino], appliedDamage);
    const firstAttack = createAttack(match, rhino, panther);
    const responseAttack = createAttack(match, panther, rhino);
    const firstRetaliation = firstAttack.getForcedResponseTriggers([TRIGGER_THIS_ATTACK])[0];
    const responseRetaliation = responseAttack.getForcedResponseTriggers([TRIGGER_THIS_ATTACK])[0];

    assert.equal(await firstRetaliation.canTrigger({}), true);
    await firstRetaliation.runTrigger({});
    assert.equal(await responseRetaliation.canTrigger({}), false);

    const responseParams = responseAttack.getTriggersParams({
        character: rhino,
        attack: firstAttack,
    });

    assert.deepEqual(appliedDamage, [{damage: 1, target: 'Rino'}]);
    assert.equal(responseParams.character, panther);
    assert.equal(responseParams.attack, responseAttack);
});

test('the response attack uses only its own target retaliation', async () => {
    const appliedDamage = [];
    const panther = createCharacter('Pantera Negra', 0);
    const rhino = createCharacter('Rino', 1, true);
    const match = createRetaliationMatch([rhino], appliedDamage);
    const firstAttack = createAttack(match, rhino, panther);
    const responseAttack = createAttack(match, panther, rhino);
    const firstRetaliation = firstAttack.getForcedResponseTriggers([TRIGGER_THIS_ATTACK])[0];
    const responseRetaliation = responseAttack.getForcedResponseTriggers([TRIGGER_THIS_ATTACK])[0];

    assert.equal(await firstRetaliation.canTrigger({}), false);
    assert.equal(await responseRetaliation.canTrigger({}), true);
    await responseRetaliation.runTrigger({});

    assert.deepEqual(appliedDamage, [{damage: 1, target: 'Pantera Negra'}]);
});
