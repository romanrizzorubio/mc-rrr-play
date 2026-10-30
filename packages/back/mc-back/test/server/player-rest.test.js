import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {ABILITY_ACTION} from 'mc-shared';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerRest} from '../../src/server/rest/player-rest.js';
import {AuthServiceClient} from '../../src/utils/auth-service-client.js';

const withAccount = async callback => {
    const authenticate = AuthServiceClient.authenticate;
    AuthServiceClient.authenticate = async () => ({
        id: 'account-1',
        name: 'TChalla',
    });
    try {
        return await callback();
    } finally {
        AuthServiceClient.authenticate = authenticate;
    }
};

describe('PlayerRest', () => {
test('playCard reuses the player snapshot sent by match.refresh', async () =>
    withAccount(async () => {
    const sent = [];
    const refreshedPlayer = {name: 'TChalla', userId: 'account-1'};
    const matchState = {
        players: [
            {name: 'TChalla', userId: 'account-2'},
            refreshedPlayer,
        ],
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
        userId: 'account-1',
        playCard: async () => {},
        toObjWithPlayableHand: async () => {
            throw new Error('The player should not be serialized a second time.');
        },
    };
    match.players.push({name: player.name, userId: 'account-2'}, player);
    match.initialized = true;
    match.phase = 'players';
    match.currentTurnPlayer = player;
    match.getPlayer = () => player;
    match.toObjWithPlayableHands = async () => matchState;

    const result = await new PlayerRest({}).playCard({
        cardId: 'wakanda-forever',
        cookie: 'session=verified',
        match,
        player: player.name,
    });

    assert.equal(result, refreshedPlayer);
    assert.equal(sent.length, 1);
    assert.equal(sent[0][2], matchState);
}));

test('playCard forwards the optional preselected target id', async () =>
    withAccount(async () => {
    let playParams;
    const refreshedPlayer = {name: 'TChalla', userId: 'account-1'};
    const player = {
        name: 'TChalla',
        userId: 'account-1',
        async playCard(params) {
            playParams = params;
        },
        toObjWithPlayableHand: async () => ({}),
    };
    const match = {
        players: [player],
        getPlayer: () => player,
        refresh: async () => ({players: [refreshedPlayer]}),
    };

    await new PlayerRest({}).playCard({
        cardId: 'damage-event',
        cookie: 'session=verified',
        match,
        player: player.name,
        targetId: 'villain-1',
    });

    assert.deepEqual(playParams, {
        cardId: 'damage-event',
        abilityType: ABILITY_ACTION,
        targetId: 'villain-1',
    });
}));

test('resolveAbility forwards a direct resource payment', async () =>
    withAccount(async () => {
    let abilityParams;
    const refreshedPlayer = {name: 'TChalla', userId: 'account-1'};
    const player = {
        name: 'TChalla',
        userId: 'account-1',
        async resolveAbility(...params) {
            abilityParams = params;
        },
    };
    const match = {
        players: [player],
        getPlayer: () => player,
        refresh: async () => ({players: [refreshedPlayer]}),
    };

    await new PlayerRest({}).resolveAbility({
        ability: 0,
        card: 'energy-channel',
        cookie: 'session=verified',
        match,
        player: player.name,
        resourcePayment: {
            cardId: 'energy-card',
            source: 'hand',
        },
    });

    assert.deepEqual(abilityParams, [
        'energy-channel',
        0,
        undefined,
        {
            cardId: 'energy-card',
            source: 'hand',
        },
    ]);
}));

test('flip changes identity once and returns the refreshed player snapshot', async () =>
    withAccount(async () => {
    const flipCalls = [];
    const refreshedPlayer = {name: 'TChalla', userId: 'account-1'};
    const player = {
        name: 'TChalla',
        userId: 'account-1',
        flip: async own => flipCalls.push(own),
        toObjWithPlayableHand: async () => {
            throw new Error('The player should not be serialized a second time.');
        },
    };
    const match = {
        players: [player],
        getPlayer: () => player,
        refresh: async () => ({
            players: [refreshedPlayer],
        }),
    };

    const result = await new PlayerRest({}).flip({
        match,
        cookie: 'session=verified',
        player: player.name,
    });

    assert.deepEqual(flipCalls, [true]);
    assert.equal(result, refreshedPlayer);
}));

test('createPlayer replaces the precon with the selected legal deck', async () => {
    const customDeck = [{count: 2, card: {type: 'event', params: {name: 'Carta'}}}];
    const heroConfig = {
        sides: [{params: {name: 'Hero alter ego'}}],
        cards: [],
        precon: [{count: 1, card: {type: 'event', params: {name: 'Precon'}}}],
    };
    const calls = [];
    const data = {
        getHeroConfig: async hero => {
            calls.push(['hero', hero]);
            return heroConfig;
        },
        getDeckConfig: async (deckId, hero) => {
            calls.push(['deck', deckId, hero]);
            return {
                aspect: 'justice',
                cards: customDeck,
            };
        },
    };
    const match = {
        creationConfig: {
            players: [],
            scenario: null,
            expert: false,
        },
        createPlayer: config => ({
            id: 'seat-1',
            toObj: () => config,
        }),
    };
    const originalCreateSuperhero = MatchFactory.prototype.createSuperhero;
    MatchFactory.prototype.createSuperhero = config => {
        config.sides[0].params.match = 'runtime match reference';

        return {id: 'hero-card'};
    };

    try {
        const result = await new PlayerRest({mc: {data}}).createPlayer({
            match,
            name: 'Player',
            hero: 'hero',
            deckId: 'deck-1',
        });

        assert.deepEqual(calls, [
            ['hero', 'hero'],
            ['deck', 'deck-1', 'hero'],
        ]);
        assert.deepEqual(result.config.precon, customDeck);
        assert.equal(result.config.aspect, 'justice');
        assert.deepEqual(match.creationConfig.players, [{
            id: 'seat-1',
            name: 'Player',
            initial: false,
            config: {
                sides: [{params: {name: 'Hero alter ego'}}],
                cards: [],
                precon: customDeck,
                aspect: 'justice',
            },
        }]);
        assert.notEqual(match.creationConfig.players[0].config, heroConfig);
        assert.equal(
            Object.hasOwn(
                match.creationConfig.players[0].config.sides[0].params,
                'match'
            ),
            false
        );
    } finally {
        MatchFactory.prototype.createSuperhero = originalCreateSuperhero;
    }
});
});
