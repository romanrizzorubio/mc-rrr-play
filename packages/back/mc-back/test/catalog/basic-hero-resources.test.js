import assert from 'node:assert/strict';
import {test} from 'node:test';

import {RESOURCE_MENTAL} from 'mc-shared';
import basicUpgrades from '../../../mc-data/seed/catalog/aspects/basic/upgrades.js';
import {HeroResourceAbility} from '../../src/abilities/resource/hero-resource-ability.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Consciencia mejorada is offered as a resource only in hero form', async () => {
    const enhancedAwareness = basicUpgrades.find(({_id}) =>
        _id === 'basic-enhanced-awareness');
    assert.ok(enhancedAwareness);

    const player = {
        isAlterEgo: false,
        isHero: true,
        isPlayer: true,
    };
    const factory = new CardsFactory({
        match: {triggerCards: {}},
    });
    const card = factory.createGameCard({
        card: factory.createCard(enhancedAwareness.card),
        owner: player,
    });
    card.controller = player;

    const [ability] = card.abilities;
    assert.ok(ability instanceof HeroResourceAbility);

    let arrowChecks = 0;
    ability.arrow.canPay = async () => {
        arrowChecks++;

        return true;
    };

    assert.equal(await card.hasResourceGenerators({}, RESOURCE_MENTAL), true);
    assert.equal(arrowChecks, 1);

    player.isHero = false;
    player.isAlterEgo = true;

    assert.equal(await card.hasResourceGenerators({}, RESOURCE_MENTAL), false);
    assert.equal(arrowChecks, 1);
});
