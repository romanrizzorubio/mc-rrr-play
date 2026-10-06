import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_CONSTANT,
    CARD_TYPE_UPGRADE,
    EFFECT_MODIFY_HIT_POINTS,
    TARGET_ATTACHED,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
} from 'mc-shared';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';

test('character hit points include constant modifiers from cards in play', async () => {
    const player = {isPlayer: true};
    const match = {
        initialPlayer: player,
        triggerCards: {},
    };
    const cardsFactory = new CardsFactory({match});
    const character = new CharacterGameCard({
        card: {
            hitPoints: 4,
            isAlly: true,
            isCharacter: true,
            match,
        },
        owner: player,
    });
    character.controller = player;
    character.damage = 3;

    const modifier = cardsFactory.createGameCard({
        card: cardsFactory.createCard({
            type: CARD_TYPE_UPGRADE,
            params: {
                abilities: [
                    {
                        type: ABILITY_CONSTANT,
                        params: {
                            trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
                            effect: {
                                type: EFFECT_MODIFY_HIT_POINTS,
                                params: {
                                    target: TARGET_ATTACHED,
                                    count: 2,
                                },
                            },
                        },
                    },
                ],
                match,
                name: 'Character health modifier',
            },
        }),
        owner: player,
    });
    modifier.attachedTo = character;
    character.attached.push(modifier);
    await modifier.initTriggers();

    assert.equal(await character.getHitPoints(), 6);
    assert.equal(await character.getLife(), 3);
    const effectiveStats = await character.getEffectiveStats();
    assert.equal(effectiveStats.hitPoints, 6);
    assert.equal(effectiveStats.life, 3);

    modifier.endTriggers();

    assert.equal(await character.getHitPoints(), 4);
    assert.equal(await character.getLife(), 1);
    const statsWithoutModifier = await character.getEffectiveStats();
    assert.equal(statsWithoutModifier.hitPoints, 4);
    assert.equal(statsWithoutModifier.life, 1);
});
