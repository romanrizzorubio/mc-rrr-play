import assert from 'node:assert/strict';
import {describe, test} from 'node:test';
import {CARD_TYPE_SUPPORT} from 'mc-shared';

import {Hand} from '../../src/model/match/hand.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';

describe('Match factory card identities', () => {
    test('keeps card copy indexes unique across separate factories for the same match', () => {
        const match = new Match({name: 'shared-hero-card-identities'});
        const sharedSupport = {
            type: CARD_TYPE_SUPPORT,
            params: {name: 'Shared support', set: 'basic', cost: 0},
        };
        const config = {
            ...blackPanther.config,
            cards: [],
            precon: [{count: 2, card: sharedSupport}],
            obligation: undefined,
            nemesis: [],
        };
        const first = new MatchFactory(match).createSuperhero(config);
        const second = new MatchFactory(match).createSuperhero(config);

        assert.deepEqual(first.deck.map(card => card.index), [1, 2]);
        assert.deepEqual(second.deck.map(card => card.index), [3, 4]);
        assert.equal(new Set([...first.deck, ...second.deck].map(card => card.id)).size, 4);
        assert.equal(first.deck[0].card.id, second.deck[0].card.id);
    });

    test('assigns unique ids to Wakanda Forever copies with different printed resources', () => {
        const match = new Match({
            mc: {
                mcSocket: {
                    send() {},
                },
            },
            name: 'black-panther-card-identities',
        });
        const superhero = new MatchFactory(match).createSuperhero(blackPanther.config);
        const wakandaCards = superhero.cards.filter(card =>
            card.name === '¡Wakanda por siempre!');

        assert.equal(wakandaCards.length, 5);
        assert.equal(new Set(wakandaCards.map(card => card.id)).size, wakandaCards.length);

        const hand = new Hand({match});
        hand.cards = wakandaCards.slice(0, 2);

        assert.deepEqual(hand.getCardsToPay(hand.cards[0]), [hand.cards[1]]);
    });
});
