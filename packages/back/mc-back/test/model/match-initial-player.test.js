import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {DIALOG_LIST} from 'mc-shared';
import {Match} from '../../src/model/match/match.js';
import {Player} from '../../src/model/match/player.js';

describe('match starting player selection', () => {
    test('asks the creator to choose by player and hero image', async () => {
        const creator = {
            id: 'creator-player',
            userId: 'creator-account',
            name: 'Creator',
            initial: true,
            superhero: {
                name: 'Captain America',
                image: 'heroes/captain-america/03001a.png',
            },
        };
        const guest = {
            id: 'guest-player',
            userId: 'guest-account',
            name: 'Guest',
            initial: false,
            superhero: {
                name: 'Captain Marvel',
                image: 'heroes/captain-marvel/01010b.png',
            },
        };
        let dialog;
        const match = Object.assign(Object.create(Match.prototype), {
            name: 'game',
            creatorUserId: creator.userId,
            players: [creator, guest],
            openDialog: async params => {
                dialog = params;
                return {selected: {playerId: guest.id}};
            },
        });

        assert.equal(await match.selectInitialPlayer(), guest);
        assert.equal(dialog.dialogType, DIALOG_LIST);
        assert.equal(dialog.targetPlayer, creator);
        assert.equal(dialog.hideOk, true);
        assert.deepEqual(dialog.data.options, [
            {
                text: 'Creator - Captain America',
                image: 'heroes/captain-america/03001a.png',
                playerId: creator.id,
            },
            {
                text: 'Guest - Captain Marvel',
                image: 'heroes/captain-marvel/01010b.png',
                playerId: guest.id,
            },
        ]);
        assert.equal(creator.initial, false);
        assert.equal(guest.initial, true);
    });

    test('keeps the existing default in non-lobby matches without a creator account', async () => {
        const initialPlayer = {id: 'first', initial: true};
        const match = Object.assign(Object.create(Match.prototype), {
            players: [initialPlayer, {id: 'second', initial: false}],
            openDialog() {
                assert.fail('A legacy match should not prompt for a creator.');
            },
        });

        assert.equal(await match.selectInitialPlayer(), initialPlayer);
    });

    test('rejects a lobby match when no valid player is selected', async () => {
        const match = Object.assign(Object.create(Match.prototype), {
            lobbyId: 'lobby',
            creatorUserId: 'creator-account',
            players: [{
                id: 'creator',
                userId: 'creator-account',
                name: 'Creator',
                superhero: {name: 'Hero', image: 'hero.png'},
            }, {
                id: 'guest',
                userId: 'guest-account',
                name: 'Guest',
                superhero: {name: 'Other Hero', image: 'other-hero.png'},
            }],
            openDialog: async () => ({selected: {playerId: 'missing'}}),
        });

        await assert.rejects(
            match.selectInitialPlayer(),
            /No se recibió un jugador válido/u,
        );
    });

    test('serializes the initial-player marker for the board and roster', () => {
        const player = Object.assign(Object.create(Player.prototype), {
            id: 'player',
            userId: 'account',
            name: 'Hero player',
            initial: true,
            defeated: false,
            extraDecks: {},
            superhero: {
                currentSide: {handSize: 5},
                toObj: () => ({}),
            },
        });

        assert.equal(player.toObj().initial, true);
    });
});
