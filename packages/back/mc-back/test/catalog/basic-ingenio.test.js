import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_RESOURCE,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_BASIC,
    EFFECT_DISCARD_GAME,
    RESOURCE_WILD,
    TARGET_THIS,
    TRAIT_SKILL,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ResourceAbility} from '../../src/abilities/resource/resource-ability.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

describe('Ingenio', () => {
    test('is a shared basic upgrade with a self-discarding wild resource ability', async () => {
        const {aspects, heroes} = await loadCatalog();
        const cardConfig = aspects.find(({_id}) => _id === 'basic-ingenio');

        assert.ok(cardConfig);
        assert.equal(cardConfig.card.type, CARD_TYPE_UPGRADE);
        assert.equal(cardConfig.classification, CLASSIFICATION_BASIC);
        assert.equal(cardConfig.card.params.name, 'Ingenio');
        assert.equal(cardConfig.card.params.image, 'aspect/basic/upgrades/10032.png');
        assert.deepEqual(cardConfig.card.params.traits, [TRAIT_SKILL]);
        assert.equal(cardConfig.card.params.cost, 1);
        assert.deepEqual(cardConfig.card.params.resources, [RESOURCE_WILD]);
        assert.equal(cardConfig.card.params.classification, CLASSIFICATION_BASIC);
        assert.equal(
            heroes.some(({config}) => config.precon?.some(({cardRefs}) =>
                cardRefs.some(({id}) => id === cardConfig._id))),
            false
        );

        const [abilityConfig] = cardConfig.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_RESOURCE);
        assert.equal(abilityConfig.params.resource, RESOURCE_WILD);
        assert.deepEqual(abilityConfig.params.arrow, {
            type: EFFECT_DISCARD_GAME,
            params: {
                target: TARGET_THIS,
            },
        });

        const cardsFactory = new CardsFactory({match: {triggerCards: {}}});
        const gameCard = cardsFactory.createGameCard({
            card: cardsFactory.createCard(cardConfig.card),
            owner: {isPlayer: true},
        });
        const [ability] = gameCard.abilities;

        assert.ok(ability instanceof ResourceAbility);
        assert.equal(typeof ability.canRun, 'function');
        assert.equal(ability.resource, RESOURCE_WILD);
        assert.equal(typeof ability.arrow.cost.canRun, 'function');
    });
});
