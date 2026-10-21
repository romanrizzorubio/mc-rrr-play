import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_RESOURCE,
    CARD_TYPE_UPGRADE,
    EFFECT_EXHAUST,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ANY_PLAYER,
    TARGET_PLAYER,
    TARGET_THIS,
    TRAIT_ATTACK,
    TRAIT_SKILL,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ResourceAbility} from '../../src/abilities/resource/resource-ability.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('Destreza marcial is in Hulk precon and generates resources only for Attack events', async () => {
    const {aspects, heroes} = await loadCatalog();
    const cardConfig = aspects.find(({_id}) =>
        _id === 'aggression-destreza-marcial');
    const hulk = heroes.find(({_id}) => _id === 'hulk');

    assert.ok(cardConfig);
    assert.ok(hulk);

    const preconCard = hulk.config.precon
        .find(({aspect}) => aspect === 'aggression')
        .cardRefs.find(({id}) => id === cardConfig._id);
    assert.equal(preconCard.count, 3);

    const {card} = cardConfig;
    assert.equal(card.type, CARD_TYPE_UPGRADE);
    assert.equal(card.params.name, 'Destreza marcial');
    assert.equal(card.params.image, 'aspect/aggression/upgrades/10018.png');
    assert.deepEqual(card.params.traits, [TRAIT_SKILL]);
    assert.equal(card.params.cost, 2);
    assert.deepEqual(card.params.resources, [RESOURCE_PHYSICAL]);
    assert.equal(card.params.controllerTarget, TARGET_ANY_PLAYER);
    assert.deepEqual(card.params.maximum, {
        count: 1,
        target: TARGET_PLAYER,
    });

    const player = {
        isPlayer: true,
        gameZone: {refresh: async () => {}},
    };
    const cardsFactory = new CardsFactory({match: {triggerCards: {}}});
    const gameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(card),
        owner: player,
    });
    gameCard.controller = player;
    gameCard.refresh = async () => {};

    const [ability] = gameCard.abilities;
    assert.equal(card.params.abilities[0].type, ABILITY_RESOURCE);
    assert.equal(card.params.abilities[0].params.arrow.type, EFFECT_EXHAUST);
    assert.equal(card.params.abilities[0].params.arrow.params.target, TARGET_THIS);
    assert.ok(ability instanceof ResourceAbility);
    assert.equal(typeof ability.arrow.canPay, 'function');

    ability.arrow.canPay = async () => true;
    const attackEvent = {
        isEvent: true,
        traits: [TRAIT_ATTACK],
    };
    const nonAttackEvent = {
        isEvent: true,
        traits: [],
    };
    const nonEventAttack = {
        isEvent: false,
        traits: [TRAIT_ATTACK],
    };

    assert.equal(
        await gameCard.hasResourceGenerators(attackEvent, RESOURCE_PHYSICAL),
        true
    );
    assert.equal(
        await gameCard.hasResourceGenerators(attackEvent, RESOURCE_MENTAL),
        false
    );
    assert.equal(
        await gameCard.hasResourceGenerators(nonAttackEvent, RESOURCE_PHYSICAL),
        false
    );
    assert.equal(
        await gameCard.hasResourceGenerators(nonEventAttack, RESOURCE_PHYSICAL),
        false
    );

    await ability.payArrow({player, card: gameCard});
    assert.equal(gameCard.exhausted, true);
});
