import assert from 'node:assert/strict';
import {test} from 'node:test';

import {ABILITY_BOOST, ABILITY_WHEN_REVEALED, TRAIT_DRONE} from 'mc-shared';
import ultron from '../../../mc-data/seed/catalog/scenarios/ultron.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Secuencia de reparación heals one per Drone as a boost and two when revealed', async () => {
    const villain = {
        damage: 6,
        canHeal: true,
        async refresh() {},
        healDamage(amount) {
            this.damage = Math.max(0, this.damage - amount);
        },
    };
    const match = {
        villain,
        triggerCards: {},
        async openDialog() {
            return {};
        },
    };
    const cardsFactory = new CardsFactory({match});
    const repairSequence = ultron.config.cards.find(({card}) =>
        card.params.name === 'Secuencia de reparación').card;
    const gameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(structuredClone(repairSequence)),
        index: 1,
        owner: {},
    });
    const boostAbility = repairSequence.params.boostAbility;

    assert.equal(boostAbility.type, ABILITY_BOOST);
    assert.equal(repairSequence.params.abilities[0].type, ABILITY_WHEN_REVEALED);

    const enemyActivation = {
        boostCards: [gameCard],
    };
    const boost = new ResolveBoostEffect({
        card: gameCard,
        enemyActivation,
        match,
    });

    const player = {
        minions: [
            {traits: [TRAIT_DRONE]},
            {traits: [TRAIT_DRONE]},
            {traits: []},
        ],
    };
    await boost.runEffect({player});

    assert.equal(villain.damage, 4);
    assert.equal(boost.value, 1);

    villain.damage = 6;
    await gameCard.abilities[0].resolveAbility({
        card: gameCard,
        player,
    });

    assert.equal(villain.damage, 2);
});
