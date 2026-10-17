import assert from 'node:assert/strict';
import {test} from 'node:test';

import {HeroInterruptAbility} from '../../src/abilities/interrupt/hero-interrupt-ability.js';
import {AlteregoResponseAbility} from '../../src/abilities/response/alterego-response-ability.js';
import {Effect} from '../../src/effects/effect.js';
import {HeroDefendsAttackTrigger} from '../../src/triggers/hero-defends-attack-trigger.js';
import {PlayerTurnStartTrigger} from '../../src/triggers/player-turn-start-trigger.js';

function createPlayer(id, isHero) {
    const player = {
        hand: {cards: []},
        id,
        isAlterEgo: !isHero,
        isHero,
        isPlayer: true,
    };
    player.superhero = {
        currentSide: {
            isHero,
            owner: player,
        },
    };

    return player;
}

function createAbilityEffect(match) {
    const effect = new Effect({match});
    effect.canRun = async () => true;

    return effect;
}

test('event triggers are available to the player holding the event, not its owner', async () => {
    const owner = createPlayer('owner', true);
    const handHolder = createPlayer('hand-holder', true);
    const event = {isEvent: true, owner};
    handHolder.hand.cards.push(event);

    const trigger = new PlayerTurnStartTrigger({
        ability: {canTrigger: () => true},
        card: event,
    });

    assert.equal(await trigger.canTrigger({player: handHolder}), true);
    assert.equal(await trigger.canTrigger({player: owner}), false);
});

test('a hero interrupt event uses the hand holder identity rather than its owner', async () => {
    const match = {triggerCards: {}};
    const owner = createPlayer('owner', false);
    const handHolder = createPlayer('hand-holder', true);
    const event = {id: 'borrowed-defense', isEvent: true, owner};
    handHolder.hand.cards.push(event);
    const ability = new HeroInterruptAbility({
        card: event,
        effect: createAbilityEffect(match),
        match,
    });
    const trigger = new HeroDefendsAttackTrigger({
        ability,
        card: event,
    });

    assert.equal(await trigger.canTrigger({
        arrowPaid: true,
        effect: {defender: handHolder.superhero.currentSide},
        player: handHolder,
    }), true);
});

test('an alter-ego response event uses the hand holder identity rather than its owner', async () => {
    const match = {triggerCards: {}};
    const owner = createPlayer('owner', true);
    const handHolder = createPlayer('hand-holder', false);
    const event = {id: 'borrowed-response', isEvent: true, owner};
    handHolder.hand.cards.push(event);
    const ability = new AlteregoResponseAbility({
        card: event,
        effect: createAbilityEffect(match),
        match,
    });

    assert.equal(await ability.canRun({
        arrowPaid: true,
        player: handHolder,
    }), true);
});
