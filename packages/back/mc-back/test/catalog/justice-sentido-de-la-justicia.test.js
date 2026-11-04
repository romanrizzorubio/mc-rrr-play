import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_RESOURCE,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_JUSTICE,
    EFFECT_EXHAUST,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ANY_PLAYER,
    TARGET_PLAYER,
    TARGET_THIS,
    TRAIT_SKILL,
    TRAIT_THWART,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ResourceAbility} from '../../src/abilities/resource/resource-ability.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

describe('Sentido de la justicia', () => {
    test('is in the shared Justice collection and in no precon', async () => {
        const {aspects, heroes} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'justice-sentido-de-la-justicia');

        assert.ok(cardConfig);
        assert.equal(cardConfig.aspect, CLASSIFICATION_JUSTICE);
        assert.equal(cardConfig.card.type, CARD_TYPE_UPGRADE);
        assert.equal(cardConfig.card.params.name, 'Sentido de la justicia');
        assert.equal(cardConfig.card.params.set, CLASSIFICATION_JUSTICE);
        assert.equal(
            cardConfig.card.params.image,
            'aspect/justice/upgrades/14030.png'
        );
        assert.deepEqual(cardConfig.card.params.traits, [TRAIT_SKILL]);
        assert.equal(cardConfig.card.params.cost, 2);
        assert.deepEqual(cardConfig.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(
            cardConfig.card.params.classification,
            CLASSIFICATION_JUSTICE
        );
        assert.equal(
            cardConfig.card.params.controllerTarget,
            TARGET_ANY_PLAYER
        );
        assert.deepEqual(cardConfig.card.params.maximum, {
            count: 1,
            target: TARGET_PLAYER,
        });

        const preconIds = heroes.flatMap(({config}) =>
            (config.precon ?? []).flatMap(({cardRefs = []}) =>
                cardRefs.map(({id}) => id)
            )
        );
        assert.equal(preconIds.includes(cardConfig._id), false);

        const [ability] = cardConfig.card.params.abilities;
        assert.equal(ability.type, ABILITY_RESOURCE);
        assert.equal(ability.params.resource, RESOURCE_MENTAL);
        assert.deepEqual(ability.params.condition, {
            'cardToPay.isEvent': true,
            'cardToPay.traits': TRAIT_THWART,
        });
        assert.deepEqual(ability.params.arrow, {
            type: EFFECT_EXHAUST,
            params: {target: TARGET_THIS},
        });
    });

    test('generates mental only for Thwart Events and exhausts when used', async () => {
        const {aspects} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) =>
            _id === 'justice-sentido-de-la-justicia').card;
        const player = {
            isPlayer: true,
            gameZone: {refresh: async () => {}},
        };
        const cardsFactory = new CardsFactory({match: {triggerCards: {}}});
        const gameCard = cardsFactory.createGameCard({
            card: cardsFactory.createCard(cardConfig),
            owner: player,
        });
        gameCard.controller = player;
        gameCard.refresh = async () => {};

        const [ability] = gameCard.abilities;
        assert.ok(ability instanceof ResourceAbility);
        assert.equal(typeof ability.arrow.cost.canRun, 'function');
        ability.arrow.canPay = async () => true;

        const thwartEvent = {
            isEvent: true,
            traits: [TRAIT_THWART],
        };
        const otherEvent = {
            isEvent: true,
            traits: [],
        };
        const thwartAlly = {
            isEvent: false,
            traits: [TRAIT_THWART],
        };

        assert.equal(
            await gameCard.hasResourceGenerators(thwartEvent, RESOURCE_MENTAL),
            true
        );
        assert.equal(
            await gameCard.hasResourceGenerators(thwartEvent, RESOURCE_PHYSICAL),
            false
        );
        assert.equal(
            await gameCard.hasResourceGenerators(otherEvent, RESOURCE_MENTAL),
            false
        );
        assert.equal(
            await gameCard.hasResourceGenerators(thwartAlly, RESOURCE_MENTAL),
            false
        );

        await ability.payArrow({player, card: gameCard});
        assert.equal(gameCard.exhausted, true);
    });
});
