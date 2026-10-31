import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CLASSIFICATION_HERO,
    DIALOG_DISCARD_RANDOM_HAND,
    DIALOG_LIST,
    EFFECT_CANNOT,
    EFFECT_CHOOSE,
    EFFECT_DISCARD_RANDOM,
    EFFECT_FOR_EACH,
    EFFECT_PLACE_THREAT,
    RESOURCE_PHYSICAL,
    TARGET_ALL_PLAYERS,
    TARGET_THIS,
    TARGET_YOU,
    TRIGGER_PLAYER_CAN_USE_ABILITY,
} from 'mc-shared';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';

const createGame = async name => {
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name,
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
    // Keep setup from dealing the tested encounter cards under the main scheme.
    scenarioConfig.mainSchemes[0][0] = {
        ...scenarioConfig.mainSchemes[0][0],
        params: {
            ...scenarioConfig.mainSchemes[0][0].params,
            abilities: [],
        },
    };
    const scenario = await factory.createScenario(scenarioConfig);
    match.addScenario(scenario);
    await scenario.initScenario([], false);

    return {factory, match, players, scenario};
};

const createResourceCard = (factory, owner, name) =>
    factory.cardsFactory.createGameCardFromConfig({
        type: CARD_TYPE_RESOURCE,
        params: {
            name,
            set: 'test',
            resources: [RESOURCE_PHYSICAL],
        },
    }, {owner});

const createHeroCard = (factory, owner) =>
    factory.cardsFactory.createGameCardFromConfig({
        type: CARD_TYPE_SUPPORT,
        params: {
            name: 'Carta de héroe',
            set: 'test',
            classification: CLASSIFICATION_HERO,
        },
    }, {owner});

const revealCard = async (match, card, player) =>
    new RevealEncounterEffect({card, match, player}).runEffect({player});

