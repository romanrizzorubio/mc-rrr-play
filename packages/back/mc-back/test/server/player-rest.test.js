import assert from 'node:assert/strict';
import {test} from 'node:test';

import {MatchFactory} from '../../src/factory/match-factory.js';
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
