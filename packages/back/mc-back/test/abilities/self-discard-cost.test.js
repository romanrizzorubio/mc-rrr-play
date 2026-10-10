import assert from 'node:assert/strict';
import {test} from 'node:test';

import {ActivationsFactory} from '../../src/factory/activations/activations-factory.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import captainMarvel from '../../../mc-data/seed/catalog/heroes/captain-marvel.js';

test('a labeled ability resolves after discarding its source card as a cost', async () => {
    const enemy = {
        abilities: [],
        damage: 0,
        hitPoints: 10,
        id: 'test-enemy',
        isEnemy: true,
        isMinion: true,
        name: 'Test enemy',
        async getLife() {
            return this.hitPoints - this.damage;
        },
        canBeAttacked() {
            return true;
        },
        placeDamage(damage) {
            this.damage += damage;
        },
        async refresh() {},
    };
    const player = {
        isHero: true,
        isPlayer: true,
        isStunned: false,
        canAttack() {
            return true;
        },
        gameZone: {
            discard() {},
            async refresh() {},
        },
        deck: {
            async discard() {},
            async refresh() {},
        },
    };
    const match = {
        enemies: [enemy],
        triggerCards: {},
    };
    match.activationsFactory = new ActivationsFactory(match);
    const cardsFactory = new CardsFactory({match});
    match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;

    const channelEnergyConfig = captainMarvel.config.cards.find(({card}) =>
        card.params.name === 'Canalizar energía').card;
    const printedCard = cardsFactory.createCard(channelEnergyConfig);
    const channelEnergy = cardsFactory.createGameCard({
        card: printedCard,
        index: 1,
        owner: player,
    });
    channelEnergy.controller = player;
    channelEnergy.counters = 2;

    const shootAbility = channelEnergy.abilities.find(({name}) =>
        name === 'Disparar');

    await shootAbility.resolveAbility({
        card: channelEnergy,
        match,
        player,
    });

    assert.equal(channelEnergy.controller, undefined);
    assert.equal(shootAbility.resolved, true);
    assert.equal(shootAbility.character, undefined);
    assert.equal(enemy.damage, 4);
});
