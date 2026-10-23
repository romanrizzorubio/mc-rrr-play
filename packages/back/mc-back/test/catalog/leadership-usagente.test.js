import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    RESOURCE_MENTAL,
    TRAIT_AVENGER,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('USAgente Leadership ally', () => {
    test('defines its printed details and appears once in Hawkeye’s precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const usAgent = aspects.find(({_id}) => _id === 'leadership-usagente');
        const hawkeye = heroes.find(({_id}) => _id === 'hawkeye');

        assert.ok(usAgent);
        assert.ok(hawkeye);
        assert.equal(usAgent.aspect, 'leadership');
        assert.equal(usAgent.card.type, CARD_TYPE_ALLY);
        assert.equal(usAgent.card.params.name, 'USAgente');
        assert.equal(usAgent.card.params.subtitle, 'John Walker');
        assert.equal(
            usAgent.card.params.image,
            'aspect/leadership/allies/04014.png'
        );
        assert.deepEqual(usAgent.card.params.traits, [TRAIT_AVENGER]);
        assert.equal(usAgent.card.params.unique, true);
        assert.equal(usAgent.card.params.cost, 3);
        assert.deepEqual(usAgent.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(usAgent.card.params.hitPoints, 5);
        assert.equal(usAgent.card.params.attack, 1);
        assert.equal(usAgent.card.params.attackConsequential, 1);
        assert.equal(usAgent.card.params.thwart, 1);
        assert.equal(usAgent.card.params.thwartConsequential, 1);
        assert.deepEqual(usAgent.card.params.keywords, {retaliate: 1});

        const reference = hawkeye.config.precon
            .find(({aspect}) => aspect === 'leadership')
            .cardRefs.find(({id}) => id === usAgent._id);
        assert.deepEqual(reference, {id: usAgent._id, count: 1});
    });

    test('constructs with the printed Retaliate value', async () => {
        const {aspects} = await loadCatalog();
        const usAgent = aspects.find(({_id}) => _id === 'leadership-usagente');
        assert.ok(usAgent);

        const match = {
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
            lasting: [],
            limits: {},
        };
        const player = {
            isPlayer: true,
            name: 'Test player',
            gameZone: {cards: []},
            deck: {discardPile: []},
        };
        match.players.push(player);

        const factory = new MatchFactory(match);
        const ally = factory.cardsFactory.createGameCardFromConfig(
            usAgent.card,
            {owner: player}
        );

        assert.equal(ally.retaliate, 1);
    });
});
