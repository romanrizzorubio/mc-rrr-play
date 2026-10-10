import assert from 'node:assert/strict';
import {test} from 'node:test';

import {AttackBasicAbility} from '../../src/abilities/basic/attack-basic-ability.js';
import {ActivationsFactory} from '../../src/factory/activations/activations-factory.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {EffectsFactory} from '../../src/factory/effects/effects-factory.js';
import basicAllies from '../../../mc-data/seed/catalog/aspects/basic/allies.js';

test('Mockingbird suffers consequential damage when its attack defeats a villain stage', async () => {
    const match = {
        enemies: [],
        villain: null,
        triggerCards: {},
    };
    const nextVillain = {
        isEnemy: true,
        isInPlay: true,
        isTough: false,
        isVillain: true,
        name: 'Rino',
        async refresh() {},
    };
    const villain = {
        damage: 0,
        isEnemy: true,
        isInPlay: true,
        isTough: false,
        isVillain: true,
        name: 'Rino',
        canBeAttacked: () => true,
        async getLife() {
            return 1 - this.damage;
        },
        async defeat() {
            match.villain = nextVillain;
        },
        placeDamage(damage) {
            this.damage += damage;
        },
        async refresh() {},
    };
    match.enemies = [villain];
    match.villain = villain;
    const cardsFactory = new CardsFactory({match});
    match.activationsFactory = new ActivationsFactory(match);
    match.effectsFactory = new EffectsFactory(cardsFactory.abilitiesFactory);

    const mockingbirdConfig = basicAllies.find(({_id}) =>
        _id === 'basic-mockingbird');
    const printedCard = cardsFactory.createCard(structuredClone(mockingbirdConfig.card));
    const player = {
        gameZone: {
            async refresh() {},
        },
        canAttack: () => true,
    };
    const mockingbird = cardsFactory.createGameCard({card: printedCard});
    mockingbird.controller = player;
    let refreshCount = 0;
    let consequentialRefreshCompleted = false;
    mockingbird.refresh = async () => {
        const currentRefresh = ++refreshCount;
        await new Promise(resolve => setTimeout(resolve, 0));

        if (currentRefresh === 2) {
            consequentialRefreshCompleted = true;
        }
    };

    const attackAbility = mockingbird.abilities.find(ability =>
        ability instanceof AttackBasicAbility);

    await mockingbird.resolveAbility({
        abilityIndex: mockingbird.abilities.indexOf(attackAbility),
        player,
    });

    assert.equal(villain.damage, 1);
    assert.equal(match.villain, nextVillain);
    assert.equal(mockingbird.damage, 1);
    assert.equal(mockingbird.life, 2);
    assert.equal(consequentialRefreshCompleted, true);
});
