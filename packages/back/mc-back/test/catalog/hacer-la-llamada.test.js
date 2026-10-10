import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_ACTION,
    CARD_TYPE_ALLY,
    EFFECT_SEARCH_CARDS,
} from 'mc-shared';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import leadershipEvents from '../../../mc-data/seed/catalog/aspects/leadership/events.js';

test('Hacer la llamada allows cancelling the ally selection', () => {
    const makeTheCall = leadershipEvents.find(({_id}) =>
        _id === 'leadership-hacer-la-llamada');
    assert.ok(makeTheCall);

    const [{params: ability}] = makeTheCall.card.params.abilities;
    const searchEffect = ability.arrow.params.effects.find(({type}) =>
        type === EFFECT_SEARCH_CARDS);

    assert.ok(searchEffect);
    assert.equal(searchEffect.params.requireMatch, true);
    assert.equal(searchEffect.params.showCancel, true);
});

test('Hacer la llamada is not playable when no player has an ally in their discard pile', async () => {
    const makeTheCall = leadershipEvents.find(({_id}) =>
        _id === 'leadership-hacer-la-llamada');
    assert.ok(makeTheCall);

    const match = {
        isUniqueCard: () => false,
        triggerCards: {},
    };
    const player = {
        isPlayer: true,
        deck: {cards: [], discardPile: []},
        match,
    };
    const otherPlayer = {
        isPlayer: true,
        deck: {cards: [], discardPile: []},
        match,
    };
    match.players = [player, otherPlayer];

    const cardsFactory = new CardsFactory({match});
    const eventCard = cardsFactory.createCard({
        ...makeTheCall.card,
        params: {...makeTheCall.card.params},
    });
    const gameCard = cardsFactory.createGameCard({
        card: eventCard,
        owner: player,
    });
    const playabilityParams = {
        abilityType: ABILITY_ACTION,
        checkOnly: true,
        player,
    };

    assert.equal(await gameCard.canPlay(playabilityParams), false);

    otherPlayer.deck.discardPile.push({
        id: 'discarded-ally',
        type: CARD_TYPE_ALLY,
    });

    assert.equal(await gameCard.canPlay(playabilityParams), true);
});
