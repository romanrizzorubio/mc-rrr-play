import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Deck} from '../../src/model/match/deck.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {ScenarioRest} from '../../src/server/rest/scenario-rest.js';
import {AddAccelerationTokenEffect} from '../../src/effects/add-acceleration-token-effect.js';
import {AccelerateSchemeEffect} from '../../src/effects/accelerate-scheme-effect.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';
import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_BOOST,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    CALC_COUNT,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    DIALOG_DEFENSE,
    DIALOG_DISCARD_HAND,
    DIALOG_ACCELERATE,
    DIALOG_ENCOUNTERS_REVEAL,
    DIALOG_LIST,
    DIALOG_SELECT_PLACES,
    DIALOG_USE_CARD,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_UNTIL,
    EFFECT_FACEDOWN,
    EFFECT_CHAINED,
    EFFECT_ENGAGE,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_FOR_EACH,
    EFFECT_MODIFY_BOOST_ICONS,
    EFFECT_PLACE_THREAT,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_SHUFFLE_DECK,
    EFFECT_TAKE_DAMAGE,
    PLACE_DECK,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_FORCED_INTERRUPT,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_THIS,
    TARGET_ALL_PLAYERS,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_SCENARIO,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRAIT_TEMPORAL,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOU_BASIC_DEFENSE,
    TRIGGER_YOU_BASIC_THWART,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import hulk from '../../../mc-data/seed/catalog/heroes/hulk.js';
import kang from '../../../mc-data/seed/catalog/scenarios/kang.js';
import standard from '../../../mc-data/seed/catalog/sets/standard.js';
import temporal from '../../../mc-data/seed/catalog/sets/temporal.js';

const kangConfig = structuredClone(kang.config);
const blackPantherConfig = structuredClone(blackPanther.config);

