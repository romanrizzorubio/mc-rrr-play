import assert from 'node:assert/strict';
import {test} from 'node:test';

import {DIALOG_LIST, DIALOG_USE_CARD} from 'mc-shared';
import basicAllies from '../../../mc-data/seed/catalog/aspects/basic/allies.js';
import {PlayRoundEffect} from '../../src/effects/play-round-effect.js';
import {Engine} from '../../src/engine/engine.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';

test('Nick Fury is discarded at its match round end when another round is current', async () => {
    const discardedCards = [];
    const player = {
        isPlayer: true,
        get allies() {
            return this.gameZone.cards.filter(card => card.isAlly);
        },
        hand: {
            cards: [],
            addCards() {},
            async refresh() {},
        },
        deck: {
            discardPile: [],
            async draw() {
                return [];
            },
            async discard(card) {
                discardedCards.push(card);
            },
            async refresh() {},
        },
        gameZone: {
            cards: [],
            addToGameZone(card) {
                this.cards.push(card);
            },
            discard(card) {
                this.cards.splice(this.cards.indexOf(card), 1);
            },
            async refresh() {},
        },
    };
    const match = {
        enemies: [],
        players: [player],
        schemes: [],
        triggerCards: {},
        lasting: [],
        isUniqueCard: () => false,
        async openDialog({dialogType, data}) {
            if (dialogType === DIALOG_USE_CARD) {
                return {
                    selected: {id: nickFury.id},
                };
            }

            if (dialogType !== DIALOG_LIST) {
                return {};
            }

            const selected = data.options.findIndex(option =>
                option.text === 'Roba 3 cartas');

            assert.notEqual(selected, -1);
            return {
                selected: {id: String(selected)},
            };
        },
    };
    player.match = match;

    const cardsFactory = new CardsFactory({match});
    const nickFuryConfig = basicAllies.find(card =>
        card._id === 'basic-nick-fury').card;
    const nickFuryCard = cardsFactory.createCard(nickFuryConfig);
    const nickFury = cardsFactory.createGameCard({
        card: nickFuryCard,
        owner: player,
    });
    nickFury.init = async () => {};

    const round = new PlayRoundEffect({match});
    const otherMatch = {
        enemies: [],
        players: [],
        schemes: [],
        triggerCards: {},
        lasting: [],
    };
    Engine.currentRound = new PlayRoundEffect({match: otherMatch});
    const putPlayEffect = new PutPlayEffect({
        card: nickFury,
        controller: player,
        match,
    });
    await putPlayEffect.runEffect({
        card: nickFury,
        player,
    });

    assert.equal(round.delayedEffects.length, 0);
    assert.equal(match.lasting.length, 1);

    await round.triggerEnds({player});

    assert.equal(player.gameZone.cards.includes(nickFury), false);
    assert.deepEqual(discardedCards, [nickFury]);
    assert.equal(match.lasting.length, 0);
});
