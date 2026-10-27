import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CARD_TYPE_ALLY, TARGET_ALL_PLAYERS, TRAIT_DRONE} from 'mc-shared';
import {PutFacedownCardInPlayEffect} from '../../src/effects/put-facedown-card-in-play-effect.js';
import {
    addPlayerEvent,
    createUltronTestContext,
} from '../../test-support/ultron-test-context.js';

describe('PutFacedownCardInPlayEffect', () => {
    test('converts and engages each player top card in place', async () => {
        const context = await createUltronTestContext({playerCount: 2});
        const sourceCards = context.players.map((player, index) =>
            addPlayerEvent(context.cardsFactory, player, `secret-${index + 1}`));
        const effect = new PutFacedownCardInPlayEffect({
            match: context.match,
            players: TARGET_ALL_PLAYERS,
        });

        await effect.runEffect({player: context.players[0]});

        for (const [index, player] of context.players.entries()) {
            const drone = player.gameZone.minions[0];
            const serialized = drone.toObj();
            const serializedText = JSON.stringify(serialized);

            assert.strictEqual(drone, sourceCards[index]);
            assert.equal(drone.isFacedownCard, true);
            assert.equal(drone.isMinion, true);
            assert.equal(drone.engaged, player);
            assert.deepEqual(drone.faceDown, []);
            assert.deepEqual(drone.traits, [TRAIT_DRONE]);
            assert.equal(drone.attack, 1);
            assert.equal(drone.scheme, 1);
            assert.equal(drone.hitPoints, 1);
            assert.equal(drone.card.name, 'Dron boca abajo');
            assert.equal(drone.card.image, '');
            assert.equal(player.deck.cards.includes(drone), false);
            assert.deepEqual(serialized.faceDown, []);
            assert.equal(serialized.isFacedownCard, true);
            assert.equal(serialized.name, 'Dron boca abajo');
            assert.equal(Object.hasOwn(serialized, 'isFacedownCharacter'), false);
            assert.equal(Object.hasOwn(serialized, 'isFacedownMinion'), false);
            assert.equal(serializedText.includes(`secret-${index + 1}`), false);
            assert.equal(serializedText.includes(`heroes/test/secret-${index + 1}.png`), false);
        }
    });

    test('restores a character source card trait modifiers after the facedown Drone is defeated', async () => {
        const context = await createUltronTestContext();
        const [player] = context.players;
        const sourceCard = context.cardsFactory.createGameCard({
            card: context.cardsFactory.createCard({
                type: CARD_TYPE_ALLY,
                params: {
                    name: 'Test Ally',
                    set: 'test',
                    attack: 1,
                    thwart: 1,
                    hitPoints: 3,
                },
            }),
            owner: player,
        });
        const modifierSource = {isInPlay: false};

        sourceCard.addTraitModifier(modifierSource, {}, 'Test Trait');
        const originalTraitModifiers = sourceCard.traitModifiers;
        const originalTraitModifier = originalTraitModifiers[0];
        player.deck.cards.push(sourceCard);

        const effect = new PutFacedownCardInPlayEffect({match: context.match});
        await effect.runEffect({player});

        const drone = player.gameZone.minions[0];

        assert.strictEqual(drone, sourceCard);
        assert.deepEqual(drone.traitModifiers, []);

        await drone.defeat();

        assert.strictEqual(sourceCard.traitModifiers, originalTraitModifiers);
        assert.strictEqual(sourceCard.traitModifiers[0], originalTraitModifier);
    });
});
