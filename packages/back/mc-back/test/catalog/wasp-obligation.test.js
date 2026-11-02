import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    DIALOG_DISCARD_ORDER,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DISCARD_CONDITION_HAND,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_MAY,
    EFFECT_REMOVE_CARD,
    EFFECT_SIMULTANEOUS,
    EFFECT_TAKE_DAMAGE,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_CARD,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRIGGER_INSTANT,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const createWaspObligation = async ({isHero = true} = {}) => {
    const {heroes} = await loadCatalog();
    const wasp = heroes.find(({_id}) => _id === 'wasp');
    assert.ok(wasp);

    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'wasp-obligation-test',
    });
    match.isUniqueCard = () => false;
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero({
        ...wasp.config,
        precon: [],
    });
    superhero.selectedSide = isHero ? 1 : 0;

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

    const player = match.createPlayer({
        name: 'Nadia Van Dyne',
        superhero,
    });
    player.initPlayer();
    player.gameZone.refresh = async () => {};
    player.hand.refresh = async () => {};
    player.deck.refresh = async () => {};
    player.deck.checkCycle = async () => {};

    const obligation = superhero.obligations.find(card =>
        card.name === 'Sueños rojos');
    assert.ok(obligation);
    obligation.owner = player;
    player.addToGameZone(obligation);

    const adoption = obligation.abilities.find(ability =>
        ability.name === 'Adoptar la identidad de alter ego');
    const resolver = obligation.abilities.find(ability =>
        ability.name === 'Resolver la obligación');
    assert.ok(adoption);
    assert.ok(resolver);

    return {
        adoption,
        match,
        matchFactory,
        obligation,
        player,
        resolver,
        scenarioDiscardPile,
        superhero,
    };
};

describe('Avispa obligation', () => {
    test('defines and compiles Sueños rojos with its printed choices', async () => {
        const {heroes} = await loadCatalog();
        const wasp = heroes.find(({_id}) => _id === 'wasp');
        const config = wasp.config.obligation;

        assert.equal(config.count, 1);
        assert.equal(config.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(config.card.params.name, 'Sueños rojos');
        assert.equal(config.card.params.set, 'Avispa');
        assert.equal(config.card.params.image, 'heroes/wasp/13026.png');
        assert.equal(config.card.params.boost, 2);
        assert.equal(config.card.params.giveToOwner, true);
        assert.equal(config.card.params.triggerInstant, true);

        const {adoption, obligation, resolver} = await createWaspObligation();
        assert.equal(adoption.trigger, TRIGGER_INSTANT);
        assert.equal(adoption.effect.effectType, EFFECT_MAY);
        assert.equal(adoption.effect.effect.effectType, EFFECT_FLIP);
        assert.equal(adoption.effect.effect.formTarget, TARGET_ALTEREGO_SIDE);

        assert.equal(resolver.trigger, TRIGGER_INSTANT);
        assert.equal(resolver.effect.effectType, EFFECT_CHOOSE_ABILITY);
        const [exhaustOption, discardOption] = resolver.effect.options;
        assert.equal(exhaustOption.arrow.cost.effectType, EFFECT_EXHAUST);
        assert.equal(exhaustOption.arrow.cost.target, TARGET_ALTEREGO);
        assert.equal(exhaustOption.effect.effectType, EFFECT_REMOVE_CARD);
        assert.equal(exhaustOption.effect.target, TARGET_CARD);

        assert.equal(discardOption.effect.effectType, EFFECT_CHAINED);
        const [simultaneous, discardObligation] =
            discardOption.effect.effects;
        assert.equal(simultaneous.effectType, EFFECT_SIMULTANEOUS);
        const [discardHand, takeDamage] = simultaneous.effects;
        assert.equal(discardHand.effectType, EFFECT_DISCARD_CONDITION_HAND);
        assert.equal(discardHand.target, TARGET_YOU);
        assert.deepEqual(discardHand.condition, {
            resources: RESOURCE_MENTAL,
        });
        assert.equal(takeDamage.effectType, EFFECT_TAKE_DAMAGE);
        assert.equal(takeDamage.target, TARGET_YOUR_SUPERHERO);
        assert.equal(takeDamage.damage, 1);
        assert.equal(discardObligation.effectType, EFFECT_DISCARD_GAME);
        assert.equal(discardObligation.target, TARGET_CARD);
        assert.ok(obligation.abilities.every(ability =>
            ability.effect &&
            typeof ability.effect.canRun === 'function'));
    });

    test('may flip Nadia Van Dyne to alter ego', async () => {
        const {adoption, match, obligation, player, superhero} =
            await createWaspObligation();
        match.openDialog = async () => ({});

        await adoption.resolveAbility({card: obligation, match, player});

        assert.equal(superhero.currentSide.isAlterEgo, true);
    });

    test('only allows exhausting Nadia Van Dyne in alter-ego form', async () => {
        const {
            match,
            obligation,
            player,
            resolver,
            scenarioDiscardPile,
            superhero,
        } = await createWaspObligation();
        const [exhaustOption] = resolver.effect.options;

        assert.equal(await exhaustOption.canRun({
            card: obligation,
            match,
            player,
        }), false);

        superhero.selectedSide = 0;
        assert.equal(await exhaustOption.canRun({
            card: obligation,
            match,
            player,
        }), true);
        await exhaustOption.resolveAbility({card: obligation, match, player});

        assert.equal(superhero.exhausted, true);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.equal(scenarioDiscardPile.includes(obligation), false);
    });

    test('discards all mental-resource cards, deals damage, then discards the obligation', async () => {
        const {
            match,
            matchFactory,
            obligation,
            player,
            resolver,
            scenarioDiscardPile,
            superhero,
        } = await createWaspObligation();
        const [, discardOption] = resolver.effect.options;
        const createResource = (name, resources, index) =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {name, resources},
            }, {index, owner: player});
        const mentalCards = [
            createResource('Recurso mental 1', [RESOURCE_MENTAL], 1),
            createResource(
                'Recurso mental y físico',
                [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
                2
            ),
        ];
        const physicalCard = createResource(
            'Recurso físico',
            [RESOURCE_PHYSICAL],
            3
        );
        player.hand.addCards([...mentalCards, physicalCard]);
        assert.deepEqual(
            player.hand.searchCards({resources: RESOURCE_MENTAL}),
            mentalCards
        );
        let discardOrderDialogCalled = false;
        match.openDialog = async ({dialogType, data}) => {
            assert.equal(dialogType, DIALOG_DISCARD_ORDER);
            discardOrderDialogCalled = true;

            return {selected: data.cards};
        };

        await discardOption.resolveAbility({card: obligation, match, player});

        assert.equal(discardOrderDialogCalled, true);
        assert.ok(mentalCards.every(card =>
            !player.hand.cards.includes(card) &&
            player.deck.discardPile.includes(card)));
        assert.ok(player.hand.cards.includes(physicalCard));
        assert.equal(superhero.damage, 1);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.ok(scenarioDiscardPile.includes(obligation));
    });

    test('still deals damage and discards the obligation when no mental resources are in hand', async () => {
        const {
            match,
            obligation,
            player,
            resolver,
            scenarioDiscardPile,
            superhero,
        } = await createWaspObligation();
        const [, discardOption] = resolver.effect.options;

        assert.equal(await discardOption.canRun({card: obligation, match, player}), true);
        await discardOption.resolveAbility({card: obligation, match, player});

        assert.equal(superhero.damage, 1);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.ok(scenarioDiscardPile.includes(obligation));
    });
});
