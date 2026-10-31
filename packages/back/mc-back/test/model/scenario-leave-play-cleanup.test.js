import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {Scenario} from '../../src/model/match/scenario.js';

describe('Scenario leave-play cleanup', () => {
    test('merging an all-defeated zone discards cards under removed cards', async () => {
        const discardedUnder = [];
        const removedCards = [];
        const defeatedPlayer = {
            defeated: true,
            gameZone: {cards: []},
            hand: {cards: []},
            isPlayer: true,
            name: 'Jugador derrotado',
            superhero: {toObj() {return {name: this.name};}},
        };
        const match = {
            initialPlayer: defeatedPlayer,
            players: [defeatedPlayer],
            removeCard(card) {
                removedCards.push(card);
            },
            async refresh() {},
        };
        const scenario = new Scenario({
            mainSchemes: [],
            match,
            name: 'leave-play-cleanup-test',
            scenarioCards: [],
            separatePlayAreas: true,
            sets: [],
            villains: [],
        });
        match.scenario = scenario;

        const source = scenario.createZone();
        source.addPlayer(defeatedPlayer);
        const card = {
            endTriggers() {},
            async removeAttached() {},
            async discardCardsUnder() {
                discardedUnder.push(this);
            },
        };
        source.addToGameZone(card);

        await scenario.mergeZone(source);

        assert.deepEqual(discardedUnder, [card]);
        assert.deepEqual(removedCards, [card]);
        assert.equal(scenario.zones.includes(source), false);
    });

    test('merging a live zone discards cards under its Villain and main scheme', async () => {
        const discardedUnder = [];
        const removedCards = [];
        const players = ['Primer jugador', 'Jugador que se une'].map(name => ({
            defeated: false,
            gameZone: {cards: []},
            hand: {cards: []},
            isPlayer: true,
            name,
            superhero: {toObj() {return {name: this.name};}},
        }));
        const match = {
            initialPlayer: players[0],
            players,
            removeCard(card) {
                removedCards.push(card);
            },
            async refresh() {},
        };
        const scenario = new Scenario({
            mainSchemes: [],
            match,
            name: 'live-zone-merge-cleanup-test',
            scenarioCards: [],
            separatePlayAreas: true,
            sets: [],
            villains: [],
        });
        match.scenario = scenario;

        const destination = scenario.createZone();
        const source = scenario.createZone();
        const scheme = {
            currentSide: {
                stage: 3,
                name: 'Plan secundario',
                async removeAttached() {},
            },
            endTriggers() {},
            async discardCardsUnder() {
                discardedUnder.push('scheme');
            },
        };
        const villain = {
            endTriggers() {},
            async removeAttached() {},
            async discardCardsUnder() {
                discardedUnder.push('villain');
            },
        };
        destination.addPlayer(players[0]);
        source.addPlayer(players[1]);
        source.addScheme(scheme);
        source.addVillain(villain);
        scenario.advanceMainScheme = async () => {};

        await scenario.mergeZone(source);

        assert.deepEqual(discardedUnder, ['villain', 'scheme']);
        assert.ok(removedCards.includes(villain));
        assert.ok(removedCards.includes(scheme));
        assert.equal(scenario.zones.includes(source), false);
    });
});
