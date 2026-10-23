import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {DIALOG_DEFENSE} from 'mc-shared';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';

describe('enemy attack defense dialog character data', () => {
    test('shows effective defender stats and acquired keywords', async () => {
        const player = {
            defenders: [],
            hand: {cards: []},
            isPlayer: true,
        };
        let statsPlayer;
        const acquiredKeywords = [{name: 'retaliate', value: 1}];
        const effectiveStats = {
            attack: 4,
            defense: 5,
            hitPoints: 12,
            life: 9,
            recovery: 3,
            scheme: 2,
            thwart: 3,
        };
        const defender = {
            isSuperhero: true,
            owner: player,
            async getEffectiveStats({player: statPlayer} = {}) {
                statsPlayer = statPlayer;

                return effectiveStats;
            },
            toObj() {
                return {
                    attack: 1,
                    defense: 2,
                    extraKeywords: acquiredKeywords,
                    hitPoints: 10,
                    life: 8,
                    recovery: 1,
                    scheme: 0,
                    thwart: 1,
                };
            },
        };
        player.defenders.push(defender);

        const attackTarget = {
            owner: player,
            toObj() {
                return {name: 'Spider-Man'};
            },
        };
        const enemy = {
            async getAttackValue() {
                return 2;
            },
        };
        const effect = new EnemyAttackEffect({
            enemy,
            match: {},
            selectedTarget: attackTarget,
        });
        let dialog;
        effect.toObj = () => ({character: {attack: 1}});
        effect.openDialog = async configuration => {
            dialog = configuration;

            return {};
        };

        await effect.defense({player});

        assert.equal(dialog.dialogType, DIALOG_DEFENSE);
        assert.equal(statsPlayer, player);
        assert.deepEqual(dialog.data.defenders[0], {
            attack: 4,
            defense: 5,
            extraKeywords: acquiredKeywords,
            hitPoints: 12,
            life: 9,
            recovery: 3,
            scheme: 2,
            thwart: 3,
        });
    });
});
