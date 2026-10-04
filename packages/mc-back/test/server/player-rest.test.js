import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Match} from '../../src/model/match/match.js';
import {PlayerRest} from '../../src/server/rest/player-rest.js';

test('playCard reuses the player snapshot sent by match.refresh', async () => {
    const sent = [];
    const refreshedPlayer = {name: 'TChalla'};
    const matchState = {
        players: [refreshedPlayer],
    };
    const match = new Match({
        mc: {
            mcSocket: {
                send: (...args) => sent.push(args),
            },
        },
        name: 'play-card-refresh',
    });
    const player = {
        name: 'TChalla',
        playCard: async () => {},
        toObjWithPlayableHand: async () => {
            throw new Error('The player should not be serialized a second time.');
        },
    };
    match.getPlayer = () => player;
    match.toObjWithPlayableHands = async () => matchState;

    const result = await new PlayerRest({}).playCard({
        cardId: 'wakanda-forever',
        match,
        player: player.name,
    });

    assert.equal(result, refreshedPlayer);
    assert.equal(sent.length, 1);
    assert.equal(sent[0][2], matchState);
});

test('flip changes identity once and returns the refreshed player snapshot', async () => {
    const flipCalls = [];
    const refreshedPlayer = {name: 'TChalla'};
    const player = {
        name: 'TChalla',
        flip: async own => flipCalls.push(own),
        toObjWithPlayableHand: async () => {
            throw new Error('The player should not be serialized a second time.');
        },
    };
    const match = {
        getPlayer: () => player,
        refresh: async () => ({
            players: [refreshedPlayer],
        }),
    };

    const result = await new PlayerRest({}).flip({
        match,
        player: player.name,
    });

    assert.deepEqual(flipCalls, [true]);
    assert.equal(result, refreshedPlayer);
});
