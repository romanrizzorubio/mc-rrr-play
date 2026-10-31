import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SUPPORT,
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_HERO,
    DIALOG_DISCARD_HAND,
    EFFECT_CANNOT,
    EFFECT_DISCARD_GAME,
    EFFECT_SELECT_DISCARD_CARD,
    TARGET_THIS,
    TARGET_YOU,
    TRAIT_TEMPORAL,
    TRIGGER_PLAYER_CAN_PLAY,
} from 'mc-shared';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {getAbilitiesWithAvailability} from '../../src/utils/ability-availability.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';

const createGame = async () => {
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'kang-no-powers-test',
    });
    match.openDialog = async () => ({});
    match.persist = async () => {};
    match.refresh = async () => {};

    const factory = new MatchFactory(match);
    const players = [0, 1].map(index => {
        const superhero = factory.createSuperhero({
            ...blackPanther.config,
            cards: [],
            precon: [],
            nemesis: [],
            obligation: undefined,
        });
        superhero.selectedSide = 0;
        const player = match.createPlayer({
            name: `Jugador ${index + 1}`,
            superhero,
            initial: index === 0,
        });
        player.initPlayer();

        return player;
    });
    const scenarioConfig = structuredClone(kang.config);
    scenarioConfig.sets = [];
    scenarioConfig.defaultSets = [];
    const scenario = await factory.createScenario(scenarioConfig);
    match.addScenario(scenario);
    await scenario.initScenario([], false);

    const obligation = scenario.deck.cards.find(card =>
        card.name === 'Sin poderes');
    assert.ok(obligation);
    await new RevealEncounterEffect({
        card: obligation,
        player: players[0],
        match,
    }).runEffect({player: players[0]});

    return {factory, match, obligation, players, scenario};
};

const createSupport = (factory, owner, name, classification) =>
    factory.cardsFactory.createGameCardFromConfig({
        type: CARD_TYPE_SUPPORT,
        params: {
            name,
            set: 'test',
            cost: 0,
            ...(classification ? {classification} : {}),
        },
    }, {owner});

