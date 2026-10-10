import assert from 'node:assert/strict';
import test from 'node:test';

import {
    CARD_TYPE_UPGRADE,
    TRAIT_BLACK_PANTHER,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

const createBlackPantherObligation = async () => {
    const {heroes} = await loadCatalog();
    const blackPanther = heroes.find(hero => hero._id === 'blackpanther');
    assert.ok(blackPanther);

    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'black-panther-obligation-test',
    });
    match.isUniqueCard = () => false;
    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero(blackPanther.config);
    const player = match.createPlayer({
        name: "T'Challa",
        superhero,
    });
    player.initPlayer();

    const obligation = superhero.obligations.find(card =>
        card.name === 'Asuntos de estado');
    assert.ok(obligation);
    obligation.owner = player;

    const upgradeConfig = blackPanther.config.cards.find(({card}) =>
        card.type === CARD_TYPE_UPGRADE &&
        card.params.traits?.includes(TRAIT_BLACK_PANTHER)).card;

    return {
        matchFactory,
        obligation,
        player,
        upgradeConfig,
    };
};

const getDiscardUpgradeOption = obligation =>
    obligation.abilities
        .find(ability => ability.name === 'Resolver la obligación')
        .effect.options
        .find(option => option.name.startsWith('Descartar una Mejora'));

test('Black Panther obligation discards an in-play Black Panther upgrade', async () => {
    const {matchFactory, obligation, player, upgradeConfig} =
        await createBlackPantherObligation();
    const inPlayUpgrade =
        matchFactory.cardsFactory.createGameCardFromConfig(upgradeConfig);
    inPlayUpgrade.owner = player;
    player.addToGameZone(inPlayUpgrade);

    const handUpgrade =
        matchFactory.cardsFactory.createGameCardFromConfig(upgradeConfig);
    handUpgrade.owner = player;
    player.hand.addCard(handUpgrade);

    let obligationDiscarded = false;
    obligation.discard = async () => {
        obligationDiscarded = true;
    };

    const option = getDiscardUpgradeOption(obligation);
    assert.ok(option.effect instanceof ChainedEffect);
    assert.equal(option.effect.thenEffect, undefined);

    await option.resolveAbility({
        card: obligation,
        player,
    });

    assert.equal(obligationDiscarded, true);
    assert.equal(player.gameZone.cards.includes(inPlayUpgrade), false);
    assert.equal(player.deck.discardPile.includes(inPlayUpgrade), true);
    assert.equal(player.hand.cards.includes(handUpgrade), true);
});

test('the obligation option does not discard an ineligible upgrade or a card from hand', async () => {
    const {matchFactory, obligation, player, upgradeConfig} =
        await createBlackPantherObligation();
    const unrelatedUpgrade = matchFactory.cardsFactory.createGameCardFromConfig({
        ...upgradeConfig,
        params: {
            ...upgradeConfig.params,
            traits: [],
        },
    });
    unrelatedUpgrade.owner = player;
    player.addToGameZone(unrelatedUpgrade);

    const handUpgrade =
        matchFactory.cardsFactory.createGameCardFromConfig(upgradeConfig);
    handUpgrade.owner = player;
    player.hand.addCard(handUpgrade);

    const option = getDiscardUpgradeOption(obligation);
    let obligationDiscarded = false;
    obligation.discard = async () => {
        obligationDiscarded = true;
    };

    assert.equal(option.arrow, undefined);
    assert.ok(option.effect instanceof ChainedEffect);
    assert.equal(option.effect.thenEffect, undefined);

    await option.resolveAbility({
        card: obligation,
        player,
    });

    assert.equal(obligationDiscarded, true);
    assert.equal(player.gameZone.cards.includes(unrelatedUpgrade), true);
    assert.equal(player.hand.cards.includes(handUpgrade), true);
});
