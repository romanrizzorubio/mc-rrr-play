import assert from 'node:assert/strict';
import test from 'node:test';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

test('Stark Tower moves only the Tech upgrade selected by its search', async () => {
    const catalog = await loadCatalog();
    const ironman = catalog.heroes.find(hero => hero._id === 'ironman');
    assert.ok(ironman);

    const starkTower = ironman.config.cards.find(({card}) =>
        card.params.name === 'Torre Stark');
    const reactorArk = ironman.config.cards.find(({card}) =>
        card.params.name === 'Reactor ARK');
    const gauntlets = ironman.config.cards.find(({card}) =>
        card.params.name === 'Guanteletes potenciados');
    assert.ok(starkTower);
    assert.ok(reactorArk);
    assert.ok(gauntlets);

    const matchFactory = new MatchFactory({
        players: [],
        triggerCards: {},
    });
    const deck = {
        cards: [],
        discardPile: [],
        searchDiscard(card) {
            const index = this.discardPile.indexOf(card);
            if (index !== -1) {
                this.discardPile.splice(index, 1);
            }
        },
        refresh() {},
    };
    const hand = {
        cards: [],
        addCard(card) {
            this.cards.push(card);
        },
        refresh() {},
    };
    const player = {
        deck,
        hand,
        isAlterEgo: true,
    };
    matchFactory.match.players.push(player);

    const cardsFactory = matchFactory.cardsFactory;
    const towerCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(starkTower.card),
        owner: player,
    });
    const [towerAbility] = towerCard.abilities;
    const params = {
        card: towerCard,
        match: matchFactory.match,
        player,
    };

    const abilityParams = {...params, arrowPaid: true};
    assert.equal(await towerAbility.canRun(abilityParams), false);
    await towerAbility.effect.runEffect(params);
    assert.deepEqual(hand.cards, []);

    const techUpgrade = cardsFactory.createGameCard({
        card: cardsFactory.createCard(reactorArk.card),
        owner: player,
    });
    deck.discardPile.push(techUpgrade);

    assert.equal(await towerAbility.canRun(abilityParams), true);
    await towerAbility.effect.runEffect(params);

    assert.deepEqual(hand.cards, [techUpgrade]);
    assert.deepEqual(deck.discardPile, []);
    assert.equal(hand.cards.includes(towerCard), false);

    const secondTechUpgrade = cardsFactory.createGameCard({
        card: cardsFactory.createCard(gauntlets.card),
        owner: player,
    });
    deck.discardPile.push(secondTechUpgrade);

    assert.equal(await towerAbility.canRun(abilityParams), true);
    await towerAbility.effect.runEffect(params);

    assert.deepEqual(hand.cards, [techUpgrade, secondTechUpgrade]);
    assert.deepEqual(deck.discardPile, []);
});
