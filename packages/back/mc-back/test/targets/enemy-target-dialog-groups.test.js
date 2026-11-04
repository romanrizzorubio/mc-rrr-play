import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {DIALOG_SELECT_TARGET, TARGET_ENEMY} from 'mc-shared';
import {ValidTarget} from '../../src/targets/valid-target.js';

describe('enemy target dialog groups', () => {
    const createTargets = () => {
        const playerOne = {
            id: 'player-one',
            isPlayer: true,
            name: 'Puesto de Ana',
            superhero: {
                currentSide: {name: 'Spider-Man'},
            },
        };
        const playerTwo = {
            id: 'player-two',
            isPlayer: true,
            name: 'Puesto de Bruno',
            superhero: {
                currentSide: {name: 'Capitana Marvel'},
            },
        };
        const villain = {
            abilities: [],
            id: 'villain',
            isVillain: true,
            name: 'Villano',
            toObj() {
                return {
                    id: this.id,
                    isVillain: this.isVillain,
                    name: this.name,
                };
            },
        };
        const minionOne = {
            abilities: [],
            engaged: playerOne,
            id: 'minion-one',
            isMinion: true,
            name: 'Esbirro de Ana',
            toObj() {
                return {
                    id: this.id,
                    isMinion: this.isMinion,
                    name: this.name,
                };
            },
        };
        const minionTwo = {
            abilities: [],
            engaged: playerTwo,
            id: 'minion-two',
            isMinion: true,
            name: 'Esbirro de Bruno',
            toObj() {
                return {
                    id: this.id,
                    isMinion: this.isMinion,
                    name: this.name,
                };
            },
        };
        const match = {
            enemies: [minionOne, villain, minionTwo],
            players: [playerOne, playerTwo],
        };

        return {match, minionOne, minionTwo, playerOne, villain};
    };

    test('separates the villain and groups minions by engaged player', async () => {
        const {match, minionTwo, playerOne, villain} = createTargets();
        const validTarget = new ValidTarget({match});
        let dialog;
        validTarget.openDialog = async options => {
            dialog = options;
            return {
                selected: options.data.cards.find(card =>
                    card.id === minionTwo.id),
            };
        };

        const selected = await validTarget.selectTarget({
            player: playerOne,
            target: TARGET_ENEMY,
        });

        assert.equal(dialog.dialogType, DIALOG_SELECT_TARGET);
        assert.deepEqual(
            dialog.data.cards.map(({id}) => id),
            ['minion-one', 'villain', 'minion-two']
        );
        assert.deepEqual(
            dialog.data.groups.map(({title, cards}) => ({
                title,
                cardIds: cards.map(({id}) => id),
            })),
            [
                {title: 'Villano', cardIds: ['villain']},
                {
                    title: 'Esbirros enfrentados a Spider-Man',
                    cardIds: ['minion-one'],
                },
                {
                    title: 'Esbirros enfrentados a Capitana Marvel',
                    cardIds: ['minion-two'],
                },
            ]
        );
        assert.strictEqual(selected, minionTwo);
        assert.ok(dialog.data.groups[0].cards.includes(
            dialog.data.cards.find(card => card.id === villain.id)
        ));
    });

    test('preserves the same groups for multi-target selection', async () => {
        const {match, minionOne, minionTwo, playerOne} = createTargets();
        const validTarget = new ValidTarget({match});
        let dialog;
        validTarget.openDialog = async options => {
            dialog = options;
            return {
                selected: [
                    options.data.cards.find(card => card.id === minionOne.id),
                    options.data.cards.find(card => card.id === minionTwo.id),
                ],
            };
        };

        const selected = await validTarget.selectTarget({
            player: playerOne,
            selectCount: 2,
            target: TARGET_ENEMY,
        });

        assert.deepEqual(
            dialog.data.groups.map(({title}) => title),
            [
                'Villano',
                'Esbirros enfrentados a Spider-Man',
                'Esbirros enfrentados a Capitana Marvel',
            ]
        );
        assert.deepEqual(selected, [minionOne, minionTwo]);
    });

    test('serializes effective hit points and life for character targets', async () => {
        const {match, minionOne, playerOne} = createTargets();
        const minionWithBonus = {
            ...minionOne,
            async getEffectiveStats({player}) {
                assert.strictEqual(player, playerOne);

                return {hitPoints: 8, life: 5};
            },
            toObj() {
                return {
                    ...minionOne.toObj(),
                    hitPoints: 6,
                    life: 3,
                };
            },
        };
        match.enemies = [minionWithBonus, {
            ...minionOne,
            id: 'minion-two',
            name: 'Otro esbirro',
            toObj() {
                return {id: this.id, name: this.name};
            },
        }];
        const validTarget = new ValidTarget({match});
        let dialog;
        validTarget.openDialog = async options => {
            dialog = options;

            return {selected: options.data.cards[0]};
        };

        const selected = await validTarget.selectTarget({
            player: playerOne,
            target: TARGET_ENEMY,
        });

        assert.equal(dialog.data.cards[0].hitPoints, 8);
        assert.equal(dialog.data.cards[0].life, 5);
        assert.strictEqual(selected, minionWithBonus);
    });
});
