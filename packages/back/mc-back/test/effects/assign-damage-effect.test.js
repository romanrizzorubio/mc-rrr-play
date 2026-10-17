import assert from 'node:assert/strict';
import {test} from 'node:test';

import {AssignDamageEffect} from '../../src/effects/assign-damage-effect.js';

const runSingleTargetAssignment = async ({damage, life}) => {
    let dialogCalls = 0;
    const character = {
        damage: 0,
        id: 'hero',
        async getEffectiveStats() {
            return {hitPoints: 10, life};
        },
        toObj() {
            return {id: this.id, life};
        },
    };
    const match = {
        effectsFactory: {
            createEffect({damage: amount, selectedTarget}) {
                return {
                    takenDamage: amount,
                    async runEffect() {
                        selectedTarget.damage += amount;
                    },
                };
            },
        },
        triggerCards: {},
        async openDialog() {
            dialogCalls++;

            return {assigned: {}};
        },
    };
    const effect = new AssignDamageEffect({
        damage,
        match,
        selectedTarget: [character],
    });

    await effect.execute({player: {hand: {cards: []}}});

    return {
        damageTaken: character.damage,
        dialogCalls,
    };
};

test('automatically assigns indirect damage to the only eligible character', async () => {
    const result = await runSingleTargetAssignment({
        damage: 2,
        life: 5,
    });

    assert.deepEqual(result, {
        damageTaken: 2,
        dialogCalls: 0,
    });
});

test('automatic indirect damage assignment does not exceed the target remaining life', async () => {
    const result = await runSingleTargetAssignment({
        damage: 5,
        life: 3,
    });

    assert.deepEqual(result, {
        damageTaken: 3,
        dialogCalls: 0,
    });
});

test('presents the superhero before allies and includes their assignable damage limits', async () => {
    const superhero = {
        damage: 0,
        id: 'hero',
        isSuperhero: true,
        async getEffectiveStats() {
            return {hitPoints: 10, life: 2};
        },
        toObj() {
            return {id: this.id};
        },
    };
    const ally = {
        damage: 0,
        id: 'ally',
        isSuperhero: false,
        async getEffectiveStats() {
            return {hitPoints: 5, life: 4};
        },
        toObj() {
            return {id: this.id};
        },
    };
    let assignmentDialog;
    const match = {
        effectsFactory: {
            createEffect({damage, selectedTarget}) {
                return {
                    async runEffect() {
                        selectedTarget.damage += damage;
                    },
                };
            },
        },
        triggerCards: {},
        async openDialog(dialog) {
            assignmentDialog = dialog;

            return {
                assigned: {
                    hero: 2,
                    ally: 1,
                },
            };
        },
    };
    const effect = new AssignDamageEffect({
        damage: 3,
        match,
        selectedTarget: [ally, superhero],
    });

    await effect.execute({player: {hand: {cards: []}}});

    assert.deepEqual(
        assignmentDialog.data.cards.map(({id, isSuperhero, life}) => ({
            id,
            isSuperhero,
            life,
        })),
        [
            {id: 'hero', isSuperhero: true, life: 2},
            {id: 'ally', isSuperhero: false, life: 4},
        ]
    );
    assert.deepEqual([superhero.damage, ally.damage], [2, 1]);
});
