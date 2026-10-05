import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_FORCED_INTERRUPT,
    ABILITY_WHEN_REVEALED,
    CALC_ALL,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    EFFECT_CHAINED,
    EFFECT_DISCARD_GAME,
    EFFECT_ENGAGE,
    EFFECT_HEAL,
    EFFECT_PREVENT_DEFEAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_SHUFFLE_DECK,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    TARGET_ATTACHED,
    TARGET_EFFECT,
    TARGET_MINION_HIGHEST_PRINTED_HP,
    TARGET_SCENARIO,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_CYBORG,
    TRAIT_ELITE,
    TRAIT_TECH,
    TRIGGER_ATTACHED_DEFEAT,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {DiscardFromGameEffect} from '../../src/effects/discard-from-game-effect.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {HealEffect} from '../../src/effects/heal-effect.js';
import {PreventDefeatEffect} from '../../src/effects/prevent-defeat-effect.js';
import {SearchCardsEffect} from '../../src/effects/search-cards-effect.js';
import {ShuffleDeckEffect} from '../../src/effects/shuffle-deck-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';

test('La Silla uses its main effect for the M.O.D.O.K. search', async () => {
    const {sets} = await loadCatalog();
    const set = sets.find(({_id}) => _id === 'the-doomsday-chair');
    assert.ok(set);
    const schemeEntry = set.config.cards.find(({card}) =>
        card.params.name === 'La Silla del Juicio Final');
    assert.ok(schemeEntry);
    const {card} = schemeEntry;
    const [whenRevealed] = card.params.abilities;
    const searchAndEngage = whenRevealed.params.effect;

    assert.equal(searchAndEngage.type, EFFECT_CHAINED);

    const cardsFactory = new CardsFactory({match: {}});
    const gameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(card),
        owner: {},
    });
    const [ability] = gameCard.abilities;

    assert.ok(ability.effect instanceof ChainedEffect);
    assert.equal(typeof ability.effect.canRun, 'function');
    assert.ok(ability.effect.effects[0] instanceof SearchCardsEffect);
    assert.ok(ability.effect.effects[1] instanceof EngageEffect);
    assert.ok(ability.effect.thenEffect instanceof ShuffleDeckEffect);
});

