import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Hand} from '../../src/model/match/hand.js';
import leadershipUpgrades from '../../../mc-data/seed/catalog/aspects/leadership/upgrades.js';

function createPlayer(match) {
    const player = {
        allies: [],
        gameZone: {
            cards: [],
            getPrintedCard(cardId) {
                return this.cards.find(card => card.card.id === cardId);
            },
        },
        match,
    };
    player.getPrintedCard = cardId => player.gameZone.getPrintedCard(cardId);
    player.hand = new Hand(player);
    match.players.push(player);

    return player;
}

describe('card maximum playability', () => {
    test('allows another deck-limited Inspiration to attach to a different ally', async () => {
        const inspiration = leadershipUpgrades.find(({_id}) =>
            _id === 'leadership-inspiracion');
        assert.ok(inspiration);

        const match = {
            isUniqueCard: () => false,
            players: [],
        };
        const player = createPlayer(match);
        const cardsFactory = new CardsFactory({match});
        const makeCard = (index, entry = inspiration) =>
            cardsFactory.createGameCardFromConfig(
                structuredClone(entry.card),
                {index, owner: player},
            );

        const existingInspiration = makeCard(0);
        const ironMan = {
            abilities: [],
            attached: [existingInspiration],
            id: 'iron-man',
        };
        existingInspiration.attachedTo = ironMan;

        player.allies.push(ironMan, {
            abilities: [],
            attached: [],
            id: 'black-cat',
        });
        player.gameZone.cards.push(existingInspiration);

        const handInspiration = makeCard(1);
        player.hand.cards.push(handInspiration);

        const [playability] = await player.hand.toObjWithPlayability();

        assert.equal(playability.playable, true);
        assert.deepEqual(playability.playableTargetIds, ['black-cat']);
        assert.equal(playability.playableInGameZone, false);
    });

    test('still enforces a maximum per player', async () => {
        const maxOneUpgrade = leadershipUpgrades.find(({_id}) =>
            _id === 'leadership-respuesta-rapida');
        assert.ok(maxOneUpgrade);

        const match = {
            isUniqueCard: () => false,
            players: [],
        };
        const player = createPlayer(match);
        const cardsFactory = new CardsFactory({match});
        const makeCard = index => cardsFactory.createGameCardFromConfig(
            structuredClone(maxOneUpgrade.card),
            {index, owner: player},
        );

        player.gameZone.cards.push(makeCard(0));
        player.hand.cards.push(makeCard(1));

        const [playability] = await player.hand.toObjWithPlayability();

        assert.equal(playability.playable, false);
    });
});
