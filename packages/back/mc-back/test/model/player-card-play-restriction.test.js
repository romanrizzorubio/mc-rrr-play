import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    TRAIT_AVENGER,
} from 'mc-shared';
import basicAllies from '../../../mc-data/seed/catalog/aspects/basic/allies.js';
import basicUpgrades from '../../../mc-data/seed/catalog/aspects/basic/upgrades.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';
import {findPlayerCardToPlayFrom} from '../../src/utils/player-card-play-from.js';

describe('player card play restrictions', () => {
    test('Honorary Avenger requires its trait on the current identity side', async () => {
        const honoraryAvenger = basicUpgrades.find(card =>
            card._id === 'basic-honorary-avenger');
        assert.ok(honoraryAvenger);

        const card = new PlayerCard({
            paramsToPlay: honoraryAvenger.card.params.paramsToPlay,
        });
        const currentSide = {
            traits: [],
        };
        const superhero = {
            currentSide,
            otherSide: {
                traits: [TRAIT_AVENGER],
            },
            get traits() {
                return this.currentSide.traits;
            },
        };
        const player = {
            superhero,
            get traits() {
                return this.superhero.traits;
            },
        };

        assert.equal(await card.canPlay({player}), false);

        currentSide.traits.push(TRAIT_AVENGER);
        assert.equal(await card.canPlay({player}), true);
    });

    test('Mandíbulas can be played from its owner discard pile', async () => {
        const jaws = basicAllies.find(card => card._id === 'basic-mandibulas');
        assert.ok(jaws);
        assert.equal(jaws.card.type, CARD_TYPE_ALLY);

        const card = new PlayerCard(jaws.card.params);
        const gameCard = {
            id: 'mandibulas',
            owner: {
                deck: {
                    discardPile: [],
                },
            },
        };
        gameCard.owner.deck.discardPile.push(gameCard);

        assert.equal(await card.canPlay({gameCard, player: {}}), true);
        assert.deepEqual(card.toObj().playFrom, [PLACE_DISCARD_PILE]);

        const ordinaryCard = new PlayerCard({
            ...jaws.card.params,
            playFrom: [],
        });
        assert.equal(
            await ordinaryCard.canPlay({gameCard, player: {}}),
            false
        );
    });

    test('player cards can be configured to play from multiple owner zones', async () => {
        const card = new PlayerCard({
            playFrom: [PLACE_DECK, PLACE_DISCARD_PILE],
        });
        const owner = {
            deck: {
                cards: [],
                discardPile: [],
            },
            hand: {
                cards: [],
            },
        };
        const deckCard = {
            id: 'deck-card',
            card: {playFrom: [PLACE_DECK]},
            owner,
        };
        const discardCard = {
            id: 'discard-card',
            card: {playFrom: [PLACE_DISCARD_PILE]},
            owner,
        };
        owner.deck.cards.push(deckCard);
        owner.deck.discardPile.push(discardCard);

        assert.equal(await card.canPlay({gameCard: deckCard}), true);
        assert.equal(await card.canPlay({gameCard: discardCard}), true);
        assert.strictEqual(
            findPlayerCardToPlayFrom(owner, deckCard.id),
            deckCard
        );
        assert.strictEqual(
            findPlayerCardToPlayFrom(owner, discardCard.id),
            discardCard
        );

        const deckOnlyCard = new PlayerCard({
            playFrom: [PLACE_DECK],
        });
        const cardInUnlistedPlace = {
            owner: {
                deck: {
                    cards: [],
                    discardPile: [],
                },
                hand: {
                    cards: [],
                },
            },
        };
        cardInUnlistedPlace.owner.deck.discardPile.push(cardInUnlistedPlace);
        assert.equal(await deckOnlyCard.canPlay({
            gameCard: cardInUnlistedPlace,
            player: {},
        }), false);
    });
});
