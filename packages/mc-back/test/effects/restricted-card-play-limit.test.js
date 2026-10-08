import assert from 'node:assert/strict';
import test from 'node:test';

import {DIALOG_MAX_CARDS} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';

function createRestrictedCard(id, player, inPlay = true) {
    return {
        abilities: [],
        attachedTo: undefined,
        controller: player,
        id,
        isEvent: false,
        isInPlay: inPlay,
        isMinion: false,
        isPlayerCard: true,
        name: id,
        restricted: true,
        async canPlay() {
            return true;
        },
        async discard() {
            const cardIndex = player.gameZone.cards.indexOf(this);
            if (cardIndex !== -1) {
                player.gameZone.cards.splice(cardIndex, 1);
            }
        },
        async initTriggers() {},
        toObj() {
            return {id: this.id, name: this.name};
        },
    };
}

test('playing a restricted card at the limit offers an existing card to discard', async () => {
    const dialogs = [];
    const player = {
        isPlayer: true,
        gameZone: {
            cards: [],
            addToGameZone(card) {
                this.cards.push(card);
            },
            async refresh() {},
        },
        deck: {
            refresh() {},
        },
        hand: {
            cards: [],
            discardHand(card) {
                this.cards.splice(this.cards.indexOf(card), 1);
            },
            async refresh() {},
        },
    };
    const firstRestricted = createRestrictedCard('restricted-1', player);
    const selectedRestricted = createRestrictedCard('restricted-2', player);
    const incomingRestricted = createRestrictedCard('restricted-3', player, false);
    player.gameZone.cards.push(firstRestricted, selectedRestricted);
    player.hand.cards.push(incomingRestricted);

    const match = {
        isUniqueCard: () => false,
        triggerCards: {},
        async openDialog(dialog) {
            dialogs.push(dialog);

            return {
                accepted: true,
                selected: {id: selectedRestricted.id},
            };
        },
    };
    const playCardEffect = new PlayCardEffect({
        card: incomingRestricted,
        match,
    });

    assert.equal(await playCardEffect.canRun({player}), true);
    assert.equal(playCardEffect.restrictedDialogAccepted, true);
    assert.equal(
        playCardEffect.restrictedCardToDiscardId,
        selectedRestricted.id
    );
    assert.equal(dialogs[0].dialogType, DIALOG_MAX_CARDS);
    assert.equal(dialogs[0].showCancel, true);
    assert.deepEqual(
        dialogs[0].data.cards.map(({id}) => id),
        [firstRestricted.id, selectedRestricted.id]
    );

    assert.equal(await playCardEffect.canRun({player}), true);
    assert.equal(dialogs.length, 1);

    await playCardEffect.doPlay({player});

    assert.deepEqual(
        player.gameZone.cards.map(({id}) => id),
        [firstRestricted.id, incomingRestricted.id]
    );
    assert.equal(player.hand.cards.length, 0);
});

test('cancelling the restricted-card replacement stops the play', async () => {
    const restrictedCards = [
        {id: 'restricted-1', restricted: true, toObj: () => ({id: 'restricted-1'})},
        {id: 'restricted-2', restricted: true, toObj: () => ({id: 'restricted-2'})},
    ];
    const player = {
        gameZone: {cards: restrictedCards},
    };
    const match = {
        isUniqueCard: () => false,
        async openDialog() {
            return {accepted: false};
        },
    };
    const card = {
        isPlayerCard: true,
        isEvent: false,
        restricted: true,
        async canPlay() {
            return true;
        },
    };
    const playCardEffect = new PlayCardEffect({card, match});

    assert.equal(await playCardEffect.canRun({player}), false);
    assert.equal(playCardEffect.restrictedDialogAccepted, false);
});
