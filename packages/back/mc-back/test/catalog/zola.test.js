import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_WHEN_REVEALED,
    ABILITY_FORCED_RESPONSE,
    ABILITY_SETUP,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_COUNT,
    CALC_SUM,
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_VILLAIN,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CLASSIFICATION_HERO,
    CHARACTER_VILLAIN,
    DIALOG_ENCOUNTERS_REVEAL,
    DIALOG_REVEAL_CARDS,
    DIALOG_USE_CARD,
    DECK_POSITION_SHUFFLE,
    EFFECT_CHAINED,
    EFFECT_CONFUSE,
    EFFECT_DELAYED,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF,
    EFFECT_ENGAGE,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_ADD_KEYWORD,
    EFFECT_FACEDOWN,
    EFFECT_FOR_EACH,
    EFFECT_GET_ENCOUNTER_CARD,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_ACTIVATION,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MOVE_TO_DECK,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PLACE_THREAT,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_COUNTER,
    EFFECT_PUT_PLAY,
    EFFECT_RETURN_FACEDOWN,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_SHUFFLE_DECK,
    EFFECT_SURGE,
    EFFECT_STUN,
    EFFECT_TOUGH,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_HAND,
    TARGET_ALL_PLAYERS,
    TARGET_ACTIVATION,
    TARGET_ALL_CARDS,
    TARGET_ATTACHED,
    TARGET_ENCOUNTER_DECK,
    TARGET_EFFECT,
    TARGET_INITIAL_PLAYER,
    TARGET_MAIN_SCHEME,
    TARGET_SCENARIO,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TARGET_YOU,
    TARGET_VILLAIN,
    TARGET_MINION,
    TRAIT_DROID,
    TRAIT_HYDRA,
    TRAIT_MUTATED,
    TRAIT_TECH,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
    TRIGGER_THIS_GET_ATTACK,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';
import {Scenario} from '../../src/model/match/scenario.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {QuickstrikeAbility} from '../../src/abilities/misc/quickstrike-ability.js';

const createRuntime = async () => {
    const catalog = await loadCatalog();
    const match = new Match({
        mc: {
            mcSocket: {
                send() {},
            },
        },
        name: 'zola-test',
    });
    const matchFactory = new MatchFactory(match);
    const heroEntry = catalog.heroes.find(({config}) =>
        config.cards.some(({card}) =>
            card.type === CARD_TYPE_ALLY &&
            card.params.classification === CLASSIFICATION_HERO));

    assert.ok(heroEntry, 'Expected a hero with an identity-specific Ally.');

    const superhero = matchFactory.createSuperhero(heroEntry.config);
    const player = match.createPlayer({
        name: 'Test player',
        superhero,
        initial: true,
    });
    player.gameZone = new PlayerZone({owner: player});
    player.gameZone.refresh = async () => {};
    player.deck = new Deck({owner: player, isPlayerDeck: true});
    player.deck.refresh = async () => {};
    player.hand.refresh = async () => {};

    const scenario = new Scenario({
        name: 'zola',
        villains: [],
        mainSchemes: [],
        scenarioCards: [],
        sets: [],
        match,
    });
    scenario.gameZone = new ScenarioZone({owner: scenario});
    scenario.gameZone.refresh = async () => {};
    scenario.deck = new Deck({owner: scenario, isScenarioDeck: true});
    scenario.deck.refresh = async () => {};
    match.scenario = scenario;
    match.openDialog = async () => {};

    return {
        catalog,
        heroEntry,
        match,
        matchFactory,
        player,
        scenario,
    };
};

