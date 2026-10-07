import assert from 'node:assert/strict';
import {test} from 'node:test';

import {Hand} from '../../src/model/match/hand.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';

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
