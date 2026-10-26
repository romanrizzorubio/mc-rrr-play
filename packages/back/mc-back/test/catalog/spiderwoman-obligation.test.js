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
    EFFECT_PLACE_THREAT,
    EFFECT_REMOVE_CARD,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_CARD,
    TARGET_MAIN_SCHEME,
    TARGET_YOUR_SUPERHERO,
    TRIGGER_INSTANT,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const createSpiderwomanObligation = async ({isHero = false} = {}) => {
    const {heroes} = await loadCatalog();
    const spiderwoman = heroes.find(({_id}) => _id === 'spiderwoman');
    assert.ok(spiderwoman);

    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'spiderwoman-obligation-test',
    });
    match.isUniqueCard = () => false;
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero({
        ...spiderwoman.config,
        precon: [],
    });
    superhero.selectedSide = isHero ? 1 : 0;

    const scenarioDiscardPile = [];
    const mainScheme = {
        isMainScheme: true,
        threat: 0,
        value: 100,
        placeThreat(threat) {
            this.threat += threat;
        },
        refresh() {},
    };
    match.scenario = {
        mainScheme,
        deck: {
            discardPile: scenarioDiscardPile,
            async discard(card) {
                scenarioDiscardPile.push(card);
            },
            async refresh() {},
        },
        async completeMainScheme() {
            assert.fail('The main scheme should remain below its threshold.');
        },
    };

    const player = match.createPlayer({
        name: 'Jessica Drew',
        superhero,
    });
    player.initPlayer();
    player.gameZone.refresh = async () => {};
    player.deck.refresh = async () => {};
    player.deck.checkCycle = async () => {};

    const obligation = superhero.obligations.find(card =>
        card.name === 'Lealtad dudosa');
    assert.ok(obligation);
    obligation.owner = player;
    player.addToGameZone(obligation);

    const resolver = obligation.abilities.find(ability =>
        ability.name === 'Resolver la obligación');
    assert.ok(resolver);

    return {
        mainScheme,
        obligation,
        player,
        resolver,
        scenarioDiscardPile,
        superhero,
    };
};

describe('Spiderwoman obligation', () => {
    test('defines and compiles Lealtad dudosa with its printed instant choices', async () => {
        const {heroes} = await loadCatalog();
        const spiderwoman = heroes.find(({_id}) => _id === 'spiderwoman');
        assert.ok(spiderwoman);

        const obligationConfig = spiderwoman.config.obligation;
        assert.equal(obligationConfig.count, 1);
        assert.equal(obligationConfig.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(obligationConfig.card.params.name, 'Lealtad dudosa');
        assert.equal(obligationConfig.card.params.set, 'Spiderwoman');
        assert.equal(
            obligationConfig.card.params.image,
            'heroes/spiderwoman/04053.png',
        );
        assert.equal(obligationConfig.card.params.boost, 2);
        assert.equal(obligationConfig.card.params.giveToOwner, true);
        assert.equal(obligationConfig.card.params.triggerInstant, true);

        const {obligation, resolver} = await createSpiderwomanObligation();
        const adoption = obligation.abilities.find(ability =>
            ability.name === 'Adoptar la identidad de alter ego');
        assert.ok(adoption);
        assert.equal(adoption.trigger, TRIGGER_INSTANT);
        assert.equal(adoption.effect.effectType, EFFECT_MAY);
        assert.equal(adoption.effect.effect.effectType, EFFECT_FLIP);
        assert.equal(adoption.effect.effect.target, TARGET_YOUR_SUPERHERO);
        assert.equal(adoption.effect.effect.formTarget, TARGET_ALTEREGO_SIDE);

        assert.equal(resolver.trigger, TRIGGER_INSTANT);
        assert.equal(resolver.effect.effectType, EFFECT_CHOOSE_ABILITY);
        const [exhaustOption, threatOption] = resolver.effect.options;
        assert.equal(exhaustOption.arrow.cost.effectType, EFFECT_EXHAUST);
        assert.equal(exhaustOption.arrow.cost.target, TARGET_ALTEREGO);
        assert.equal(exhaustOption.effect.effectType, EFFECT_REMOVE_CARD);
        assert.equal(exhaustOption.effect.target, TARGET_CARD);

        assert.equal(threatOption.effect.effectType, EFFECT_CHAINED);
        const [placeThreat, discardObligation] = threatOption.effect.effects;
        assert.equal(placeThreat.effectType, EFFECT_PLACE_THREAT);
        assert.equal(placeThreat.target, TARGET_MAIN_SCHEME);
        assert.equal(placeThreat.threat, 3);
        assert.equal(discardObligation.effectType, EFFECT_DISCARD_GAME);
        assert.equal(discardObligation.target, TARGET_CARD);

        for (const ability of obligation.abilities) {
            assert.ok(ability.effect);
            assert.equal(typeof ability.effect.canRun, 'function');
        }
    });

    test('only allows exhausting Jessica Drew while in alter-ego form', async () => {
        const {
            obligation,
            player,
            resolver,
            superhero,
        } = await createSpiderwomanObligation({isHero: true});
        const [exhaustOption, threatOption] = resolver.effect.options;

        assert.equal(await exhaustOption.canRun({card: obligation, player}), false);
        assert.equal(await threatOption.canRun({card: obligation, player}), true);

        superhero.selectedSide = 0;
        assert.equal(await exhaustOption.canRun({card: obligation, player}), true);
    });

    test('exhausting Jessica Drew removes Lealtad dudosa from the game', async () => {
        const {
            obligation,
            player,
            resolver,
            scenarioDiscardPile,
            superhero,
        } = await createSpiderwomanObligation();
        const [exhaustOption] = resolver.effect.options;

        await exhaustOption.resolveAbility({card: obligation, player});

        assert.equal(superhero.exhausted, true);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.equal(scenarioDiscardPile.includes(obligation), false);
    });

    test('placing threat on the main scheme then discards Lealtad dudosa', async () => {
        const {
            mainScheme,
            obligation,
            player,
            resolver,
            scenarioDiscardPile,
        } = await createSpiderwomanObligation();
        const [, threatOption] = resolver.effect.options;

        await threatOption.resolveAbility({card: obligation, player});

        assert.equal(mainScheme.threat, 3);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.equal(scenarioDiscardPile.includes(obligation), true);
    });
});
