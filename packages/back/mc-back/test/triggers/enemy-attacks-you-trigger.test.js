import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EnemyAttacksYouTrigger} from '../../src/triggers/enemy-attacks-you-trigger.js';

test('EnemyAttacksYouTrigger uses the event hand-holder and otherwise the controller', async () => {
    const controller = {
        superhero: {
            currentSide: {},
        },
        hand: {cards: []},
    };
    const otherPlayer = {
        superhero: {
            currentSide: {},
        },
        hand: {cards: []},
    };
    const eventOwner = {
        superhero: {
            currentSide: {},
        },
        hand: {cards: []},
    };
    const event = {
        isEvent: true,
        owner: eventOwner,
    };
    controller.hand.cards.push(event);

    const eventTrigger = new EnemyAttacksYouTrigger({
        ability: {canTrigger: () => true},
        card: event,
    });

    assert.equal(await eventTrigger.canTrigger({
        effect: {selectedTarget: controller},
        player: controller,
    }), true);
    assert.equal(await eventTrigger.canTrigger({
        effect: {selectedTarget: eventOwner},
        player: eventOwner,
    }), false);

    const otherCard = {
        controller,
        isEvent: false,
        owner: otherPlayer,
    };
    const otherCardTrigger = new EnemyAttacksYouTrigger({
        ability: {canTrigger: () => true},
        card: otherCard,
    });

    assert.equal(await otherCardTrigger.canTrigger({
        effect: {
            selectedTarget: [
                otherPlayer.superhero.currentSide,
                controller.superhero.currentSide,
            ],
        },
        player: controller,
    }), true);

    assert.equal(await otherCardTrigger.canTrigger({
        effect: {selectedTarget: otherPlayer},
        player: otherPlayer,
    }), false);
});
