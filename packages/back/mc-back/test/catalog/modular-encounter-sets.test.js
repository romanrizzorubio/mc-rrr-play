import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_CANNOT,
    EFFECT_RESOLVE_ABILITY,
    TARGET_REVEALED_ABILITY,
    TARGET_YOUR_SUPERHERO,
    TRAIT_CRIMINAL,
    TRIGGER_ENCOUNTER_ABILITY_RESOLVED,
    TRIGGER_PLAYER_CAN_FLIP,
    TRIGGER_PLAYER_CAN_READY,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import aMessOfThings from '../../../mc-data/seed/catalog/sets/a-mess-of-things.js';
import powerDrain from '../../../mc-data/seed/catalog/sets/power-drain.js';
import runningInterference from '../../../mc-data/seed/catalog/sets/running-interference.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

const cardsByName = set => new Map(set.config.cards.map(entry => [
    entry.card.params.name,
    entry,
]));

test('the three modular encounter sets are registered with their printed card counts', async () => {
    const {sets} = await loadCatalog();
    const registeredSets = new Map(sets.map(set => [set._id, set]));

    assert.equal(registeredSets.get('a-mess-of-things')?.config.name, 'Un auténtico estropicio');
    assert.equal(registeredSets.get('power-drain')?.config.name, 'Alta tensión');
    assert.equal(registeredSets.get('running-interference')?.config.name, 'Impedimentos');

    const messCards = cardsByName(aMessOfThings);
    assert.equal(messCards.get('Barrido de cola').count, 2);
    assert.equal(messCards.get('Barrido de cola').card.params.boost, 0);
    assert.equal(messCards.get('Escorpión').card.type, CARD_TYPE_MINION);
    assert.equal(messCards.get('Un auténtico estropicio').card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);

    const standardTodosAUno = standard.config.cards.find(({card}) =>
        card.params.name === 'Todos a una');
    assert.ok(standardTodosAUno);
    assert.strictEqual(messCards.get('Todos a una').card, standardTodosAUno.card);

    const drainCards = cardsByName(powerDrain);
    assert.equal(drainCards.size, 5);
    assert.equal(drainCards.get('Alta tensión').card.params.startingThreat[0], 2);
    assert.equal(drainCards.get('Electro').card.params.unique, true);
    assert.deepEqual(
        drainCards.get('Electro').card.params.traits,
        [TRAIT_CRIMINAL]
    );

    const interferenceCards = cardsByName(runningInterference);
    assert.equal(interferenceCards.get('Cobertura mediática').count, 2);
    assert.equal(interferenceCards.get('Con las manos atadas').card.params.attach, TARGET_YOUR_SUPERHERO);
});

test('all abilities in the modular encounter sets compile to individual effects', () => {
    const factory = new CardsFactory({
        match: {
            players: [],
            triggerCards: {},
        },
    });

    for (const set of [aMessOfThings, powerDrain, runningInterference]) {
        for (const {card: cardConfig} of set.config.cards) {
            const gameCard = factory.createGameCard({
                card: factory.createCard(cardConfig),
                owner: {},
            });

            for (const ability of gameCard.abilities) {
                if (ability.effect) {
                    assert.equal(Array.isArray(ability.effect), false);
                    assert.equal(typeof ability.effect.canRun, 'function');
                }
            }

            if (gameCard.boostAbility?.effect) {
                assert.equal(Array.isArray(gameCard.boostAbility.effect), false);
                assert.equal(typeof gameCard.boostAbility.effect.canRun, 'function');
            }
        }
    }
});

test('the attachment restrictions use permission triggers and the reveal repeater resolves its event ability', () => {
    const [scheme, _tombstone, tiedHands, mediaCoverage] =
        runningInterference.config.cards;
    assert.equal(scheme.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
    assert.equal(_tombstone.card.params.name, 'Lápida');
    assert.equal(_tombstone.card.params.unique, true);
    assert.equal(tiedHands.card.type, CARD_TYPE_ATTACHMENT);
    assert.equal(mediaCoverage.card.type, CARD_TYPE_ATTACHMENT);

    const [cannotReady, cannotFlip] = tiedHands.card.params.abilities;
    assert.equal(cannotReady.params.trigger, TRIGGER_PLAYER_CAN_READY);
    assert.equal(cannotReady.params.effect.type, EFFECT_CANNOT);
    assert.equal(cannotFlip.params.trigger, TRIGGER_PLAYER_CAN_FLIP);
    assert.equal(cannotFlip.params.effect.type, EFFECT_CANNOT);

    const [resolveAbility] = mediaCoverage.card.params.abilities;
    assert.equal(resolveAbility.params.trigger, TRIGGER_ENCOUNTER_ABILITY_RESOLVED);
    assert.equal(resolveAbility.params.effect.type, EFFECT_RESOLVE_ABILITY);
    assert.equal(
        resolveAbility.params.effect.params.target,
        TARGET_REVEALED_ABILITY
    );
});

test('encounter set treacheries retain their card type and printed boost values', () => {
    const powerCards = cardsByName(powerDrain);
    for (const [name, boost] of [
        ['Pulso electromagnético', 2],
        ['Descarga eléctrica', 1],
        ['Terapia de electrochoque', 1],
    ]) {
        assert.equal(powerCards.get(name).card.type, CARD_TYPE_TREACHERY);
        assert.equal(powerCards.get(name).card.params.boost, boost);
    }
});

test('Electroshock Therapy discards one encounter card per player', () => {
    const therapy = cardsByName(powerDrain).get('Terapia de electrochoque').card;
    const [discardEffect] = therapy.params.abilities[0].params.effect.params.effects;

    assert.deepEqual(discardEffect.params.count, [1, true]);
    assert.equal(discardEffect.params.paramsCalc, undefined);
});
