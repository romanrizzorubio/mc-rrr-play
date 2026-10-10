import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_CHOOSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_PLACE_THREAT,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_TOUGH,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_ALL_PLAYERS,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOUR_HERO,
    TRAIT_ARMOR,
    TRAIT_WEAPON,
    TRIGGER_ATTACHED_TAKES_DAMAGE,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

const getEntry = (set, name) => {
    const entry = set.config.cards.find(({card}) => card.params.name === name);
    assert.ok(entry, `Expected ${name} in the Under Attack set.`);

    return entry;
};

test('Under Attack is registered with the four encounter cards', async () => {
    const {sets} = await loadCatalog();
    const set = sets.find(({_id}) => _id === 'under-attack');

    assert.ok(set);
    assert.equal(set.config.name, 'Civiles en peligro');
    assert.equal(set.config.standard, false);
    assert.equal(set.config.cards.length, 4);

    const scheme = getEntry(set, 'Civiles en peligro');
    assert.equal(scheme.count, 1);
    assert.equal(scheme.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
    assert.equal(scheme.card.params.image, 'sets/under-attack/01151.png');
    assert.equal(scheme.card.params.startingThreat, 3);
    assert.equal(scheme.card.params.boost, 3);
    assert.deepEqual(scheme.card.params.icons, {crisis: true});
    const [whenRevealed] = scheme.card.params.abilities;
    assert.equal(whenRevealed.type, ABILITY_WHEN_REVEALED);
    assert.equal(whenRevealed.params.effect.type, EFFECT_CHOOSE);
    assert.equal(whenRevealed.params.effect.params.players, TARGET_ALL_PLAYERS);
    assert.deepEqual(whenRevealed.params.effect.params.options, [
        {
            type: EFFECT_PLACE_THREAT,
            params: {
                title: 'Colocar 2 de Amenaza sobre esta carta',
                threat: 2,
                target: TARGET_CARD,
            },
        },
        {
            type: EFFECT_DEAL_DAMAGE,
            params: {
                title: 'Infligir 3 de Daño a tu Héroe',
                damage: 3,
                target: TARGET_YOUR_HERO,
            },
        },
    ]);

    const armor = getEntry(set, 'Armadura de Vibránium');
    assert.equal(armor.count, 1);
    assert.equal(armor.card.type, CARD_TYPE_ATTACHMENT);
    assert.equal(armor.card.params.image, 'sets/under-attack/01152.png');
    assert.deepEqual(armor.card.params.traits, [TRAIT_ARMOR]);
    assert.equal(armor.card.params.boost, 1);
    assert.equal(armor.card.params.attach, TARGET_VILLAIN);
    const [armorResponse, armorAction] = armor.card.params.abilities;
    assert.equal(armorResponse.type, ABILITY_FORCED_RESPONSE);
    assert.equal(armorResponse.params.trigger, TRIGGER_ATTACHED_TAKES_DAMAGE);
    assert.deepEqual(armorResponse.params.effect, {
        type: EFFECT_TOUGH,
        params: {
            target: TARGET_ATTACHED,
        },
    });
    assert.equal(armorAction.type, ABILITY_HERO_ACTION);
    assert.equal(armorAction.params.arrow.type, EFFECT_SIMULTANEOUS);
    assert.deepEqual(armorAction.params.arrow.params.effects, [
        {
            type: EFFECT_EXHAUST,
            params: {
                target: TARGET_YOUR_HERO,
            },
        },
        {
            type: EFFECT_SPEND,
            params: {
                resources: [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL],
            },
        },
    ]);
    assert.deepEqual(armorAction.params.effect, {
        type: EFFECT_DISCARD_GAME,
        params: {
            target: TARGET_THIS,
        },
    });

    const rays = getEntry(set, 'Rayos de fuerza');
    assert.equal(rays.count, 1);
    assert.equal(rays.card.params.image, 'sets/under-attack/01153.png');
    assert.deepEqual(rays.card.params.traits, [TRAIT_WEAPON]);
    assert.equal(rays.card.params.attach, TARGET_VILLAIN);
    assert.deepEqual(rays.card.params.keywords, {retaliate: 1});
    const [raysAction] = rays.card.params.abilities;
    assert.equal(raysAction.type, ABILITY_HERO_ACTION);
    assert.deepEqual(raysAction.params.arrow.params.effects[1].params.resources, [
        RESOURCE_ENERGY,
        RESOURCE_ENERGY,
    ]);
    assert.deepEqual(raysAction.params.effect, {
        type: EFFECT_DISCARD_GAME,
        params: {
            target: TARGET_THIS,
        },
    });

    const treachery = getEntry(set, 'Descarga fulminante');
    assert.equal(treachery.count, 2);
    assert.equal(treachery.card.type, CARD_TYPE_TREACHERY);
    assert.equal(treachery.card.params.image, 'sets/under-attack/01154.png');
    const [treacheryReveal] = treachery.card.params.abilities;
    assert.equal(treacheryReveal.type, ABILITY_WHEN_REVEALED);
    assert.deepEqual(treacheryReveal.params.effect, {
        type: EFFECT_DEAL_DAMAGE,
        params: {
            damage: 1,
            target: TARGET_ALL_FRIENDLY_CHARACTERS,
        },
    });
    assert.equal(treachery.card.params.boostAbility.type, ABILITY_BOOST);
    assert.deepEqual(treachery.card.params.boostAbility.params.effect, {
        type: EFFECT_DEAL_DAMAGE,
        params: {
            damage: 1,
            target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
        },
    });
});

test('all Under Attack abilities compile to a single effect with canRun', async () => {
    const {sets} = await loadCatalog();
    const set = sets.find(({_id}) => _id === 'under-attack');
    const cardsFactory = new CardsFactory({
        match: {
            triggerCards: {},
            players: [],
        },
    });

    for (const {card: cardConfig} of set.config.cards) {
        const printedCard = cardsFactory.createCard(cardConfig);
        const gameCard = cardsFactory.createGameCard({
            card: printedCard,
            owner: {},
        });
        const abilities = [
            ...gameCard.abilities,
            ...(gameCard.boostAbility ? [gameCard.boostAbility] : []),
        ];

        assert.ok(abilities.length);
        for (const ability of abilities) {
            assert.ok(ability.effect);
            assert.equal(typeof ability.effect.canRun, 'function');
        }
    }

    const schemeEntry = getEntry(set, 'Civiles en peligro');
    const schemeGameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(schemeEntry.card),
        owner: {},
    });
    assert.deepEqual(
        schemeGameCard.abilities[0].effect.options.map(option => option.getTitle()),
        [
            'Colocar 2 de Amenaza sobre esta carta',
            'Infligir 3 de Daño a tu Héroe',
        ]
    );

    const armorEntry = getEntry(set, 'Armadura de Vibránium');
    const armorCard = cardsFactory.createCard(armorEntry.card);
    assert.equal(armorCard.traits[0], TRAIT_ARMOR);

    const raysEntry = getEntry(set, 'Rayos de fuerza');
    const raysCard = cardsFactory.createCard(raysEntry.card);
    assert.equal(raysCard.retaliate, 1);

    const treacheryEntry = getEntry(set, 'Descarga fulminante');
    const treacheryCard = cardsFactory.createCard(treacheryEntry.card);
    assert.equal(treacheryCard.boost, 0);
    const treacheryGameCard = cardsFactory.createGameCard({
        card: treacheryCard,
        owner: {},
    });
    assert.equal(treacheryGameCard.boostAbility.effect.effectType, EFFECT_DEAL_DAMAGE);
});
