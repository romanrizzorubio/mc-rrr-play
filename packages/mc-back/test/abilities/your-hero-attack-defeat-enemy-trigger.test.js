import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY} from 'mc-shared';
import {
    YourHeroAttackDefeatEnemyTrigger
} from '../../src/triggers/your-hero-attack-defeat-enemy-trigger.js';

test('an event owned by the player can trigger after their hero defeats an enemy', async () => {
    const hero = {};
    const player = {
        isHero: true,
        superhero: {
            currentSide: hero,
        },
    };
    const trigger = new YourHeroAttackDefeatEnemyTrigger({
        card: {
            isEvent: true,
            owner: player,
        },
        ability: {
            canTrigger: () => true,
        },
        trigger: TRIGGER_YOUR_HERO_ATTACK_DEFEAT_ENEMY,
    });

    assert.equal(await trigger.canTrigger({
        player,
        effect: {
            isAttack: true,
            activation: {
                character: hero,
            },
            selectedTarget: {
                isEnemy: true,
            },
        },
    }), true);
});
