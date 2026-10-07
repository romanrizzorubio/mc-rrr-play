import assert from 'node:assert/strict';
import {test} from 'node:test';

import {GameCard} from '../../src/model/cards/game-card.js';
import {PutFacedownCardInPlayEffect} from '../../src/effects/put-facedown-card-in-play-effect.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {
    addPlayerEvent,
    createUltronTestContext,
} from '../../test-support/ultron-test-context.js';
import ultron from '../../../mc-data/seed/catalog/scenarios/ultron.js';

const putDroneInPlay = async context => {
    const [player] = context.players;
    const sourceCard = addPlayerEvent(
        context.cardsFactory,
        player,
        'secret-drone-source',
        'Secret Drone Source'
    );
    const effect = new PutFacedownCardInPlayEffect({match: context.match});

    await effect.runEffect({player});

    return {drone: player.gameZone.minions[0], player, sourceCard};
};

test('Ultron III modifies the reused Drone card and stops modifying it when removed', async () => {
    const context = await createUltronTestContext();
    const {drone, player} = await putDroneInPlay(context);
    const villain = context.cardsFactory.createGameCard({
        card: context.cardsFactory.createCard(context.ultron.config.villains[2]),
    });

    context.match.villain = villain;
    await villain.initTriggers();

    assert.equal(await drone.getAttackValue({player}), 2);
    assert.equal(await drone.getHitPoints(), 2);

    villain.endTriggers();

    assert.equal(await drone.getAttackValue({player}), 1);
    assert.equal(await drone.getHitPoints(), 1);
});

test('serializes improved stats on facedown drones without revealing their source card', async () => {
    const context = await createUltronTestContext();
    const [player] = context.players;
    player.gameZone = new PlayerZone({owner: player});
    const improvedDronesConfig = ultron.config.cards.find(({card}) =>
        card.params.name === 'Drones mejorados').card;
    const improvedDrones = context.cardsFactory.createGameCard({
        card: context.cardsFactory.createCard({
            ...improvedDronesConfig,
            params: {
                ...improvedDronesConfig.params,
            },
        }),
        owner: context.scenario,
    });
    improvedDrones.controller = context.scenario;
    improvedDrones.attachedTo = context.environment;
    context.environment.attached.push(improvedDrones);
    await improvedDrones.initTriggers();

    const {drone} = await putDroneInPlay(context);
    const originalCard = drone.facedownConversion.card;
    const serializedZone = await player.gameZone.toObjWithAbilityAvailability(player);
    const serializedDrone = serializedZone.minions[0];
    const serializedText = JSON.stringify(serializedDrone);

    assert.equal(serializedDrone.attack, 2);
    assert.equal(serializedDrone.hitPoints, 2);
    assert.equal(serializedDrone.life, 2);
    assert.equal(serializedDrone.isFacedownCard, true);
    assert.equal(Object.hasOwn(serializedDrone, 'playable'), false);
    assert.equal(serializedText.includes(originalCard.name), false);
    assert.equal(serializedText.includes(originalCard.image), false);
    assert.strictEqual(serializedDrone.id, drone.id);
});

test('defeating a facedown Drone restores the same source card to its owner discard', async () => {
    const context = await createUltronTestContext();
    const {drone, player, sourceCard} = await putDroneInPlay(context);
    const originalPrintedCard = drone.facedownConversion.card;
    const originalId = sourceCard.facedownConversion.id;
    const serialized = drone.toObj();
    const serializedText = JSON.stringify(serialized);

    assert.deepEqual(serialized.faceDown, []);
    assert.equal(serialized.isFacedownCard, true);
    assert.equal(Object.hasOwn(serialized, 'isFacedownCharacter'), false);
    assert.equal(Object.hasOwn(serialized, 'isFacedownMinion'), false);
    assert.equal(serializedText.includes(originalPrintedCard.name), false);
    assert.equal(serializedText.includes(originalPrintedCard.image), false);

    await drone.defeat();

    assert.deepEqual(player.gameZone.minions, []);
    assert.deepEqual(player.deck.discardPile, [sourceCard]);
    assert.strictEqual(player.deck.discardPile[0], drone);
    assert.equal(drone.id, originalId);
    assert.strictEqual(drone.card, originalPrintedCard);
    assert.equal(drone.card.name, 'Secret Drone Source');
    assert.ok(drone instanceof GameCard);
    assert.equal(drone.isFacedownCard, undefined);
    assert.equal(drone.controller, undefined);
});
