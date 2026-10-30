import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Scenario} from '../../src/model/match/scenario.js';

function createScheme(stage, name) {
    return {
        currentSide: {
            async removeAttached() {},
            name,
            stage,
        },
        endTriggers() {},
        async removeFaceDown() {},
    };
}

function createVillain() {
    return {
        endTriggers() {},
        async removeAttached() {},
        async removeFaceDown() {},
    };
}

function createPlayer(name, defeated = false) {
    return {
        defeated,
        gameZone: {cards: []},
        hand: {cards: []},
        isPlayer: true,
        name,
        superhero: {toObj() {return {name};}},
    };
}

test('zone merge uses individual choices and routes common cards with the first player', async () => {
    const dialogs = [];
    const players = [
        createPlayer('Primer jugador'),
        createPlayer('Jugador A'),
        createPlayer('Jugador B'),
    ];
    const match = {
        initialPlayer: players[0],
        players,
        removedCards: [],
        async openDialog(dialog) {
            dialogs.push(dialog);
            return {selected: {id: dialog.targetPlayer === 'Jugador A' ? 0 : 1}};
        },
        removeCard(card) {
            this.removedCards.push(card);
        },
        async refresh() {},
    };
    const scenario = new Scenario({
        mainSchemes: [],
        match,
        name: 'zone-merge-test',
        scenarioCards: [],
        separatePlayAreas: true,
        sets: [],
        villains: [],
    });
    match.scenario = scenario;

    const hub = scenario.createZone();
    const destinationA = scenario.createZone();
    const destinationB = scenario.createZone();
    const source = scenario.createZone();
    hub.addScheme(createScheme(2, 'El amo del tiempo'));
    destinationA.addScheme(createScheme(3, 'Cronópolis'));
    destinationB.addScheme(createScheme(3, 'Destino inexorable'));
    source.addScheme(createScheme(3, 'En el reino de Rama-Tut'));
    source.addVillain(createVillain());
    hub.addPlayer(players[0]);
    source.addPlayer(players[1]);
    source.addPlayer(players[2]);

    const commonCard = {
        async initTriggers() {},
        endTriggers() {},
    };
    const playerCard = {
        controller: players[1],
        async initTriggers() {},
        endTriggers() {},
    };
    source.addToGameZone(commonCard);
    source.addToGameZone(playerCard);

    await scenario.mergeZone(source);

    assert.equal(players[1].scenarioZone, destinationA);
    assert.equal(players[2].scenarioZone, destinationB);
    assert.ok(destinationA.cards.includes(playerCard));
    assert.ok(destinationB.cards.includes(commonCard));
    assert.equal(scenario.zones.includes(source), false);
    assert.equal(dialogs.length, 3);
    assert.deepEqual(dialogs.map(dialog => dialog.targetPlayer), [
        'Jugador A',
        'Jugador B',
        'Primer jugador',
    ]);
});

test('an all-defeated zone is removed without transferring its cards', async () => {
    const defeatedPlayer = createPlayer('Jugador derrotado', true);
    const survivor = createPlayer('Superviviente');
    const match = {
        initialPlayer: survivor,
        players: [survivor, defeatedPlayer],
        removedCards: [],
        removeCard(card) {
            this.removedCards.push(card);
        },
        async refresh() {},
    };
    const scenario = new Scenario({
        mainSchemes: [],
        match,
        name: 'defeated-zone-test',
        scenarioCards: [],
        separatePlayAreas: true,
        sets: [],
        villains: [],
    });
    match.scenario = scenario;

    const hub = scenario.createZone();
    const source = scenario.createZone();
    hub.addScheme(createScheme(2, 'El amo del tiempo'));
    source.addScheme(createScheme(3, 'Cronópolis'));
    source.addVillain(createVillain());
    hub.addPlayer(survivor);
    source.addPlayer(defeatedPlayer);
    const card = {endTriggers() {}};
    source.addToGameZone(card);

    await scenario.mergeZone(source);

    assert.equal(scenario.zones.includes(source), false);
    assert.equal(defeatedPlayer.scenarioZone, undefined);
    assert.equal(hub.cards.includes(card), false);
    assert.ok(match.removedCards.includes(card));
});

test('the hub advances to stage IV once every living player has joined it', async () => {
    const firstPlayer = createPlayer('Primer jugador');
    const joiningPlayer = createPlayer('Jugador que se une');
    const match = {
        initialPlayer: firstPlayer,
        players: [firstPlayer, joiningPlayer],
        removedCards: [],
        removeCard(card) {
            this.removedCards.push(card);
        },
        async refresh() {},
    };
    const scenario = new Scenario({
        mainSchemes: [],
        match,
        name: 'hub-convergence-test',
        scenarioCards: [],
        separatePlayAreas: true,
        sets: [],
        villains: [],
    });
    match.scenario = scenario;

    const hub = scenario.createZone();
    const source = scenario.createZone();
    hub.addScheme(createScheme(2, 'El amo del tiempo'));
    source.addScheme(createScheme(3, 'Cronópolis'));
    hub.addPlayer(firstPlayer);
    source.addPlayer(joiningPlayer);
    const advancedStages = [];
    scenario.advanceMainScheme = async (_zone, stage) => {
        advancedStages.push(stage);
    };

    await scenario.mergeZone(source);

    assert.equal(joiningPlayer.scenarioZone, hub);
    assert.deepEqual(advancedStages, [4]);
});
