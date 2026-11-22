import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_ALLY,
    CARD_TYPE_MINION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CALC_ALL,
    CHARACTER_VILLAIN,
    DIALOG_DISCARD_ORDER,
    DIALOG_LIST,
    DIALOG_PAY_COST,
    DIALOG_SELECT_TARGET,
    DIALOG_USE_CARD,
    EFFECT_ADD_TO_ADDITIONAL_ZONE,
    EFFECT_CHAINED,
    EFFECT_CHOOSE,
    EFFECT_DELAYED,
    EFFECT_DISCARD_HAND,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_ENEMY_ATTACK,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_SPEND,
    EFFECT_SURGE,
    MATCH_END_REASON_SCENARIO_FAILED,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ACTIVATION,
    TARGET_ATTACHED,
    TARGET_CARD,
    TARGET_CONDITION_CARD,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    OPERATOR_MAX,
    OPERATOR_MIN,
    TRAIT_BOUNTY_HUNTER,
    TRAIT_ILLUSION,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import sheHulk from '../../../mc-data/seed/catalog/heroes/she-hulk.js';
import galacticArtifacts from '../../../mc-data/seed/catalog/sets/galactic-artifacts.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {DiscardFromGameEffect} from '../../src/effects/discard-from-game-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {MoveCountersEffect} from '../../src/effects/move-counters-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {RemoveCountersEffect} from '../../src/effects/remove-counters-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {Match} from '../../src/model/match/match.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';

const SET = 'infiltrate-the-museum';

async function createScenario(deckCardNames = []) {
    const {scenarios, sets} = await loadCatalog();
    const scenarioRecord = scenarios.find(({_id}) => _id === SET);
    assert.ok(scenarioRecord);

    const setConfigs = new Map(sets.map(({_id, config}) => [_id, config]));
    const match = new Match({
        mc: {
            data: {
                async getSetConfig(id) {
                    const config = setConfigs.get(id);
                    assert.ok(config, `Missing test set "${id}".`);
                    return config;
                },
            },
            mcSocket: {send() {}},
        },
        name: `${SET}-test`,
    });
    match.persist = async () => {};
    match.refresh = async () => {};
    match.openDialog = async ({data, dialogType}) => {
        if (dialogType === DIALOG_USE_CARD) {
            return {selected: data.cards[0]};
        }
        if (dialogType === DIALOG_LIST && data.options?.length) {
            return {selected: data.options[0]};
        }

        return {};
    };

    const factory = new MatchFactory(match);
    const superhero = factory.createSuperhero({
        ...structuredClone(sheHulk.config),
        cards: [],
        nemesis: [],
        obligation: undefined,
        precon: [],
    });
    const player = match.createPlayer({
        initial: true,
        name: 'Jugador',
        superhero,
    });
    player.initPlayer();
    player.deck.cards = deckCardNames.map(name =>
        factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name,
                set: 'test',
                resources: [RESOURCE_MENTAL],
            },
        }, {owner: player}));

    const scenario = await factory.createScenario(scenarioRecord.config);
    match.addScenario(scenario);

    return {factory, match, player, scenario, scenarioRecord};
}

