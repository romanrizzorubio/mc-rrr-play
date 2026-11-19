import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {EVENTS} from 'mc-endpoints';
import {TRAIT_ATTACK, TRAIT_THWART} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PlayRoundEffect} from '../../src/effects/play-round-effect.js';
import {PlayTurnEffect} from '../../src/effects/play-turn-effect.js';
import {Player} from '../../src/model/match/player.js';

describe('played Events this turn', () => {
    test('records an Event before its ability resolves and removes it if payment is canceled', async () => {
        const player = {
            playedCardsThisRound: [],
            playedEventsThisTurn: [],
            config: {},
            deck: {
                async discard() {},
            },
            hand: {
                cards: [],
                async refresh() {},
            },
        };
        const event = {
            id: 'test-event',
            name: 'Test event',
            isEvent: true,
            traits: [TRAIT_ATTACK, TRAIT_THWART],
        };
        const ability = {
            paymentCancelled: false,
            async resolveAbility({playCardEffect}) {
                assert.equal(playCardEffect.isFirstCardThisRound, true);
                assert.deepEqual(player.playedEventsThisTurn, [{
                    traits: [TRAIT_ATTACK, TRAIT_THWART],
                }]);
            },
        };
        const playEffect = new PlayCardEffect({
            card: event,
            ability,
            match: {},
        });

        await playEffect.doPlay({player});
        assert.deepEqual(player.playedEventsThisTurn, [{
            traits: [TRAIT_ATTACK, TRAIT_THWART],
        }]);
        assert.deepEqual(player.playedCardsThisRound, [{
            id: 'test-event',
            name: 'Test event',
        }]);

        const canceledPlayer = {
            ...player,
            playedCardsThisRound: [],
            playedEventsThisTurn: [],
            deck: {
                async discard() {
                    assert.fail('A canceled Event must not be discarded.');
                },
            },
        };
        const canceledAbility = {
            paymentCancelled: false,
            async resolveAbility() {
                this.paymentCancelled = true;
            },
        };
        const canceledPlay = new PlayCardEffect({
            card: {...event},
            ability: canceledAbility,
            match: {},
        });

        await canceledPlay.doPlay({player: canceledPlayer});

        assert.deepEqual(canceledPlayer.playedCardsThisRound, []);
        assert.deepEqual(canceledPlayer.playedEventsThisTurn, []);
        assert.equal(canceledPlay.played, false);
    });

    test('keeps the first-card marker stable during nested card plays', async () => {
        const player = {
            playedCardsThisRound: [],
            playedEventsThisTurn: [],
            config: {},
            deck: {
                async discard() {},
            },
            hand: {
                cards: [],
                async refresh() {},
            },
        };
        const firstPlay = new PlayCardEffect({
            card: {
                id: 'first-event',
                name: 'First event',
                isEvent: true,
                traits: [TRAIT_ATTACK],
            },
            ability: {
                paymentCancelled: false,
                async resolveAbility({playCardEffect}) {
                    assert.equal(playCardEffect.isFirstCardThisRound, true);
                },
            },
            match: {},
        });
        await firstPlay.doPlay({player});

        const secondPlay = new PlayCardEffect({
            card: {
                id: 'second-event',
                name: 'Second event',
                isEvent: true,
                traits: [TRAIT_THWART],
            },
            ability: {
                paymentCancelled: false,
                async resolveAbility({playCardEffect}) {
                    assert.equal(playCardEffect.isFirstCardThisRound, false);
                },
            },
            match: {},
        });
        await secondPlay.doPlay({player});

        assert.deepEqual(player.playedCardsThisRound, [
            {id: 'first-event', name: 'First event'},
            {id: 'second-event', name: 'Second event'},
        ]);
    });

    test('tracks the first card independently for each player', async () => {
        const otherPlayer = {
            playedCardsThisRound: [{id: 'other-card', name: 'Other card'}],
        };
        const player = {
            playedCardsThisRound: [],
            playedEventsThisTurn: [],
            config: {},
            deck: {
                async discard() {},
            },
            hand: {
                cards: [],
                async refresh() {},
            },
        };
        const playEffect = new PlayCardEffect({
            card: {
                id: 'my-first-card',
                name: 'My first card',
                isEvent: true,
                traits: [TRAIT_ATTACK],
            },
            ability: {
                paymentCancelled: false,
                async resolveAbility({playCardEffect}) {
                    assert.equal(playCardEffect.isFirstCardThisRound, true);
                },
            },
            match: {},
        });

        await playEffect.doPlay({player});

        assert.deepEqual(otherPlayer.playedCardsThisRound, [
            {id: 'other-card', name: 'Other card'},
        ]);
        assert.deepEqual(player.playedCardsThisRound, [
            {id: 'my-first-card', name: 'My first card'},
        ]);
    });

    test('resets event history at turn start, serializes it, and preserves it when resuming', async () => {
        const player = {
            playedEventsThisTurn: [{traits: [TRAIT_ATTACK]}],
        };
        let endTurn;
        const match = {
            name: 'match',
            triggerCards: {},
            turnStartProcessed: false,
            listen(endpoint, callback) {
                if (endpoint === EVENTS.TURN.END) {
                    endTurn = callback;
                }
            },
            async persist() {
                assert.deepEqual(player.playedEventsThisTurn, []);
            },
            async refresh() {},
        };
        const turn = new PlayTurnEffect({match});
        turn.trigger = async () => {};
        const turnResult = turn.execute({player});

        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(player.playedEventsThisTurn, []);
        endTurn({});
        await turnResult;
        assert.deepEqual(player.playedEventsThisTurn, []);

        const savedPlayer = new Player({
            name: 'Gamora',
            superhero: {
                currentSide: {handSize: 5},
                toObj: () => ({}),
            },
        });
        savedPlayer.playedEventsThisTurn = [
            {traits: [TRAIT_ATTACK]},
            {traits: [TRAIT_THWART]},
        ];
        savedPlayer.playedCardsThisRound = [
            {id: 'event-1', name: 'First event'},
            {id: 'ally-1', name: 'An ally'},
        ];
        assert.deepEqual(savedPlayer.toObj().playedCardsThisRound, [
            {id: 'event-1', name: 'First event'},
            {id: 'ally-1', name: 'An ally'},
        ]);
        assert.deepEqual(savedPlayer.toObj().playedEventsThisTurn, [
            {traits: [TRAIT_ATTACK]},
            {traits: [TRAIT_THWART]},
        ]);

        const resumedPlayer = {
            playedEventsThisTurn: [{traits: [TRAIT_THWART]}],
        };
        const resumedMatch = {
            name: 'match',
            triggerCards: {},
            turnStartProcessed: true,
            listen(endpoint, callback) {
                if (endpoint === EVENTS.TURN.END) {
                    endTurn = callback;
                }
            },
            async refresh() {},
        };
        const resumedTurn = new PlayTurnEffect({match: resumedMatch});
        resumedTurn.trigger = async () => {};
        const resumedResult = resumedTurn.execute({player: resumedPlayer});

        await new Promise(resolve => setImmediate(resolve));
        assert.deepEqual(resumedPlayer.playedEventsThisTurn, [
            {traits: [TRAIT_THWART]},
        ]);
        endTurn({});
        await resumedResult;
    });

    test('clears round card history after round-end triggers', async () => {
        const player = {
            playedCardsThisRound: [
                {id: 'card-1', name: 'Played card'},
            ],
        };
        const round = new PlayRoundEffect({
            match: {players: [player]},
        });
        round.resolveDelayedEffects = async () => {};
        round.trigger = async () => true;

        await round.triggerEnds({});

        assert.deepEqual(player.playedCardsThisRound, []);
    });
});
