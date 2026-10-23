import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_SELECT_TARGET,
    EFFECT_MOVE_TO_HAND,
    EFFECT_TUCK_UNDER,
    TARGET_THIS,
} from 'mc-shared';
import {TuckUnderEffect} from '../../src/effects/tuck-under-effect.js';
import {MoveToHandEffect} from '../../src/effects/move-to-hand-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {GameCard} from '../../src/model/cards/game-card.js';
import msMarvel from '../../../mc-data/seed/catalog/heroes/ms-marvel.js';

const createCard = (id, owner) => ({
    id,
    name: id,
    image: `${id}.png`,
    owner,
    toObj() {
        return {id: this.id, name: this.name, image: this.image};
    },
});

describe('Tuck-under effects', () => {
    test('TuckUnderEffect tucks every supplied hand card under its selected host', async () => {
        const handCards = [];
        const discardedFromHand = [];
        const hand = {
            cards: handCards,
            discardHand(card) {
                discardedFromHand.push(card);
                handCards.splice(handCards.indexOf(card), 1);
            },
            async refresh() {},
        };
        const owner = {hand};
        const cards = [
            createCard('visible-card-1', owner),
            createCard('visible-card-2', owner),
        ];
        handCards.push(...cards);
        const host = {
            tuckedCards: [],
            async refresh() {},
        };
        const ability = {card: host};
        const effect = new TuckUnderEffect({
            cards: 'selectedCards',
            match: {triggerCards: {}, async openDialog() {
                throw new Error('TuckUnderEffect must not select cards.');
            }},
            target: TARGET_THIS,
        });
        effect.ability = ability;
        const params = {ability, player: owner, selectedCards: cards};

        assert.equal(await effect.canRun(params), true);
        await effect.runEffect(params);

        assert.deepEqual(discardedFromHand, cards);
        assert.deepEqual(handCards, []);
        assert.deepEqual(host.tuckedCards, cards);
        assert.deepEqual(host.tuckedCards[0].toObj(), {
            id: 'visible-card-1',
            name: 'visible-card-1',
            image: 'visible-card-1.png',
        });
    });

    test('TuckUnderEffect can tuck a searched card directly from the player deck', async () => {
        const deckRefreshes = [];
        const before = createCard('before', null);
        const after = createCard('after', null);
        const owner = {
            deck: {
                cards: [],
                discardPile: [],
                async searchDeck(card) {
                    this.cards.splice(this.cards.indexOf(card), 1);
                },
                searchDiscard() {},
                async refresh() {
                    deckRefreshes.push(true);
                },
            },
        };
        const card = createCard('searched-card', owner);
        owner.deck.cards.push(before, card, after);
        let hostRefreshes = 0;
        const host = {
            tuckedCards: [],
            async refresh() {
                hostRefreshes++;
            },
        };
        const ability = {card: host};
        const effect = new TuckUnderEffect({
            cards: 'selectedCards',
            match: {triggerCards: {}},
            target: TARGET_THIS,
        });
        effect.ability = ability;

        const params = {
            ability,
            player: owner,
            selectedCards: [card],
        };

        assert.equal(await effect.canRun(params), true);
        await effect.runEffect(params);

        assert.deepEqual(owner.deck.cards, [before, after]);
        assert.deepEqual(host.tuckedCards, [card]);
        assert.equal(hostRefreshes, 1);
        assert.equal(deckRefreshes.length, 1);
    });

    test('Bruno automatically tucks the only available hand card', async () => {
        const handCards = [];
        const discardedFromHand = [];
        const hand = {
            cards: handCards,
            discardHand(card) {
                discardedFromHand.push(card);
                handCards.splice(handCards.indexOf(card), 1);
            },
            async refresh() {},
        };
        const owner = {hand};
        const card = createCard('visible-card', owner);
        handCards.push(card);
        let dialogCalls = 0;
        const match = {
            triggerCards: {},
            async openDialog() {
                dialogCalls++;
            },
        };
        const brunoConfig = msMarvel.config.cards.find(({card: cardConfig}) =>
            cardConfig.params.name === 'Bruno Carrelli').card;
        const cardsFactory = new CardsFactory({match});
        const bruno = cardsFactory.createGameCardFromConfig(brunoConfig, {owner});
        bruno.refresh = async () => {};
        const ability = bruno.abilities[0];

        await ability.effect.runEffect({ability, player: owner});

        assert.equal(dialogCalls, 0);
        assert.deepEqual(discardedFromHand, [card]);
        assert.deepEqual(handCards, []);
        assert.deepEqual(bruno.tuckedCards, [card]);
    });

    test('Bruno returns up to three tucked cards with MoveToHandEffect', async () => {
        const returnedCards = [];
        const owner = {
            hand: {
                cards: returnedCards,
                addCard(card) {
                    returnedCards.push(card);
                },
                async refresh() {},
            },
            deck: {
                cards: [],
                discardPile: [],
            },
        };
        const tuckedCards = Array.from({length: 4}, (_, index) =>
            createCard(`tucked-${index}`, owner));
        let hostRefreshes = 0;
        let selectionDialog;
        const match = {
            triggerCards: {},
            async openDialog(dialog) {
                selectionDialog = dialog;
                const selected = dialog.data.cards.slice(0, 2);
                return {selected};
            },
        };
        const brunoConfig = msMarvel.config.cards.find(({card: cardConfig}) =>
            cardConfig.params.name === 'Bruno Carrelli').card;
        const cardsFactory = new CardsFactory({match});
        const bruno = cardsFactory.createGameCardFromConfig(brunoConfig, {owner});
        bruno.tuckedCards.push(...tuckedCards);
        bruno.refresh = async () => {
            hostRefreshes++;
        };
        const ability = bruno.abilities[1];

        await ability.resolveAbility({arrowPaid: true, card: bruno, player: owner});

        assert.equal(selectionDialog.dialogType, DIALOG_SELECT_TARGET);
        assert.equal(selectionDialog.data.count, 3);
        assert.deepEqual(returnedCards, tuckedCards.slice(0, 2));
        assert.deepEqual(bruno.tuckedCards, tuckedCards.slice(2));
        assert.equal(hostRefreshes, 1);
    });

    test('tucked cards are discarded when their host leaves play', async () => {
        const discardPile = [];
        const deckRefreshes = [];
        const owner = {
            deck: {
                async discard(card) {
                    discardPile.push(card);
                },
                async refresh() {
                    deckRefreshes.push(true);
                },
            },
        };
        const host = new GameCard({
            card: {
                id: 'bruno',
                isPlayerCard: true,
                toObj() {
                    return {id: this.id};
                },
            },
            owner,
        });
        const tuckedCard = new GameCard({
            card: {
                id: 'tucked-support',
                isPlayerCard: true,
                toObj() {
                    return {id: this.id};
                },
            },
            owner,
        });
        host.tuckedCards.push(tuckedCard);

        assert.deepEqual(
            host.toObj().tuckedCards.map(({id}) => id),
            ['tucked-support']
        );

        await host.init();

        assert.deepEqual(discardPile, [tuckedCard]);
        assert.deepEqual(deckRefreshes, [true]);
        assert.deepEqual(host.tuckedCards, []);
    });

    test('tuck effects have registered generic effect types', async () => {
        const {EFFECT_MAP} = await import('../../src/factory/effects/effects-map.js');

        assert.equal(EFFECT_MAP[EFFECT_TUCK_UNDER], TuckUnderEffect);
        assert.equal(EFFECT_MAP[EFFECT_MOVE_TO_HAND], MoveToHandEffect);
    });
});