describe('Infiltrados en el museo', () => {
    function createPlayerCard(factory, player, {
        type = CARD_TYPE_UPGRADE,
        ...params
    }) {
        return factory.cardsFactory.createGameCardFromConfig({
            type,
            params: {
                set: 'test',
                ...params,
            },
        }, {owner: player});
    }

    async function revealTreachery({match, player, scenario}, name) {
        const card = scenario.deck.cards.find(candidate =>
            candidate.name === name);
        assert.ok(card, `Missing scenario treachery "${name}".`);

        const reveal = new RevealEncounterEffect({
            match,
            selectedTarget: card,
        });
        await reveal.runEffect({match, player});

        return {card, reveal};
    }

    function addSecondPlayer({factory, match}) {
        const superhero = factory.createSuperhero({
            ...structuredClone(sheHulk.config),
            cards: [],
            nemesis: [],
            obligation: undefined,
            precon: [],
        });
        const player = match.createPlayer({
            name: 'Jugador 2',
            superhero,
        });
        player.initPlayer();
        player.deck.cards = [1, 2, 3].map(index =>
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {
                    name: `Carta de preparación del jugador 2 ${index}`,
                    set: 'test',
                    resources: [RESOURCE_MENTAL],
                },
            }, {owner: player}));

        return player;
    }

    test('catalog defines normal and expert villains, scheme, and required sets', async () => {
        const {scenarioRecord} = await createScenario();

        assert.equal(scenarioRecord.name, 'Infiltrados en el museo');
        assert.deepEqual(
            scenarioRecord.config.villains.map(({params}) => params.stage),
            [1, 2]
        );
        assert.deepEqual(
            scenarioRecord.config.expertVillains.map(({params}) => params.stage),
            [2, 3]
        );
        assert.deepEqual(scenarioRecord.config.sets, [
            'standard',
            'galactic-artifacts',
        ]);
        assert.deepEqual(scenarioRecord.config.defaultSets, ['menagerie-medley']);
        assert.deepEqual(
            scenarioRecord.config.additionalZones.map(({id, name, displayCardInfo}) => [
                id,
                name,
                displayCardInfo.map(({id, label, path}) => [id, label, path]),
            ]),
            [[
                'collection',
                'La Colección',
                [
                    ['owner', 'Propietario', 'owner.superhero.mainName'],
                    ['scenarioOwner', 'Escenario', 'owner.name'],
                ],
            ]]
        );
        assert.equal(
            scenarioRecord.config.mainSchemes[0][1].params.value[0],
            10
        );
    });

    test('adds scenario treacheries and includes the shared Con la guardia baja in both configs', async () => {
        const {match, scenario, scenarioRecord} = await createScenario([
            'Carta de preparación',
            'Carta superior',
            'Carta restante',
        ]);
        const treacheries = scenarioRecord.config.cards.filter(({card}) =>
            ['Caja poco llamativa', 'Observar el cosmos', 'Quedaos un rato']
                .includes(card.params.name)
        );
        const sharedCardEntry = scenarioRecord.config.cards.find(({card}) =>
            card.params.name === 'Con la guardia baja'
        );
        assert.ok(sharedCardEntry);
        assert.equal(sharedCardEntry.count, 1);
        assert.equal(sharedCardEntry.card.params.set, SET);
        assert.equal(
            sharedCardEntry.card.params.image,
            'sets/standard/01188.png'
        );

        assert.deepEqual(treacheries.map(({count, card}) => [
            count,
            card.params.name,
            card.params.set,
            card.params.image,
            card.params.boost,
        ]), [
            [2, 'Caja poco llamativa', SET, `scenarios/${SET}/16076.png`, 0],
            [2, 'Observar el cosmos', SET, `scenarios/${SET}/16077.png`, 2],
            [2, 'Quedaos un rato', SET, `scenarios/${SET}/16078.png`, 1],
        ]);
        assert.deepEqual(
            scenarioRecord.config.cards.map(({card}) =>
                Number(card.params.image.match(/\/(\d+)\.png$/)?.[1])),
            [1188, 16074, 16075, 16076, 16077, 16078]
        );

        const [boxConfig, cosmosConfig, stayConfig] = treacheries.map(
            ({card}) => card
        );
        const boxWhenRevealed = boxConfig.params.abilities[0];
        assert.equal(boxWhenRevealed.type, ABILITY_WHEN_REVEALED);
        assert.equal(boxWhenRevealed.params.effect.type, EFFECT_CHAINED);
        assert.deepEqual(
            boxWhenRevealed.params.effect.params.effects.map(({type}) => type),
            [EFFECT_ADD_TO_ADDITIONAL_ZONE, EFFECT_DO_IF]
        );
        assert.deepEqual(
            boxWhenRevealed.params.effect.params.effects[0].params.condition,
            {cost: {operator: OPERATOR_MIN, defaultValue: 0}}
        );
        assert.equal(
            boxWhenRevealed.params.effect.params.effects[1].params.effect.type,
            EFFECT_SURGE
        );
        assert.equal(boxConfig.params.boostAbility.type, ABILITY_BOOST);
        assert.equal(
            boxConfig.params.boostAbility.params.effect.type,
            EFFECT_DO_IF
        );
        assert.deepEqual(
            boxConfig.params.boostAbility.params.effect.params.condition,
            {
                'match.scenario.additionalZones.collection.cards.length': {
                    operator: 'lte',
                    path: 'match.players.length',
                    multiply: 3,
                },
            }
        );

        const cosmosOptions = cosmosConfig.params.abilities[0]
            .params.effect.params.options;
        assert.equal(cosmosConfig.params.abilities[0].type, ABILITY_WHEN_REVEALED);
        assert.equal(cosmosOptions[0].type, EFFECT_ADD_TO_ADDITIONAL_ZONE);
        assert.equal(cosmosOptions[0].params.fromHand, true);
        assert.deepEqual(cosmosOptions[0].params.condition, {
            cost: {operator: OPERATOR_MAX, defaultValue: 0},
        });
        assert.equal(cosmosOptions[1].type, EFFECT_CHAINED);
        assert.equal(
            cosmosOptions[1].params.effects[0].type,
            EFFECT_DISCARD_HAND
        );
        assert.equal(
            cosmosOptions[1].params.thenEffect.type,
            EFFECT_PLACE_THREAT
        );

        const [alterEgoAbility, heroAbility] = stayConfig.params.abilities;
        assert.equal(alterEgoAbility.type, ABILITY_WHEN_REVEALED_ALTEREGO);
        assert.equal(alterEgoAbility.params.effect.type, EFFECT_CHOOSE);
        assert.equal(
            alterEgoAbility.params.effect.params.options[0].type,
            EFFECT_SPEND
        );
        assert.deepEqual(
            alterEgoAbility.params.effect.params.options[0].params.resources,
            [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL]
        );
        assert.equal(heroAbility.type, ABILITY_WHEN_REVEALED_HERO);
        assert.deepEqual(
            heroAbility.params.effect.params.effects.map(({type}) => type),
            [EFFECT_ENEMY_ATTACK, EFFECT_DO_IF_TAKE_DAMAGE]
        );
        assert.equal(
            heroAbility.params.effect.params.effects[0].params.enemyType,
            CHARACTER_VILLAIN
        );
        assert.equal(
            heroAbility.params.effect.params.effects[0].params.attackModifier,
            1
        );
        assert.equal(
            heroAbility.params.effect.params.effects[0].params.target,
            TARGET_YOU
        );
        assert.equal(
            heroAbility.params.effect.params.effects[1].params.target,
            TARGET_YOUR_HERO
        );

        await scenario.initScenario(match.createObligations(), false);
        for (const {count, card} of treacheries) {
            assert.equal(
                scenario.scenarioCards.filter(({name}) =>
                    name === card.params.name).length,
                count
            );
        }

        const reusedCard = scenario.scenarioCards.filter(({name}) =>
            name === 'Con la guardia baja');
        assert.equal(reusedCard.length, 2);
        assert.deepEqual(
            reusedCard.map(({set}) => set).sort(),
            [SET, 'standard'].sort()
        );
        assert.equal(reusedCard[0].card.image, 'sets/standard/01188.png');
    });

    test('Caja poco llamativa collects the lowest-cost controlled card', async () => {
        const context = await createScenario();
        const {factory, match, player, scenario} = context;
        await scenario.initScenario(match.createObligations(), false);

        const lowCostCard = createPlayerCard(factory, player, {
            name: 'Mejora de coste bajo',
            cost: 1,
        });
        const highCostCard = createPlayerCard(factory, player, {
            name: 'Mejora de coste alto',
            cost: 3,
        });
        for (const card of [lowCostCard, highCostCard]) {
            card.controller = player;
            player.gameZone.addToGameZone(card);
        }

        await revealTreachery(context, 'Caja poco llamativa');

        assert.ok(scenario.additionalZones.collection.cards.includes(lowCostCard));
        assert.ok(!scenario.additionalZones.collection.cards.includes(highCostCard));
        assert.ok(!player.gameZone.cards.includes(lowCostCard));
        assert.ok(player.gameZone.cards.includes(highCostCard));
    });

    test('Caja poco llamativa gains Surge when no controlled card can be collected', async () => {
        const context = await createScenario();
        const {factory, match, player, scenario} = context;
        await scenario.initScenario(match.createObligations(), false);
        const card = scenario.deck.cards.find(candidate =>
            candidate.name === 'Caja poco llamativa');
        assert.ok(card);
        const extraEncounter = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Carta adicional',
                set: 'test',
                boost: 0,
            },
        }, {owner: scenario});
        scenario.deck.cards = [extraEncounter];

        const surgeReveal = new RevealEncounterEffect({
            match,
            selectedTarget: card,
        });
        await surgeReveal.runEffect({match, player});
        assert.equal(surgeReveal.surge, true);
        assert.ok(scenario.deck.discardPile.includes(extraEncounter));
        assert.ok(!scenario.additionalZones.collection.cards.includes(card));
    });

    test('Caja poco llamativa scales its Boost threshold by the number of players', async () => {
        for (const {playerCount, shouldCollectTopCard} of [
            {playerCount: 1, shouldCollectTopCard: false},
            {playerCount: 2, shouldCollectTopCard: true},
        ]) {
            const context = await createScenario([
                'Carta de preparación',
                'Carta superior',
                'Carta restante',
            ]);
            const {factory, match, player, scenario} = context;
            if (playerCount === 2) {
                addSecondPlayer(context);
            }
            await scenario.initScenario(match.createObligations(), false);

            for (let index = 1; index < 4; index++) {
                const filler = createPlayerCard(factory, player, {
                    type: CARD_TYPE_RESOURCE,
                    name: `Carta de la Colección ${index}`,
                    resources: [RESOURCE_MENTAL],
                });
                await scenario.addToAdditionalZone('collection', filler, {player});
            }

            const box = scenario.deck.cards.find(card =>
                card.name === 'Caja poco llamativa');
            assert.ok(box);
            await box.boostAbility.resolveAbility({
                card: box,
                match,
                player,
            });

            assert.equal(
                scenario.additionalZones.collection.cards.some(({name}) =>
                    name === 'Carta superior'),
                shouldCollectTopCard
            );
            assert.equal(
                player.deck.cards.some(({name}) => name === 'Carta superior'),
                !shouldCollectTopCard
            );
        }
    });

    test('Observar el cosmos places the highest-cost hand card in the Collection', async () => {
        const context = await createScenario();
        const {factory, match, player, scenario} = context;
        await scenario.initScenario(match.createObligations(), false);

        const lowerCostCard = createPlayerCard(factory, player, {
            name: 'Carta de coste bajo',
            cost: 1,
        });
        const higherCostCard = createPlayerCard(factory, player, {
            name: 'Carta de coste alto',
            cost: 4,
        });
        player.hand.addCards([lowerCostCard, higherCostCard]);

        await revealTreachery(context, 'Observar el cosmos');

        assert.ok(scenario.additionalZones.collection.cards.includes(higherCostCard));
        assert.ok(!player.hand.cards.includes(higherCostCard));
        assert.ok(!player.deck.discardPile.includes(higherCostCard));
        assert.ok(player.hand.cards.includes(lowerCostCard));
    });

    test('Observar el cosmos discards the highest-cost hand card then places its printed cost as threat', async () => {
        const context = await createScenario([
            'Carta de preparación',
            'Carta superior',
            'Carta restante',
        ]);
        const {factory, match, player, scenario} = context;
        await scenario.initScenario(match.createObligations(), false);

        const lowerCostCard = createPlayerCard(factory, player, {
            name: 'Carta de coste bajo',
            cost: 1,
        });
        const higherCostCard = createPlayerCard(factory, player, {
            name: 'Carta de coste alto',
            cost: 4,
        });
        player.hand.addCards([lowerCostCard, higherCostCard]);
        const mainScheme = scenario.gameZone.currentScheme.currentSide;
        const startingThreat = mainScheme.threat;
        const openDialog = match.openDialog;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_LIST &&
                dialog.data.options?.length === 2) {
                return {selected: dialog.data.options[1]};
            }

            return openDialog(dialog);
        };

        await revealTreachery(context, 'Observar el cosmos');

        assert.ok(!player.hand.cards.includes(higherCostCard));
        assert.ok(player.deck.discardPile.includes(higherCostCard));
        assert.ok(player.hand.cards.includes(lowerCostCard));
        assert.equal(mainScheme.threat, startingThreat + 4);
    });

    test('Quedaos un rato lets an alter ego choose the top card of their deck', async () => {
        const context = await createScenario([
            'Carta de preparación',
            'Carta superior',
            'Carta restante',
        ]);
        const {factory, match, player, scenario} = context;
        await scenario.initScenario(match.createObligations(), false);
        const physicalResources = [1, 2].map(index =>
            createPlayerCard(factory, player, {
                type: CARD_TYPE_RESOURCE,
                name: `Recurso físico ${index}`,
                resources: [RESOURCE_PHYSICAL],
            }));
        player.hand.addCards(physicalResources);

        const openDialog = match.openDialog;
        let choiceCount = 0;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_LIST &&
                dialog.data.options?.length === 2) {
                choiceCount++;
                return {selected: dialog.data.options[1]};
            }

            return openDialog(dialog);
        };

        await revealTreachery(context, 'Quedaos un rato');

        assert.equal(choiceCount, 1);
        assert.deepEqual(
            scenario.additionalZones.collection.cards.map(({name}) => name),
            ['Carta de preparación', 'Carta superior']
        );
        assert.deepEqual(
            player.deck.cards.map(({name}) => name),
            ['Carta restante']
        );
        assert.equal(player.hand.cards.length, 2);
    });

    test('Quedaos un rato lets an alter ego spend two physical resources', async () => {
        const context = await createScenario([
            'Carta de preparación',
            'Carta superior',
        ]);
        const {factory, match, player, scenario} = context;
        await scenario.initScenario(match.createObligations(), false);
        const physicalResources = [1, 2].map(index =>
            createPlayerCard(factory, player, {
                type: CARD_TYPE_RESOURCE,
                name: `Recurso físico ${index}`,
                resources: [RESOURCE_PHYSICAL],
            }));
        player.hand.addCards(physicalResources);

        const openDialog = match.openDialog;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_LIST &&
                dialog.data.options?.length === 2) {
                return {selected: dialog.data.options[0]};
            }
            if (dialog.dialogType === DIALOG_PAY_COST) {
                return {
                    fullyPaid: true,
                    paid: {
                        generators: [],
                        hand: dialog.data.cards.hand.map(({id}) => ({id})),
                    },
                    resources: [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL],
                };
            }
            if (dialog.dialogType === DIALOG_DISCARD_ORDER) {
                return {selected: dialog.data.cards};
            }

            return openDialog(dialog);
        };

        await revealTreachery(context, 'Quedaos un rato');

        assert.equal(player.hand.cards.length, 0);
        assert.ok(physicalResources.every(card =>
            player.deck.discardPile.includes(card)));
        assert.deepEqual(
            scenario.additionalZones.collection.cards.map(({name}) => name),
            ['Carta de preparación']
        );
        assert.deepEqual(player.deck.cards.map(({name}) => name), ['Carta superior']);
    });

    test('Quedaos un rato gives the Villain +1 ATK and collects a card when the hero takes damage', async () => {
        const context = await createScenario([
            'Carta de preparación',
            'Carta superior',
            'Carta restante',
        ]);
        const {factory, match, player, scenario} = context;
        await scenario.initScenario(match.createObligations(), false);
        const hero = player.superhero.sides.find(side => side.isHero);
        await player.superhero.flip({player, selectedFormTarget: hero});

        const card = scenario.deck.cards.find(candidate =>
            candidate.name === 'Quedaos un rato');
        const boostCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Aumento de prueba',
                set: 'test',
                boost: 0,
            },
        }, {owner: scenario});
        scenario.deck.cards = [boostCard];

        await new RevealEncounterEffect({
            match,
            selectedTarget: card,
        }).runEffect({match, player});

        assert.equal(hero.damage, 2);
        assert.deepEqual(
            scenario.additionalZones.collection.cards.map(({name}) => name),
            ['Carta de preparación', 'Carta superior']
        );
        assert.deepEqual(player.deck.cards.map(({name}) => name), ['Carta restante']);
    });

    test('Imagen biogramática is included once with its printed encounter data and abilities', async () => {
        const {scenario, scenarioRecord} = await createScenario();
        const entries = scenarioRecord.config.cards;
        const entry = entries.find(({card}) =>
            card.params.name === 'Imagen biogramática'
        );
        assert.ok(entry);
        const {count, card} = entry;

        assert.equal(count, 1);
        assert.equal(card.type, CARD_TYPE_ATTACHMENT);
        assert.equal(card.params.name, 'Imagen biogramática');
        assert.equal(card.params.set, SET);
        assert.equal(
            card.params.image,
            `scenarios/${SET}/16074.png`
        );
        assert.deepEqual(card.params.traits, [TRAIT_ILLUSION]);
        assert.equal(card.params.boost, 1);
        assert.deepEqual(card.params.attach, {
            target: TARGET_CONDITION_CARD,
            condition: {name: 'El Coleccionista'},
        });

        const [interrupt] = card.params.abilities;
        assert.equal(interrupt.type, ABILITY_FORCED_INTERRUPT);
        assert.equal(
            interrupt.params.trigger,
            TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE
        );
        assert.deepEqual(interrupt.params.triggerParams, {
            target: TARGET_ATTACHED,
        });
        const interruptEffects = interrupt.params.effect.params.effects;
        assert.equal(interrupt.params.effect.type, EFFECT_CHAINED);
        assert.deepEqual(interruptEffects.map(({type}) => type), [
            EFFECT_ADD_TO_ADDITIONAL_ZONE,
            EFFECT_PREVENT_DAMAGE,
            EFFECT_PLACE_THREAT,
        ]);
        assert.deepEqual(interruptEffects[0].params, {
            zoneId: 'collection',
            target: TARGET_THIS,
            inPlayOnly: true,
        });
        assert.deepEqual(interruptEffects[1].params, {
            target: TARGET_EFFECT,
            preventAll: true,
        });
        assert.deepEqual(interruptEffects[2].params, {
            target: TARGET_MAIN_SCHEME,
            threat: 0,
            paramsCalc: {
                target: 'effects.1.preventedDamage',
                formula: CALC_ALL,
            },
        });

        const boostAbility = card.params.boostAbility;
        assert.equal(boostAbility.type, ABILITY_BOOST);
        assert.equal(boostAbility.params.effect.type, EFFECT_DELAYED);
        assert.equal(
            boostAbility.params.effect.params.target,
            TARGET_ACTIVATION
        );
        assert.deepEqual(
            boostAbility.params.effect.params.effect,
            {
                type: EFFECT_REVEAL_ENCOUNTER,
                params: {card: 'card'},
            }
        );

        const imageCodes = entries.map(({card: entryCard}) =>
            Number(entryCard.params.image.match(/\/(\d+)\.png$/)?.[1])
        );
        assert.deepEqual(
            imageCodes,
            [...imageCodes].sort((first, second) => first - second)
        );
        assert.equal(
            scenario.scenarioCards.filter(({name}) =>
                name === 'Imagen biogramática'
            ).length,
            1
        );
    });

    test('Monark Starstalker is included once as a unique, villainous minion', async () => {
        const {scenario, scenarioRecord} = await createScenario();
        const entry = scenarioRecord.config.cards.find(({card}) =>
            card.params.name === 'Monark Starstalker'
        );

        assert.ok(entry);
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_MINION);
        assert.equal(entry.card.params.name, 'Monark Starstalker');
        assert.equal(entry.card.params.set, SET);
        assert.equal(
            entry.card.params.image,
            `scenarios/${SET}/16075.png`
        );
        assert.equal(entry.card.params.unique, true);
        assert.deepEqual(entry.card.params.traits, [TRAIT_BOUNTY_HUNTER]);
        assert.equal(entry.card.params.attack, 2);
        assert.equal(entry.card.params.scheme, 2);
        assert.equal(entry.card.params.hitPoints, 7);
        assert.equal(entry.card.params.boost, 3);
        assert.deepEqual(entry.card.params.keywords, {villainous: true});

        const minionCopies = scenario.scenarioCards.filter(({name}) =>
            name === 'Monark Starstalker'
        );
        assert.equal(minionCopies.length, 1);
        assert.equal(minionCopies[0].villainous, true);
    });

    test('Imagen biogramática moves to the Collection after preventing Collector damage', async () => {
        const {match, player, scenario} = await createScenario();
        await scenario.initScenario(match.createObligations(), false);

        const image = scenario.deck.cards.find(card =>
            card.name === 'Imagen biogramática'
        );
        const villain = scenario.gameZone.currentVillain;
        const mainScheme = scenario.gameZone.currentScheme.currentSide;
        assert.ok(image);

        await new RevealEncounterEffect({
            match,
            selectedTarget: image,
        }).runEffect({match, player});

        assert.equal(image.attachedTo, villain);
        assert.ok(villain.attached.includes(image));

        const threatBeforeDamage = mainScheme.threat;
        const heroDamage = new TakeDamageEffect({
            character: player.superhero.currentSide,
            damage: 1,
            match,
            selectedTarget: player.superhero.currentSide,
        });
        await heroDamage.runEffect({match, player});

        assert.equal(player.superhero.currentSide.damage, 1);
        assert.ok(!scenario.additionalZones.collection.cards.includes(image));
        assert.equal(mainScheme.threat, threatBeforeDamage);

        const villainDamage = new TakeDamageEffect({
            character: villain,
            damage: 3,
            match,
            selectedTarget: villain,
        });
        await villainDamage.runEffect({match, player});

        assert.equal(villainDamage.takenDamage, 0);
        assert.equal(villain.damage, 0);
        assert.ok(scenario.additionalZones.collection.cards.includes(image));
        assert.equal(image.attachedTo, undefined);
        assert.ok(
            scenario.toObj().additionalZones.collection.cards.some(({name}) =>
                name === 'Imagen biogramática'
            )
        );
        assert.equal(mainScheme.threat, threatBeforeDamage + 3);
    });

    test('Imagen biogramática is revealed after the Villain activation ends when drawn as a boost', async () => {
        const {match, player, scenario} = await createScenario();
        await scenario.initScenario(match.createObligations(), false);

        const imageIndex = scenario.deck.cards.findIndex(card =>
            card.name === 'Imagen biogramática'
        );
        assert.notEqual(imageIndex, -1);
        const [image] = scenario.deck.cards.splice(imageIndex, 1);
        scenario.deck.cards.unshift(image);

        const villain = scenario.gameZone.currentVillain;
        const attack = new EnemyAttackEffect({
            enemy: villain,
            match,
            selectedTarget: player,
        });
        await attack.runEffect({match, player});

        assert.equal(attack.boostCards[0], image);
        assert.equal(image.attachedTo, villain);
        assert.ok(villain.attached.includes(image));
    });

    test('main scheme setup places each player deck top card face up in the Collection', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta superior',
            'Carta restante',
        ]);

        await scenario.initScenario(match.createObligations(), false);

        assert.deepEqual(
            scenario.additionalZones.collection.cards.map(card => card.name),
            ['Carta superior']
        );
        assert.equal(scenario.additionalZones.collection.cards[0].owner, player);
        assert.deepEqual(
            player.deck.cards.map(card => card.name),
            ['Carta restante']
        );
        assert.equal(
            scenario.toObj().additionalZones.collection.cards[0]
                .additionalInfo.owner,
            player.superhero.mainName
        );
        assert.equal(
            scenario.toObj().additionalZones.collection.cards[0]
                .additionalInfo.scenarioOwner,
            player.name
        );
    });

    test('expert setup resolves the initial stage II When Revealed ability', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta de preparación',
            'Carta elegida',
            'Carta restante',
        ]);

        await scenario.initScenario(match.createObligations(), true);
        await match.resolveWhenReveal(player);

        assert.equal(scenario.gameZone.currentVillain.stage, 2);
        assert.deepEqual(
            scenario.additionalZones.collection.cards.map(card => card.name),
            ['Carta de preparación', 'Carta elegida']
        );
        assert.deepEqual(
            player.deck.cards.map(card => card.name),
            ['Carta restante']
        );
    });

    test('stage II and III reveal effects add cards and stage III adds matching threat', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta uno',
            'Carta dos',
            'Carta tres',
            'Carta restante',
        ]);
        scenario.expertVillains = [
            scenario.villains[0],
            scenario.villains[1],
            scenario.expertVillains[1],
        ];

        await scenario.initScenario(match.createObligations(), true);

        assert.equal(scenario.gameZone.currentVillain.stage, 1);
        assert.equal(scenario.additionalZones.collection.cards.length, 1);

        await scenario.selectVillain(
            player,
            scenario.gameZone.currentVillain,
            {defeatAnnounced: true}
        );

        assert.equal(scenario.gameZone.currentVillain.stage, 2);
        assert.equal(scenario.additionalZones.collection.cards.length, 2);

        await scenario.selectVillain(
            player,
            scenario.gameZone.currentVillain,
            {defeatAnnounced: true}
        );

        assert.equal(scenario.gameZone.currentVillain.stage, 3);
        assert.equal(scenario.additionalZones.collection.cards.length, 3);
        assert.equal(scenario.gameZone.currentScheme.currentSide.threat, 7);
    });

    test('an in-play card goes to the Collection and can later be discarded to its owner pile', async () => {
        const {factory, match, player, scenario} = await createScenario([
            'Carta del jugador',
            'Carta restante',
        ]);

        await scenario.initScenario(match.createObligations(), false);

        const encounterCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Carta de encuentro',
                set: SET,
                image: `scenarios/${SET}/test.png`,
            },
        }, {owner: scenario});
        scenario.gameZone.addToGameZone(encounterCard);
        await encounterCard.initTriggers();

        await encounterCard.discard();

        assert.ok(
            scenario.additionalZones.collection.cards.includes(encounterCard)
        );
        assert.ok(!scenario.deck.discardPile.includes(encounterCard));

        const playerCard = scenario.additionalZones.collection.cards.find(card =>
            card.owner === player);
        await new DiscardFromGameEffect({
            match,
            selectedTarget: playerCard,
            target: TARGET_SOURCE,
            source: 'match.scenario.additionalZones.collection.cards',
        }).runEffect({player});

        assert.ok(
            !scenario.additionalZones.collection.cards.includes(playerCard)
        );
        assert.ok(player.deck.discardPile.includes(playerCard));

        await new DiscardFromGameEffect({
            match,
            selectedTarget: encounterCard,
            target: TARGET_SOURCE,
            source: 'match.scenario.additionalZones.collection.cards',
        }).runEffect({player});

        assert.ok(
            !scenario.additionalZones.collection.cards.includes(encounterCard)
        );
        assert.ok(scenario.deck.discardPile.includes(encounterCard));

        const victoryCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_UPGRADE,
            params: {
                name: 'Carta con Victoria en la Colección',
                set: SET,
                keywords: {victory: 1},
            },
        }, {owner: player});
        await scenario.addToAdditionalZone('collection', victoryCard, {player});
        await new DiscardFromGameEffect({
            match,
            selectedTarget: victoryCard,
            target: TARGET_SOURCE,
            source: 'match.scenario.additionalZones.collection.cards',
        }).runEffect({player});

        assert.ok(!scenario.additionalZones.collection.cards.includes(victoryCard));
        assert.ok(player.deck.discardPile.includes(victoryCard));
        assert.ok(!match.victoryDisplay.includes(victoryCard));
    });

    test('Victory X cards enter the shared Victory Display instead of the Collection or discard piles', async () => {
        const {factory, match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);

        const ally = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado con Victoria',
                set: SET,
                attack: 1,
                thwart: 1,
                hitPoints: 2,
                keywords: {victory: 2},
            },
        }, {owner: player});
        ally.controller = player;
        player.gameZone.addToGameZone(ally);
        await ally.initTriggers();
        let refreshCount = 0;
        match.refresh = async () => {
            refreshCount++;
        };

        const defeat = new DefeatEffect({
            match,
            selectedTarget: ally,
            target: TARGET_CARD,
        });
        await defeat.runEffect({match, player, card: ally});

        assert.equal(ally.victory, 2);
        assert.deepEqual(match.victoryDisplay, [ally]);
        assert.ok(!scenario.additionalZones.collection.cards.includes(ally));
        assert.ok(!player.deck.discardPile.includes(ally));
        assert.ok(!player.gameZone.cards.includes(ally));
        assert.equal(match.toObj().victoryDisplay[0].id, ally.id);
        assert.equal(refreshCount, 1);

        delete match.persist;
        delete match.refresh;
        delete match.openDialog;
        const restoredMatch = restoreMatch(serializeMatch(match), match.mc);
        assert.equal(restoredMatch.victoryDisplay[0].id, ally.id);
    });

    test('a Victory 0 scheme enters the Victory Display instead of the Collection', async () => {
        const {factory, match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);

        const eggConfig = galacticArtifacts.config.cards.find(({card}) =>
            card.params.name === 'Huevo del monarca hujahdariano').card;
        const egg = factory.cardsFactory.createGameCardFromConfig(
            structuredClone(eggConfig),
            {owner: scenario}
        );
        egg.controller = scenario;
        scenario.gameZone.addToGameZone(egg);
        await egg.initTriggers();

        const defeat = new DefeatEffect({
            match,
            selectedTarget: egg,
            target: TARGET_CARD,
        });
        await defeat.runEffect({match, player, card: egg});

        assert.equal(egg.victory, 0);
        assert.equal(egg.hasVictory, true);
        assert.ok(match.victoryDisplay.includes(egg));
        assert.ok(!scenario.additionalZones.collection.cards.includes(egg));
        assert.ok(!scenario.deck.discardPile.includes(egg));
    });

    test('Victory X attachments enter the Victory Display when their host is defeated', async () => {
        const {factory, match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);

        const host = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado con accesorio',
                set: SET,
                attack: 1,
                thwart: 1,
                hitPoints: 2,
            },
        }, {owner: player});
        host.controller = player;
        player.gameZone.addToGameZone(host);
        await host.initTriggers();

        const attachment = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_UPGRADE,
            params: {
                name: 'Accesorio con Victoria',
                set: SET,
                keywords: {victory: 1},
            },
        }, {owner: player});
        attachment.controller = player;
        player.gameZone.addToGameZone(attachment);
        attachment.attachedTo = host;
        host.attached.push(attachment);

        const defeat = new DefeatEffect({
            match,
            selectedTarget: host,
            target: TARGET_CARD,
        });
        await defeat.runEffect({match, player, card: host});

        assert.ok(match.victoryDisplay.includes(attachment));
        assert.ok(!scenario.additionalZones.collection.cards.includes(attachment));
        assert.ok(!player.deck.discardPile.includes(attachment));
        assert.ok(!host.attached.includes(attachment));
        assert.ok(scenario.additionalZones.collection.cards.includes(host));
    });

    test('a defeated Villain with Victory X enters the Victory Display after the stage transition', async () => {
        const {match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);
        const villain = scenario.gameZone.currentVillain;
        villain.currentSide.card.keywords._victory = 1;

        await new DefeatEffect({
            match,
            selectedTarget: villain,
            target: TARGET_CARD,
        }).runEffect({match, player, card: villain});

        assert.ok(match.victoryDisplay.includes(villain));
        assert.notEqual(scenario.gameZone.currentVillain, villain);
        assert.equal(scenario.gameZone.currentVillain.stage, 2);
        assert.ok(!scenario.deck.discardPile.includes(villain));
    });

    test('a Victory X card with Uses enters the Victory Display when its last counter is removed', async () => {
        const {factory, match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);

        const card = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_UPGRADE,
            params: {
                name: 'Mejora con Victoria y Usos',
                set: SET,
                keywords: {
                    uses: 'carga',
                    victory: 3,
                },
            },
        }, {owner: player});
        card.controller = player;
        player.gameZone.addToGameZone(card);
        card.counters = 1;

        const removeCounters = new RemoveCountersEffect({
            selectedTarget: card,
            count: 1,
            match,
        });
        await removeCounters.execute({match, player});

        assert.equal(removeCounters.removedCounters, 1);
        assert.ok(match.victoryDisplay.includes(card));
        assert.ok(!player.deck.discardPile.includes(card));
        assert.ok(!scenario.additionalZones.collection.cards.includes(card));
    });

    test('a Victory X card with Uses enters the Victory Display when its last counter is moved', async () => {
        const {factory, match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);

        const card = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_UPGRADE,
            params: {
                name: 'Mejora con Victoria y Usos movida',
                set: SET,
                keywords: {
                    uses: 'carga',
                    victory: 1,
                },
            },
        }, {owner: player});
        card.controller = player;
        player.gameZone.addToGameZone(card);
        card.counters = 1;
        const destination = {
            counters: 0,
            placeCounters(count) {
                this.counters += count;
            },
            refresh: async () => {},
        };
        const moveCounters = new MoveCountersEffect({
            fromTarget: TARGET_SOURCE,
            target: TARGET_CARD,
            counters: 1,
            match,
            selectedTarget: card,
        });
        moveCounters.selectedDestination = destination;

        await moveCounters.execute({match, player});

        assert.equal(moveCounters.movedCounters, 1);
        assert.ok(match.victoryDisplay.includes(card));
        assert.ok(!player.deck.discardPile.includes(card));
        assert.ok(!scenario.additionalZones.collection.cards.includes(card));
    });

    test('the main scheme action discards a card from its configured zone', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta de la Colección',
            'Carta restante',
        ]);
        await scenario.initScenario(match.createObligations(), false);
        const heroSide = player.superhero.sides.find(side => side.isHero);
        await player.superhero.flip({player, selectedFormTarget: heroSide});

        const collectedCard = scenario.additionalZones.collection.cards[0];
        const schemeSide = scenario.gameZone.currentScheme.currentSide;
        const action = schemeSide.abilities.find(ability =>
            ability.limit?.perPlayer);

        const scenarioView = await scenario.toObjWithAbilityAvailability(player);
        const serializedScheme = scenarioView.zones.find(zone =>
            zone.id === scenario.gameZone.id).mainScheme;
        const serializedAction = serializedScheme.abilities.find(ability =>
            ability.index === schemeSide.abilities.indexOf(action));

        assert.equal(serializedAction.name, 'Descarta 1 carta de La Colección');
        assert.equal(serializedAction.disable, false);
        assert.equal(serializedScheme.playable, true);
        assert.equal(action.arrow.cost.effectType, EFFECT_CHOOSE);
        assert.equal(action.effect.effectType, EFFECT_DISCARD_GAME);
        assert.equal(await action.canRun({match, player, card: schemeSide}), true);
        await player.resolveAbility(
            schemeSide.id,
            schemeSide.abilities.indexOf(action)
        );

        assert.ok(
            !scenario.additionalZones.collection.cards.includes(collectedCard)
        );
        assert.ok(player.deck.discardPile.includes(collectedCard));
        assert.equal(player.superhero.currentSide.exhausted, true);
    });

    test('the main scheme action can pay its resource arrow cost', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta de la Colección',
            'Recurso uno',
            'Recurso dos',
            'Carta restante',
        ]);
        await scenario.initScenario(match.createObligations(), false);
        const heroSide = player.superhero.sides.find(side => side.isHero);
        await player.superhero.flip({player, selectedFormTarget: heroSide});
        const [resourceOne, resourceTwo] = await player.deck.draw(2);
        player.hand.addCards([resourceOne, resourceTwo]);
        assert.deepEqual(
            player.hand.cards.map(card => card.name).sort(),
            ['Recurso dos', 'Recurso uno']
        );

        const openDialog = match.openDialog;
        match.openDialog = async ({data, dialogType, ...params}) => {
            if (dialogType === DIALOG_LIST) {
                const resourceOption = data.options?.find(option =>
                    option.text === 'Gasta 2 recursos de cualquier tipo');
                if (resourceOption) {
                    return {selected: resourceOption};
                }
            }
            if (dialogType === DIALOG_PAY_COST) {
                assert.equal(data.cards.hand.length, 2);
                assert.deepEqual(
                    data.cards.hand.map(card => card.name).sort(),
                    ['Recurso dos', 'Recurso uno']
                );
                return {
                    fullyPaid: true,
                    paid: {
                        generators: [],
                        hand: data.cards.hand.map(({id}) => ({id})),
                    },
                    resources: [RESOURCE_MENTAL, RESOURCE_MENTAL],
                };
            }
            if (dialogType === DIALOG_DISCARD_ORDER) {
                assert.deepEqual(
                    data.cards.map(card => card.name).sort(),
                    ['Recurso dos', 'Recurso uno']
                );
                return {selected: data.cards};
            }

            return openDialog({data, dialogType, ...params});
        };

        const collectedCard = scenario.additionalZones.collection.cards[0];
        const schemeSide = scenario.gameZone.currentScheme.currentSide;
        const action = schemeSide.abilities.find(ability =>
            ability.limit?.perPlayer);

        await action.resolveAbility({
            card: schemeSide,
            match,
            player,
        });

        assert.ok(!scenario.additionalZones.collection.cards.includes(collectedCard));
        assert.ok(player.deck.discardPile.includes(collectedCard));
        assert.ok(player.deck.discardPile.includes(resourceOne));
        assert.ok(player.deck.discardPile.includes(resourceTwo));
        assert.equal(player.superhero.currentSide.exhausted, false);
    });

    test('canceling the main scheme action resource cost cancels its effect', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta de la Colección',
            'Recurso uno',
            'Recurso dos',
            'Carta restante',
        ]);
        await scenario.initScenario(match.createObligations(), false);
        const heroSide = player.superhero.sides.find(side => side.isHero);
        await player.superhero.flip({player, selectedFormTarget: heroSide});
        const [resourceOne, resourceTwo] = await player.deck.draw(2);
        player.hand.addCards([resourceOne, resourceTwo]);

        let choiceDialogs = 0;
        match.openDialog = async ({data, dialogType}) => {
            if (dialogType === DIALOG_LIST) {
                assert.equal(choiceDialogs++, 0);
                return {
                    selected: data.options.find(option =>
                        option.text === 'Gasta 2 recursos de cualquier tipo'),
                };
            }
            if (dialogType === DIALOG_PAY_COST) {
                return undefined;
            }
            if (dialogType === DIALOG_SELECT_TARGET) {
                assert.fail('A canceled cost must not open the Collection target dialog.');
            }

            return {};
        };

        const collectedCard = scenario.additionalZones.collection.cards[0];
        const schemeSide = scenario.gameZone.currentScheme.currentSide;
        const action = schemeSide.abilities.find(ability =>
            ability.limit?.perPlayer);

        await action.resolveAbility({card: schemeSide, match, player});

        assert.ok(scenario.additionalZones.collection.cards.includes(collectedCard));
        assert.ok(!player.deck.discardPile.includes(collectedCard));
        assert.ok(player.hand.cards.includes(resourceOne));
        assert.ok(player.hand.cards.includes(resourceTwo));
        assert.equal(player.superhero.currentSide.exhausted, false);
        assert.equal(action.paymentCancelled, true);
        assert.equal(action.limit.canUse({player}), true);
    });

    test('canceling an auto-selected sole payment option cancels the main scheme action', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta de la Colección',
            'Recurso uno',
            'Recurso dos',
            'Carta restante',
        ]);
        await scenario.initScenario(match.createObligations(), false);
        const heroSide = player.superhero.sides.find(side => side.isHero);
        await player.superhero.flip({player, selectedFormTarget: heroSide});
        heroSide.exhausted = true;
        const [resourceOne, resourceTwo] = await player.deck.draw(2);
        player.hand.addCards([resourceOne, resourceTwo]);

        match.openDialog = async ({dialogType}) => {
            if (dialogType === DIALOG_LIST) {
                assert.fail('A single valid cost option should resolve without a choice dialog.');
            }
            if (dialogType === DIALOG_PAY_COST) {
                return undefined;
            }
            if (dialogType === DIALOG_SELECT_TARGET) {
                assert.fail('A canceled auto-selected cost must not open the Collection target dialog.');
            }

            return {};
        };

        const collectedCard = scenario.additionalZones.collection.cards[0];
        const schemeSide = scenario.gameZone.currentScheme.currentSide;
        const action = schemeSide.abilities.find(ability =>
            ability.limit?.perPlayer);

        await action.resolveAbility({card: schemeSide, match, player});

        assert.ok(scenario.additionalZones.collection.cards.includes(collectedCard));
        assert.ok(!player.deck.discardPile.includes(collectedCard));
        assert.ok(player.hand.cards.includes(resourceOne));
        assert.ok(player.hand.cards.includes(resourceTwo));
        assert.equal(heroSide.exhausted, true);
        assert.equal(action.paymentCancelled, true);
        assert.equal(action.limit.canUse({player}), true);
    });

    test('an incomplete main scheme resource payment cancels the action without paying partially', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta de la Colección',
            'Recurso uno',
            'Recurso dos',
            'Carta restante',
        ]);
        await scenario.initScenario(match.createObligations(), false);
        const heroSide = player.superhero.sides.find(side => side.isHero);
        await player.superhero.flip({player, selectedFormTarget: heroSide});
        const [resourceOne, resourceTwo] = await player.deck.draw(2);
        player.hand.addCards([resourceOne, resourceTwo]);

        let choiceDialogs = 0;
        match.openDialog = async ({data, dialogType}) => {
            if (dialogType === DIALOG_LIST) {
                assert.equal(choiceDialogs++, 0);
                return {
                    selected: data.options.find(option =>
                        option.text === 'Gasta 2 recursos de cualquier tipo'),
                };
            }
            if (dialogType === DIALOG_PAY_COST) {
                return {
                    fullyPaid: false,
                    paid: {
                        generators: [],
                        hand: [{id: data.cards.hand[0].id}],
                    },
                    resources: [RESOURCE_MENTAL],
                };
            }
            if (dialogType === DIALOG_SELECT_TARGET) {
                assert.fail('An incomplete cost must not open the Collection target dialog.');
            }

            return {};
        };

        const collectedCard = scenario.additionalZones.collection.cards[0];
        const schemeSide = scenario.gameZone.currentScheme.currentSide;
        const action = schemeSide.abilities.find(ability =>
            ability.limit?.perPlayer);

        await action.resolveAbility({card: schemeSide, match, player});

        assert.ok(scenario.additionalZones.collection.cards.includes(collectedCard));
        assert.ok(!player.deck.discardPile.includes(collectedCard));
        assert.ok(player.hand.cards.includes(resourceOne));
        assert.ok(player.hand.cards.includes(resourceTwo));
        assert.equal(player.superhero.currentSide.exhausted, false);
        assert.equal(action.paymentCancelled, true);
        assert.equal(action.limit.canUse({player}), true);
    });

    test('an empty payment response without fullyPaid cancels the main scheme action', async () => {
        const {match, player, scenario} = await createScenario([
            'Carta de la Colección',
            'Recurso uno',
            'Recurso dos',
            'Carta restante',
        ]);
        await scenario.initScenario(match.createObligations(), false);
        const heroSide = player.superhero.sides.find(side => side.isHero);
        await player.superhero.flip({player, selectedFormTarget: heroSide});
        const [resourceOne, resourceTwo] = await player.deck.draw(2);
        player.hand.addCards([resourceOne, resourceTwo]);

        match.openDialog = async ({data, dialogType}) => {
            if (dialogType === DIALOG_LIST) {
                return {
                    selected: data.options.find(option =>
                        option.text === 'Gasta 2 recursos de cualquier tipo'),
                };
            }
            if (dialogType === DIALOG_PAY_COST) {
                return {
                    paid: {generators: [], hand: []},
                    resources: [],
                };
            }
            if (dialogType === DIALOG_SELECT_TARGET) {
                assert.fail('An empty payment must not open the Collection target dialog.');
            }

            return {};
        };

        const collectedCard = scenario.additionalZones.collection.cards[0];
        const schemeSide = scenario.gameZone.currentScheme.currentSide;
        const action = schemeSide.abilities.find(ability =>
            ability.limit?.perPlayer);

        await action.resolveAbility({card: schemeSide, match, player});

        assert.ok(scenario.additionalZones.collection.cards.includes(collectedCard));
        assert.ok(!player.deck.discardPile.includes(collectedCard));
        assert.ok(player.hand.cards.includes(resourceOne));
        assert.ok(player.hand.cards.includes(resourceTwo));
        assert.equal(action.paymentCancelled, true);
        assert.equal(action.limit.canUse({player}), true);
    });

    test('five cards in the Collection end the game and action limits are per player', async () => {
        const {match, player, scenario} = await createScenario();

        await scenario.initScenario(match.createObligations(), false);
        for (let index = 0; index < 5; index++) {
            await scenario.addToAdditionalZone('collection', {
                id: `collection-${index}`,
                toObj() {
                    return {id: this.id};
                },
            }, {player});
        }

        assert.equal(
            match.gameOverReason,
            MATCH_END_REASON_SCENARIO_FAILED
        );

        const action = scenario.gameZone.currentScheme.currentSide.abilities
            .find(ability => ability.limit?.perPlayer);
        assert.equal(action.limit.perPlayer, true);
        assert.equal(action.limit.canUse({player}), true);
        action.useLimit({player});
        assert.equal(action.limit.canUse({player}), false);
        assert.equal(action.limit.canUse({player: {id: 'other-player'}}), true);
        action.limit.clean();
        assert.equal(action.limit.canUse({player}), true);
    });
});
