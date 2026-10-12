import assert from 'node:assert/strict';
import test from 'node:test';

import {
    PLACE_DECK,
    PLACE_DISCARD_PILE,
} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';

for (const place of [PLACE_DECK, PLACE_DISCARD_PILE]) {
    test(`cancelling a card play restores it to its ${place} source position`, async () => {
        const before = {id: 'before'};
        const after = {id: 'after'};
        const card = {
            id: 'playable',
            isEvent: false,
            isUpgrade: false,
            isPlaying: false,
            card: {
                playFrom: [place],
            },
        };
        const sourceCards = [before, card, after];
        const player = {
            deck: {
                cards: place === PLACE_DECK ? sourceCards : [],
                discardPile: place === PLACE_DISCARD_PILE ? sourceCards : [],
                async refresh() {},
            },
            hand: {
                cards: [],
                async refresh() {},
            },
        };
        card.owner = player;

        const effect = new PlayCardEffect({
            card,
            match: {},
            selectedTarget: player,
        });

        await effect.prepare({player});

        assert.deepEqual(sourceCards, [before, after]);
        await effect.returnToSource(player);
        assert.deepEqual(sourceCards, [before, card, after]);
        assert.equal(card.isPlaying, false);
    });
}
