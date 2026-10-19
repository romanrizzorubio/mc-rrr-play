import assert from 'node:assert/strict';
import {test} from 'node:test';

import {TARGET_SIDE} from 'mc-shared';
import runningInterference from '../../../mc-data/seed/catalog/sets/running-interference.js';
import {FlipEffect} from '../../src/effects/flip-effect.js';
import {ReadyEffect} from '../../src/effects/ready-effect.js';
import {Player} from '../../src/model/match/player.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

function createPlayer(name, match) {
    const player = Object.create(Player.prototype);
    player.name = name;
    player.isPlayer = true;
    player.hand = {cards: []};
    player.superhero = {
        attached: [],
        currentSide: {isHero: true},
        isSuperhero: true,
        match,
        owner: player,
        sides: [],
        getAttachedCards() {
            return this.attached;
        },
    };

    return player;
}

async function getPlayableSnapshot(player) {
    player.superhero.currentSide.abilities = [];
    player.superhero.currentSide.traits = [];
    player.superhero.extraTraits = [];
    player.superhero.getEffectiveTraits = async () => [];
    player.superhero.getEffectiveStats = async () => ({});
    player.hand = {
        toObjWithPlayability: async () => [],
    };
    player.getHandSize = async () => 0;
    player.toObj = () => ({
        superhero: {
            extraTraits: [],
        },
    });
    for (const card of player.superhero.attached) {
        card.toObjWithAbilityAvailability = async () => ({id: card.id});
    }

    return Player.prototype.toObjWithPlayableHand.call(player);
}

test('Con las manos atadas blocks ready and identity changes only for its attached player', async () => {
    const match = {
        players: [],
        triggerCards: {},
    };
    const firstPlayer = createPlayer('Attached player', match);
    const secondPlayer = createPlayer('Other player', match);
    match.players = [firstPlayer, secondPlayer];

    const attachmentConfig = runningInterference.config.cards
        .find(({card}) => card.params.name === 'Con las manos atadas').card;
    const factory = new CardsFactory({match});
    const attachment = factory.createGameCard({
        card: factory.createCard(attachmentConfig),
        owner: {},
    });
    firstPlayer.superhero.attached.push(attachment);
    attachment.attachedTo = firstPlayer.superhero;
    await attachment.initTriggers();

    assert.equal(await firstPlayer.canReady({card: firstPlayer.superhero}), false);
    assert.equal(await firstPlayer.canFlip({card: firstPlayer.superhero}), false);
    assert.equal(await secondPlayer.canReady({card: secondPlayer.superhero}), true);
    assert.equal(await secondPlayer.canFlip({card: secondPlayer.superhero}), true);

    const firstSnapshot = await getPlayableSnapshot(firstPlayer);
    const secondSnapshot = await getPlayableSnapshot(secondPlayer);
    assert.equal(firstSnapshot.superhero.canFlip, false);
    assert.equal(secondSnapshot.superhero.canFlip, true);

    let readyCount = 0;
    const readyTarget = {
        exhausted: true,
        isSuperhero: true,
        owner: firstPlayer,
        ready() {
            readyCount++;
        },
        async refresh() {},
    };
    const readyEffect = new ReadyEffect({
        match,
        selectedTarget: readyTarget,
    });
    await readyEffect.execute({player: firstPlayer});
    assert.equal(readyCount, 0);

    const heroSide = {
        exhausted: true,
        isHero: true,
        owner: firstPlayer,
        parent: firstPlayer.superhero,
        readyCount: 0,
        ready() {
            this.readyCount++;
        },
        async refresh() {},
    };
    firstPlayer.superhero.sides.push(heroSide);
    const heroSideReadyEffect = new ReadyEffect({
        match,
        selectedTarget: heroSide,
    });
    await heroSideReadyEffect.execute({player: firstPlayer});
    assert.equal(heroSide.readyCount, 0);

    const ally = {
        owner: firstPlayer,
        readyCount: 0,
        ready() {
            this.readyCount++;
        },
        async refresh() {},
    };
    const allyReadyEffect = new ReadyEffect({
        match,
        selectedTarget: ally,
    });
    assert.equal(await firstPlayer.canReady({card: ally}), true);
    await allyReadyEffect.execute({player: firstPlayer});
    assert.equal(ally.readyCount, 1);

    let flipCount = 0;
    const flipTarget = {
        isSuperhero: true,
        owner: firstPlayer,
        sides: [{}, {}],
        async flipToSide() {
            flipCount++;
        },
    };
    const flipEffect = new FlipEffect({
        formTarget: TARGET_SIDE,
        match,
        selectedFormTarget: flipTarget.sides[1],
        selectedTarget: flipTarget,
    });
    assert.equal(
        await flipEffect.canFlipTarget(heroSide, {player: firstPlayer}),
        false
    );

    const doubleSidedPlayerCard = {
        owner: firstPlayer,
        sides: [{}, {}],
    };
    assert.equal(
        await flipEffect.canFlipTarget(doubleSidedPlayerCard, {player: firstPlayer}),
        true
    );

    await flipEffect.execute({player: firstPlayer});
    assert.equal(flipCount, 0);
});