describe('Zola scenario', () => {
    test('registers the three villain stages with their supplied stats and traits', async () => {
        const {scenarios} = await loadCatalog();
        const zola = scenarios.find(({_id}) => _id === 'zola');

        assert.ok(zola);
        assert.equal(zola.name, 'Zola');
        assert.deepEqual(zola.config.sets, ['standard']);
        assert.deepEqual(zola.config.defaultSets, ['under-attack']);
        assert.deepEqual(
            zola.config.villains.map(({type, params}) => [
                type,
                params.name,
                params.image,
                params.stage,
                params.scheme,
                params.attack,
                params.hitPoints,
                params.traits,
                params.keywords.retaliate,
            ]),
            [
                [
                    CARD_TYPE_VILLAIN,
                    'Zola',
                    'scenarios/zola/04109.png',
                    1,
                    2,
                    1,
                    [12, true],
                    [TRAIT_DROID, TRAIT_HYDRA],
                    1,
                ],
                [
                    CARD_TYPE_VILLAIN,
                    'Zola',
                    'scenarios/zola/04110.png',
                    2,
                    2,
                    2,
                    [14, true],
                    [TRAIT_DROID, TRAIT_HYDRA],
                    1,
                ],
                [
                    CARD_TYPE_VILLAIN,
                    'Zola',
                    'scenarios/zola/04111.png',
                    3,
                    3,
                    2,
                    [16, true],
                    [TRAIT_DROID, TRAIT_HYDRA],
                    1,
                ],
            ],
        );
    });

    test('configures both main-scheme stages and their threat values', async () => {
        const {scenarios, sets} = await loadCatalog();
        const zola = scenarios.find(({_id}) => _id === 'zola');
        const [[stageOneA, stageOneB], [stageTwoA, stageTwoB]] =
            zola.config.mainSchemes;
        const registeredSetIds = new Set(sets.map(({_id}) => _id));

        assert.equal(zola.config.mainSchemes.length, 2);
        assert.ok([...zola.config.sets, ...zola.config.defaultSets]
            .every(setId => registeredSetIds.has(setId)));

        assert.equal(stageOneA.type, CARD_TYPE_MAIN_SCHEME_A_CARD);
        assert.equal(stageOneA.params.name, 'La isla del doctor Zola');
        assert.equal(stageOneA.params.image, 'scenarios/zola/04112a.png');
        assert.equal(stageOneA.params.stage, 1);
        assert.deepEqual(stageOneA.params.content, {
            villains: [1, 2],
            villainsExpert: [2, 3],
        });
        assert.equal(stageOneB.type, CARD_TYPE_MAIN_SCHEME_B_CARD);
        assert.equal(stageOneB.params.image, 'scenarios/zola/04112b.png');
        assert.equal(stageOneB.params.startingThreat, 0);
        assert.deepEqual(stageOneB.params.acceleration, [1, true]);
        assert.deepEqual(stageOneB.params.value, [6, true]);
        assert.equal(stageOneB.params.final, undefined);

        assert.equal(stageTwoA.type, CARD_TYPE_MAIN_SCHEME_A_CARD);
        assert.equal(stageTwoA.params.name, 'El científico loco');
        assert.equal(stageTwoA.params.image, 'scenarios/zola/04113a.png');
        assert.equal(stageTwoA.params.stage, 2);
        assert.equal(stageTwoB.type, CARD_TYPE_MAIN_SCHEME_B_CARD);
        assert.equal(stageTwoB.params.image, 'scenarios/zola/04113b.png');
        assert.deepEqual(stageTwoB.params.startingThreat, [1, true]);
        assert.deepEqual(stageTwoB.params.acceleration, [1, true]);
        assert.deepEqual(stageTwoB.params.value, [8, true]);
        assert.equal(stageTwoB.params.final, true);
    });

    test('registers the supplied encounter cards and distinguishes their effects', async () => {
        const {scenarios} = await loadCatalog();
        const {config} = scenarios.find(({_id}) => _id === 'zola');
        const [
            bioEntry,
            zolaMutateEntry,
            rabidMutateEntry,
            defensiveProgrammingEntry,
            painInhibitorsEntry,
            neuralImplantsEntry,
            mentalRayEntry,
            technologyImprovementsEntry,
            subjectsEntry,
            prisonEntry,
            experimentsEntry,
        ] = config.cards;
        const bio = bioEntry.card;
        const zolaMutate = zolaMutateEntry.card;
        const rabidMutate = rabidMutateEntry.card;
        const defensiveProgramming = defensiveProgrammingEntry.card;
        const painInhibitors = painInhibitorsEntry.card;
        const neuralImplants = neuralImplantsEntry.card;
        const mentalRay = mentalRayEntry.card;
        const technologyImprovements = technologyImprovementsEntry.card;
        const subjects = subjectsEntry.card;
        const prison = prisonEntry.card;
        const experiments = experimentsEntry.card;

        assert.deepEqual(
            config.cards.map(({count, card}) => [card.params.name, count]),
            [
                ['Biosiervo definitivo', 4],
                ['Mutado de Zola', 3],
                ['Mutado rabioso', 3],
                ['Programación defensiva', 3],
                ['Inhibidores del dolor', 2],
                ['Implantes neurológicos', 2],
                ['Rayo mental', 3],
                ['Mejoras tecnológicas', 2],
                ['Sujetos de prueba', 2],
                ['Prisión de Hydra', 1],
                ['Los experimentos de Zola', 1],
            ],
        );

        assert.equal(bio.type, CARD_TYPE_MINION);
        assert.equal(bio.params.image, 'scenarios/zola/04114.png');
        assert.deepEqual(bio.params.traits, [TRAIT_HYDRA, TRAIT_MUTATED]);
        assert.equal(bio.params.attack, 1);
        assert.equal(bio.params.scheme, 1);
        assert.equal(bio.params.hitPoints, 4);
        assert.deepEqual(bio.params.keywords, {toughness: true});
        assert.equal(bio.params.boost, 0);
        assert.equal(bio.params.abilities[0].type, ABILITY_CONSTANT);
        assert.equal(bio.params.abilities[0].params.trigger, TRIGGER_THIS_GET_ATTACK);
        assert.deepEqual(
            bio.params.abilities[0].params.effect,
            {
                type: EFFECT_MODIFY_ATTACK_VALUE,
                params: {
                    target: TARGET_EFFECT,
                    paramsCalc: {
                        target: 'card.attached',
                        formula: CALC_COUNT,
                        conditions: {isAttachment: true},
                    },
                },
            },
        );
        assert.equal(bio.params.boostAbility.type, ABILITY_BOOST);
        assert.deepEqual(bio.params.boostAbility.params.effect, {
            type: EFFECT_TOUGH,
            params: {target: TARGET_VILLAIN},
        });
        const bioGameCard = new CardsFactory({match: {}})
            .createGameCardFromConfig(bio, {owner: {}});
        assert.equal(bioGameCard.toughness, true);

        assert.equal(zolaMutate.type, CARD_TYPE_MINION);
        assert.equal(zolaMutate.params.image, 'scenarios/zola/04115.png');
        assert.deepEqual(zolaMutate.params.traits, [TRAIT_HYDRA, TRAIT_MUTATED]);
        assert.equal(zolaMutate.params.attack, 2);
        assert.equal(zolaMutate.params.scheme, 1);
        assert.equal(zolaMutate.params.hitPoints, 5);
        assert.equal(zolaMutate.params.boost, 0);
        const [zolaMutateWhenRevealed] = zolaMutate.params.abilities;
        const [discardUntilTechnology, putTechnologyIntoPlay] =
            zolaMutateWhenRevealed.params.effect.params.effects;
        assert.equal(zolaMutateWhenRevealed.type, ABILITY_WHEN_REVEALED);
        assert.equal(zolaMutateWhenRevealed.params.effect.type, EFFECT_CHAINED);
        assert.equal(
            zolaMutateWhenRevealed.params.effect.params.target,
            TARGET_THIS,
        );
        assert.equal(discardUntilTechnology.type, EFFECT_DISCARD_UNTIL);
        assert.equal(discardUntilTechnology.params.target, TARGET_ENCOUNTER_DECK);
        assert.equal(discardUntilTechnology.params.showDiscardedCards, true);
        assert.deepEqual(discardUntilTechnology.params.condition, {
            isAttachment: true,
            traits: TRAIT_TECH,
        });
        assert.equal(putTechnologyIntoPlay.type, EFFECT_PUT_PLAY);
        assert.deepEqual(putTechnologyIntoPlay.params, {
            cardSource: 'selectedCard',
            controller: 'player.match.scenario',
            target: TARGET_THIS,
        });
        assert.equal(zolaMutate.params.boostAbility.type, ABILITY_BOOST);
        const delayedBoostEffect = zolaMutate.params.boostAbility.params.effect;
        assert.equal(delayedBoostEffect.type, EFFECT_DELAYED);
        assert.equal(delayedBoostEffect.params.target, TARGET_ACTIVATION);
        assert.equal(delayedBoostEffect.params.effect.type, EFFECT_MOVE_TO_DECK);
        assert.deepEqual(delayedBoostEffect.params.effect.params, {
            target: TARGET_SCENARIO,
            position: DECK_POSITION_SHUFFLE,
        });

        assert.equal(rabidMutate.type, CARD_TYPE_MINION);
        assert.equal(rabidMutate.params.name, 'Mutado rabioso');
        assert.equal(rabidMutate.params.image, 'scenarios/zola/04116.png');
        assert.deepEqual(rabidMutate.params.traits, [TRAIT_HYDRA, TRAIT_MUTATED]);
        assert.equal(rabidMutate.params.attack, 2);
        assert.equal(rabidMutate.params.scheme, 0);
        assert.equal(rabidMutate.params.hitPoints, 3);
        assert.deepEqual(rabidMutate.params.keywords, {quickStrike: true});
        assert.equal(rabidMutate.params.boost, 0);
        assert.equal(rabidMutate.params.boostAbility.type, ABILITY_BOOST);
        const rabidBoost = rabidMutate.params.boostAbility.params.effect;
        assert.equal(rabidBoost.type, EFFECT_CHAINED);
        const [placeTestCounter, modifyActivation] = rabidBoost.params.effects;
        assert.equal(placeTestCounter.type, EFFECT_PLACE_COUNTERS);
        assert.deepEqual(placeTestCounter.params, {
            target: TARGET_MAIN_SCHEME,
            counters: 1,
        });
        assert.equal(modifyActivation.type, EFFECT_MODIFY_ACTIVATION);
        assert.deepEqual(modifyActivation.params, {
            target: TARGET_ACTIVATION,
            attack: true,
            scheme: true,
            paramsCalc: {
                target: 'player.match.mainScheme.counters',
            },
        });

        const rabidGameCard = new CardsFactory({match: {}})
            .createGameCardFromConfig(rabidMutate, {owner: {}});
        assert.equal(rabidGameCard.quickStrike, true);
        assert.ok(rabidGameCard.abilities
            .some(ability => ability instanceof QuickstrikeAbility));

        assert.equal(defensiveProgramming.type, CARD_TYPE_ATTACHMENT);
        assert.equal(defensiveProgramming.params.image, 'scenarios/zola/04117.png');
        assert.deepEqual(defensiveProgramming.params.traits, [TRAIT_TECH]);
        assert.equal(defensiveProgramming.params.boost, 1);
        assert.equal(defensiveProgramming.params.maxAttach, 1);
        assert.deepEqual(defensiveProgramming.params.attach, {
            target: TARGET_MINION,
            condition: {life: {operator: 'max'}},
            ifNot: {type: EFFECT_SURGE},
        });
        const [healthBonus, guardBonus] = defensiveProgramming.params.abilities;
        assert.equal(healthBonus.type, ABILITY_CONSTANT);
        assert.equal(healthBonus.params.trigger, TRIGGER_CHARACTER_GET_HIT_POINTS);
        assert.deepEqual(healthBonus.params.effect, {
            type: EFFECT_MODIFY_HIT_POINTS,
            params: {target: TARGET_ATTACHED, count: 2},
        });
        assert.equal(guardBonus.type, ABILITY_CONSTANT);
        assert.equal(guardBonus.params.trigger, TRIGGER_CARD_ENTER_PLAY);
        assert.deepEqual(guardBonus.params.effect, {
            type: EFFECT_ADD_KEYWORD,
            params: {
                target: TARGET_ATTACHED,
                keyword: {guard: true},
            },
        });

        assert.equal(painInhibitors.type, CARD_TYPE_ATTACHMENT);
        assert.equal(painInhibitors.params.image, 'scenarios/zola/04118.png');
        assert.deepEqual(painInhibitors.params.traits, [TRAIT_TECH]);
        assert.equal(painInhibitors.params.boost, 1);
        assert.equal(painInhibitors.params.maxAttach, 1);
        assert.deepEqual(painInhibitors.params.attach, {
            target: TARGET_MINION,
            condition: {life: {operator: 'max'}},
            ifNot: {type: EFFECT_SURGE},
        });
        const [painInhibitorsHealth, painInhibitorsRetaliate] =
            painInhibitors.params.abilities;
        assert.equal(painInhibitorsHealth.type, ABILITY_CONSTANT);
        assert.equal(
            painInhibitorsHealth.params.trigger,
            TRIGGER_CHARACTER_GET_HIT_POINTS,
        );
        assert.deepEqual(painInhibitorsHealth.params.effect, {
            type: EFFECT_MODIFY_HIT_POINTS,
            params: {target: TARGET_ATTACHED, count: 2},
        });
        assert.equal(painInhibitorsRetaliate.type, ABILITY_CONSTANT);
        assert.equal(
            painInhibitorsRetaliate.params.trigger,
            TRIGGER_CARD_ENTER_PLAY,
        );
        assert.deepEqual(painInhibitorsRetaliate.params.effect, {
            type: EFFECT_ADD_KEYWORD,
            params: {
                target: TARGET_ATTACHED,
                keyword: {retaliate: 1},
            },
        });

        assert.equal(neuralImplants.type, CARD_TYPE_ATTACHMENT);
        assert.equal(neuralImplants.params.image, 'scenarios/zola/04119.png');
        assert.deepEqual(neuralImplants.params.traits, [TRAIT_TECH]);
        assert.equal(neuralImplants.params.attack, 2);
        assert.equal(neuralImplants.params.scheme, 2);
        assert.equal(neuralImplants.params.boost, 1);
        assert.equal(neuralImplants.params.maxAttach, 1);
        assert.deepEqual(neuralImplants.params.attach, {
            target: TARGET_MINION,
            condition: {life: {operator: 'max'}},
            ifNot: {type: EFFECT_SURGE},
        });
        const [neuralImplantsHealth] = neuralImplants.params.abilities;
        assert.equal(neuralImplantsHealth.type, ABILITY_CONSTANT);
        assert.equal(
            neuralImplantsHealth.params.trigger,
            TRIGGER_CHARACTER_GET_HIT_POINTS,
        );
        assert.deepEqual(neuralImplantsHealth.params.effect, {
            type: EFFECT_MODIFY_HIT_POINTS,
            params: {target: TARGET_ATTACHED, count: 2},
        });

        assert.equal(mentalRay.type, CARD_TYPE_TREACHERY);
        assert.equal(mentalRay.params.name, 'Rayo mental');
        assert.equal(mentalRay.params.image, 'scenarios/zola/04120.png');
        assert.equal(mentalRay.params.boost, 2);
        const [mentalRayAlterEgo, mentalRayHero] = mentalRay.params.abilities;
        assert.equal(mentalRayAlterEgo.type, ABILITY_WHEN_REVEALED_ALTEREGO);
        assert.equal(mentalRayAlterEgo.params.effect.type, EFFECT_CHAINED);
        assert.deepEqual(
            mentalRayAlterEgo.params.effect.params.effects,
            [
                {
                    type: EFFECT_ENEMY_SCHEME,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        target: TARGET_MAIN_SCHEME,
                    },
                },
                {
                    type: EFFECT_CONFUSE,
                    params: {target: TARGET_YOU},
                },
            ],
        );
        assert.equal(mentalRayHero.type, ABILITY_WHEN_REVEALED_HERO);
        assert.equal(mentalRayHero.params.effect.type, EFFECT_CHAINED);
        assert.deepEqual(
            mentalRayHero.params.effect.params.effects,
            [
                {
                    type: EFFECT_ENEMY_ATTACK,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        target: TARGET_YOU,
                    },
                },
                {
                    type: EFFECT_STUN,
                    params: {target: TARGET_YOU},
                },
            ],
        );

        assert.equal(technologyImprovements.type, CARD_TYPE_TREACHERY);
        assert.equal(technologyImprovements.params.name, 'Mejoras tecnológicas');
        assert.equal(
            technologyImprovements.params.image,
            'scenarios/zola/04121.png',
        );
        assert.equal(technologyImprovements.params.boost, 0);
        assert.deepEqual(technologyImprovements.params.keywords, {incite: 1});
        const [technologyImprovementsWhenRevealed] =
            technologyImprovements.params.abilities;
        const placeCounterEffect = {
            type: EFFECT_PLACE_COUNTERS,
            params: {
                target: TARGET_MAIN_SCHEME,
                counters: 1,
            },
        };
        assert.equal(
            technologyImprovementsWhenRevealed.type,
            ABILITY_WHEN_REVEALED,
        );
        assert.deepEqual(
            technologyImprovementsWhenRevealed.params.effect,
            placeCounterEffect,
        );
        assert.equal(
            technologyImprovements.params.boostAbility.type,
            ABILITY_BOOST,
        );
        assert.deepEqual(
            technologyImprovements.params.boostAbility.params.effect,
            placeCounterEffect,
        );

        assert.equal(subjects.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(subjects.params.image, 'scenarios/zola/04123.png');
        assert.deepEqual(subjects.params.startingThreat, [2, true]);
        assert.equal(subjects.params.boost, 2);
        assert.deepEqual(subjects.params.icons, {hazard: 1});
        const subjectsAbility = subjects.params.abilities[0];
        const revealSubjectEffects = subjectsAbility.params.effect.params.effects;
        assert.equal(subjectsAbility.type, ABILITY_WHEN_DEFEATED);
        assert.equal(subjectsAbility.params.effect.type, EFFECT_CHAINED);
        assert.equal(subjectsAbility.params.effect.params.target, TARGET_INITIAL_PLAYER);
        assert.equal(revealSubjectEffects[0].type, EFFECT_DISCARD_UNTIL);
        assert.equal(revealSubjectEffects[0].params.target, TARGET_ENCOUNTER_DECK);
        assert.deepEqual(revealSubjectEffects[0].params.condition, {isMinion: true});
        assert.equal(revealSubjectEffects[1].type, EFFECT_CHAINED);
        const [getEncounterCard, revealMinion] =
            revealSubjectEffects[1].params.effects;
        assert.equal(getEncounterCard.type, EFFECT_GET_ENCOUNTER_CARD);
        assert.equal(getEncounterCard.params.from, PLACE_ENCOUNTER_DISCARD);
        assert.equal(getEncounterCard.params.cardSource, 'selectedCard');
        assert.equal(revealMinion.type, EFFECT_REVEAL_ENCOUNTER);
        assert.equal(revealMinion.params.card, 'effects.0.card');
        assert.equal(revealMinion.params.player, 'match.initialPlayer');

        assert.equal(prison.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(prison.params.image, 'scenarios/zola/04122.png');
        assert.equal(prison.params.startingThreat, 1);
        assert.equal(prison.params.boost, 0);
        const [whenRevealed, whenDefeated] = prison.params.abilities;
        const [searchEachPlayer, threatForAllies, shuffleEachDeck] =
            whenRevealed.params.effect.params.effects;
        const [search, moveToHand, faceDown] =
            searchEachPlayer.params.effect.params.effects;
        assert.equal(whenRevealed.type, ABILITY_WHEN_REVEALED);
        assert.equal(searchEachPlayer.type, EFFECT_FOR_EACH);
        assert.equal(searchEachPlayer.params.target, TARGET_ALL_PLAYERS);
        assert.equal(search.type, EFFECT_SEARCH_CARDS);
        assert.deepEqual(search.params.filter, {
            isAlly: true,
            'card.classification': CLASSIFICATION_HERO,
        });
        assert.deepEqual(search.params.locations, [
            PLACE_HAND,
            PLACE_DECK,
            PLACE_DISCARD_PILE,
        ]);
        assert.equal(search.params.requireMatch, true);
        assert.equal(moveToHand.type, EFFECT_MOVE_TO_HAND);
        assert.equal(moveToHand.params.target, TARGET_SOURCE);
        assert.equal(moveToHand.params.source, 'selectedCards');
        assert.equal(faceDown.type, EFFECT_FACEDOWN);
        assert.equal(faceDown.params.cardsTarget, TARGET_SOURCE);
        assert.equal(faceDown.params.source, 'selectedCards');
        assert.equal(threatForAllies.type, EFFECT_PLACE_THREAT);
        assert.equal(threatForAllies.params.target, TARGET_THIS);
        assert.deepEqual(threatForAllies.params.paramsCalc, {
            target: 'effect.ability.card.faceDown',
            formula: CALC_SUM,
            property: 'card.cost',
        });
        assert.equal(shuffleEachDeck.type, EFFECT_FOR_EACH);
        assert.equal(shuffleEachDeck.params.target, TARGET_ALL_PLAYERS);
        assert.equal(
            shuffleEachDeck.params.effect.type,
            EFFECT_SHUFFLE_DECK,
        );

        const defeatEffects = whenDefeated.params.effect.params.effects;
        assert.equal(whenDefeated.type, ABILITY_WHEN_DEFEATED);
        assert.deepEqual(
            defeatEffects.map(({type}) => type),
            [EFFECT_RETURN_FACEDOWN, EFFECT_REMOVE_CARD],
        );
        assert.equal(defeatEffects[0].params.faceDownTarget, TARGET_ALL_CARDS);

        assert.equal(experiments.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(experiments.params.image, 'scenarios/zola/04124.png');
        assert.deepEqual(experiments.params.startingThreat, [3, true]);
        assert.deepEqual(experiments.params.icons, {acceleration: 1});
        assert.equal(experiments.params.boost, 3);
        const [attachTechnologyToMinion] = experiments.params.abilities;
        assert.equal(attachTechnologyToMinion.type, ABILITY_FORCED_RESPONSE);
        assert.equal(
            attachTechnologyToMinion.params.trigger,
            TRIGGER_CARD_ENTER_PLAY,
        );
        assert.deepEqual(attachTechnologyToMinion.params.triggerParams, {
            cardCondition: {isMinion: true},
        });
        assert.equal(attachTechnologyToMinion.params.effect.type, EFFECT_CHAINED);
        const [searchTechnology, attachTechnology] =
            attachTechnologyToMinion.params.effect.params.effects;
        assert.equal(searchTechnology.type, EFFECT_SEARCH_CARDS);
        assert.deepEqual(searchTechnology.params, {
            locations: [PLACE_ENCOUNTER_DISCARD],
            filter: {isAttachment: true, traits: TRAIT_TECH},
            firstMatch: true,
            reverseLocations: [PLACE_ENCOUNTER_DISCARD],
        });
        assert.equal(attachTechnology.type, EFFECT_PUT_PLAY);
        assert.deepEqual(attachTechnology.params, {
            cardSource: 'selectedCards',
            controller: 'player.match.scenario',
            target: TARGET_TRIGGERED_CARD,
        });
    });

    test('attaches the topmost Technology attachment in the encounter discard to a minion entering play', async () => {
        const {
            catalog,
            match,
            matchFactory,
            player,
            scenario,
        } = await createRuntime();
        match.openDialog = async ({data, dialogType}) =>
            dialogType === DIALOG_USE_CARD ?
                {selected: data.cards[0]} :
                {};
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        const experimentsConfig = config.cards.find(({card}) =>
            card.params.name === 'Los experimentos de Zola').card;
        const minionConfig = config.cards.find(({card}) =>
            card.params.name === 'Biosiervo definitivo').card;
        const olderTechnologyConfig = config.cards.find(({card}) =>
            card.params.name === 'Programación defensiva').card;
        const topmostTechnologyConfig = config.cards.find(({card}) =>
            card.params.name === 'Inhibidores del dolor').card;
        const nonTechnologyConfig = config.cards.find(({card}) =>
            card.params.name === 'Rayo mental').card;
        const experiments = matchFactory.cardsFactory.createGameCardFromConfig(
            experimentsConfig,
            {owner: scenario},
        );
        const minion = matchFactory.cardsFactory.createGameCardFromConfig(
            minionConfig,
            {owner: scenario},
        );
        const olderTechnology =
            matchFactory.cardsFactory.createGameCardFromConfig(
                olderTechnologyConfig,
                {owner: scenario},
            );
        const topmostTechnology =
            matchFactory.cardsFactory.createGameCardFromConfig(
                topmostTechnologyConfig,
                {owner: scenario},
            );
        const nonTechnology =
            matchFactory.cardsFactory.createGameCardFromConfig(
                nonTechnologyConfig,
                {owner: scenario},
            );
        scenario.deck.cards = [experiments, minion];
        scenario.deck.discardPile = [
            olderTechnology,
            topmostTechnology,
            nonTechnology,
        ];

        await new RevealEncounterEffect({
            selectedTarget: experiments,
            match,
        }).runEffect({match, player});
        await new EngageEffect({
            card: minion,
            controller: scenario,
            match,
            target: TARGET_YOU,
        }).runEffect({match, player});

        assert.deepEqual(minion.attached, [topmostTechnology]);
        assert.equal(topmostTechnology.attachedTo, minion);
        assert.deepEqual(
            scenario.deck.discardPile,
            [olderTechnology, nonTechnology],
        );
        assert.equal(scenario.gameZone.cards.includes(topmostTechnology), true);
    });

    test('does not fail when a minion enters play and the encounter discard has no Technology attachment', async () => {
        const {
            catalog,
            match,
            matchFactory,
            player,
            scenario,
        } = await createRuntime();
        match.openDialog = async ({data, dialogType}) =>
            dialogType === DIALOG_USE_CARD ?
                {selected: data.cards[0]} :
                {};
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        const experimentsConfig = config.cards.find(({card}) =>
            card.params.name === 'Los experimentos de Zola').card;
        const minionConfig = config.cards.find(({card}) =>
            card.params.name === 'Biosiervo definitivo').card;
        const experiments = matchFactory.cardsFactory.createGameCardFromConfig(
            experimentsConfig,
            {owner: scenario},
        );
        const minion = matchFactory.cardsFactory.createGameCardFromConfig(
            minionConfig,
            {owner: scenario},
        );
        scenario.deck.cards = [experiments, minion];
        scenario.deck.discardPile = [];

        await new RevealEncounterEffect({
            selectedTarget: experiments,
            match,
        }).runEffect({match, player});
        await new EngageEffect({
            card: minion,
            controller: scenario,
            match,
            target: TARGET_YOU,
        }).runEffect({match, player});

        assert.deepEqual(minion.attached, []);
        assert.deepEqual(scenario.deck.discardPile, []);
    });

    test('attaches the first discarded Technology attachment to Mutado de Zola', async () => {
        const {
            catalog,
            match,
            matchFactory,
            player,
            scenario,
        } = await createRuntime();
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        const zolaMutateConfig = config.cards.find(({card}) =>
            card.params.name === 'Mutado de Zola').card;
        const bioServantConfig = config.cards.find(({card}) =>
            card.params.name === 'Biosiervo definitivo').card;
        const attachmentConfig = config.cards.find(({card}) =>
            card.params.name === 'Programación defensiva').card;
        const zolaMutate = matchFactory.cardsFactory.createGameCardFromConfig(
            zolaMutateConfig,
            {owner: scenario},
        );
        const nonMatchingMinion = matchFactory.cardsFactory.createGameCardFromConfig(
            bioServantConfig,
            {owner: scenario},
        );
        const remainingCard = matchFactory.cardsFactory.createGameCardFromConfig(
            bioServantConfig,
            {owner: scenario},
        );
        const technologyAttachment =
            matchFactory.cardsFactory.createGameCardFromConfig(
                attachmentConfig,
                {owner: scenario},
            );
        zolaMutate.controller = scenario;
        scenario.gameZone.addToGameZone(zolaMutate);
            scenario.deck.cards = [
                nonMatchingMinion,
                technologyAttachment,
                remainingCard,
            ];
            const discardedDialogs = [];
            match.openDialog = async dialog => {
                discardedDialogs.push(dialog);
            };

            await zolaMutate.abilities[0].resolveAbility({match, player});

            const discardedCardsDialog = discardedDialogs.find(({dialogType}) =>
                dialogType === DIALOG_REVEAL_CARDS);
            assert.ok(discardedCardsDialog);
            assert.deepEqual(
                discardedCardsDialog.data.cards.map(({id}) => id),
                [nonMatchingMinion.id, technologyAttachment.id],
            );
            assert.deepEqual(scenario.deck.discardPile, [nonMatchingMinion]);
        assert.deepEqual(zolaMutate.attached, [technologyAttachment]);
        assert.equal(technologyAttachment.attachedTo, zolaMutate);
        assert.ok(scenario.gameZone.cards.includes(technologyAttachment));
        assert.deepEqual(scenario.deck.cards, [remainingCard]);
    });

    test('returns Mutado de Zola to the encounter deck after its boost activation', async () => {
        const {
            catalog,
            match,
            matchFactory,
            player,
            scenario,
        } = await createRuntime();
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        const zolaMutateConfig = config.cards.find(({card}) =>
            card.params.name === 'Mutado de Zola').card;
        const zolaMutate = matchFactory.cardsFactory.createGameCardFromConfig(
            zolaMutateConfig,
            {owner: scenario},
        );
        const delayedEffects = [];
        const activation = {
            createDelayedEffect(effect) {
                delayedEffects.push(effect);
            },
        };

        await zolaMutate.boostAbility.resolveAbility({
            activation,
            card: zolaMutate,
            match,
            player,
        });
        assert.equal(delayedEffects.length, 1);

        scenario.deck.discardPile.push(zolaMutate);
        let shuffleCount = 0;
        const shuffle = scenario.deck.shuffle.bind(scenario.deck);
        scenario.deck.shuffle = () => {
            shuffleCount++;
            return shuffle();
        };
        await delayedEffects[0].resolve({match, player});

        assert.ok(scenario.deck.cards.includes(zolaMutate));
        assert.ok(!scenario.deck.discardPile.includes(zolaMutate));
        assert.equal(shuffleCount, 1);
    });

    test('places a test counter and boosts Zola for the current attack or scheme activation', async () => {
        const {
            catalog,
            match,
            matchFactory,
            player,
            scenario,
        } = await createRuntime();
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        const [, mainSchemeConfig] = config.mainSchemes[0];
        const rabidMutateConfig = config.cards.find(({card}) =>
            card.params.name === 'Mutado rabioso').card;
        const mainScheme = matchFactory.cardsFactory.createGameCardFromConfig(
            mainSchemeConfig,
            {owner: scenario},
        );
        scenario.gameZone.currentScheme = mainScheme;
        const rabidMutate = matchFactory.cardsFactory.createGameCardFromConfig(
            rabidMutateConfig,
            {owner: scenario},
        );

        for (const activationType of ['attack', 'scheme']) {
            mainScheme.counters = activationType === 'attack' ? 2 : 0;
            const activationEffect = {
                isAttack: activationType === 'attack',
                isScheme: activationType === 'scheme',
                modifyAttack: 0,
                modifyScheme: 0,
            };

            await rabidMutate.boostAbility.resolveAbility({
                activation: {effect: activationEffect},
                card: rabidMutate,
                match,
                player,
            });

            const expectedBonus = mainScheme.counters;
            assert.equal(mainScheme.counters, activationType === 'attack' ? 3 : 1);
            assert.equal(
                activationEffect.modifyAttack,
                activationType === 'attack' ? expectedBonus : 0,
            );
            assert.equal(
                activationEffect.modifyScheme,
                activationType === 'scheme' ? expectedBonus : 0,
            );
        }
    });

    test('places a test counter when Mejoras tecnológicas is revealed or used as boost', async () => {
        const {
            catalog,
            match,
            matchFactory,
            player,
            scenario,
        } = await createRuntime();
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        const [, mainSchemeConfig] = config.mainSchemes[0];
        const technologyImprovementsConfig = config.cards.find(({card}) =>
            card.params.name === 'Mejoras tecnológicas').card;
        const mainScheme = matchFactory.cardsFactory.createGameCardFromConfig(
            mainSchemeConfig,
            {owner: scenario},
        );
        const technologyImprovements =
            matchFactory.cardsFactory.createGameCardFromConfig(
                technologyImprovementsConfig,
                {owner: scenario},
            );
        scenario.gameZone.currentScheme = mainScheme;
        mainScheme.counters = 0;

        await technologyImprovements.abilities[0].resolveAbility({
            card: technologyImprovements,
            match,
            player,
        });
        assert.equal(mainScheme.counters, 1);

        await technologyImprovements.boostAbility.resolveAbility({
            card: technologyImprovements,
            match,
            player,
        });
        assert.equal(mainScheme.counters, 2);
    });

    test('searches only identity-specific Allies from hand, deck, or discard and returns them after defeat', async () => {
        for (const sourceLocation of [
            PLACE_HAND,
            PLACE_DECK,
            PLACE_DISCARD_PILE,
        ]) {
            const {
                catalog,
                heroEntry,
                match,
                matchFactory,
                player,
                scenario,
            } = await createRuntime();
            const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
            const prisonConfig = config.cards.find(({card}) =>
                card.params.name === 'Prisión de Hydra').card;
            const heroAllyConfig = heroEntry.config.cards.find(({card}) =>
                card.type === CARD_TYPE_ALLY &&
                card.params.classification === CLASSIFICATION_HERO).card;
            const identityAlly = matchFactory.cardsFactory.createGameCardFromConfig(
                heroAllyConfig,
                {owner: player},
            );
            const aspectAlly = {
                id: `aspect-ally-${sourceLocation}`,
                name: 'Aliado de aspecto',
                owner: player,
                isAlly: true,
                isEvent: false,
                abilities: [],
                card: {classification: 'aggression'},
                toObj() {
                    return {id: this.id, name: this.name};
                },
            };
            const deckCard = {
                id: `deck-card-${sourceLocation}`,
                isAlly: false,
                card: {classification: 'basic'},
            };
            player.hand.cards = [aspectAlly];
            player.deck.cards = [deckCard];
            player.deck.discardPile = [];
            if (sourceLocation === PLACE_HAND) {
                player.hand.cards.push(identityAlly);
            } else if (sourceLocation === PLACE_DECK) {
                player.deck.cards.unshift(identityAlly);
            } else {
                player.deck.discardPile.push(identityAlly);
            }

            const prison = matchFactory.cardsFactory.createGameCardFromConfig(
                prisonConfig,
                {owner: scenario},
            );
            prison.controller = scenario;
            prison.refresh = async () => {};
            scenario.gameZone.addToGameZone(prison);

            const whenRevealed = prison.abilities[0];
            const [searchEachPlayer, placeThreat, shuffleEachDeck] =
                whenRevealed.effect.effects;
            await searchEachPlayer.runEffect({
                ability: whenRevealed,
                match,
                player,
            });

            assert.ok(!player.deck.cards.includes(identityAlly));
            assert.deepEqual(player.deck.discardPile, []);
            assert.deepEqual(player.hand.cards, [aspectAlly]);
            assert.equal(prison.faceDown.length, 1);
            assert.equal(prison.faceDown[0].card, identityAlly);

            assert.equal(
                placeThreat.getThreat({match, player}),
                identityAlly.cost,
            );
            assert.equal(
                placeThreat.checkTrigger({match, player}),
                identityAlly.cost > 0,
            );
            await placeThreat.runEffect({
                ability: whenRevealed,
                match,
                player,
            });
            assert.equal(prison.threat, identityAlly.cost);

            await shuffleEachDeck.runEffect({
                ability: whenRevealed,
                match,
                player,
            });

            const whenDefeated = prison.abilities[1];
            await whenDefeated.effect.runEffect({
                ability: whenDefeated,
                match,
                player,
            });
            assert.ok(player.hand.cards.includes(identityAlly));
            assert.equal(player.hand.cards.filter(card =>
                card === identityAlly).length, 1);
            assert.equal(prison.faceDown.length, 0);
            assert.ok(!scenario.gameZone.cards.includes(prison));
        }
    });

    test('reveals the minion discarded by Sujetos de prueba for the initial player', async () => {
        const {
            catalog,
            heroEntry,
            match,
            matchFactory,
            player: initialPlayer,
            scenario,
        } =
            await createRuntime();
        const activePlayer = match.createPlayer({
            name: 'Active player',
            superhero: matchFactory.createSuperhero(heroEntry.config),
            initial: false,
        });
        activePlayer.gameZone = new PlayerZone({owner: activePlayer});
        activePlayer.gameZone.refresh = async () => {};
        activePlayer.deck = new Deck({owner: activePlayer, isPlayerDeck: true});
        activePlayer.deck.refresh = async () => {};
        activePlayer.hand.refresh = async () => {};
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        const [subjectsConfig] = config.cards
            .filter(({card}) => card.params.name === 'Sujetos de prueba')
            .map(({card}) => card);
        const bioConfig = config.cards.find(({card}) =>
            card.params.name === 'Biosiervo definitivo').card;
        const subjects = matchFactory.cardsFactory.createGameCardFromConfig(
            subjectsConfig,
            {owner: scenario},
        );
        const minion = matchFactory.cardsFactory.createGameCardFromConfig(
            bioConfig,
            {owner: scenario},
        );
        const otherEncounterCard = {isMinion: false};
        subjects.controller = scenario;
        minion.controller = scenario;
        scenario.gameZone.addToGameZone(subjects);
        scenario.deck.cards = [
            otherEncounterCard,
            minion,
            {isMinion: false},
        ];

        const revealDialogs = [];
        match.openDialog = async dialog => {
            revealDialogs.push(dialog);
        };
        const ability = subjects.abilities[0];
        await ability.effect.runEffect({
            ability,
            match,
            player: activePlayer,
        });

        assert.ok(initialPlayer.minions.includes(minion));
        assert.equal(minion.engaged, initialPlayer);
        assert.ok(!activePlayer.minions.includes(minion));
        assert.ok(!scenario.deck.discardPile.includes(minion));
        assert.equal(scenario.deck.cards.length, 1);
        assert.ok(revealDialogs.some(({dialogType, data}) =>
            dialogType === DIALOG_ENCOUNTERS_REVEAL &&
            data.card.id === minion.id));
    });

    test('adds one attack for each attachment on Biosiervo definitivo', async () => {
        const {
            catalog,
            match,
            matchFactory,
            player,
            scenario,
        } = await createRuntime();
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        const bioConfig = config.cards.find(({card}) =>
            card.params.name === 'Biosiervo definitivo').card;
        const minion = matchFactory.cardsFactory.createGameCardFromConfig(
            bioConfig,
            {owner: scenario},
        );
        minion.controller = scenario;
        scenario.gameZone.addToGameZone(minion);
        await minion.initTriggers();

        assert.equal(await minion.getAttackValue({match, player}), 1);
        minion.attached.push(
            {isAttachment: true, card: {attack: 0}},
            {isAttachment: true, card: {attack: 0}},
            {isAttachment: false, card: {attack: 0}},
        );
        assert.equal(await minion.getAttackValue({match, player}), 3);
    });

    test('links defensive programming to the eligible minion with most remaining life', async () => {
        const {
            catalog,
            match,
            matchFactory,
            player,
            scenario,
        } = await createRuntime();
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        scenario.deck.cards = [{}];
        const minionConfig = config.cards.find(({card}) =>
            card.params.name === 'Biosiervo definitivo').card;
        const attachmentConfig = config.cards.find(({card}) =>
            card.params.name === 'Programación defensiva').card;
        const attachment = matchFactory.cardsFactory.createGameCardFromConfig(
            attachmentConfig,
            {owner: scenario},
        );
        const createMinion = async ({damage = 0, modifyHitPoints = 0} = {}) => {
            const minion = matchFactory.cardsFactory.createGameCardFromConfig(
                minionConfig,
                {owner: scenario},
            );
            minion.controller = scenario;
            minion.engaged = player;
            minion.damage = damage;
            minion.modifyHitPoints = modifyHitPoints;
            player.gameZone.engage(minion);
            await minion.initTriggers();

            return minion;
        };
        const blockedHighest = await createMinion({modifyHitPoints: 10});
        const minion = await createMinion();
        const lowerEligible = await createMinion({damage: 1});
        const linkedCopy = {
            isAttachment: true,
            card: {id: attachment.card.id},
        };
        blockedHighest.attached.push(linkedCopy);
        const reveal = new RevealEncounterEffect({
            match,
            selectedTarget: attachment,
        });

        await reveal.execute({player});

        assert.deepEqual(minion.attached, [attachment]);
        assert.equal(attachment.attachedTo, minion);
        assert.equal(minion.guard, true);
        assert.equal(await minion.getHitPoints({player}), 6);
        assert.ok(!lowerEligible.attached.length);

        minion.damage = 1;
        assert.equal((await minion.getEffectiveStats({player})).life, 5);
        lowerEligible.attached.push({
            isAttachment: true,
            card: {id: attachment.card.id},
        });

        const duplicate = matchFactory.cardsFactory.createGameCardFromConfig(
            attachmentConfig,
            {owner: scenario},
        );
        const duplicateReveal = new RevealEncounterEffect({
            match,
            selectedTarget: duplicate,
        });
        let surgeCount = 0;
        duplicateReveal.applySurge = async () => {
            surgeCount++;
        };

        await duplicateReveal.execute({player});

        assert.equal(surgeCount, 1);
        assert.deepEqual(minion.attached, [attachment]);
        assert.deepEqual(blockedHighest.attached, [linkedCopy]);
        assert.equal(minion.guard, true);

        await attachment.discard();

        assert.deepEqual(minion.attached, []);
        assert.equal(minion.guard, false);
        assert.equal(await minion.getHitPoints({player}), 4);
    });

    test('links pain inhibitors to the highest-life eligible minion and grants its bonuses', async () => {
        const {
            catalog,
            match,
            matchFactory,
            player,
            scenario,
        } = await createRuntime();
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        scenario.deck.cards = [{}];
        const minionConfig = config.cards.find(({card}) =>
            card.params.name === 'Biosiervo definitivo').card;
        const attachmentConfig = config.cards.find(({card}) =>
            card.params.name === 'Inhibidores del dolor').card;
        const attachment = matchFactory.cardsFactory.createGameCardFromConfig(
            attachmentConfig,
            {owner: scenario},
        );
        const createMinion = async ({damage = 0, modifyHitPoints = 0} = {}) => {
            const minion = matchFactory.cardsFactory.createGameCardFromConfig(
                minionConfig,
                {owner: scenario},
            );
            minion.controller = scenario;
            minion.engaged = player;
            minion.damage = damage;
            minion.modifyHitPoints = modifyHitPoints;
            player.gameZone.engage(minion);
            await minion.initTriggers();

            return minion;
        };
        const blockedHighest = await createMinion({modifyHitPoints: 10});
        const minion = await createMinion();
        const lowerEligible = await createMinion({damage: 1});
        const linkedCopy = {
            isAttachment: true,
            card: {id: attachment.card.id},
        };
        blockedHighest.attached.push(linkedCopy);
        const reveal = new RevealEncounterEffect({
            match,
            selectedTarget: attachment,
        });

        await reveal.execute({player});

        assert.deepEqual(minion.attached, [attachment]);
        assert.equal(attachment.attachedTo, minion);
        assert.equal(minion.retaliate, 1);
        assert.equal(await minion.getHitPoints({player}), 6);
        assert.ok(!lowerEligible.attached.length);

        minion.damage = 1;
        assert.equal((await minion.getEffectiveStats({player})).life, 5);
        lowerEligible.attached.push({
            isAttachment: true,
            card: {id: attachment.card.id},
        });

        const duplicate = matchFactory.cardsFactory.createGameCardFromConfig(
            attachmentConfig,
            {owner: scenario},
        );
        const duplicateReveal = new RevealEncounterEffect({
            match,
            selectedTarget: duplicate,
        });
        let surgeCount = 0;
        duplicateReveal.applySurge = async () => {
            surgeCount++;
        };

        await duplicateReveal.execute({player});

        assert.equal(surgeCount, 1);
        assert.deepEqual(minion.attached, [attachment]);
        assert.deepEqual(blockedHighest.attached, [linkedCopy]);
        assert.equal(minion.retaliate, 1);

        await attachment.discard();

        assert.deepEqual(minion.attached, []);
        assert.equal(minion.retaliate, 0);
        assert.equal(await minion.getHitPoints({player}), 4);
    });

    test('links neural implants to the highest-life eligible minion and grants its bonuses', async () => {
        const {
            match,
            matchFactory,
            player,
            scenario,
            catalog,
        } = await createRuntime();
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        scenario.deck.cards = [{}];
        const bioMinionConfig = config.cards.find(({card}) =>
            card.params.name === 'Biosiervo definitivo').card;
        const minionConfig = {
            ...bioMinionConfig,
            params: {
                ...bioMinionConfig.params,
                abilities: [],
            },
        };
        const attachmentConfig = config.cards.find(({card}) =>
            card.params.name === 'Implantes neurológicos').card;
        const attachment = matchFactory.cardsFactory.createGameCardFromConfig(
            attachmentConfig,
            {owner: scenario},
        );
        const createMinion = async ({damage = 0, modifyHitPoints = 0} = {}) => {
            const minion = matchFactory.cardsFactory.createGameCardFromConfig(
                minionConfig,
                {owner: scenario},
            );
            minion.controller = scenario;
            minion.engaged = player;
            minion.damage = damage;
            minion.modifyHitPoints = modifyHitPoints;
            player.gameZone.engage(minion);
            await minion.initTriggers();

            return minion;
        };
        const blockedHighest = await createMinion({modifyHitPoints: 10});
        const minion = await createMinion();
        const lowerEligible = await createMinion({damage: 1});
        assert.equal(await minion.getHitPoints({player}), 4);
        assert.equal(await minion.getAttackValue({match, player}), 1);
        assert.equal(await minion.getSchemeValue({match, player}), 1);
        const linkedCopy = {
            isAttachment: true,
            card: {id: attachment.card.id},
        };
        blockedHighest.attached.push(linkedCopy);
        const reveal = new RevealEncounterEffect({
            match,
            selectedTarget: attachment,
        });

        await reveal.execute({player});

        assert.deepEqual(minion.attached, [attachment]);
        assert.equal(attachment.attachedTo, minion);
        assert.equal(await minion.getHitPoints({player}), 6);
        assert.equal(await minion.getAttackValue({match, player}), 3);
        assert.equal(await minion.getSchemeValue({match, player}), 3);
        assert.ok(!lowerEligible.attached.length);

        minion.damage = 1;
        assert.equal((await minion.getEffectiveStats({player})).life, 5);
        lowerEligible.attached.push(linkedCopy);

        const duplicate = matchFactory.cardsFactory.createGameCardFromConfig(
            attachmentConfig,
            {owner: scenario},
        );
        const duplicateReveal = new RevealEncounterEffect({
            match,
            selectedTarget: duplicate,
        });
        let surgeCount = 0;
        duplicateReveal.applySurge = async () => {
            surgeCount++;
        };

        await duplicateReveal.execute({player});

        assert.equal(surgeCount, 1);
        assert.deepEqual(minion.attached, [attachment]);
        assert.deepEqual(blockedHighest.attached, [linkedCopy]);
        assert.deepEqual(lowerEligible.attached, [linkedCopy]);

        await attachment.discard();

        assert.deepEqual(minion.attached, []);
        assert.equal(await minion.getHitPoints({player}), 4);
        assert.equal(await minion.getAttackValue({match, player}), 1);
        assert.equal(await minion.getSchemeValue({match, player}), 1);
    });

    test('searches and reveals the specified cards when later stages are revealed', async () => {
        const {scenarios} = await loadCatalog();
        const {config} = scenarios.find(({_id}) => _id === 'zola');
        const stageTwoAbility = config.villains[1].params.abilities[0];
        const stageTwoEffects = stageTwoAbility.params.effect.params.effects;
        const stageThreeAbility = config.villains[2].params.abilities[0];
        const stageThreeEffects = stageThreeAbility.params.effect.params.effects;
        const stageThreeReveal = stageThreeEffects[0].params.effect;

        assert.equal(stageTwoAbility.type, ABILITY_WHEN_REVEALED);
        assert.equal(stageTwoAbility.params.effect.type, EFFECT_CHAINED);
        assert.equal(stageTwoEffects[0].type, EFFECT_SEARCH_CARD_REVEAL);
        assert.equal(stageTwoEffects[0].params.condition.name, 'Sujetos de prueba');
        assert.equal(stageTwoEffects[0].params.firstMatch, undefined);
        assert.deepEqual(stageTwoEffects[0].params.places, [
            PLACE_ENCOUNTER_DECK_CARDS,
            PLACE_ENCOUNTER_DISCARD,
        ]);
        assert.equal(stageTwoEffects[1].type, EFFECT_SHUFFLE_DECK);
        assert.equal(stageTwoEffects[1].params.target, TARGET_SCENARIO);

        assert.equal(stageThreeAbility.type, ABILITY_WHEN_REVEALED);
        assert.equal(stageThreeEffects[0].type, EFFECT_FOR_EACH);
        assert.equal(stageThreeEffects[0].params.target, TARGET_ALL_PLAYERS);
        assert.equal(stageThreeReveal.type, EFFECT_SEARCH_CARD_REVEAL);
        assert.deepEqual(stageThreeReveal.params.condition, {isMinion: true});
        assert.deepEqual(stageThreeReveal.params.places, [
            PLACE_ENCOUNTER_DECK_CARDS,
            PLACE_ENCOUNTER_DISCARD,
        ]);
        assert.equal(stageThreeEffects[1].type, EFFECT_SHUFFLE_DECK);
    });

    test('distinguishes putting a searched minion into play from revealing one', async () => {
        const {scenarios} = await loadCatalog();
        const {config} = scenarios.find(({_id}) => _id === 'zola');
        const [[stageOneA], [stageTwoA]] = config.mainSchemes;
        const setup = stageOneA.params.abilities[0];
        const setupEffects = setup.params.effect.params.effects;
        const playerSetup = setupEffects[1].params.effect.params.effects;
        const stageTwoAbility = stageTwoA.params.abilities[0];
        const stageTwoEffects = stageTwoAbility.params.effect.params.effects;

        assert.equal(setup.type, ABILITY_SETUP);
        assert.equal(setupEffects[0].type, EFFECT_SEARCH_CARD_REVEAL);
        assert.deepEqual(setupEffects[0].params.condition, {
            name: 'Prisión de Hydra',
        });
        assert.deepEqual(setupEffects[0].params.places, [
            PLACE_ENCOUNTER_DECK_CARDS,
        ]);
        assert.equal(setupEffects[1].type, EFFECT_FOR_EACH);
        assert.equal(setupEffects[1].params.target, TARGET_ALL_PLAYERS);
        assert.equal(playerSetup[0].type, EFFECT_SEARCH_CARDS);
        assert.deepEqual(playerSetup[0].params.filter, {
            name: 'Biosiervo definitivo',
            isMinion: true,
        });
        assert.deepEqual(playerSetup[0].params.locations, [
            PLACE_ENCOUNTER_DECK_CARDS,
        ]);
        assert.equal(playerSetup[0].params.firstMatch, true);
        assert.equal(playerSetup[0].params.requireMatch, true);
        assert.equal(playerSetup[1].type, EFFECT_ENGAGE);
        assert.equal(playerSetup[1].params.cardSource, 'selectedCard');
        assert.equal(playerSetup[1].params.target, TARGET_YOU);
        assert.equal(setupEffects.length, 2);

        assert.equal(stageTwoAbility.type, ABILITY_WHEN_REVEALED);
        assert.equal(stageTwoEffects[0].type, EFFECT_FOR_EACH);
        assert.equal(stageTwoEffects[0].params.target, TARGET_ALL_PLAYERS);
        assert.equal(stageTwoEffects[0].params.effect.type, EFFECT_SEARCH_CARD_REVEAL);
        assert.equal(
            stageTwoEffects[0].params.effect.params.title,
            'Elige el Esbirro a mostrar',
        );
        assert.deepEqual(stageTwoEffects[0].params.effect.params.condition, {
            isMinion: true,
        });
        assert.deepEqual(stageTwoEffects[0].params.effect.params.places, [
            PLACE_ENCOUNTER_DECK_CARDS,
            PLACE_ENCOUNTER_DISCARD,
        ]);
        assert.equal(stageTwoEffects[1].type, EFFECT_SHUFFLE_DECK);
    });

    test('adds a test counter after villain step one and resolves at three', async () => {
        const {scenarios} = await loadCatalog();
        const {config} = scenarios.find(({_id}) => _id === 'zola');
        const [, stageOneB] = config.mainSchemes[0];
        const [, stageTwoB] = config.mainSchemes[1];

        for (const schemeB of [stageOneB, stageTwoB]) {
            const ability = schemeB.params.abilities[0];
            const placeCounters = ability.params.effect;
            const threshold = placeCounters.params.thenEffect;
            const thresholdEffects = threshold.params.effect.params.effects;
            const simultaneousEffects = thresholdEffects[1].params.effects;

            assert.equal(ability.type, ABILITY_FORCED_RESPONSE);
            assert.equal(ability.params.trigger, TRIGGER_VILLAIN_PHASE_STEP);
            assert.deepEqual(ability.params.condition, {step: 1});
            assert.equal(placeCounters.type, EFFECT_PLACE_COUNTERS);
            assert.equal(placeCounters.params.target, TARGET_THIS);
            assert.equal(placeCounters.params.counters, 1);
            assert.equal(threshold.type, EFFECT_DO_IF);
            assert.deepEqual(threshold.params.condition, {
                'ability.card.counters': '>2',
            });
            assert.equal(thresholdEffects[0].type, EFFECT_DISCARD_UNTIL);
            assert.equal(thresholdEffects[0].params.target, TARGET_ENCOUNTER_DECK);
            assert.deepEqual(thresholdEffects[0].params.condition, {
                isMinion: true,
            });
            assert.equal(thresholdEffects[1].type, EFFECT_SIMULTANEOUS);
            assert.equal(simultaneousEffects[0].type, EFFECT_ENGAGE);
            assert.equal(simultaneousEffects[0].params.cardSource, 'selectedCard');
            assert.equal(simultaneousEffects[0].params.target, TARGET_INITIAL_PLAYER);
            assert.equal(simultaneousEffects[1].type, EFFECT_REMOVE_COUNTER);
            assert.equal(simultaneousEffects[1].params.count, 3);
            assert.equal(simultaneousEffects[1].params.target, TARGET_THIS);
        }

        const cardsFactory = new CardsFactory({match: {}});
        const stageOneBCard = cardsFactory.createGameCard({
            card: cardsFactory.createCard(stageOneB),
            owner: {},
        });
        const ability = stageOneBCard.abilities[0];
        const threshold = ability.effect.thenEffect;

        ability.card.counters = 2;
        assert.equal(threshold.checkCondition({}), false);
        ability.card.counters = 3;
        assert.equal(threshold.checkCondition({}), true);
    });

    test('puts a minion into play when the third test counter is placed without ability params', async () => {
        const {
            catalog,
            match,
            matchFactory,
            player,
            scenario,
        } = await createRuntime();
        const {config} = catalog.scenarios.find(({_id}) => _id === 'zola');
        const [, stageOneBConfig] = config.mainSchemes[0];
        const minionConfig = config.cards.find(({card}) =>
            card.params.name === 'Biosiervo definitivo').card;
        const scheme = matchFactory.cardsFactory.createGameCardFromConfig(
            stageOneBConfig,
            {owner: scenario},
        );
        scheme.controller = scenario;
        scenario.gameZone.addToGameZone(scheme);
        scheme.counters = 2;

        const minion = matchFactory.cardsFactory.createGameCardFromConfig(
            minionConfig,
            {owner: scenario},
        );
        minion.controller = scenario;
        scenario.deck.cards = [minion, {isMinion: false}];

        const ability = scheme.abilities[0];
        await ability.resolveAbility({
            match,
            player,
            step: 1,
        });

        assert.equal(scheme.counters, 0);
        assert.equal(minion.engaged, player);
        assert.ok(player.minions.includes(minion));
    });

    test('compiles every scenario ability and boost ability to a runnable effect', async () => {
        const {scenarios} = await loadCatalog();
        const {config} = scenarios.find(({_id}) => _id === 'zola');
        const cardsFactory = new CardsFactory({match: {}});
        const cardConfigs = [
            ...config.villains,
            ...config.mainSchemes.flat(),
            ...config.cards.map(({card}) => card),
        ];

        for (const cardConfig of cardConfigs) {
            const gameCard = cardsFactory.createGameCard({
                card: cardsFactory.createCard(cardConfig),
                owner: {},
            });

            for (const ability of gameCard.abilities) {
                assert.equal(Array.isArray(ability.effect), false);
                assert.equal(typeof ability.effect.canRun, 'function');
            }
            if (gameCard.boostAbility) {
                assert.equal(typeof gameCard.boostAbility.effect.canRun, 'function');
            }
        }
    });

    test('creates the partial scenario through MatchFactory', async () => {
        const {scenarios} = await loadCatalog();
        const {config} = scenarios.find(({_id}) => _id === 'zola');
        const loadedSetIds = [];
        const match = {
            mc: {
                data: {
                    async getSetConfig(id) {
                        loadedSetIds.push(id);
                        return {
                            cards: [],
                            expertSet: [],
                        };
                    },
                },
            },
        };
        const scenario = await new MatchFactory(match).createScenario(config);

        assert.deepEqual(loadedSetIds, ['standard', 'under-attack']);
        assert.equal(scenario.name, 'zola');
        assert.equal(scenario.villains.length, 3);
        assert.equal(scenario.mainSchemes.length, 2);
        assert.equal(scenario.mainSchemes[0].sides.length, 2);
        assert.equal(scenario.mainSchemes[1].sides.length, 2);
        assert.deepEqual(
            scenario.scenarioCards.reduce((counts, card) => {
                counts[card.name] = (counts[card.name] || 0) + 1;
                return counts;
            }, {}),
            {
                'Biosiervo definitivo': 4,
                'Mutado de Zola': 3,
                'Mutado rabioso': 3,
                'Programación defensiva': 3,
                'Inhibidores del dolor': 2,
                'Implantes neurológicos': 2,
                'Rayo mental': 3,
                'Mejoras tecnológicas': 2,
                'Sujetos de prueba': 2,
                'Prisión de Hydra': 1,
                'Los experimentos de Zola': 1,
            },
        );
    });
});