describe('Sin poderes', () => {
    test('is a scenario Obligation with a Temporal trait, not the Temporary keyword', async () => {
        const entry = kang.config.cards.find(({card}) =>
            card.params.name === 'Sin poderes');
        assert.equal(entry.count, 2);
        assert.equal(entry.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(entry.card.params.set, 'kang');
        assert.equal(entry.card.params.image, 'scenarios/kang/11020.png');
        assert.deepEqual(entry.card.params.traits, [TRAIT_TEMPORAL]);
        assert.equal(entry.card.params.keywords, undefined);
        assert.equal(entry.card.params.boost, 2);

        const images = kang.config.cards.map(({card}) => card.params.image);
        assert.deepEqual(images, images.toSorted());

        const {obligation} = await createGame();
        assert.equal(obligation.controller.name, 'Jugador 1');
        assert.equal(obligation.abilities.length, 2);
        assert.ok(obligation.abilities.every(ability =>
            ability.effect &&
            typeof ability.effect.canRun === 'function'));

        const restriction = obligation.abilities.find(ability =>
            ability.trigger === TRIGGER_PLAYER_CAN_PLAY);
        assert.ok(restriction);
        assert.equal(restriction.effect.effectType, EFFECT_CANNOT);
        assert.equal(restriction.effect.restriction, 'play');
        assert.equal(restriction.effect.sourceIn, 'player.gameZone.cards');
        assert.deepEqual(restriction.effect.targetCondition, {
            'card.classification': CLASSIFICATION_HERO,
        });
    });

    test('prohibits playing hero-specific cards only for its holder', async () => {
        const {factory, match, obligation, players} = await createGame();
        const [holder, otherPlayer] = players;
        const heroCard = createSupport(
            factory,
            holder,
            'Mejora específica de prueba',
            [CLASSIFICATION_HERO, CLASSIFICATION_AGGRESSION]
        );
        const regularCard = createSupport(
            factory,
            holder,
            'Apoyo básico de prueba'
        );
        const otherHeroCard = createSupport(
            factory,
            otherPlayer,
            'Mejora específica de otro jugador',
            CLASSIFICATION_HERO
        );
        const energyDaggersConfig = blackPanther.config.cards.find(({card}) =>
            card.params.name === 'Dagas de energía').card;
        const energyDaggers = factory.cardsFactory.createGameCardFromConfig(
            energyDaggersConfig,
            {owner: holder}
        );
        assert.ok(blackPanther.config.cards.every(({card}) =>
            card.params.classification === CLASSIFICATION_HERO));
        holder.hand.cards = [heroCard, regularCard, energyDaggers];
        otherPlayer.hand.cards = [otherHeroCard];
        match.currentTurnPlayer = holder;
        match.phase = 'players';

        assert.ok(holder.gameZone.cards.includes(obligation));
        assert.ok(!otherPlayer.gameZone.cards.includes(obligation));
        assert.equal(
            await new PlayCardEffect({
                abilityType: ABILITY_ACTION,
                card: heroCard,
                match,
            }).canRun({player: holder}),
            false
        );
        assert.equal(
            await new PlayCardEffect({
                ability: {type: ABILITY_ACTION},
                card: heroCard,
                match,
            }).canRun({player: holder}),
            false
        );
        assert.equal(energyDaggers.card.classification, CLASSIFICATION_HERO);
        assert.equal(
            await new PlayCardEffect({
                abilityType: ABILITY_ACTION,
                card: energyDaggers,
                match,
            }).canRun({player: holder}),
            false
        );
        assert.equal(
            await new PlayCardEffect({
                abilityType: ABILITY_ACTION,
                card: regularCard,
                match,
            }).canRun({player: holder}),
            true
        );
        assert.equal(
            await new PlayCardEffect({
                abilityType: ABILITY_ACTION,
                card: otherHeroCard,
                match,
            }).canRun({player: otherPlayer}),
            true
        );

        const serializedHand = await holder.hand.toObjWithPlayability();
        assert.equal(
            serializedHand.find(card => card.id === heroCard.id).playable,
            false
        );
        assert.equal(
            serializedHand.find(card => card.id === regularCard.id).playable,
            true
        );
        assert.equal(
            serializedHand.find(card => card.id === energyDaggers.id).playable,
            false
        );

        const putIntoPlayCard = createSupport(
            factory,
            holder,
            'Carta específica puesta en juego',
            CLASSIFICATION_HERO
        );
        await new PutPlayEffect({
            card: putIntoPlayCard,
            controller: holder,
            match,
            target: TARGET_YOU,
        }).runEffect({player: holder});
        assert.ok(holder.gameZone.cards.includes(putIntoPlayCard));
    });

    test('only its holder can discard it, using the holder hand after a stale target', async () => {
        const {factory, match, obligation, players, scenario} = await createGame();
        const [holder, otherPlayer] = players;
        const holderHeroCard = createSupport(
            factory,
            holder,
            'Carta de Héroe del jugador con la Obligación',
            CLASSIFICATION_HERO
        );
        const otherHeroCard = createSupport(
            factory,
            otherPlayer,
            'Carta de Héroe del otro jugador',
            CLASSIFICATION_HERO
        );
        holder.hand.cards = [holderHeroCard];
        otherPlayer.hand.cards = [otherHeroCard];
        holder.deck.cards.push(createSupport(
            factory,
            holder,
            'Carta que permanece en el mazo del titular'
        ));
        match.currentTurnPlayer = holder;
        match.phase = 'players';

        assert.ok(holder.gameZone.cards.includes(obligation));
        assert.equal(obligation.controller, holder);
        const action = obligation.abilities.find(ability => ability.isAction);
        assert.ok(action);
        const actionIndex = obligation.abilities.indexOf(action);

        action.arrow.cost.selectedTarget = otherPlayer;
        const otherAvailability =
            await getAbilitiesWithAvailability(obligation, otherPlayer);
        assert.equal(
            otherAvailability.find(ability => ability.isAction).disable,
            true
        );

        await assert.rejects(
            otherPlayer.resolveAbility(obligation.id, actionIndex),
            error => error.statusCode === 403
        );
        await action.resolveAbility({
            card: obligation,
            match,
            player: otherPlayer,
        });
        assert.ok(holder.gameZone.cards.includes(obligation));
        assert.ok(holder.hand.cards.includes(holderHeroCard));
        assert.ok(otherPlayer.hand.cards.includes(otherHeroCard));

        const holderAvailability =
            await getAbilitiesWithAvailability(obligation, holder);
        assert.equal(
            holderAvailability.find(ability => ability.isAction).disable,
            false
        );

        match.openDialog = async ({dialogType, targetPlayer, data}) => {
            assert.equal(dialogType, DIALOG_DISCARD_HAND);
            assert.equal(targetPlayer, holder);
            assert.deepEqual(data.cards.map(card => card.id), [holderHeroCard.id]);

            return {selected: [{id: holderHeroCard.id}]};
        };
        await action.resolveAbility({card: obligation, match, player: holder});

        assert.ok(!holder.hand.cards.includes(holderHeroCard));
        assert.ok(holder.deck.discardPile.includes(holderHeroCard));
        assert.ok(otherPlayer.hand.cards.includes(otherHeroCard));
        assert.ok(!holder.gameZone.cards.includes(obligation));
        assert.ok(scenario.deck.discardPile.includes(obligation));
    });

    test('discards a hero-specific hand card as the Alter-Ego action cost', async () => {
        const {factory, match, obligation, players, scenario} = await createGame();
        const [player] = players;
        const heroCard = createSupport(
            factory,
            player,
            'Carta específica que se descarta',
            CLASSIFICATION_HERO
        );
        player.deck.cards.push(createSupport(
            factory,
            player,
            'Carta que permanece en el mazo'
        ));
        const regularCard = createSupport(
            factory,
            player,
            'Carta no específica que permanece'
        );
        player.hand.cards = [regularCard, heroCard];
        const action = obligation.abilities.find(ability => ability.isAction);
        assert.ok(action);
        assert.equal(action.arrow.cost.effectType, EFFECT_SELECT_DISCARD_CARD);
        assert.deepEqual(action.arrow.cost.cardFilter, {
            'card.classification': CLASSIFICATION_HERO,
        });
        assert.deepEqual(
            action.arrow.cost.getEligibleCards(player),
            [heroCard]
        );
        assert.equal(action.effect.effectType, EFFECT_DISCARD_GAME);
        assert.equal(action.effect.target, TARGET_THIS);

        match.openDialog = async ({dialogType, data}) => {
            assert.equal(dialogType, DIALOG_DISCARD_HAND);
            assert.deepEqual(data.cards.map(card => card.id), [heroCard.id]);

            return {selected: [{id: heroCard.id}]};
        };
        await action.resolveAbility({card: obligation, match, player});

        assert.ok(!player.hand.cards.includes(heroCard));
        assert.ok(player.deck.discardPile.includes(heroCard));
        assert.ok(player.hand.cards.includes(regularCard));
        assert.ok(!player.gameZone.cards.includes(obligation));
        assert.ok(scenario.deck.discardPile.includes(obligation));

        const playableAfterDiscard = createSupport(
            factory,
            player,
            'Carta específica después de descartar la Obligación',
            CLASSIFICATION_HERO
        );
        player.hand.cards.push(playableAfterDiscard);
        assert.equal(
            await new PlayCardEffect({
                abilityType: ABILITY_ACTION,
                card: playableAfterDiscard,
                match,
            }).canRun({player}),
            true
        );
    });
});
