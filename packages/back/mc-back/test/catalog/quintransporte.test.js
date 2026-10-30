import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {TRAIT_AVENGER} from 'mc-shared';
import basicSupports from '../../../mc-data/seed/catalog/aspects/basic/supports.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Quintransporte uniqueness', () => {
    for (const sameAccount of [false, true]) {
        test(`blocks another copy in play across ${sameAccount ? 'shared' : 'different'} accounts`, async () => {
            const config = basicSupports.find(({_id}) => _id === 'basic-quintransporte').card;
            assert.equal(config.params.unique, true);
            const match = new Match({name: 'quintransporte-test', mc: {}});
            match.players = [0, 1].map(index => ({
                id: `seat-${index}`,
                userId: sameAccount ? 'account' : `account-${index}`,
                superhero: {traits: [TRAIT_AVENGER]},
                hand: {cards: []},
                gameZone: {cards: [], minions: []},
            }));
            const factory = new CardsFactory({match});
            const cards = match.players.map((owner, index) => {
                const card = factory.createGameCard({
                    card: factory.createCard(config), owner, index,
                });
                owner.hand.cards.push(card);
                return card;
            });
            assert.equal(cards[0].unique, true);
            assert.equal(cards[1].unique, true);
            assert.notEqual(cards[0].id, cards[1].id);
            assert.equal(await cards[1].canPlay({player: match.players[1]}), true);
            match.players[0].hand.cards = [];
            match.players[0].gameZone.cards.push(cards[0]);
            cards[0].controller = match.players[0];
            assert.equal(match.isUniqueCard(cards[1]), true);
            assert.equal(await cards[1].canPlay({player: match.players[1]}), false);
            match.players[0].gameZone.cards = [];
            assert.equal(await cards[1].canPlay({player: match.players[1]}), true);
        });
    }
});
