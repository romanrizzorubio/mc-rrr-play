import assert from 'node:assert/strict';
import test from 'node:test';

import {SetLifeEffect} from '../../src/effects/set-life-effect.js';

test('SetLifeEffect sets remaining life by updating damage against effective hit points', async () => {
    const player = {};
    const target = {
        damage: 2,
        refreshed: false,
        async getHitPoints(params) {
            assert.equal(params.player, player);

            return 11;
        },
        async refresh() {
            this.refreshed = true;
        },
    };
    const effect = new SetLifeEffect({
        life: 1,
        selectedTarget: target,
    });

    await effect.execute({player});

    assert.equal(target.damage, 10);
    assert.equal(target.refreshed, true);
});

test('SetLifeEffect rejects a requested life value above the target maximum', async () => {
    const target = {
        damage: 0,
        async refresh() {},
        async getHitPoints() {
            return 1;
        },
    };
    const effect = new SetLifeEffect({
        life: 2,
        selectedTarget: target,
    });

    await assert.rejects(
        effect.execute({player: {}}),
        /life cannot exceed the target hit points/
    );
});
