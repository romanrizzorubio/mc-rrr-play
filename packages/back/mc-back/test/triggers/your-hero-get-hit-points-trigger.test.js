import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    YourHeroGetHitPointsTrigger,
} from '../../src/triggers/your-hero-get-hit-points-trigger.js';

test('YourHeroGetHitPointsTrigger is scoped to its controller, including in alter ego', () => {
    const superhero = {currentSide: {}};
    const controller = {
        isHero: false,
        superhero,
    };
    const otherSuperhero = {currentSide: {}};
    const otherPlayer = {
        isHero: true,
        superhero: otherSuperhero,
    };
    const trigger = new YourHeroGetHitPointsTrigger({
        ability: {
            canTrigger: () => true,
        },
        card: {
            controller,
        },
    });

    assert.equal(trigger.canTrigger({
        effect: {selectedTarget: superhero},
        player: controller,
    }), true);
    assert.equal(trigger.canTrigger({
        effect: {selectedTarget: otherSuperhero},
        player: otherPlayer,
    }), undefined);
});