describe('Flujo temporal corrompido', () => {
    test('is a one-copy Kang side scheme with runnable, correctly scoped abilities', async () => {
        const entry = kang.config.cards.find(({card}) =>
            card.params.name === 'Flujo temporal corrompido');
        const obligationEntry = kang.config.cards.find(({card}) =>
            card.params.name === 'Debilitado');
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(entry.card.params.set, 'kang');
        assert.equal(entry.card.params.image, 'scenarios/kang/11022.png');
        assert.equal(entry.card.params.startingThreat, 2);
        assert.equal(entry.card.params.boost, 2);
        assert.equal(obligationEntry.card.type, CARD_TYPE_OBLIGATION);

        const images = kang.config.cards.map(({card}) => card.params.image);
        assert.deepEqual(images, images.toSorted());

        const {scenario} = await createGame('kang-temporal-corruption-config');
        const card = scenario.deck.cards.find(({name}) =>
            name === 'Flujo temporal corrompido');
        assert.ok(card);
        assert.equal(card.abilities.length, 2);
        assert.ok(card.abilities.every(ability =>
            ability.effect &&
            typeof ability.effect.canRun === 'function'));

        const restriction = card.abilities.find(ability =>
            ability.trigger === TRIGGER_PLAYER_CAN_USE_ABILITY);
        assert.ok(restriction);
        assert.equal(restriction.effect.effectType, EFFECT_CANNOT);
        assert.equal(restriction.effect.restriction, ABILITY_ALTEREGO_ACTION);
        assert.equal(restriction.effect.sourceIn, undefined);
        assert.deepEqual(restriction.effect.targetCondition, {
            isObligation: true,
        });

        const whenRevealed = card.abilities.find(ability =>
            ability.isWhenRevealed);
        assert.ok(whenRevealed);
        assert.equal(whenRevealed.effect.effectType, EFFECT_FOR_EACH);
        assert.equal(whenRevealed.effect.target, TARGET_ALL_PLAYERS);
        const choose = whenRevealed.effect.createTargetEffect();
        assert.equal(choose.effectType, EFFECT_CHOOSE);
        assert.deepEqual(
            choose.options.map(option => option.effectType),
            [EFFECT_DISCARD_RANDOM, EFFECT_PLACE_THREAT]
        );
        assert.equal(choose.options[0].target, TARGET_YOU);
        assert.equal(choose.options[1].target, TARGET_THIS);
        assert.deepEqual(
            choose.options.map(option => option.title),
            [
                'Descarta 1 carta al azar de tu mano',
                'Coloca 2 de amenaza sobre esta carta',
            ]
        );
    });

    test('lets each player choose to discard one random card or add two threat', async () => {
        for (const choiceId of [0, 1]) {
            const {factory, match, players, scenario} = await createGame(
                `kang-temporal-corruption-choice-${choiceId}`
            );
            const handCards = players.map((player, index) =>
                createResourceCard(factory, player, `Recurso ${index + 1}`));
            players.forEach((player, index) => {
                player.hand.cards = [handCards[index]];
                player.deck.cards.push(
                    createResourceCard(factory, player, `Mazo ${index + 1}`)
                );
            });

            const dialogs = [];
            match.openDialog = async dialog => {
                dialogs.push(dialog);
                if (dialog.dialogType === DIALOG_LIST) {
                    return {selected: {id: choiceId}};
                }
                if (dialog.dialogType === DIALOG_DISCARD_RANDOM_HAND) {
                    return {selected: {id: dialog.data.cards[0].id}};
                }

                return {};
            };

            const card = scenario.deck.cards.find(({name}) =>
                name === 'Flujo temporal corrompido');
            await revealCard(match, card, players[0]);

            assert.equal(
                dialogs.filter(({dialogType}) =>
                    dialogType === DIALOG_LIST).length,
                2
            );
            if (choiceId === 0) {
                assert.equal(
                    dialogs.filter(({dialogType}) =>
                        dialogType === DIALOG_DISCARD_RANDOM_HAND).length,
                    2
                );
                players.forEach((player, index) => {
                    assert.equal(player.hand.cards.length, 0);
                    assert.ok(player.deck.discardPile.includes(handCards[index]));
                });
                assert.equal(card.threat, 2);
            } else {
                assert.deepEqual(players.map(player => player.hand.cards.length), [1, 1]);
                assert.equal(card.threat, 6);
            }
        }
    });

    test('only offers the discard option to a player with cards in hand', async () => {
        const {factory, match, players, scenario} = await createGame(
            'kang-temporal-corruption-empty-hand'
        );
        const discardedCard = createResourceCard(
            factory,
            players[1],
            'Carta descartada'
        );
        players[1].hand.cards = [discardedCard];
        players[1].deck.cards.push(
            createResourceCard(factory, players[1], 'Carta del mazo')
        );

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_LIST) {
                return {selected: {id: 0}};
            }
            if (dialog.dialogType === DIALOG_DISCARD_RANDOM_HAND) {
                return {selected: {id: dialog.data.cards[0].id}};
            }

            return {};
        };

        const card = scenario.deck.cards.find(({name}) =>
            name === 'Flujo temporal corrompido');
        await revealCard(match, card, players[0]);

        assert.equal(
            dialogs.filter(({dialogType}) => dialogType === DIALOG_LIST).length,
            1
        );
        assert.equal(
            dialogs.filter(({dialogType}) =>
                dialogType === DIALOG_DISCARD_RANDOM_HAND).length,
            1
        );
        assert.equal(card.threat, 4);
        assert.equal(players[0].hand.cards.length, 0);
        assert.equal(players[1].hand.cards.length, 0);
        assert.ok(players[1].deck.discardPile.includes(discardedCard));
    });

    test('prevents only Obligation Alter-Ego actions in the side scheme zone', async () => {
        const {factory, match, players, scenario} = await createGame(
            'kang-temporal-corruption-restriction'
        );
        match.openDialog = async dialog =>
            dialog.dialogType === DIALOG_LIST ?
                {selected: {id: 1}} :
                {};
        const obligationNames = ['Debilitado', 'Sin poderes'];
        const obligations = [];
        for (const [index, player] of players.entries()) {
            const obligation = scenario.deck.cards.find(({name}) =>
                name === obligationNames[index]);
            assert.ok(obligation);
            await revealCard(match, obligation, player);
            obligations.push(obligation);
            player.hand.cards = [
                index === 0 ?
                    createResourceCard(factory, player, `Coste ${player.name}`) :
                    createHeroCard(factory, player),
            ];
            player.deck.cards.push(
                createResourceCard(factory, player, `Mazo ${player.name}`)
            );
        }

        const actions = obligations.map(obligation =>
            obligation.abilities.find(ability =>
                ability.abilityType === ABILITY_ALTEREGO_ACTION));
        assert.ok(actions.every(Boolean));
        for (let index = 0; index < players.length; index++) {
            assert.equal(
                await actions[index].canRun({
                    card: obligations[index],
                    player: players[index],
                }),
                true
            );
        }

        const sideScheme = scenario.deck.cards.find(({name}) =>
            name === 'Flujo temporal corrompido');
        assert.ok(sideScheme);
        await revealCard(match, sideScheme, players[0]);
        const sourceZone = players[0].scenarioZone;
        assert.equal(players[1].scenarioZone, sourceZone);
        assert.ok(sourceZone.cards.includes(sideScheme));

        for (let index = 0; index < players.length; index++) {
            assert.equal(
                await actions[index].canRun({
                    card: obligations[index],
                    player: players[index],
                }),
                false
            );
            const availableAbilities =
                await obligations[index].getAbilityAvailability(players[index]);
            assert.equal(
                availableAbilities.abilities.find(ability => ability.isAction)
                    ?.disable,
                true
            );
            await actions[index].resolveAbility({
                card: obligations[index],
                player: players[index],
            });
            assert.equal(players[index].hand.cards.length, 1);
            assert.ok(players[index].gameZone.cards.includes(obligations[index]));
        }

        const otherZone = scenario.createZone({
            id: 'isolated-test-scenario-zone',
        });
        otherZone.addPlayer(players[1]);
        assert.notEqual(players[0].scenarioZone, players[1].scenarioZone);
        assert.equal(otherZone.cards.includes(sideScheme), false);
        assert.equal(
            await actions[0].canRun({
                card: obligations[0],
                player: players[0],
            }),
            false
        );
        assert.equal(
            await actions[1].canRun({
                card: obligations[1],
                player: players[1],
            }),
            true
        );
        const otherZoneAvailability =
            await obligations[1].getAbilityAvailability(players[1]);
        assert.notEqual(
            otherZoneAvailability.abilities.find(ability => ability.isAction)
                ?.disable,
            true
        );

        assert.equal(
            await players[0].canUseAbility({
                abilityType: ABILITY_ACTION,
                card: obligations[0],
            }),
            true
        );
        const otherCard = createResourceCard(factory, players[0], 'Carta ajena');
        assert.equal(
            await players[0].canUseAbility({
                abilityType: ABILITY_ALTEREGO_ACTION,
                card: otherCard,
            }),
            true
        );
    });
});
