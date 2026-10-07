import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {
    addPlayerEvent,
    createUltronTestContext,
} from '../../test-support/ultron-test-context.js';

test('defeating Ultron Advanced Drone puts the engaged player top card into play facedown', async () => {
    const context = await createUltronTestContext();
    const [player] = context.players;
    const sourceCard = addPlayerEvent(
        context.cardsFactory,
        player,
        'secret-advanced-drone-source'
    );
    const advancedDroneConfig = context.ultron.config.cards.find(({card}) =>
        card.params.name === 'Dron avanzado de Ultrón').card;
    const advancedDrone = context.cardsFactory.createGameCard({
        card: context.cardsFactory.createCard(advancedDroneConfig),
        owner: context.scenario,
    });

    advancedDrone.controller = player;
    advancedDrone.engaged = player;
    player.gameZone.engage(advancedDrone);
    await advancedDrone.initTriggers();

    const defeat = new DefeatEffect({
        match: context.match,
        selectedTarget: advancedDrone,
    });
    await defeat.runEffect({player});

    assert.equal(player.gameZone.minions.length, 1);
    const facedownDrone = player.gameZone.minions[0];

    assert.strictEqual(facedownDrone, sourceCard);
    assert.equal(facedownDrone.isFacedownCard, true);
    assert.equal(facedownDrone.isMinion, true);
    assert.equal(facedownDrone.engaged, player);
    assert.deepEqual(facedownDrone.faceDown, []);
});

test('simultaneously defeating advanced drones resolves each forced interrupt in its own dialog window', async () => {
    const context = await createUltronTestContext();
    const [player] = context.players;
    context.match.effectsFactory = context.cardsFactory.abilitiesFactory.effectsFactory;
    context.match.mc = {mcSocket: {send() {}}};
    context.match.name = 'ultron-test';

    const sourceCards = [1, 2].map(index =>
        addPlayerEvent(context.cardsFactory, player, `advanced-drone-source-${index}`));
    const advancedDroneConfig = context.ultron.config.cards.find(({card}) =>
        card.params.name === 'Dron avanzado de Ultrón').card;
    const advancedDrones = [1, 2].map(index => {
        const drone = context.cardsFactory.createGameCard({
            card: context.cardsFactory.createCard(structuredClone(advancedDroneConfig)),
            index,
            owner: context.scenario,
        });

        drone.controller = player;
        drone.engaged = player;
        player.gameZone.engage(drone);

        return drone;
    });

    await Promise.all(advancedDrones.map(drone => drone.initTriggers()));

    let openDialogs = 0;
    let maximumConcurrentDialogs = 0;
    let dialogCount = 0;
    const openDialog = context.match.openDialog;
    context.match.openDialog = async params => {
        openDialogs++;
        dialogCount++;
        maximumConcurrentDialogs = Math.max(maximumConcurrentDialogs, openDialogs);

        await new Promise(resolve => setImmediate(resolve));

        openDialogs--;

        return openDialog(params);
    };

    const damage = new TakeDamageEffect({
        damage: [4, 4],
        match: context.match,
        selectedTarget: advancedDrones,
    });
    await damage.runEffect({player});

    assert.equal(dialogCount, 2);
    assert.equal(maximumConcurrentDialogs, 1);
    assert.deepEqual(
        player.gameZone.minions,
        sourceCards
    );
    assert.ok(sourceCards.every(card =>
        card.isFacedownCard && card.engaged === player));
    assert.ok(advancedDrones.every(drone =>
        !player.gameZone.minions.includes(drone)));
    assert.equal(context.scenario.deck.discardPile.length, 2);
});
