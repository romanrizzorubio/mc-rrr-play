import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TARGET_EFFECT_PLAY_CARD, TARGET_THIS} from 'mc-shared';
import {DelayedEffect} from '../../src/effects/delayed-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {ReturnHandEffect} from '../../src/effects/return-hand-effect.js';

describe('DelayedEffect', () => {
    test('preserves the source ability for a delayed TARGET_THIS effect', async () => {
        const player = {
            deck: {
                discardPile: [],
                async checkCycle() {},
                async refresh() {},
                searchDiscard(card) {
                    this.discardPile.splice(this.discardPile.indexOf(card), 1);
                },
            },
            hand: {
                cards: [],
                addCards(cards) {
                    this.cards.push(...cards);
                },
                async refresh() {},
            },
        };
        const card = {
            isInPlay: false,
            owner: player,
            async refresh() {},
        };
        player.deck.discardPile.push(card);

        const match = {triggerCards: {}};
        const playCardEffect = new PlayCardEffect({card, match});
        const returnHandEffect = new ReturnHandEffect({
            match,
            target: TARGET_THIS,
        });
        const delayedEffect = new DelayedEffect({
            effect: returnHandEffect,
            match,
            target: TARGET_EFFECT_PLAY_CARD,
        });
        delayedEffect.ability = {card};

        await delayedEffect.runEffect({
            card,
            match,
            player,
            playCardEffect,
        });
        await playCardEffect.resolveDelayedEffects({player});

        assert.deepEqual(player.hand.cards, [card]);
        assert.deepEqual(player.deck.discardPile, []);
    });
});
