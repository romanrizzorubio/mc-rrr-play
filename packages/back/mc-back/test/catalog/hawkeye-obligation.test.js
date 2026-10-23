import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_OBLIGATION,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_MAY,
    EFFECT_REMOVE_CARD,
    TARGET_ALTEREGO,
    TARGET_CARD,
    TARGET_UPGRADE_YOU_CONTROL,
    TRIGGER_INSTANT,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const createHawkeyeObligation = async ({isHero = true} = {}) => {
    const {heroes} = await loadCatalog();
    const hawkeye = heroes.find(({_id}) => _id === 'hawkeye');
    assert.ok(hawkeye);

    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'hawkeye-obligation-test',
    });
    match.isUniqueCard = () => false;
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero({
        ...hawkeye.config,
        precon: [],
    });
    superhero.selectedSide = isHero ? 1 : 0;

    const player = match.createPlayer({
        name: 'Clint Barton',
        superhero,
    });
    player.initPlayer();

    const scenarioDiscardPile = [];
    match.scenario = {
        deck: {
            discardPile: scenarioDiscardPile,
            async discard(card) {
                scenarioDiscardPile.push(card);
            },
            async refresh() {},
        },
    };
    player.gameZone.refresh = async () => {};
    player.deck.refresh = async () => {};
    player.deck.checkCycle = async () => {};

    const obligation = superhero.obligations.find(card =>
        card.name === 'Pasado criminal');
    assert.ok(obligation);
    obligation.owner = player;
    player.addToGameZone(obligation);

    const resolver = obligation.abilities.find(ability =>
        ability.name === 'Resolver la obligación');
    assert.ok(resolver);

    return {
        hawkeye,
        matchFactory,
        obligation,
        player,
        resolver,
        scenarioDiscardPile,
        superhero,
    };
};

describe('Hawkeye obligation', () => {
    test('defines and compiles Pasado criminal with its printed instant choices', async () => {
        const {heroes} = await loadCatalog();
        const hawkeye = heroes.find(({_id}) => _id === 'hawkeye');
        assert.ok(hawkeye);

        const obligationConfig = hawkeye.config.obligation;
        assert.equal(obligationConfig.count, 1);
        assert.equal(obligationConfig.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(obligationConfig.card.params.name, 'Pasado criminal');
        assert.equal(
            obligationConfig.card.params.image,
            'heroes/hawkeye/04026.png'
        );
        assert.equal(obligationConfig.card.params.boost, 2);
        assert.equal(obligationConfig.card.params.giveToOwner, true);
        assert.equal(obligationConfig.card.params.triggerInstant, true);

        const {obligation, resolver} = await createHawkeyeObligation();
        const adoption = obligation.abilities.find(ability =>
            ability.name === 'Adoptar la identidad de alter ego');
        assert.ok(adoption);
        assert.equal(adoption.trigger, TRIGGER_INSTANT);
        assert.equal(adoption.effect.effectType, EFFECT_MAY);
        assert.equal(adoption.effect.effect.effectType, EFFECT_FLIP);

        assert.equal(resolver.effect.effectType, EFFECT_CHOOSE_ABILITY);
        const [exhaustOption, discardOption] = resolver.effect.options;
        assert.equal(exhaustOption.arrow.cost.effectType, EFFECT_EXHAUST);
        assert.equal(exhaustOption.arrow.cost.target, TARGET_ALTEREGO);
        assert.equal(exhaustOption.effect.effectType, EFFECT_REMOVE_CARD);
        assert.equal(exhaustOption.effect.target, TARGET_CARD);

        assert.equal(discardOption.effect.effectType, EFFECT_CHAINED);
        assert.equal(
            discardOption.effect.effects[0].effectType,
            EFFECT_DISCARD_GAME
        );
        assert.equal(
            discardOption.effect.effects[0].target,
            TARGET_UPGRADE_YOU_CONTROL
        );
        assert.deepEqual(discardOption.effect.effects[0].condition, {
            name: 'Arco de Ojo de Halcón',
        });
        assert.equal(
            discardOption.effect.effects[1].effectType,
            EFFECT_DISCARD_GAME
        );
        assert.equal(discardOption.effect.effects[1].target, TARGET_CARD);

        for (const ability of obligation.abilities) {
            assert.ok(ability.effect);
            assert.equal(typeof ability.effect.canRun, 'function');
        }
    });

    test("keeps the obligation-discard option available when Hawkeye's Bow is absent", async () => {
        const {
            obligation,
            player,
            resolver,
        } = await createHawkeyeObligation();
        const [exhaustOption, discardOption] = resolver.effect.options;

        assert.equal(await exhaustOption.canRun({card: obligation, player}), false);
        assert.equal(await discardOption.canRun({card: obligation, player}), true);

        player.superhero.selectedSide = 0;
        assert.equal(await exhaustOption.canRun({card: obligation, player}), true);
    });

    test('discards the obligation when the Bow sentence cannot resolve', async () => {
        const {
            obligation,
            player,
            resolver,
            scenarioDiscardPile,
        } = await createHawkeyeObligation();
        const discardOption = resolver.effect.options[1];

        await discardOption.resolveAbility({card: obligation, player});

        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.equal(scenarioDiscardPile.includes(obligation), true);
    });

    test('exhausting Clint Barton removes the obligation from the game', async () => {
        const {
            obligation,
            player,
            resolver,
            scenarioDiscardPile,
            superhero,
        } = await createHawkeyeObligation({isHero: false});
        const exhaustOption = resolver.effect.options[0];

        await exhaustOption.resolveAbility({card: obligation, player});

        assert.equal(superhero.exhausted, true);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.equal(scenarioDiscardPile.includes(obligation), false);
    });

    test("discarding Hawkeye's Bow discards the obligation after the Bow", async () => {
        const {
            hawkeye,
            matchFactory,
            obligation,
            player,
            resolver,
            scenarioDiscardPile,
        } = await createHawkeyeObligation();
        const bowConfig = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Arco de Ojo de Halcón').card;
        const bow = matchFactory.cardsFactory.createGameCardFromConfig(bowConfig);
        bow.owner = player;
        player.addToGameZone(bow);

        const discardOption = resolver.effect.options[1];
        await discardOption.resolveAbility({card: obligation, player});

        assert.equal(player.gameZone.cards.includes(bow), false);
        assert.equal(player.deck.discardPile.includes(bow), true);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.equal(scenarioDiscardPile.includes(obligation), true);
    });
});
