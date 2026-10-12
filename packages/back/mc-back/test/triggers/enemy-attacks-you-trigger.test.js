import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EnemyAttacksYouTrigger} from '../../src/triggers/enemy-attacks-you-trigger.js';

test('EnemyAttacksYouTrigger is limited to its controller and matches group targets', () => {
    const controller = {
        superhero: {
            currentSide: {},
        },
    };
    const otherPlayer = {
        superhero: {
            currentSide: {},
        },
    };
    const trigger = new EnemyAttacksYouTrigger({
        ability: {canTrigger: () => true},
        card: {controller},
    });

    assert.equal(trigger.canTrigger({
        effect: {selectedTarget: otherPlayer},
        player: otherPlayer,
    }), undefined);

    assert.equal(trigger.canTrigger({
        effect: {
            selectedTarget: [
                otherPlayer.superhero.currentSide,
                controller.superhero.currentSide,
            ],
        },
        player: controller,
    }), true);

    assert.equal(trigger.canTrigger({
        effect: {selectedTarget: [otherPlayer.superhero.currentSide]},
        player: controller,
    }), undefined);
});
