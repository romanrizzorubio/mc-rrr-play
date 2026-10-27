import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TRIGGER_YOUR_SUPERHERO_FLIPS} from 'mc-shared';
import {TriggersFactory} from '../../src/factory/triggers/triggers-factory.js';
import {YourSuperheroFlipsTrigger} from '../../src/triggers/your-superhero-flips-trigger.js';

describe('YourSuperheroFlipsTrigger', () => {
    test('only matches its controller flipping their own superhero to Hero form', () => {
        const superhero = {currentSide: {isHero: true}};
        const player = {
            isHero: true,
            isPlayer: true,
            superhero,
        };
        const card = {controller: player};
        const trigger = new TriggersFactory({}).createTrigger({
            ability: {canTrigger: () => true},
            card,
            type: TRIGGER_YOUR_SUPERHERO_FLIPS,
        });
        const params = {
            player,
            triggeredCard: superhero,
        };

        assert.ok(trigger instanceof YourSuperheroFlipsTrigger);
        assert.equal(trigger.canTrigger(params), true);

        const otherSuperhero = {currentSide: {isHero: true}};
        const otherPlayer = {
            isHero: true,
            isPlayer: true,
            superhero: otherSuperhero,
        };
        assert.equal(Boolean(trigger.canTrigger({
            ...params,
            player: otherPlayer,
            triggeredCard: otherSuperhero,
        })), false);

        assert.equal(Boolean(trigger.canTrigger({
            ...params,
            player: {...player, isHero: false},
        })), false);
    });
});
