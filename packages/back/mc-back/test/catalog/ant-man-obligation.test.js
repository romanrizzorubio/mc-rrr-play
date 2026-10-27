import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_OBLIGATION,
    DIALOG_DISCARD_HAND,
    EFFECT_CANNOT,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DISCARD_GAME,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_LASTING,
    EFFECT_MAY,
    EFFECT_REMOVE_CARD,
    EFFECT_SELECT_DISCARD_CARD,
    PRIORITY_CONSTANT,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_CARD,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRIGGER_INSTANT,
    TRIGGER_PLAYER_CAN_FLIP,
    TRIGGER_PLAYER_TURN_END,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PlayTurnEffect} from '../../src/effects/play-turn-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const createAntManObligation = async ({isHero = true} = {}) => {
    const {heroes} = await loadCatalog();
    const antMan = heroes.find(({_id}) => _id === 'ant-man');
    assert.ok(antMan);

    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'ant-man-obligation-test',
    });
    match.isUniqueCard = () => false;
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero({
        ...antMan.config,
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
        name: 'Scott Lang',
        superhero,
    });
    player.initPlayer();
    player.gameZone.refresh = async () => {};
    player.hand.refresh = async () => {};
    player.deck.refresh = async () => {};
    player.deck.checkCycle = async () => {};

    const obligation = superhero.obligations.find(card =>
        card.name === 'Cuidar de Cassie');
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
        obligation,
        player,
        resolver,
        matchFactory,
        scenarioDiscardPile,
        superhero,
    };
};

describe('Hombre Hormiga obligation', () => {
    test('defines and compiles Cuidar de Cassie with its printed choices', async () => {
        const {heroes} = await loadCatalog();
        const antMan = heroes.find(({_id}) => _id === 'ant-man');
        assert.ok(antMan);

        const config = antMan.config.obligation;
        assert.equal(config.count, 1);
        assert.equal(config.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(config.card.params.name, 'Cuidar de Cassie');
        assert.equal(config.card.params.set, 'Hombre Hormiga');
        assert.equal(config.card.params.image, 'heroes/ant-man/12025.png');
        assert.equal(config.card.params.boost, 2);
        assert.equal(config.card.params.giveToOwner, true);
        assert.equal(config.card.params.triggerInstant, true);

        const {
            adoption,
            obligation,
            resolver,
        } = await createAntManObligation();
        assert.equal(adoption.trigger, TRIGGER_INSTANT);
        assert.equal(adoption.effect.effectType, EFFECT_MAY);
        assert.equal(adoption.effect.effect.effectType, EFFECT_FLIP);
        assert.equal(adoption.effect.effect.target, TARGET_YOUR_SUPERHERO);
        assert.equal(adoption.effect.effect.formTarget, TARGET_ALTEREGO_SIDE);

        assert.equal(resolver.trigger, TRIGGER_INSTANT);
        assert.equal(resolver.effect.effectType, EFFECT_CHOOSE_ABILITY);
        const [exhaustOption, discardOption] = resolver.effect.options;
        assert.equal(exhaustOption.arrow.cost.effectType, EFFECT_EXHAUST);
        assert.equal(exhaustOption.arrow.cost.target, TARGET_ALTEREGO);
        assert.equal(exhaustOption.effect.effectType, EFFECT_REMOVE_CARD);
        assert.equal(exhaustOption.effect.target, TARGET_CARD);

        assert.equal(discardOption.effect.effectType, EFFECT_CHAINED);
        const [discardHand, lasting, discardObligation] =
            discardOption.effect.effects;
        assert.equal(discardHand.effectType, EFFECT_SELECT_DISCARD_CARD);
        assert.equal(discardHand.target, TARGET_YOU);
        assert.equal(discardHand.count, 1);
        assert.equal(lasting.effectType, EFFECT_LASTING);
        assert.equal(lasting.until, TRIGGER_PLAYER_TURN_END);
        assert.equal(lasting.triggerType, TRIGGER_PLAYER_CAN_FLIP);
        assert.equal(lasting.triggerTarget, TARGET_YOUR_SUPERHERO);
        assert.equal(lasting.hideDialog, true);
        assert.equal(lasting.effect.effectType, EFFECT_CANNOT);
        assert.equal(lasting.effect.restriction, 'flip');
        assert.equal(
            lasting.effect.sourceIn,
            'player.superhero.obligations'
        );
        assert.equal(discardObligation.effectType, EFFECT_DISCARD_GAME);
        assert.equal(discardObligation.target, TARGET_CARD);
        assert.ok(obligation.abilities.every(ability =>
            ability.effect &&
            typeof ability.effect.canRun === 'function'));
    });

    test('may flip Scott Lang to alter ego', async () => {
        const {
            adoption,
            match,
            obligation,
            player,
            superhero,
        } = await createAntManObligation();
        match.openDialog = async () => ({});

        await adoption.resolveAbility({
            card: obligation,
            match,
            player,
        });

        assert.equal(superhero.currentSide.isAlterEgo, true);
    });

    test('only allows exhausting Scott Lang while in alter-ego form', async () => {
        const {
            obligation,
            player,
            resolver,
            scenarioDiscardPile,
            superhero,
        } = await createAntManObligation();
        const [exhaustOption] = resolver.effect.options;

        assert.equal(await exhaustOption.canRun({card: obligation, player}), false);

        superhero.selectedSide = 0;
        assert.equal(await exhaustOption.canRun({card: obligation, player}), true);
        await exhaustOption.resolveAbility({card: obligation, player});

        assert.equal(superhero.exhausted, true);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.equal(scenarioDiscardPile.includes(obligation), false);
    });

    test('discarding a hand card prevents identity changes until the end of the next turn', async () => {
        const {
            match,
            matchFactory,
            obligation,
            player,
            resolver,
            scenarioDiscardPile,
            superhero,
        } = await createAntManObligation();
        const [discardOption] = resolver.effect.options.slice(1);
        const [handCard] = player.deck.cards.splice(0, 1);
        assert.ok(handCard);
        player.hand.addCard(handCard);

        match.openDialog = async ({dialogType, data}) => {
            assert.equal(dialogType, DIALOG_DISCARD_HAND);

            return {selected: [data.cards[0]]};
        };

        await discardOption.resolveAbility({card: obligation, player});

        assert.equal(player.hand.cards.includes(handCard), false);
        assert.equal(player.deck.discardPile.includes(handCard), true);
        assert.equal(player.gameZone.cards.includes(obligation), false);
        assert.equal(scenarioDiscardPile.includes(obligation), true);
        assert.equal(match.lasting.length, 1);
        assert.equal(superhero.currentSide.isHero, true);
        assert.equal(await player.canFlip(), false);

        const {heroes} = await loadCatalog();
        const spiderwoman = heroes.find(({_id}) => _id === 'spiderwoman');
        assert.ok(spiderwoman);
        const otherSuperhero = matchFactory.createSuperhero({
            ...spiderwoman.config,
            precon: [],
        });
        const otherPlayer = match.createPlayer({
            name: 'Jessica Drew',
            superhero: otherSuperhero,
        });
        otherPlayer.initPlayer();
        assert.equal(await otherPlayer.canFlip(), true);

        const turnEnd = new PlayTurnEffect({match});
        await turnEnd.trigger(
            PRIORITY_CONSTANT,
            [TRIGGER_PLAYER_TURN_END],
            {player}
        );

        assert.equal(match.lasting.length, 0);
        assert.equal(await player.canFlip(), true);
        assert.equal(await otherPlayer.canFlip(), true);
    });
});
