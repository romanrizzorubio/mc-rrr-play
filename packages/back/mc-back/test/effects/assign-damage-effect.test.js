import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {AssignDamageEffect} from '../../src/effects/assign-damage-effect.js';

describe('AssignDamageEffect', () => {
    const createDamageEffect = ({damage, selectedTarget}) => {
        const targets = Array.isArray(selectedTarget) ?
            selectedTarget :
            [selectedTarget];
        const amounts = Array.isArray(damage) ?
            damage :
            targets.map(() => damage);

        return {
            takenDamage: Array.isArray(selectedTarget) ?
                amounts :
                amounts[0],
            async runEffect() {
                targets.forEach((target, index) => {
                    target.damage += amounts[index];
                });
            },
        };
    };

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
                createEffect: createDamageEffect,
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

    test('presents the superhero before allies and applies each assignment', async () => {
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
                createEffect: createDamageEffect,
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

    test('keeps assigned damage scoped to each selected player', async () => {
        const createPlayer = id => {
            const superhero = {
                damage: 0,
                id: `${id}-hero`,
                isSuperhero: true,
                async getEffectiveStats() {
                    return {hitPoints: 10, life: 10};
                },
                toObj() {
                    return {id: this.id};
                },
            };
            const ally = {
                damage: 0,
                id: `${id}-ally`,
                isSuperhero: false,
                async getEffectiveStats() {
                    return {hitPoints: 5, life: 5};
                },
                toObj() {
                    return {id: this.id};
                },
            };

            return {
                allies: [ally],
                hand: {cards: []},
                id,
                isPlayer: true,
                superhero,
            };
        };
        const firstPlayer = createPlayer('first');
        const secondPlayer = createPlayer('second');
        const assignmentPlayers = [];
        const match = {
            effectsFactory: {
                createEffect: createDamageEffect,
            },
            triggerCards: {},
            async openDialog({data, targetPlayer}) {
                assignmentPlayers.push({
                    cards: data.cards.map(({id}) => id),
                    player: targetPlayer.id,
                });

                return {
                    assigned: {
                        [targetPlayer.superhero.id]:
                            targetPlayer === firstPlayer ? 1 : 3,
                        [targetPlayer.allies[0].id]: 0,
                    },
                };
            },
        };
        const effect = new AssignDamageEffect({
            activation: {
                checkStatus: () => true,
                getTriggersEnds: () => [],
                getTriggersInit: () => [],
                getTriggersParams: triggerParams => triggerParams,
                getTriggersWould: () => [],
            },
            damage: [1, 3],
            isAttack: true,
            match,
            selectedTarget: [firstPlayer, secondPlayer],
        });

        await effect.execute({player: firstPlayer});

        assert.deepEqual(assignmentPlayers, [
            {
                cards: ['first-hero', 'first-ally'],
                player: 'first',
            },
            {
                cards: ['second-hero', 'second-ally'],
                player: 'second',
            },
        ]);
        assert.deepEqual(
            [
                firstPlayer.superhero.damage,
                firstPlayer.allies[0].damage,
                secondPlayer.superhero.damage,
                secondPlayer.allies[0].damage,
            ],
            [1, 0, 3, 0]
        );
        assert.equal(effect.getTakenDamageFor(firstPlayer.superhero), 1);
        assert.equal(effect.getTakenDamageFor(secondPlayer.superhero), 3);
    });
});
