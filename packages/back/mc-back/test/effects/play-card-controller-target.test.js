import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_SELECT_TARGET,
    TARGET_ANY_PLAYER,
} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {Hand} from '../../src/model/match/hand.js';
import {Player} from '../../src/model/match/player.js';

describe('cards playable under any player', () => {
    test('serializes each legal player as a drop destination', async () => {
        const players = [
            {id: 'captain-player', isPlayer: true, abilities: []},
            {id: 'marvel-player', isPlayer: true, abilities: []},
        ];
        const match = {players};
        const owner = {...players[0], match};
        const card = {
            card: {controllerTarget: TARGET_ANY_PLAYER},
            id: 'shared-upgrade',
            isEvent: false,
            isUpgrade: true,
            async canPlay() {
                return true;
            },
            toObj() {
                return {id: this.id};
            },
        };
        const hand = new Hand(owner);
        hand.cards = [card];

        const [serializedCard] = await hand.toObjWithPlayability();

        assert.deepEqual(serializedCard.playableTargetIds, []);
        assert.deepEqual(serializedCard.playablePlayerIds, [
            'captain-player',
            'marvel-player',
        ]);
        assert.equal(serializedCard.playableInGameZone, true);
    });

    test('preselects an eligible player when the card is dropped on their row', async () => {
        const captain = Object.assign(Object.create(Player.prototype), {
            id: 'captain-player',
            isPlayer: true,
            abilities: [],
        });
        const marvel = Object.assign(Object.create(Player.prototype), {
            id: 'marvel-player',
            isPlayer: true,
            abilities: [],
        });
        const match = {players: [captain, marvel]};
        const card = {
            card: {controllerTarget: TARGET_ANY_PLAYER},
            isUpgrade: true,
        };
        const effect = new PlayCardEffect({
            card,
            match,
            targetId: marvel.id,
        });

        await effect.preselectDroppedTarget({
            card,
            match,
            player: captain,
        });

        assert.strictEqual(effect.selectedTarget, marvel);
    });

    test('shows valid heroes only to the player playing the card', async () => {
        const captain = Object.assign(Object.create(Player.prototype), {
            id: 'captain-player',
            isPlayer: true,
            name: 'Jugador Capitán',
            abilities: [],
            superhero: {
                image: 'heroes/captain-america/03001a.png',
                name: 'Capitán América',
                toObj() {
                    return {image: this.image, name: this.name};
                },
            },
        });
        const marvel = Object.assign(Object.create(Player.prototype), {
            id: 'marvel-player',
            isPlayer: true,
            name: 'Jugadora Marvel',
            abilities: [],
            superhero: {
                image: 'heroes/captain-marvel/01010a.png',
                name: 'Capitana Marvel',
                toObj() {
                    return {image: this.image, name: this.name};
                },
            },
        });
        const dialogs = [];
        const match = {
            players: [captain, marvel],
            async openDialog(dialog) {
                dialogs.push(dialog);

                return {selected: dialog.data.cards[1]};
            },
        };
        const card = {
            card: {controllerTarget: TARGET_ANY_PLAYER},
            isUpgrade: true,
        };
        const effect = new PlayCardEffect({card, match});

        const selectedPlayer = await effect.selectTarget({
            card,
            match,
            player: captain,
        });

        assert.strictEqual(selectedPlayer, marvel);
        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].dialogType, DIALOG_SELECT_TARGET);
        assert.equal(dialogs[0].targetPlayer, captain.id);
        assert.deepEqual(
            dialogs[0].data.cards.map(({id, name, image, showPlayerHero}) => ({
                id,
                name,
                image,
                showPlayerHero,
            })),
            [
                {
                    id: captain.id,
                    name: captain.superhero.name,
                    image: captain.superhero.image,
                    showPlayerHero: true,
                },
                {
                    id: marvel.id,
                    name: marvel.superhero.name,
                    image: marvel.superhero.image,
                    showPlayerHero: true,
                },
            ],
        );
    });
});