test('La Silla del Juicio Final is registered with its M.O.D.O.K. reveal effect', async () => {
    const {sets} = await loadCatalog();
    const set = sets.find(({_id}) => _id === 'the-doomsday-chair');

    assert.ok(set);
    assert.equal(set.config.name, 'La Silla del Juicio Final');
    assert.equal(set.config.standard, false);
    assert.equal(set.config.cards.length, 3);

    const schemeEntry = set.config.cards.find(({card}) =>
        card.params.name === 'La Silla del Juicio Final');
    assert.ok(schemeEntry);
    const {count, card} = schemeEntry;
    assert.equal(count, 2);
    assert.equal(card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
    assert.equal(card.params.name, 'La Silla del Juicio Final');
    assert.equal(card.params.image, 'sets/the-doomsday-chair/01183.png');
    assert.equal(card.params.startingThreat, 8);
    assert.equal(card.params.boost, 3);

    const [whenRevealed] = card.params.abilities;
    assert.equal(whenRevealed.type, ABILITY_WHEN_REVEALED);

    const searchAndEngage = whenRevealed.params.effect;
    assert.equal(searchAndEngage.type, EFFECT_CHAINED);
    assert.equal(searchAndEngage.params.matchAll, true);

    const [search, engage] = searchAndEngage.params.effects;
    assert.equal(search.type, EFFECT_SEARCH_CARDS);
    assert.deepEqual(search.params.locations, [
        PLACE_ENCOUNTER_DECK_CARDS,
        PLACE_ENCOUNTER_DISCARD,
    ]);
    assert.deepEqual(search.params.filter, {name: 'M.O.D.O.K.'});
    assert.equal(search.params.firstMatch, true);
    assert.equal(search.params.requireMatch, true);
    assert.equal(engage.type, EFFECT_ENGAGE);
    assert.equal(engage.params.target, TARGET_YOU);

    assert.equal(searchAndEngage.params.thenEffect.type, EFFECT_SHUFFLE_DECK);
    assert.equal(searchAndEngage.params.thenEffect.params.target, TARGET_SCENARIO);

    const cardsFactory = new CardsFactory({match: {}});
    const gameCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(card),
        owner: {},
    });
    const [ability] = gameCard.abilities;

    assert.ok(ability.effect instanceof ChainedEffect);
    assert.equal(typeof ability.effect.canRun, 'function');
    assert.ok(ability.effect.effects[0] instanceof SearchCardsEffect);
    assert.ok(ability.effect.effects[1] instanceof EngageEffect);
    assert.ok(ability.effect.thenEffect instanceof ShuffleDeckEffect);

    const modokEntry = set.config.cards.find(({card}) => card.params.name === 'M.O.D.O.K.');
    assert.ok(modokEntry);
    assert.equal(modokEntry.count, 1);
    assert.equal(modokEntry.card.type, CARD_TYPE_MINION);
    assert.equal(modokEntry.card.params.image, 'sets/the-doomsday-chair/01184.png');
    assert.equal(modokEntry.card.params.unique, true);
    assert.deepEqual(modokEntry.card.params.traits, [TRAIT_CYBORG, TRAIT_ELITE]);
    assert.equal(modokEntry.card.params.boost, 2);
    assert.equal(modokEntry.card.params.attack, 2);
    assert.equal(modokEntry.card.params.scheme, 2);
    assert.equal(modokEntry.card.params.hitPoints, 8);
    assert.equal(modokEntry.card.params.keywords.retaliate, 2);

    const modok = cardsFactory.createCard(modokEntry.card);
    assert.equal(modok.retaliate, 2);

    const attachmentEntry = set.config.cards.find(({card}) =>
        card.params.name === 'Mejoras biomecánicas');
    assert.ok(attachmentEntry);
    assert.equal(attachmentEntry.count, 3);
    assert.equal(attachmentEntry.card.type, CARD_TYPE_ATTACHMENT);
    assert.equal(attachmentEntry.card.params.image, 'sets/the-doomsday-chair/01185.png');
    assert.deepEqual(attachmentEntry.card.params.traits, [TRAIT_TECH]);
    assert.equal(attachmentEntry.card.params.boost, 1);
    assert.equal(attachmentEntry.card.params.maxAttach, 1);
    assert.equal(attachmentEntry.card.params.attach.target, TARGET_MINION_HIGHEST_PRINTED_HP);
    assert.equal(attachmentEntry.card.params.attach.ifNot, undefined);
    assert.equal(attachmentEntry.card.params.keywords.surge, true);

    const [forcedInterrupt] = attachmentEntry.card.params.abilities;
    assert.equal(forcedInterrupt.type, ABILITY_FORCED_INTERRUPT);
    assert.equal(forcedInterrupt.params.trigger, TRIGGER_ATTACHED_DEFEAT);
    const replacement = forcedInterrupt.params.effect;
    assert.equal(replacement.type, EFFECT_CHAINED);
    assert.equal(replacement.params.matchAll, true);
    assert.equal(replacement.params.effects[0].type, EFFECT_PREVENT_DEFEAT);
    assert.equal(replacement.params.effects[0].params.target, TARGET_EFFECT);
    assert.equal(replacement.params.effects[1].type, EFFECT_HEAL);
    assert.equal(replacement.params.effects[1].params.target, TARGET_ATTACHED);
    assert.deepEqual(replacement.params.effects[1].params.paramsCalc, {
        formula: CALC_ALL,
        target: 'effect.selectedTarget',
    });
    assert.equal(replacement.params.thenEffect.type, EFFECT_DISCARD_GAME);
    assert.equal(replacement.params.thenEffect.params.target, TARGET_THIS);

    const attachmentCard = cardsFactory.createGameCard({
        card: cardsFactory.createCard(attachmentEntry.card),
        owner: {},
    });
    const [attachmentAbility] = attachmentCard.abilities;
    assert.equal(attachmentAbility.trigger, TRIGGER_ATTACHED_DEFEAT);
    assert.equal(typeof attachmentAbility.effect.canRun, 'function');
    assert.ok(attachmentAbility.effect instanceof ChainedEffect);
    assert.ok(attachmentAbility.effect.effects[0] instanceof PreventDefeatEffect);
    assert.ok(attachmentAbility.effect.effects[1] instanceof HealEffect);
    assert.ok(attachmentAbility.effect.thenEffect instanceof DiscardFromGameEffect);
});