describe('Kang scenario', () => {
    test('Recuerdos robados cycles the player deck after taking its available top cards', async () => {
        const setConfigs = new Map([
            ['standard', structuredClone(standard.config)],
            ['temporal', structuredClone(temporal.config)],
        ]);
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                data: {
                    async getSetConfig(id) {
                        return setConfigs.get(id);
                    },
                },
            },
            name: 'stolen-memories-deck-cycle-test',
        });
        match.openDialog = async () => ({});
        match.persist = async () => {};
        match.refresh = async () => {};
        const factory = new MatchFactory(match);
        const superhero = factory.createSuperhero(
            structuredClone(blackPantherConfig)
        );
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Jugador',
            superhero,
            initial: true,
        });
        player.initPlayer();
        player.gameZone = new PlayerZone({owner: player});

        const scenario = await factory.createScenario(
            structuredClone(kang.config)
        );
        match.addScenario(scenario);
        const dealtEncounterCounts = [];
        match.drawEncounterCards = async count => {
            dealtEncounterCounts.push(count);
            return [];
        };
        await scenario.initScenario(match.createObligations(), false);
        const dealtEncounterCountBeforeReveal = dealtEncounterCounts.length;

        const stolenMemories = scenario.deck.cards.find(card =>
            card.name === 'Recuerdos robados');
        assert.ok(stolenMemories);

        const facedownCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Carta tomada del mazo'},
        }, {owner: player});
        const recycledCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name: 'Carta de la pila de descartes'},
        }, {owner: player});
        player.deck.cards = [facedownCard];
        player.deck.discardPile = [recycledCard];
        let shuffleCount = 0;
        player.deck.shuffle = () => {
            shuffleCount += 1;
        };

        await new RevealEncounterEffect({
            card: stolenMemories,
            player,
            match,
        }).runEffect({player});

        assert.deepEqual(
            stolenMemories.faceDown.map(({card}) => card.id),
            [facedownCard.id]
        );
        assert.deepEqual(
            player.deck.cards.map(card => card.id),
            [recycledCard.id]
        );
        assert.deepEqual(player.deck.discardPile, []);
        assert.equal(shuffleCount, 1);
        assert.deepEqual(
            dealtEncounterCounts.slice(dealtEncounterCountBeforeReveal),
            [1]
        );
    });

    for (const optionIndex of [0, 1]) {
        test(`Kang attack choice ${optionIndex} resolves once and continues the attack`, async () => {
            const match = new Match({
                mc: {mcSocket: {send() {}}},
                name: `kang-attack-choice-${optionIndex}`,
            });
            match.persist = async () => {};
            match.refresh = async () => {};
            match.openDialog = async () => ({});
            const factory = new MatchFactory(match);
            const player = match.createPlayer({
                name: 'Jugador',
                initial: true,
                superhero: factory.createSuperhero({
                    ...blackPanther.config,
                    cards: [],
                    precon: [],
                    nemesis: [],
                    obligation: undefined,
                }),
            });
            player.initPlayer();
            player.superhero.selectedSide = 1;
            match.currentPlayer = player;
            const scenario = await factory.createScenario({
                ...structuredClone(kangConfig),
                cards: structuredClone(standard.config.cards),
                sets: [],
                defaultSets: [],
            });
            match.addScenario(scenario);
            await scenario.initScenario([], false);
            match.phase = 'villain';
            match.playing = true;
            const villain = match.villain;
            const scheme = scenario.gameZone.currentScheme.currentSide;
            const startingThreat = scheme.threat;
            const baseAttack = await villain.getAttackValue({player});
            let choiceDialogs = 0;
            let defenseDialogs = 0;
            let selectedOption = optionIndex;
            match.openDialog = async dialog => {
                if (dialog.dialogType === DIALOG_USE_CARD) {
                    return {selected: {id: villain.id}};
                }
                if (dialog.dialogType === DIALOG_LIST) {
                    choiceDialogs++;
                    assert.ok(choiceDialogs <= 2, 'The interruption must not repeat within an attack');
                    assert.equal(dialog.data.options.length, 2);
                    assert.ok(dialog.data.options.every(option =>
                        option.text && !option.triggers));
                    return {selected: {id: selectedOption}};
                }
                if (dialog.dialogType === DIALOG_DEFENSE) {
                    defenseDialogs++;
                }
                return {};
            };
            const attack = new EnemyAttackEffect({
                match,
                enemy: villain,
                selectedTarget: player,
                giveBoost: false,
            });
            const trigger = villain.triggers[TRIGGER_VILLAIN_ATTACKS_YOU]
                [PRIORITY_FORCED_INTERRUPT][0];
            const grouped = await attack._getCardTriggers([trigger], {player, effect: attack});
            assert.equal(grouped.cardsTriggers[villain.id].triggers[0], trigger);

            await attack.runEffect({player});

            assert.equal(attack.resolved, true);
            assert.equal(choiceDialogs, 1);
            assert.equal(defenseDialogs, 1);
            assert.equal(scheme.threat, startingThreat + (optionIndex === 0 ? 1 : 0));
            assert.equal(player.superhero.damage, baseAttack + (optionIndex === 1 ? 2 : 0));
            assert.equal(trigger.hasTriggeredFor(attack), true);
            assert.equal(await villain.getAttackValue({player}), baseAttack);

            selectedOption = 0;
            const previousDamage = player.superhero.damage;
            const nextAttack = new EnemyAttackEffect({
                match,
                enemy: villain,
                selectedTarget: player,
                giveBoost: false,
            });
            await nextAttack.runEffect({player});

            assert.equal(nextAttack.resolved, true);
            assert.equal(choiceDialogs, 2);
            assert.equal(defenseDialogs, 2);
            assert.equal(player.superhero.damage, previousDamage + baseAttack);
            assert.equal(scheme.threat, startingThreat + (optionIndex === 0 ? 2 : 1));
        });
    }

    test('Kang catalog creates all printed villain and main-scheme stages', async () => {
        const setConfigs = new Map([
            ['standard', standard.config],
            ['temporal', temporal.config],
        ]);
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                data: {
                    async getSetConfig(id) {
                        return setConfigs.get(id);
                    },
                },
            },
            name: 'kang-catalog-test',
        });
        const scenario = await new MatchFactory(match).createScenario(kang.config);

        assert.deepEqual(kang.config.sets, ['standard']);
        assert.deepEqual(kang.config.defaultSets, ['temporal']);
        const villains = [...scenario.villains, ...scenario.expertVillains];
        assert.equal(villains.length, 12);
        assert.deepEqual(
            villains.map(villain => villain.stage).sort(),
            [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3]
        );
        assert.equal(scenario.allMainSchemes.length, 7);
        assert.equal(scenario.excludeObligations, undefined);
        assert.ok(villains
            .filter(villain => villain.stage === 3)
            .every(villain => villain.card.final !== true));
        assert.equal(scenario.apart.length, 4);
        assert.ok(scenario.apart.every(card => card.name === 'El dominio de Kang'));
        const debilitado = kang.config.cards.find(({card}) =>
            card.params.name === 'Debilitado');
        assert.ok(debilitado);
        assert.equal(debilitado.count, 2);
        assert.equal(debilitado.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(debilitado.card.params.image, 'scenarios/kang/11018.png');
        assert.equal(debilitado.card.params.boost, 2);
        assert.deepEqual(debilitado.card.params.traits, [TRAIT_TEMPORAL]);

        const detained = kang.config.cards.find(({card}) =>
            card.params.name === 'Retenido');
        assert.ok(detained);
        assert.equal(detained.count, 1);
        assert.equal(detained.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(detained.card.params.image, 'scenarios/kang/11024.png');
        assert.equal(detained.card.params.boost, 2);
        assert.equal(detained.card.params.startingThreat, 2);
        assert.deepEqual(detained.card.params.icons, {crisis: true});
        assert.deepEqual(detained.card.params.abilities[0], {
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_PLACE_THREAT,
                    params: {
                        target: TARGET_THIS,
                        paramsCalc: {
                            target: 'effect.ability.card.scenarioZone.players.*.gameZone.inPlayCards',
                            formula: CALC_COUNT,
                            conditions: {isObligation: true},
                            multiply: 2,
                        },
                    },
                },
            },
        });

        const desbocado = kang.config.cards.find(({card}) =>
            card.params.name === 'Desbocado');
        assert.ok(desbocado);
        assert.equal(desbocado.count, 2);
        assert.equal(desbocado.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(desbocado.card.params.image, 'scenarios/kang/11025.png');
        assert.equal(desbocado.card.params.boost, 2);
        assert.equal(desbocado.card.params.startingThreat, 4);
        assert.deepEqual(desbocado.card.params.abilities[0], {
            type: ABILITY_WHEN_DEFEATED,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_DISCARD_UNTIL,
                                params: {
                                    target: TARGET_ENCOUNTER_DECK,
                                    condition: {isMinion: true},
                                },
                            },
                            {
                                type: EFFECT_ENGAGE,
                                params: {target: TARGET_YOU},
                            },
                        ],
                    },
                },
            },
        });
        const desbocadoInstances = scenario.scenarioCards.filter(card =>
            card.name === 'Desbocado');
        assert.equal(desbocadoInstances.length, 2);
        assert.equal(
            typeof desbocadoInstances[0].abilities[0].effect.canRun,
            'function'
        );

        const stolenMemories = kang.config.cards.find(({card}) =>
            card.params.name === 'Recuerdos robados');
        assert.ok(stolenMemories);
        assert.equal(stolenMemories.count, 2);
        assert.equal(stolenMemories.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(stolenMemories.card.params.image, 'scenarios/kang/11019.png');
        assert.equal(stolenMemories.card.params.boost, 2);
        assert.deepEqual(stolenMemories.card.params.traits, [TRAIT_TEMPORAL]);
        assert.equal(stolenMemories.card.params.keywords, undefined);
        assert.deepEqual(
            kang.config.cards.map(({card}) =>
                Number(card.params.image.match(/(\d+)\.png$/)?.[1])),
            [11014, 11015, 11016, 11017, 11018, 11019, 11020, 11021, 11022, 11024, 11025, 11026, 11027, 11028, 11029]
        );
        const timeTravelTactics = kang.config.cards.find(({card}) =>
            card.params.name === 'Tácticas de viaje en el tiempo');
        assert.ok(timeTravelTactics);
        assert.equal(timeTravelTactics.count, 2);
        assert.equal(timeTravelTactics.card.type, CARD_TYPE_TREACHERY);
        assert.equal(timeTravelTactics.card.params.image, 'scenarios/kang/11028.png');
        assert.equal(timeTravelTactics.card.params.boost, 1);
        assert.deepEqual(timeTravelTactics.card.params.keywords, {surge: true});

        const [timeTravelTacticsReveal] = timeTravelTactics.card.params.abilities;
        assert.equal(timeTravelTacticsReveal.type, ABILITY_WHEN_REVEALED);
        assert.equal(timeTravelTacticsReveal.params.effect.type, EFFECT_FOR_EACH);
        assert.equal(timeTravelTacticsReveal.params.effect.params.target, TARGET_ALL_PLAYERS);
        assert.equal(
            timeTravelTacticsReveal.params.effect.params.effect.type,
            EFFECT_ASSIGN_DAMAGE
        );
        assert.equal(
            timeTravelTacticsReveal.params.effect.params.effect.params.target,
            TARGET_ALL_CHARACTERS_YOU_CONTROL
        );
        assert.deepEqual(
            timeTravelTacticsReveal.params.effect.params.effect.params.paramsCalc,
            {
                target: 'player.gameZone.cards',
                formula: CALC_COUNT,
                conditions: {isObligation: true},
            }
        );
        assert.equal(timeTravelTactics.card.params.boostAbility.type, ABILITY_BOOST);
        assert.equal(
            timeTravelTactics.card.params.boostAbility.params.effect.type,
            EFFECT_MODIFY_BOOST_ICONS
        );
        assert.equal(
            timeTravelTactics.card.params.boostAbility.params.effect.params.target,
            TARGET_EFFECT
        );
        assert.deepEqual(
            timeTravelTactics.card.params.boostAbility.params.effect.params.paramsCalc,
            {
                target: 'player.gameZone.cards',
                formula: CALC_COUNT,
                conditions: {isObligation: true},
            }
        );
        const [stolenMemoriesReveal, stolenMemoriesAction] =
            stolenMemories.card.params.abilities;
        assert.equal(stolenMemoriesReveal.type, ABILITY_WHEN_REVEALED);
        assert.deepEqual(stolenMemoriesReveal.params.effect, {
            type: EFFECT_FACEDOWN,
            params: {
                target: TARGET_THIS,
                count: 8,
                from: PLACE_DECK,
            },
        });
        assert.equal(stolenMemoriesAction.type, ABILITY_ALTEREGO_ACTION);
        assert.deepEqual(
            stolenMemoriesAction.params.arrow.params.filter,
            {resources: RESOURCE_MENTAL}
        );
        assert.deepEqual(stolenMemoriesAction.params.effect, {
            type: EFFECT_DISCARD_GAME,
            params: {target: TARGET_THIS},
        });

        const designsOfThePast = kang.config.cards.find(({card}) =>
            card.params.name === 'Designios del pasado');
        assert.ok(designsOfThePast);
        assert.equal(designsOfThePast.count, 1);
        assert.equal(designsOfThePast.card.type, CARD_TYPE_TREACHERY);
        assert.equal(designsOfThePast.card.params.image, 'scenarios/kang/11029.png');
        assert.equal(designsOfThePast.card.params.boost, 3);
        assert.deepEqual(designsOfThePast.card.params.keywords, {incite: 1});
        const [designsOfThePastReveal] = designsOfThePast.card.params.abilities;
        assert.equal(designsOfThePastReveal.type, ABILITY_WHEN_REVEALED);
        assert.deepEqual(designsOfThePastReveal.params.effect, {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_FOR_EACH,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effect: {
                                type: EFFECT_SEARCH_CARD_REVEAL,
                                params: {
                                    condition: {isObligation: true},
                                    excludeNames:
                                        'forEachResults.*.cards.*.name',
                                    places: [
                                        PLACE_ENCOUNTER_DECK_CARDS,
                                        PLACE_ENCOUNTER_DISCARD,
                                    ],
                                },
                            },
                        },
                    },
                    {
                        type: EFFECT_SHUFFLE_DECK,
                        params: {target: TARGET_SCENARIO},
                    },
                ],
            },
        });

        const stageThreeSides = scenario.allMainSchemes
            .flatMap(scheme => scheme.sides)
            .filter(side => side.stage === 3);
        assert.equal(stageThreeSides.length, 8);
        assert.ok(stageThreeSides
            .filter(side => side.isMainScheme && side.final === false)
            .every(side => side.value === 9));
        assert.ok(stageThreeSides
            .filter(side => side.isMainScheme && side.final === false)
            .every(side => !Array.isArray(side.value)));
    });

    test('Designios del pasado gives each player a different Obligation name', async () => {
        const setConfigs = new Map([
            ['standard', standard.config],
            ['temporal', temporal.config],
        ]);
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                data: {
                    async getSetConfig(id) {
                        return setConfigs.get(id);
                    },
                },
            },
            name: 'kang-designs-of-the-past-test',
        });
        match.openDialog = async () => ({});
        match.persist = async () => {};
        match.refresh = async () => {};
        const factory = new MatchFactory(match);
        const players = [0, 1].map(index => {
            const superhero = factory.createSuperhero(
                structuredClone(blackPantherConfig)
            );
            superhero.selectedSide = 1;
            const player = match.createPlayer({
                name: `Jugador ${index + 1}`,
                superhero,
                initial: index === 0,
            });
            player.initPlayer();
            player.gameZone = new PlayerZone({owner: player});

            return player;
        });
        const scenario = await factory.createScenario(kang.config);
        match.addScenario(scenario);
        match.drawEncounterCards = async () => [];
        await scenario.initScenario(match.createObligations(), false);

        const getScenarioCard = name => scenario.deck.cards.find(card =>
            card.name === name);
        const designsOfThePast = getScenarioCard('Designios del pasado');
        const deckObligation = getScenarioCard('Debilitado');
        assert.ok(designsOfThePast);
        assert.ok(deckObligation);
        const duplicateDeckObligation = Object.assign(
            Object.create(Object.getPrototypeOf(deckObligation)),
            deckObligation,
            {id: `${deckObligation.id}-duplicate`}
        );
        const discardObligation = getScenarioCard('Sin poderes');
        const otherCard = scenario.deck.cards.find(card =>
            !card.isObligation && card !== designsOfThePast);
        assert.ok(duplicateDeckObligation);
        assert.ok(discardObligation);
        assert.ok(otherCard);
        scenario.deck.cards = [
            deckObligation,
            duplicateDeckObligation,
            otherCard,
        ];
        scenario.deck.discardPile = [discardObligation];

        let shuffleCount = 0;
        scenario.deck.shuffle = () => {
            shuffleCount++;
        };
        let searchDialogs = 0;
        const shownCards = [];
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_SELECT_PLACES) {
                searchDialogs++;
                assert.deepEqual(
                    dialog.data.places[PLACE_ENCOUNTER_DECK_CARDS]
                        .map(card => card.id),
                    [deckObligation.id]
                );
                assert.deepEqual(
                    dialog.data.places[PLACE_ENCOUNTER_DISCARD]
                        .map(card => card.id),
                    [discardObligation.id]
                );

                return {
                    selected: {
                        place: PLACE_ENCOUNTER_DECK_CARDS,
                        card: {id: deckObligation.id},
                    },
                };
            }
            if (dialog.dialogType === DIALOG_ENCOUNTERS_REVEAL) {
                assert.equal(dialog.showToAll, true);
                shownCards.push(dialog.data.card.name);
            }

            return {};
        };

        const mainScheme = scenario.gameZone.currentScheme.currentSide;
        const startingThreat = mainScheme.threat;
        await new RevealEncounterEffect({
            card: designsOfThePast,
            player: players[0],
            match,
        }).runEffect({player: players[0]});

        assert.equal(mainScheme.threat, startingThreat + 1);
        assert.equal(searchDialogs, 1);
        assert.equal(shuffleCount, 1);
        assert.deepEqual(shownCards, [
            'Designios del pasado',
            'Debilitado',
            'Sin poderes',
        ]);
        assert.ok(players[0].gameZone.cards.includes(deckObligation));
        assert.ok(players[1].gameZone.cards.includes(discardObligation));
        assert.equal(scenario.deck.cards.includes(deckObligation), false);
        assert.ok(scenario.deck.cards.includes(duplicateDeckObligation));
        assert.equal(scenario.deck.discardPile.includes(discardObligation), false);
    });

    test('Kang encounter abilities respect player and scenario obligation scopes in split zones', async () => {
        const setConfigs = new Map([
            ['standard', standard.config],
            ['temporal', temporal.config],
        ]);
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                data: {
                    async getSetConfig(id) {
                        return setConfigs.get(id);
                    },
                },
            },
            name: 'kang-retenido-test',
        });
        match.openDialog = async () => ({});
        match.persist = async () => {};
        match.refresh = async () => {};
        const factory = new MatchFactory(match);
        const players = [0, 1].map(index => {
            const superhero = factory.createSuperhero(
                structuredClone(blackPantherConfig)
            );
            superhero.selectedSide = 1;
            const player = match.createPlayer({
                name: `Jugador ${index + 1}`,
                superhero,
                initial: index === 0,
            });
            player.initPlayer();
            player.gameZone = new PlayerZone({owner: player});

            return player;
        });
        const scenario = await factory.createScenario(kang.config);
        match.addScenario(scenario);
        match.drawEncounterCards = async () => [];
        await scenario.initScenario(match.createObligations(), false);
        await scenario.advanceMainScheme(
            scenario.gameZone,
            2,
            match.initialPlayer
        );

        const splitZones = scenario.zones.filter(zone =>
            zone.currentScheme?.currentSide?.stage === 3);
        assert.equal(splitZones.length, 2);
        assert.equal(new Set(players.map(player =>
            player.scenarioZone)).size, players.length);

        assert.deepEqual(
            scenario.sets.map(({name}) => name),
            [standard.config.name, temporal.config.name]
        );
        const detainedCards = scenario.deck.cards.filter(card =>
            card.name === 'Retenido');
        assert.equal(detainedCards.length, 1);
        const [revealAbility] = detainedCards[0].abilities;
        assert.equal(typeof revealAbility.effect.canRun, 'function');
        const obligations = scenario.deck.cards.filter(card =>
            card.name === 'Debilitado');
        assert.equal(obligations.length, 2);

        for (const obligation of obligations) {
            await new RevealEncounterEffect({
                card: obligation,
                player: players[0],
                match,
            }).runEffect({player: players[0]});
        }
        const obligationInOtherZone = scenario.deck.cards.find(card =>
            card.name === 'Sin poderes');
        assert.ok(obligationInOtherZone);
        await new RevealEncounterEffect({
            card: obligationInOtherZone,
            player: players[1],
            match,
        }).runEffect({player: players[1]});

        const inPlayObligations = match.inPlayCards.filter(card => card.isObligation);
        assert.equal(inPlayObligations.length, 3);
        assert.equal(
            players[0].gameZone.cards.filter(card => card.isObligation).length,
            2
        );
        assert.equal(
            players[1].gameZone.cards.filter(card => card.isObligation).length,
            1
        );
        const [retained] = detainedCards;
        await new RevealEncounterEffect({
            card: retained,
            player: players[0],
            match,
        }).runEffect({player: players[0]});

        assert.equal(retained.isInPlay, true);
        assert.equal(retained.threat, 6);
        assert.equal(retained.scenarioZone, players[0].scenarioZone);
        assert.ok(players[0].scenarioZone.cards.includes(retained));
        assert.ok(!players[1].scenarioZone.cards.includes(retained));

        const timeTravelTactics = scenario.deck.cards.find(card =>
            card.name === 'Tácticas de viaje en el tiempo');
        assert.ok(timeTravelTactics);
        const timeTravelTacticsDefinition = kang.config.cards.find(({card}) =>
            card.params.name === 'Tácticas de viaje en el tiempo').card;
        const revealedTactics = factory.cardsFactory.createGameCardFromConfig({
            ...timeTravelTacticsDefinition,
            params: {
                ...timeTravelTacticsDefinition.params,
                keywords: {},
            },
        }, {owner: scenario});

        const damageBeforeReveal = players.map(player => player.superhero.damage);
        await new RevealEncounterEffect({
            card: revealedTactics,
            player: players[1],
            match,
        }).runEffect({player: players[1]});

        assert.equal(
            players[0].superhero.damage - damageBeforeReveal[0],
            0
        );
        assert.equal(
            players[1].superhero.damage - damageBeforeReveal[1],
            1
        );

        for (const [player, expectedBoost] of [
            [players[0], 3],
            [players[1], 2],
        ]) {
            const boostEffect = new ResolveBoostEffect({
                card: timeTravelTactics,
                enemyActivation: {boostCards: [timeTravelTactics]},
                match,
            });
            await boostEffect.runEffect({player});
            assert.equal(boostEffect.value, expectedBoost);
        }
    });

    test('Kang Obligations stay with their revealing player and resolve their printed effects', async () => {
        const setConfigs = new Map([
            ['standard', standard.config],
            ['temporal', temporal.config],
        ]);
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                data: {
                    async getSetConfig(id) {
                        return setConfigs.get(id);
                    },
                },
            },
            name: 'kang-debilitado-test',
        });
        match.openDialog = async () => ({});
        match.persist = async () => {};
        match.refresh = async () => {};
        const factory = new MatchFactory(match);
        const players = [0, 1].map(index => {
            const superhero = factory.createSuperhero(
                structuredClone(blackPantherConfig)
            );
            superhero.selectedSide = 1;
            const player = match.createPlayer({
                name: `Jugador ${index + 1}`,
                superhero,
                initial: index === 0,
            });
            player.initPlayer();
            player.gameZone = new PlayerZone({owner: player});

            return player;
        });
        const scenario = await factory.createScenario(kang.config);
        match.addScenario(scenario);
        match.drawEncounterCards = async () => [];
        await scenario.initScenario(match.createObligations(), false);
        const debilitados = scenario.deck.cards.filter(card =>
            card.name === 'Debilitado');
        assert.equal(debilitados.length, 2);

        for (const [index, player] of players.entries()) {
            await new RevealEncounterEffect({
                card: debilitados[index],
                player,
                match,
            }).runEffect({player});
            assert.equal(debilitados[index].controller, player);
            assert.ok(player.gameZone.cards.includes(debilitados[index]));
        }

        const physicalEvent = {
            id: 'physical-event',
            isResource: false,
            resources: [RESOURCE_PHYSICAL],
        };
        const mentalResource = {
            id: 'mental-resource',
            isResource: true,
            resources: [RESOURCE_MENTAL],
        };
        players[0].hand.cards = [physicalEvent, mentalResource];
        const alteregoAction = debilitados[0].abilities.find(ability =>
            ability.isAction &&
                ability.arrow?.cost?.effectType === EFFECT_SELECT_DISCARD_CARD);
        assert.equal(alteregoAction.arrow.cost.effectType, EFFECT_SELECT_DISCARD_CARD);
        assert.equal(alteregoAction.arrow.cost.count, 1);
        assert.deepEqual(
            alteregoAction.arrow.cost.cardFilter,
            {resources: RESOURCE_PHYSICAL}
        );
        assert.deepEqual(
            alteregoAction.arrow.cost.getEligibleCards(players[0]),
            [physicalEvent]
        );
        assert.equal(alteregoAction.effect.effectType, EFFECT_DISCARD_GAME);
        assert.equal(alteregoAction.effect.target, TARGET_THIS);

        players[0].hand.cards = [];
        const stolenMemories = scenario.deck.cards.find(card =>
            card.name === 'Recuerdos robados');
        assert.ok(stolenMemories);
        const topCards = Array.from({length: 10}, (_, index) =>
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {name: `Carta superior ${index + 1}`},
            }, {owner: players[0]}));
        const expectedFacedownCardIds = topCards.slice(0, 8)
            .map(card => card.id);
        const expectedDeckCardIds = topCards.slice(8)
            .map(card => card.id);
        players[0].deck.cards = topCards;
        await new RevealEncounterEffect({
            card: stolenMemories,
            player: players[0],
            match,
        }).runEffect({player: players[0]});

        assert.ok(players[0].gameZone.cards.includes(stolenMemories));
        assert.deepEqual(
            stolenMemories.faceDown.map(({card}) => card.id),
            expectedFacedownCardIds
        );
        assert.deepEqual(
            players[0].deck.cards.map(card => card.id),
            expectedDeckCardIds
        );

        players[0].superhero.selectedSide = 0;
        players[0].hand.cards = [physicalEvent, mentalResource];
        const stolenMemoriesAction = stolenMemories.abilities.find(ability =>
            ability.isAction &&
                ability.arrow?.cost?.effectType === EFFECT_SELECT_DISCARD_CARD);
        assert.ok(stolenMemoriesAction);
        assert.equal(typeof stolenMemoriesAction.effect.canRun, 'function');
        assert.equal(stolenMemoriesAction.arrow.cost.effectType, EFFECT_SELECT_DISCARD_CARD);
        assert.deepEqual(
            stolenMemoriesAction.arrow.cost.cardFilter,
            {resources: RESOURCE_MENTAL}
        );
        assert.deepEqual(
            stolenMemoriesAction.arrow.cost.getEligibleCards(players[0]),
            [mentalResource]
        );
        assert.equal(stolenMemoriesAction.effect.effectType, EFFECT_DISCARD_GAME);
        assert.equal(stolenMemoriesAction.effect.target, TARGET_THIS);
        const mentalResourceCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso mental',
                resources: [RESOURCE_MENTAL],
            },
        }, {owner: players[0]});
        players[0].hand.cards = [mentalResourceCard];
        let discardDialogCount = 0;
        match.openDialog = async ({dialogType, data}) => {
            assert.equal(dialogType, DIALOG_DISCARD_HAND);
            assert.deepEqual(data.cards.map(({id}) => id), [mentalResourceCard.id]);
            discardDialogCount++;

            return {selected: [{id: mentalResourceCard.id}]};
        };
        await stolenMemoriesAction.resolveAbility({
            card: stolenMemories,
            player: players[0],
        });
        assert.equal(discardDialogCount, 1);
        assert.ok(!players[0].hand.cards.includes(mentalResourceCard));
        assert.ok(players[0].deck.discardPile.includes(mentalResourceCard));
        assert.ok(!players[0].gameZone.cards.includes(stolenMemories));
        assert.ok(scenario.deck.discardPile.includes(stolenMemories));
        players[0].superhero.selectedSide = 1;

        const basicAttack = {
            ability: {isBasic: true},
            character: players[0].superhero.currentSide,
            isAttack: true,
        };
        const otherPlayerBasicAttack = {
            ...basicAttack,
            character: players[1].superhero.currentSide,
        };
        const labeledAttack = {
            ...basicAttack,
            ability: {isAttack: true, isBasic: false},
        };
        const ownAttackTrigger = debilitados[0].triggers[TRIGGER_YOU_BASIC_ATTACK]
            [PRIORITY_FORCED_RESPONSE][0];
        assert.equal(
            ownAttackTrigger.ability.effect.effectType,
            EFFECT_TAKE_DAMAGE
        );
        assert.equal(ownAttackTrigger.ability.effect.target, TARGET_YOUR_SUPERHERO);
        assert.equal(ownAttackTrigger.ability.effect.damage, 1);
        assert.equal(
            await ownAttackTrigger.canTrigger({
                player: players[0],
                effect: basicAttack,
            }),
            true
        );
        assert.equal(
            await ownAttackTrigger.canTrigger({
                player: players[0],
                effect: labeledAttack,
            }),
            false
        );
        assert.equal(
            await ownAttackTrigger.canTrigger({
                player: players[1],
                effect: otherPlayerBasicAttack,
            }),
            false
        );

        const ownThwartTrigger = debilitados[0].triggers[TRIGGER_YOU_BASIC_THWART]
            [PRIORITY_FORCED_RESPONSE][0];
        const basicThwart = {
            ability: {isBasic: true},
            character: players[0].superhero.currentSide,
            isThwart: true,
        };
        const labeledThwart = {
            ...basicThwart,
            ability: {isBasic: false, isThwart: true},
        };
        assert.equal(ownThwartTrigger.ability.effect.effectType, EFFECT_TAKE_DAMAGE);
        assert.equal(ownThwartTrigger.ability.effect.damage, 1);
        assert.equal(
            await ownThwartTrigger.canTrigger({
                player: players[0],
                effect: basicThwart,
            }),
            true
        );
        assert.equal(
            await ownThwartTrigger.canTrigger({
                player: players[0],
                effect: labeledThwart,
            }),
            false
        );
        assert.equal(
            await ownThwartTrigger.canTrigger({
                player: players[1],
                effect: {...otherPlayerBasicAttack, isAttack: false, isThwart: true},
            }),
            false
        );

        const attack = new EnemyAttackEffect({
            enemy: {isVillain: false, name: 'Minion'},
            match,
            selectedTarget: players[0],
        });
        attack.trigger = async () => true;
        await attack.setDefender(
            players[0].superhero,
            players[0],
            {},
            {exhaust: false}
        );
        assert.equal(attack.hasBasicDefenseFor(players[0]), true);
        assert.ok(attack.getTriggersEnds({}).includes(TRIGGER_YOU_BASIC_DEFENSE));
        const ownDefenseTrigger = debilitados[0].triggers[TRIGGER_YOU_BASIC_DEFENSE]
            [PRIORITY_FORCED_RESPONSE][0];
        assert.equal(
            await ownDefenseTrigger.canTrigger({
                player: players[0],
                effect: attack,
            }),
            true
        );
        assert.equal(
            await ownDefenseTrigger.canTrigger({
                player: players[1],
                effect: attack,
            }),
            false
        );

        const labeledDefense = new EnemyAttackEffect({
            enemy: {isVillain: false, name: 'Minion'},
            match,
            selectedTarget: players[0],
        });
        labeledDefense.trigger = async () => true;
        await labeledDefense.setDefenderByAbility(players[0]);
        assert.equal(labeledDefense.hasBasicDefenseFor(players[0]), false);
        assert.ok(!labeledDefense.getTriggersEnds({})
            .includes(TRIGGER_YOU_BASIC_DEFENSE));
    });

    test('Temporal can be omitted from Kang as an optional modular set', async () => {
        const mc = {
            mcSocket: {send() {}},
            data: {
                async getScenarioConfig() {
                    return structuredClone(kangConfig);
                },
                async getSetConfig(id) {
                    return id === 'standard' ? standard.config : temporal.config;
                },
            },
        };
        const match = new Match({mc, name: 'kang-optional-temporal-test'});
        const scenarioRest = new ScenarioRest({mc});

        await scenarioRest.createScenario({
            match,
            scenario: 'kang',
            modularSets: [],
        });

        assert.deepEqual(kangConfig.sets, ['standard']);
        assert.deepEqual(kangConfig.defaultSets, ['temporal']);
        assert.deepEqual(
            match.scenario.sets.map(({name}) => name),
            [standard.config.name]
        );
        assert.deepEqual(match.creationConfig.scenario.defaultSets, []);
    });

    test('Kang setup removes only player Obligations and selects the stage I Villain', async () => {
        const standardWithObligation = {
            ...standard.config,
            cards: [
                ...standard.config.cards,
                {
                    count: 1,
                    card: {
                        type: CARD_TYPE_OBLIGATION,
                        params: {
                            name: 'Obligación modular de prueba',
                            set: 'standard',
                            image: 'sets/standard/01186.png',
                            boost: 0,
                        },
                    },
                },
            ],
        };
        const setConfigs = new Map([
            ['standard', standardWithObligation],
            ['temporal', temporal.config],
        ]);
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                dialog: {async openDialog() {return {};}},
                data: {
                    async getSetConfig(id) {
                        return setConfigs.get(id);
                    },
                },
            },
            name: 'kang-setup-test',
        });
        const factory = new MatchFactory(match);
        const superhero = factory.createSuperhero(blackPanther.config);
        const player = match.createPlayer({name: 'Jugador 1', superhero, initial: true});
        player.initPlayer();
        const scenario = await factory.createScenario(kang.config);
        match.addScenario(scenario);
        const drawEncounterCards = match.drawEncounterCards.bind(match);
        let deckBeforeDeal;
        match.drawEncounterCards = async count => {
            deckBeforeDeal ??= scenario.deck.cards.slice();
            return drawEncounterCards(count);
        };

        await scenario.initScenario(match.createObligations(), false);

        assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 1);
        assert.equal(scenario.gameZone.currentVillain.stage, 1);
        assert.equal(scenario.gameZone.currentVillain.name, 'Kang (El Conquistador)');
        const playerObligationsBeforeDeal = deckBeforeDeal.filter(card =>
            card.isObligation && card.owner?.isPlayer);
        assert.equal(playerObligationsBeforeDeal.length, 0);
        const obligationsBeforeDeal = deckBeforeDeal.filter(card =>
            card.isObligation);
        assert.equal(obligationsBeforeDeal.length, 9);
        assert.equal(
            obligationsBeforeDeal.filter(card => card.set === 'kang').length,
            8
        );
        assert.ok(obligationsBeforeDeal.some(card =>
            card.name === 'Obligación modular de prueba'));
        assert.equal(match.initialPlayer.encounters.length, 1);
    });

    test('Desbocado engages the discarded minion with the player who defeated it', async () => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'kang-desbocado-test',
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD &&
                dialog.data?.cards?.length) {
                return {selected: {id: dialog.data.cards[0].id}};
            }

            return {};
        };
        const factory = new MatchFactory(match);
        const players = [
            match.createPlayer({
                name: 'Jugador 1',
                initial: true,
                superhero: factory.createSuperhero({
                    ...blackPanther.config,
                    cards: [],
                    precon: [],
                    nemesis: [],
                    obligation: undefined,
                }),
            }),
            match.createPlayer({
                name: 'Jugador 2',
                superhero: factory.createSuperhero({
                    ...blackPanther.config,
                    cards: [],
                    precon: [],
                    nemesis: [],
                    obligation: undefined,
                }),
            }),
        ];
        players.forEach(player => player.initPlayer());

        const scenario = await factory.createScenario({
            ...structuredClone(kangConfig),
            cards: ['Desbocado', 'Macrobots'].map(name => ({
                count: 1,
                card: structuredClone(kangConfig.cards.find(({card}) =>
                    card.params.name === name).card),
            })),
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        const zone = scenario.createZone();
        players.forEach(player => zone.addPlayer(player));
        scenario.deck = new Deck({owner: scenario, isScenarioDeck: true});

        const desbocado = scenario.scenarioCards.find(card =>
            card.name === 'Desbocado');
        const minion = scenario.scenarioCards.find(card =>
            card.name === 'Macrobots');
        desbocado.owner = scenario;
        minion.owner = scenario;
        scenario.deck.addToDeck([minion]);

        await new PutPlayEffect({
            card: desbocado,
            controller: scenario,
            match,
        }).runEffect({player: players[0]});
        await new DefeatEffect({
            match,
            selectedTarget: desbocado,
        }).runEffect({player: players[1]});

        assert.ok(
            minion.engaged === players[1],
            'The minion should engage the player who defeated the scheme.'
        );
        assert.ok(players[1].gameZone.minions.includes(minion));
        assert.ok(!players[0].gameZone.minions.includes(minion));
        assert.ok(!scenario.deck.discardPile.includes(minion));
        assert.equal(desbocado.isInPlay, false);
    });

    for (const expert of [false, true]) {
        for (const playerCount of [1, 2, 4]) {
            test(`Kang ${expert ? 'expert' : 'normal'} setup deals one facedown encounter to each of ${playerCount} players`, async () => {
                const setConfigs = new Map([
                    ['standard', standard.config],
                    ['temporal', temporal.config],
                ]);
                const match = new Match({
                    mc: {
                        mcSocket: {send() {}},
                        data: {
                            async getSetConfig(id) {
                                return setConfigs.get(id);
                            },
                        },
                    },
                    name: `kang-setup-encounters-${expert}-${playerCount}`,
                });
                match.openDialog = async () => ({});
                const factory = new MatchFactory(match);
                for (let index = 0; index < playerCount; index++) {
                    const player = match.createPlayer({
                        name: `Jugador ${index + 1}`,
                        superhero: factory.createSuperhero(structuredClone(blackPantherConfig)),
                        initial: index === 0,
                    });
                    player.initPlayer();
                }
                const scenario = await factory.createScenario(structuredClone(kangConfig));
                match.addScenario(scenario);
                const drawEncounterCards = match.drawEncounterCards.bind(match);
                let deckBeforeDeal;
                let drawn = 0;
                match.drawEncounterCards = async count => {
                    deckBeforeDeal ??= scenario.deck.cards.slice();
                    assert.equal(count, 1);
                    drawn += count;
                    return drawEncounterCards(count);
                };

                await scenario.initScenario(match.createObligations(), expert);

                assert.equal(drawn, playerCount);
                assert.equal(scenario.deck.cards.length, deckBeforeDeal.length - playerCount);
                const obligationsBeforeDeal = deckBeforeDeal.filter(card =>
                    card.isObligation);
                assert.equal(obligationsBeforeDeal.length, 8);
                assert.ok(obligationsBeforeDeal.every(card =>
                    card.set === 'kang'));
                const dealt = [];
                for (const [index, player] of match.players.entries()) {
                    assert.equal(player.encounters.length, 1);
                    assert.equal(player.encounters[0], deckBeforeDeal[index]);
                    assert.ok(!player.encounters[0].isInPlay);
                    assert.equal(player.gameZone.toObj().encounters, 1);
                    dealt.push(player.encounters[0]);
                }
                assert.equal(new Set(dealt).size, playerCount);
                assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 1);
                assert.equal(scenario.gameZone.currentVillain.stage, 1);
            });
        }
    }

    test('stage II splits players into local zones and prevents victory while local villains remain', async () => {
        const setConfigs = new Map([
            ['standard', standard.config],
            ['temporal', temporal.config],
        ]);
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                dialog: {async openDialog() {return {};}},
                data: {
                    async getSetConfig(id) {
                        return setConfigs.get(id);
                    },
                },
            },
            name: 'kang-split-setup-test',
        });
        match.openDialog = async () => ({});
        match.refresh = async () => {};
        const factory = new MatchFactory(match);
        for (let index = 0; index < 2; index++) {
            const superhero = factory.createSuperhero(blackPanther.config);
            const player = match.createPlayer({
                name: `Jugador ${index + 1}`,
                superhero,
                initial: index === 0,
            });
            player.gameZone = new PlayerZone({owner: player});
        }

        const scenario = await factory.createScenario(kang.config);
        match.addScenario(scenario);
        await scenario.initScenario(match.createObligations(), false);
        scenario.gameZone.currentScheme.currentSide.accelerationTokens = 2;
        await scenario.advanceMainScheme(
            scenario.gameZone,
            2,
            match.initialPlayer
        );

        const splitZones = scenario.zones.filter(zone =>
            zone.currentScheme?.currentSide?.stage === 3);
        assert.equal(splitZones.length, 2);
        assert.equal(new Set(match.players.map(player =>
            player.scenarioZone)).size, 2);
        assert.ok(splitZones.every(zone => zone.currentVillain.stage === 2));
        assert.ok(match.players.every(player =>
            player.gameZone.encounters.length === 2));
        assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 2);
        assert.equal(
            scenario.gameZone.currentScheme.currentSide.accelerationTokens,
            2,
        );

        const isolatedMainScheme = splitZones[0].currentScheme.currentSide;
        const centralMainScheme = scenario.gameZone.currentScheme.currentSide;
        assert.equal(
            centralMainScheme.abilities.filter(ability =>
                ability.globalScope).length,
            1,
        );
        const addAccelerationTokens = new AddAccelerationTokenEffect({
            count: 2,
            selectedTarget: isolatedMainScheme,
            match,
        });
        const openDialog = match.openDialog;
        match.openDialog = async dialog => ({
            selected: dialog.data.cards[0],
        });
        try {
            await addAccelerationTokens.runEffect({player: match.initialPlayer});
        } finally {
            match.openDialog = openDialog;
        }

        assert.equal(isolatedMainScheme.accelerationTokens, 0);
        assert.equal(centralMainScheme.accelerationTokens, 4);

        let accelerationDialog;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_ACCELERATE) {
                accelerationDialog = dialog;
            }
            return {};
        };
        const isolatedThreat = isolatedMainScheme.threat;
        await new AccelerateSchemeEffect({match}).runEffect({
            player: match.players[0],
        });
        assert.equal(accelerationDialog.data.accelerateTokens, 0);
        assert.equal(isolatedMainScheme.threat - isolatedThreat,
            accelerationDialog.data.accelerateBase +
                accelerationDialog.data.accelerateIcons);

        const finalVillain = scenario.findVillain({
            name: 'Kang (El Conquistador)',
            stage: 3,
        });
        const finishReasons = [];
        scenario.gameZone.addVillain(finalVillain);
        match.finishGame = async reason => finishReasons.push(reason);
        await scenario.selectVillain(match.initialPlayer, finalVillain);

        assert.deepEqual(finishReasons, []);
        assert.equal(scenario.gameZone.currentVillain, null);
    });

    test('stage II acceleration tokens transfer to stage IV when split zones merge', async () => {
        const setConfigs = new Map([
            ['standard', standard.config],
            ['temporal', temporal.config],
        ]);
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                dialog: {async openDialog() {return {};}},
                data: {
                    async getSetConfig(id) {
                        return setConfigs.get(id);
                    },
                },
            },
            name: 'kang-stage-four-acceleration-transfer-test',
        });
        match.openDialog = async () => ({});
        match.refresh = async () => {};
        const factory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Pantera Negra',
            superhero: factory.createSuperhero(blackPanther.config),
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});

        const scenario = await factory.createScenario(kang.config);
        match.addScenario(scenario);
        await scenario.initScenario(match.createObligations(), false);
        scenario.gameZone.currentScheme.currentSide.accelerationTokens = 3;
        await scenario.advanceMainScheme(scenario.gameZone, 2, player);

        const localZone = player.scenarioZone;
        const stageTwo = scenario.gameZone.currentScheme.currentSide;
        assert.equal(stageTwo.accelerationTokens, 3);
        assert.equal(localZone.currentScheme.currentSide.accelerationTokens, 0);

        match.openDialog = async dialog => ({
            selected: dialog.data?.cards?.[0],
        });
        await new AddAccelerationTokenEffect({
            count: 2,
            selectedTarget: localZone.currentScheme.currentSide,
            match,
        }).runEffect({player});
        assert.equal(stageTwo.accelerationTokens, 5);
        assert.equal(localZone.currentScheme.currentSide.accelerationTokens, 0);

        scenario.revealMainSchemeSide = async () => {};
        await scenario.mergeZone(localZone);

        assert.equal(scenario.gameZone.currentScheme.currentSide.stage, 4);
        assert.equal(scenario.gameZone.currentScheme.currentSide.accelerationTokens, 5);
        let stageFourDialog;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_ACCELERATE) {
                stageFourDialog = dialog;
            }
            return {};
        };
        await new AccelerateSchemeEffect({match}).runEffect({player});
        assert.equal(stageFourDialog.data.accelerateTokens, 5);
        assert.equal(
            stageFourDialog.data.accelerate,
            stageFourDialog.data.accelerateBase +
                stageFourDialog.data.accelerateIcons +
                5,
        );
    });

    test('stage III completion searches and stores an aside card under unused stage IV', async () => {
        const setConfigs = new Map([
            ['standard', standard.config],
            ['temporal', temporal.config],
        ]);
        const match = new Match({
            mc: {
                mcSocket: {send() {}},
                dialog: {async openDialog() {return {};}},
                data: {
                    async getSetConfig(id) {
                        return setConfigs.get(id);
                    },
                },
            },
            name: 'kang-stage-three-completion-test',
        });
        match.openDialog = async dialog => ({
            selected: dialog.data?.cards?.[0],
        });
        match.refresh = async () => {};
        const factory = new MatchFactory(match);
        const players = [
            match.createPlayer({
                name: 'Pantera Negra',
                superhero: factory.createSuperhero(blackPanther.config),
                initial: true,
            }),
            match.createPlayer({
                name: 'Hulk',
                superhero: factory.createSuperhero(hulk.config),
            }),
        ];
        players.forEach(player => {
            player.gameZone = new PlayerZone({owner: player});
        });

        const scenario = await factory.createScenario(kang.config);
        match.addScenario(scenario);
        await scenario.initScenario(match.createObligations(), false);
        await scenario.advanceMainScheme(
            scenario.gameZone,
            2,
            players[0]
        );

        const splitZone = scenario.zones.find(zone =>
            zone.currentScheme?.currentSide.stage === 3);
        const stageFour = scenario.findMainScheme(4);
        const asideCard = scenario.apart.find(card =>
            card.name === 'El dominio de Kang');
        splitZone.currentScheme.currentSide.threat = 9;
        await scenario.completeMainScheme(
            splitZone.currentScheme.currentSide,
            {player: splitZone.players[0]}
        );

        assert.equal(stageFour.faceDown.length, 1);
        assert.strictEqual(stageFour.faceDown[0].card, asideCard);
        assert.equal(scenario.apart.filter(card =>
            card.name === 'El dominio de Kang').length, 3);
    });

    for (const expert of [false, true]) {
        for (const alreadyInPlay of [[], [0], [1], [0, 1]]) {
            test(`stage IV ${expert ? 'expert' : 'standard'} advances with nemeses ${alreadyInPlay.join(',') || 'none'} already in play`, async () => {
                const setConfigs = new Map([
                    ['standard', standard.config],
                    ['temporal', temporal.config],
                ]);
                const match = new Match({
                    mc: {
                        mcSocket: {send() {}},
                        dialog: {async openDialog() {return {};}},
                        data: {
                            async getSetConfig(id) {
                                return setConfigs.get(id);
                            },
                        },
                    },
                    name: 'kang-stage-four-test',
                });
                match.openDialog = async () => ({});
                match.refresh = async () => {};
                const factory = new MatchFactory(match);
                const players = [
                    match.createPlayer({
                        name: 'Pantera Negra',
                        superhero: factory.createSuperhero(blackPanther.config),
                        initial: true,
                    }),
                    match.createPlayer({
                        name: 'Hulk',
                        superhero: factory.createSuperhero(hulk.config),
                    }),
                ];
                players.forEach(player => {
                    player.gameZone = new PlayerZone({owner: player});
                });

                const scenario = await factory.createScenario(kang.config);
                match.addScenario(scenario);
                await scenario.initScenario(match.createObligations(), expert);
                match.initNemesis();

                const [blackPantherMinion, hulkMinion] = players.map(player =>
                    player.superhero.nemesis.find(card =>
                        card.isMinion && card.isNemesis));
                const minions = [blackPantherMinion, hulkMinion];
                for (const index of alreadyInPlay) {
                    const minion = minions[index];
                    await new RevealEncounterEffect({
                        match,
                        selectedTarget: minion,
                    }).runEffect({player: players[index]});
                    minion.damage = 1;
                    assert.equal(minion.isInPlay, true);
                    assert.equal(minion.engaged, players[index]);
                    assert.equal(players[index].superhero.nemesis.includes(minion), false);
                }
                const stageFour = scenario.findMainScheme(4);
                const facedownPlanIndex = scenario.apart.findIndex(card =>
                    card.name === 'El dominio de Kang');
                assert.ok(facedownPlanIndex >= 0);
                const facedownPlan = scenario.apart.splice(facedownPlanIndex, 1)[0];
                stageFour.addFaceDown(facedownPlan);

                await scenario.advanceMainScheme(
                    scenario.gameZone,
                    4,
                    players[0],
                    stageFour
                );

                assert.equal(stageFour.faceDown.length, 0);
                assert.ok(scenario.gameZone.sideSchemes.includes(facedownPlan));
                assert.equal(scenario.gameZone.currentVillain.stage, 3);

                assert.equal(blackPantherMinion.name, 'Killmonger');
                assert.equal(hulkMinion.name, 'Abominación');
                assert.strictEqual(blackPantherMinion.engaged, players[0]);
                assert.strictEqual(hulkMinion.engaged, players[1]);
                minions.forEach((minion, index) => {
                    assert.deepEqual(players[index].gameZone.minions, [minion]);
                    assert.equal(minion.damage, alreadyInPlay.includes(index) ? 1 : 0);
                });
                assert.ok(players.every(player =>
                    !player.superhero.nemesis.some(card =>
                        card.isMinion && card.isNemesis)));
            });
        }
    }
});
