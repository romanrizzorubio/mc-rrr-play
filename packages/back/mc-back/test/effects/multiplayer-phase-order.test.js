import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {DIALOG_DISCARD_HAND} from 'mc-shared';
import {PlayPlayersPhaseEffect} from '../../src/effects/play-players-phase-effect.js';
import {PlayVillainPhaseEffect} from '../../src/effects/play-villain-phase-effect.js';
import {Match} from '../../src/model/match/match.js';
import {Player} from '../../src/model/match/player.js';

describe('multiplayer phase order', () => {
    test('keeps every player in first-player order regardless of the current turn', () => {
        for (let count = 1; count <= 4; count++) {
            for (let initialIndex = 0; initialIndex < count; initialIndex++) {
                const match = new Match({name: 'player-order'});
                match.players = Array.from({length: count}, (_, index) => ({
                    id: `player-${index}`,
                    initial: index === initialIndex,
                }));
                const expected = match.players.slice(initialIndex).concat(
                    match.players.slice(0, initialIndex)
                );
                for (const player of match.players) {
                    match.currentPlayer = player;
                    match.currentTurnPlayer = player;
                    assert.deepEqual(match.orderedPlayers, expected);
                    assert.equal(new Set(match.orderedPlayers).size, count);
                }
            }
        }
    });

    const createMatch = (userIds = ['shared-account', 'shared-account']) => {
        const match = new Match({name: 'multiplayer-refill'});
        const dialogs = [];
        const draws = [];
        const refreshedHands = [];
        const ready = [];
        match.persist = async () => {};
        match.players = ['Capitán América', 'Capitana Marvel'].map((name, index) => {
            const player = new Player({
                id: `player-${index}`,
                name,
                userId: userIds[index],
                initial: index === 1,
                superhero: {
                    match,
                    flipped: true,
                },
            });
            player.getHandSize = async () => index === 0 ? 5 : 6;
            player.hand.cards = index === 0 ? [{
                id: 'kept-card',
                toObj() {
                    return {id: this.id};
                },
            }] : [];
            player.hand.refresh = async () => {
                refreshedHands.push({
                    player: player.id,
                    count: player.hand.cards.length,
                });
            };
            player.openDialog = async dialog => {
                dialogs.push(dialog);
                return {selected: []};
            };
            player.deck = {
                async draw(count) {
                    draws.push({player: player.id, count});
                    return Array.from({length: count}, (_, cardIndex) => ({
                        id: `${player.id}-drawn-${cardIndex}`,
                    }));
                },
            };
            player.ready = async () => ready.push(player.id);
            player.gameZone = {
                readyCards: async () => ready.push(`${player.id}-cards`),
            };
            return player;
        });
        match.currentPlayer = match.players[0];
        return {match, dialogs, draws, refreshedHands, ready};
    };

    test('refills and readies both players after the last turn, including an empty first-player hand', async () => {
        const {match, dialogs, draws, refreshedHands, ready} = createMatch();
        await new PlayPlayersPhaseEffect({match}).runEndPlayersPhase({});

        assert.deepEqual(draws, [
            {player: 'player-1', count: 6},
            {player: 'player-0', count: 4},
        ]);
        assert.deepEqual(match.players.map(player => player.hand.cards.length), [5, 6]);
        assert.deepEqual(refreshedHands, [
            {player: 'player-1', count: 6},
            {player: 'player-0', count: 5},
        ]);
        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].dialogType, DIALOG_DISCARD_HAND);
        assert.strictEqual(dialogs[0].targetPlayer, match.players[0]);
        assert.deepEqual(ready, [
            'player-1', 'player-1-cards',
            'player-0', 'player-0-cards',
        ]);
        assert.ok(match.players.every(player => !player.superhero.flipped));
        assert.equal(match.endPlayerIndex, 2);
    });

    test('offers discard to both nonempty hands in first-player order', async () => {
        const {match, dialogs} = createMatch();
        match.players[1].hand.cards.push({
            id: 'marvel-kept-card',
            toObj() {
                return {id: this.id};
            },
        });
        await new PlayPlayersPhaseEffect({match}).runEndPlayersPhase({});

        assert.deepEqual(
            dialogs.map(dialog => dialog.targetPlayer.id),
            ['player-1', 'player-0']
        );
        assert.deepEqual(match.players.map(player => player.hand.cards.length), [5, 6]);
    });

    test('opens discard dialogs concurrently for different accounts', async () => {
        const {match, dialogs, ready} = createMatch(['account-a', 'account-b']);
        match.players[1].hand.cards.push({
            id: 'marvel-kept-card',
            toObj() {
                return {id: this.id};
            },
        });
        const responses = new Map();
        for (const player of match.players) {
            player.openDialog = dialog => {
                dialogs.push(dialog);

                return new Promise(resolve => {
                    responses.set(player.id, resolve);
                });
            };
        }

        const endPhase = new PlayPlayersPhaseEffect({match})
            .runEndPlayersPhase({});
        await new Promise(resolve => setImmediate(resolve));

        assert.deepEqual(
            dialogs.map(dialog => dialog.targetPlayer.id),
            ['player-1', 'player-0']
        );
        assert.equal(responses.size, 2);

        responses.get('player-0')({selected: []});
        responses.get('player-1')({selected: []});
        await endPhase;

        assert.deepEqual(ready, [
            'player-1', 'player-1-cards',
            'player-0', 'player-0-cards',
        ]);
    });

    test('opens discard dialogs sequentially for heroes controlled by one account', async () => {
        const {match, dialogs} = createMatch();
        match.players[1].hand.cards.push({
            id: 'marvel-kept-card',
            toObj() {
                return {id: this.id};
            },
        });
        const responses = [];
        for (const player of match.players) {
            player.openDialog = dialog => {
                dialogs.push(dialog);

                return new Promise(resolve => {
                    responses.push(resolve);
                });
            };
        }

        const endPhase = new PlayPlayersPhaseEffect({match})
            .runEndPlayersPhase({});
        await new Promise(resolve => setImmediate(resolve));

        assert.deepEqual(
            dialogs.map(dialog => dialog.targetPlayer.id),
            ['player-1']
        );

        responses[0]({selected: []});
        await new Promise(resolve => setImmediate(resolve));

        assert.deepEqual(
            dialogs.map(dialog => dialog.targetPlayer.id),
            ['player-1', 'player-0']
        );

        responses[1]({selected: []});
        await endPhase;
    });

    test('resumes end-of-phase work without skipping or repeating players', async () => {
        const {match, draws, ready} = createMatch();
        match.endPlayerIndex = 1;
        await new PlayPlayersPhaseEffect({match}).runEndPlayersPhase({});

        assert.deepEqual(draws, [{player: 'player-0', count: 4}]);
        assert.deepEqual(ready, ['player-0', 'player-0-cards']);
        assert.equal(match.endPlayerIndex, 2);
    });

    test('villain phase includes both players and the next marker rotates the full order', () => {
        const {match} = createMatch();
        const villainPhase = new PlayVillainPhaseEffect({match});
        assert.deepEqual(villainPhase.getPlayersInVillainPhase(), [
            match.players[1], match.players[0],
        ]);

        villainPhase.runEndVillainPhase();
        assert.strictEqual(match.initialPlayer, match.players[0]);
        assert.deepEqual(match.orderedPlayers, match.players);
        villainPhase.runEndVillainPhase();
        assert.strictEqual(match.initialPlayer, match.players[1]);
        assert.deepEqual(match.orderedPlayers, [
            match.players[1], match.players[0],
        ]);
    });
});
