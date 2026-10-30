import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {REFRESH_EVENTS} from 'mc-endpoints';
import {Hand} from '../../src/model/match/hand.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {CARD_TYPE_ALLY, CARD_TYPE_SUPPORT, CARD_TYPE_MINION} from 'mc-shared';

describe('player seat incremental refreshes', () => {
    test('duplicate-id cards refresh the actual controller seat, including assigned cards, while scenario cards remain public', async () => {
        const sent = [];
        const match = new Match({
            name: 'duplicate-card-refresh',
            mc: {mcSocket: {send: (...args) => sent.push(args)}},
        });
        const owners = ['seat-1', 'seat-2'].map(id => ({
            id, userId: 'shared-account', isPlayer: true, match,
        }));
        match.players = owners;
        owners[0].initial = true;
        for (const type of [CARD_TYPE_SUPPORT, CARD_TYPE_ALLY]) {
            const cards = owners.map(owner => {
                const factory = new MatchFactory(match);
                const card = factory.cardsFactory.createGameCardFromConfig({
                    type,
                    params: {name: 'Shared deck card', hitPoints: 3, cost: 0},
                });
                card.owner = owner;
                card.controller = owner;
                if (type === CARD_TYPE_ALLY) {
                    card.toObjWithAbilityAvailability = async () => card.toObj();
                }

                return card;
            });
            assert.equal(cards[0].id, cards[1].id);
            const originalOwners = cards.map(card => card.owner);
            for (const card of cards) {
                await card.refresh();
            }
            assert.deepEqual(sent.slice(-2).map(([, , payload]) => payload.playerId),
                ['seat-1', 'seat-2']);
            cards[0].controller = owners[1];
            await cards[0].refresh();
            assert.equal(sent.at(-1)[2].playerId, 'seat-2');
            assert.equal(cards[0].owner, originalOwners[0]);
            assert.equal(cards[0].controller, owners[1]);
        }
        const factory = new MatchFactory(match);
        const scenario = {match};
        const minion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION, params: {name: 'Scenario minion', hitPoints: 3},
        });
        minion.owner = scenario;
        minion.controller = scenario;
        minion.toObjWithAbilityAvailability = async () => minion.toObj();
        await minion.refresh();
        assert.equal(Object.hasOwn(sent.at(-1)[2], 'playerId'), false);
        assert.equal(sent.every(([, endpoint]) => endpoint === REFRESH_EVENTS.card), true);
    });

    test('hand refresh identifies its exact seat while snapshot hands remain arrays', async () => {
        const sent = [];
        const match = {
            name: 'shared-account-match',
            mc: {mcSocket: {send: (...args) => sent.push(args)}},
        };
        const owners = ['seat-1', 'seat-2'].map(id => ({
            id, userId: 'shared-account', match,
        }));
        const hands = owners.map(owner => new Hand(owner));
        for (const hand of hands) {
            await hand.refresh();
            assert.deepEqual(hand.toObj(), []);
        }
        assert.deepEqual(sent, [
            [match.name, REFRESH_EVENTS.hand, {playerId: 'seat-1', hand: []}],
            [match.name, REFRESH_EVENTS.hand, {playerId: 'seat-2', hand: []}],
        ]);
    });

    test('player zone snapshots and refreshes share stable seat-specific ids', async () => {
        const sent = [];
        const match = {
            name: 'shared-account-match',
            mc: {mcSocket: {send: (...args) => sent.push(args)}},
            players: [],
        };
        match.players = ['seat-1', 'seat-2'].map(id => {
            const owner = {id, userId: 'shared-account', match, isPlayer: true};
            owner.hand = new Hand(owner);
            owner.gameZone = new PlayerZone({owner});

            return owner;
        });
        const snapshots = match.players.map(player => player.gameZone.toObj());
        assert.deepEqual(snapshots.map(zone => zone.id),
            ['player-zone:seat-1', 'player-zone:seat-2']);
        await match.players[1].gameZone.refresh();
        assert.deepEqual(sent[0], [
            match.name, REFRESH_EVENTS.playerZone, snapshots[1],
        ]);
        assert.deepEqual(sent.slice(1).map(([, , payload]) => payload.playerId),
            ['seat-1', 'seat-2']);
        assert.equal(new PlayerZone({owner: match.players[1]}).toObj().id,
            snapshots[1].id);
    });
});
