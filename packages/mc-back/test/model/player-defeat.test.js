import assert from 'node:assert/strict';
import {test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {
    MATCH_END_REASON_ALL_HEROES_DEFEATED,
} from 'mc-shared';

import {CharacterGameCard} from '../../src/model/cards/character-game-card.js';
import {Player} from '../../src/model/match/player.js';

function createPlayer(name, match) {
    const superhero = {
        controller: null,
        currentSide: {handSize: 5},
        match,
        owner: null,
        toObj() {
            return {name: `${name} hero`};
        },
    };

    return new Player({name, superhero});
}

test('defeating a superhero eliminates its player without discarding the identity', async () => {
    const sent = [];
    const refreshed = [];
    const finished = [];
    const match = {
        mc: {
            mcSocket: {
                send(...args) {
                    sent.push(args);
                },
            },
        },
        name: 'players-defeat',
        players: [],
        async finishGame(reason) {
            finished.push(reason);
        },
        async refresh() {
            refreshed.push(true);
        },
    };
    const player = createPlayer('Player 1', match);
    match.players = [player];

    await CharacterGameCard.prototype.defeat.call({
        confused: 1,
        isSuperhero: true,
        isVillain: false,
        owner: player,
        stunned: 1,
        tough: 1,
    });

    assert.equal(player.defeated, true);
    assert.deepEqual(finished, [MATCH_END_REASON_ALL_HEROES_DEFEATED]);
    assert.deepEqual(refreshed, []);
    assert.equal(sent[0][1], EVENTS.PLAYER.DEFEAT);
    assert.equal(sent[0][2].defeated, true);
});

test('the game is lost only after every superhero has been defeated', async () => {
    const sent = [];
    const refreshed = [];
    const finished = [];
    const match = {
        mc: {
            mcSocket: {
                send(...args) {
                    sent.push(args);
                },
            },
        },
        name: 'co-op-players-defeat',
        players: [],
        async finishGame(reason) {
            finished.push(reason);
        },
        async refresh() {
            refreshed.push(true);
        },
    };
    const first = createPlayer('Player 1', match);
    const second = createPlayer('Player 2', match);
    match.players = [first, second];

    await first.defeat();
    await first.defeat();

    assert.equal(first.defeated, true);
    assert.equal(second.defeated, false);
    assert.deepEqual(finished, []);
    assert.deepEqual(refreshed, [true]);
    assert.equal(sent.length, 1);

    await second.defeat();

    assert.equal(second.defeated, true);
    assert.deepEqual(finished, [MATCH_END_REASON_ALL_HEROES_DEFEATED]);
    assert.deepEqual(refreshed, [true]);
    assert.equal(sent.length, 2);
});
