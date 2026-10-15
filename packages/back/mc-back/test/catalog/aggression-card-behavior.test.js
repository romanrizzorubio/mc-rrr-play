import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    EFFECT_DISCARD_GAME,
    EFFECT_READY,
    EFFECT_SIMULTANEOUS,
    EFFECT_TAKE_DAMAGE,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    RESOURCE_ENERGY,
    TARGET_YOUR_HERO,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

const createPlayer = (name, match, matchFactory, heroConfig) => {
    const superhero = matchFactory.createSuperhero(heroConfig);
    const player = match.createPlayer({name, superhero});
    player.gameZone = new PlayerZone({owner: player});
    player.gameZone.refresh = async () => {};
    superhero.refresh = async () => {};
    superhero.sides.forEach(side => {
        side.refresh = async () => {};
    });

    return player;
};

const createMatch = name => {
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name,
    });
    const matchFactory = new MatchFactory(match);

    return {match, matchFactory};
};

test('Valkyrie payment automatically prefers energy for its enter-play ability', async () => {
    const catalog = await loadCatalog();
    const valkyrieConfig = catalog.aspects.find(({_id}) =>
        _id === 'aggression-valquiria');
    const thor = catalog.heroes.find(({_id}) => _id === 'thor');
    const {match, matchFactory} = createMatch('valkyrie-energy-payment');
    const player = createPlayer('Thor', match, matchFactory, thor.config);
    const valkyrie = matchFactory.cardsFactory.createGameCardFromConfig(
        valkyrieConfig.card,
        {owner: player}
    );
    const playCardEffect = new PlayCardEffect({
        card: valkyrie,
        match,
    });
    let paymentDialog;
    player.getCardsToPay = async () => ({
        generators: [],
        hand: [],
    });
    playCardEffect.getCost = async () => 1;
    playCardEffect.openDialog = async options => {
        paymentDialog = options;

        return {
            paid: {
                generators: [],
                hand: [],
            },
            resources: [RESOURCE_ENERGY],
        };
    };

    await playCardEffect.payCost({player});

    assert.deepEqual(
        paymentDialog.data.resourcePreferences,
        [RESOURCE_ENERGY]
    );
});

test('Hercules cost reduction works from hand, deck and discard', async () => {
    const catalog = await loadCatalog();
    const herculesConfig = catalog.aspects.find(({_id}) =>
        _id === 'aggression-hercules');
    const thor = catalog.heroes.find(({_id}) => _id === 'thor');
    const {match, matchFactory} = createMatch('hercules-hand-cost');
    const player = createPlayer('Thor', match, matchFactory, thor.config);
    const hercules = matchFactory.cardsFactory.createGameCardFromConfig(
        herculesConfig.card,
        {owner: player}
    );
    player.hand.addCard(hercules);
    player.minions.push({id: 'minion-1'}, {id: 'minion-2'});

    assert.equal(hercules.isInPlay, false);
    assert.equal(
        hercules.abilities.some(ability => ability.workInHand),
        true
    );

    const playCardEffect = new PlayCardEffect({
        card: hercules,
        match,
    });
    await playCardEffect.triggerInit(
        playCardEffect.getTriggersParams({match, player})
    );

    assert.equal(playCardEffect.modifyCost, -2);
    assert.equal(
        (await playCardEffect.getResourceCost({match, player})).amount,
        4
    );

    player.hand.discardHand(hercules);
    assert.equal(match.triggerCards[hercules.id], undefined);

    player.deck = {
        cards: [],
        discardPile: [],
        async refresh() {},
    };
    for (const place of [PLACE_DECK, PLACE_DISCARD_PILE]) {
        hercules.card.playFrom = [place];
        const sourceCards = place === PLACE_DECK ?
            player.deck.cards :
            player.deck.discardPile;
        sourceCards.push(hercules);

        const playFromPlaceEffect = new PlayCardEffect({
            card: hercules,
            match,
        });
        await playFromPlaceEffect.prepare({match, player});
        assert.equal(sourceCards.includes(hercules), false);

        await playFromPlaceEffect.triggerInit(
            playFromPlaceEffect.getTriggersParams({match, player})
        );
        assert.equal(playFromPlaceEffect.modifyCost, -2);
        assert.equal(
            (await playFromPlaceEffect.getResourceCost({match, player})).amount,
            4
        );

        await playFromPlaceEffect.returnToSource(player);
        assert.deepEqual(sourceCards, [hercules]);
        assert.equal(match.triggerCards[hercules.id], undefined);
        sourceCards.pop();
    }
});

test('Combat Fury pays damage and self-discard as arrow costs before readying the hero', async () => {
    const catalog = await loadCatalog();
    const combatFuryConfig = catalog.aspects.find(({_id}) =>
        _id === 'aggression-furia-de-combate');
    const thor = catalog.heroes.find(({_id}) => _id === 'thor');
    const abilityConfig = combatFuryConfig.card.params.abilities[0].params;
    assert.equal(abilityConfig.arrow.type, EFFECT_SIMULTANEOUS);
    assert.deepEqual(
        abilityConfig.arrow.params.effects.map(({type}) => type),
        [EFFECT_TAKE_DAMAGE, EFFECT_DISCARD_GAME]
    );
    assert.equal(abilityConfig.effect.type, EFFECT_READY);
    assert.equal(abilityConfig.effect.params.target, TARGET_YOUR_HERO);

    const {match, matchFactory} = createMatch('combat-fury-self-discard');
    const player = createPlayer('Thor', match, matchFactory, thor.config);
    const hero = player.superhero;
    hero.selectedSide = 1;
    hero.exhaust();

    const discardPile = [];
    player.deck = {
        discardPile,
        async discard(card) {
            discardPile.push(card);
        },
        async refresh() {},
    };

    const combatFury = matchFactory.cardsFactory.createGameCardFromConfig(
        combatFuryConfig.card,
        {owner: player}
    );
    combatFury.controller = player;
    player.gameZone.addToGameZone(combatFury);

    const ability = combatFury.abilities[0];
    await ability.resolveAbility({
        match,
        player,
        card: combatFury,
        effect: {
            selectedTarget: {
                isMinion: true,
            },
        },
    });

    assert.equal(ability.resolved, true);
    assert.equal(hero.damage, 1);
    assert.equal(hero.exhausted, false);
    assert.equal(player.gameZone.cards.includes(combatFury), false);
    assert.deepEqual(discardPile, [combatFury]);
});
