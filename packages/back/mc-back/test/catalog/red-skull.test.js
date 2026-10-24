import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_FORCED_RESPONSE,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_HERO_ACTION,
    ABILITY_INTERRUPT,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_ALLY,
    CALC_ATTACK,
    CALC_COUNT,
    CALC_DIFFERENT_RESOURCE_TYPE,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CHARACTER_VILLAIN,
    DECK_POSITION_SHUFFLE,
    DECK_POSITION_TOP,
    DIALOG_ENCOUNTERS_REVEAL,
    DIALOG_SELECT_CARD,
    DIALOG_SELECT_TARGET,
    DIALOG_USE_CARD,
    EFFECT_CATEGORY_DAMAGE,
    EFFECT_CATEGORY_LEAVE_PLAY,
    EFFECT_CANNOT_TARGET,
    EFFECT_CHAINED,
    EFFECT_DEAL_BOOST,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DEFEAT,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_ATTACK,
    EFFECT_ENGAGE,
    EFFECT_FOR_EACH,
    EFFECT_MOVE_TO_DECK,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PLACE_THREAT,
    EFFECT_PUT_PLAY,
    EFFECT_SEARCH_CARDS,
    EFFECT_SPEND,
    EFFECT_SIMULTANEOUS,
    EFFECT_SET_THWART_VALUE,
    EFFECT_REMOVE_CARD,
    EFFECT_RETURN_HAND,
    EFFECT_TOUGH,
    PLACE_DECK,
    PLACE_DISCARD_PILE,
    PLACE_SCENARIO_EXTRA_DECK,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_CONSTANT,
    PRIORITY_INTERRUPT,
    PRIORITY_FORCED_INTERRUPT,
    TARGET_CONDITION_CARD,
    TARGET_ACTIVATION,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_SCHEMES,
    TARGET_ENCOUNTER_DECK,
    TARGET_EFFECT,
    TARGET_INITIAL_PLAYER,
    TARGET_MAIN_SCHEME,
    TARGET_MINION,
    TARGET_SIDE_SCHEME,
    TARGET_THIS,
    TARGET_ALL_PLAYERS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TRAIT_CONDITION,
    TRAIT_ELITE,
    TRAIT_HYDRA,
    TRAIT_SKILL,
    TRAIT_WEAPON,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TRIGGER_ATTACHED_DEFEAT,
    TRIGGER_CHARACTER_DEFEATED,
    TRIGGER_CHARACTER_GET_ATTACK,
    TRIGGER_SCHEME_GET_THWART,
    TRIGGER_THIS_ATTACK,
    TRIGGER_YOU_BASIC_THWART,
    TRIGGER_VILLAIN_ACTIVATES,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import captainAmerica from '../../../mc-data/seed/catalog/heroes/captain-america.js';
import redSkull from '../../../mc-data/seed/catalog/scenarios/red-skull.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {ModifyAttackEffect} from '../../src/effects/modify-attack-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {DealBoostEffect} from '../../src/effects/deal-boost-effect.js';
import {DealEncounterEffect} from '../../src/effects/deal-encounter-effect.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {DiscardFromGameEffect} from '../../src/effects/discard-from-game-effect.js';
import {DiscardFromDeckEffect} from '../../src/effects/discard-from-deck-effect.js';
import {ExhaustEffect} from '../../src/effects/exhaust-effect.js';
import {GetAttackEffect} from '../../src/effects/get-attack-effect.js';
import {GetEncounterCardEffect} from '../../src/effects/get-encounter-card-effect.js';
import {GetThwartEffect} from '../../src/effects/get-thwart-effect.js';
import {ForEachEffect} from '../../src/effects/for-each-effect.js';
import {ChainedEffect} from '../../src/effects/chained-effect.js';
import {MoveToDeckEffect} from '../../src/effects/move-to-deck-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {PlaceThreatEffect} from '../../src/effects/place-threat-effect.js';
import {SearchCardsEffect} from '../../src/effects/search-cards-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {SetThwartValueEffect} from '../../src/effects/set-thwart-value-effect.js';
import {SimultaneousEffect} from '../../src/effects/simultaneous-effect.js';
import {ToughEffect} from '../../src/effects/tough-effect.js';
import {Attack} from '../../src/activations/attack.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';
import {ThwartBasicAbility} from '../../src/abilities/basic/thwart-basic-ability.js';
import {Thwart} from '../../src/activations/thwart.js';
import {CannotTargetEffect} from '../../src/effects/cannot-target-effect.js';
import {InterruptAbility} from '../../src/abilities/interrupt/interrupt-ability.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {Deck} from '../../src/model/match/deck.js';
import {checkCondition} from '../../src/engine/utils.js';
import {
    restoreMatch,
    serializeMatch,
} from '../../src/utils/match-serialization.js';

const SIDE_SCHEME_DECK = 'red-skull-side-schemes';

const createBasicThwart = (match, selectedTarget) => {
    const character = {
        id: 'test-thwarting-character',
        name: 'Personaje de prueba',
        thwart: 2,
        isConfused: false,
    };
    const ability = new ThwartBasicAbility({
        card: character,
        match,
        player: match.initialPlayer,
    });
    ability.effect.selectedTarget = selectedTarget;
    ability.effect.refreshTarget = false;

    return {ability, character};
};

const createScenario = async ({expert = false, includeSideScheme = false} = {}) => {
    const {scenarios, sets} = await loadCatalog();
    const scenarioRecord = scenarios.find(({_id}) => _id === 'red-skull');
    assert.ok(scenarioRecord);

    const setConfigs = new Map(sets.map(({_id, config}) => [_id, config]));
    const match = new Match({
        mc: {
            data: {
                async getSetConfig(id) {
                    const config = setConfigs.get(id);
                    if (!config) {
                        throw new Error(`Missing test set "${id}".`);
                    }

                    return config;
                },
            },
            mcSocket: {send() {}},
        },
        name: 'red-skull-test',
    });
    match.openDialog = async () => ({});
    match.players = Array.from({length: 2}, (_, index) => ({
        name: `test-player-${index + 1}`,
        initial: index === 0,
        isPlayer: true,
        match,
        amplificationIcons: 0,
        minions: [],
        hand: {
            cards: [],
            async refresh() {},
        },
        gameZone: {
            cards: [],
            minions: [],
            encounters: [],
            dealEncounterCard(cards) {
                this.encounters.push(...cards);
            },
            searchCards(condition) {
                return this.cards.filter(card => checkCondition(card, condition));
            },
            remove(card) {
                const index = this.cards.indexOf(card);
                if (index !== -1) {
                    this.cards.splice(index, 1);
                }
            },
            async refresh() {},
        },
        searchCard() {
            return undefined;
        },
        engage(card) {
            this.minions.push(card);
        },
        removeEngaged(card) {
            const index = this.minions.indexOf(card);
            if (index !== -1) {
                this.minions.splice(index, 1);
            }
        },
        async refresh() {},
    }));

    const factory = new MatchFactory(match);
    const scenario = await factory.createScenario(scenarioRecord.config);
    match.scenario = scenario;
    scenario.selectVillain = async () => {};

    let sideScheme;
    if (includeSideScheme) {
        sideScheme = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
            params: {
                name: 'Plan secundario de prueba',
                set: 'unrelated-modular-set',
                boost: 0,
                startingThreat: 2,
            },
        });
        scenario.scenarioCards.push(sideScheme);
    }

    await scenario.initScenario([], expert);

    return {factory, match, scenario, sideScheme};
};

describe('Cráneo Rojo scenario', () => {
    test('catalog configures villain stages, main schemes, setup, and only registered encounter sets', () => {
        const {config} = redSkull;

        assert.deepEqual(config.villains.map(({params}) => [
            params.stage,
            params.attack,
            params.scheme,
            params.hitPoints,
        ]), [
            [1, 0, 2, [12, true]],
            [2, 1, 3, [16, true]],
            [3, 2, 3, [20, true]],
        ]);
        assert.deepEqual(config.mainSchemes.map(([sideA, sideB]) => [
            sideA.params.name,
            sideB.params.startingThreat,
            sideB.params.acceleration,
            sideB.params.value,
            sideB.params.final,
        ]), [
            ['La tiranía de Cráneo Rojo', 0, [1, true], [8, true], undefined],
            ['El nuevo mundo de Hydra', [1, true], [1, true], [11, true], true],
        ]);
        assert.deepEqual(
            config.cards.map(({card}) =>
                card.params.image.match(/\d+\.png$/)?.[0]
            ),
            [
                '04131.png',
                '04132.png',
                '04133.png',
                '04134.png',
                '04135.png',
                '04136.png',
                '04137.png',
                '04138.png',
                '04139.png',
                '04140.png',
                '04141.png',
                '04142.png',
                '04143.png',
                '04144.png',
            ]
        );
        assert.deepEqual(config.mainSchemes[0][0].params.content, {
            villains: [1, 2],
            villainsExpert: [2, 3],
        });
        assert.deepEqual(config.sets, ['standard']);
        assert.deepEqual(config.defaultSets, ['hydra-assault', 'hydra-patrol']);
        assert.equal(config.sets.includes(redSkull._id), false);
        assert.deepEqual(config.setAsideCards.map(({card}) => card.params.name), [
            'El Durmiente',
        ]);

        const redHouse = config.cards.find(({card}) =>
            card.params.name === 'La Casa Roja').card;
        assert.deepEqual(redHouse.params.startingThreat, [3, true]);
        assert.equal(redHouse.params.boost, 0);
        assert.equal(redHouse.params.abilities[0].type, ABILITY_CONSTANT);
        assert.equal(
            redHouse.params.abilities[0].params.validation.type,
            EFFECT_CANNOT_TARGET
        );
        assert.deepEqual(
            redHouse.params.abilities[0].params.validation.params.targetCondition,
            {name: 'Cráneo Rojo'}
        );
        assert.equal(redHouse.params.abilities[1].type, ABILITY_INTERRUPT);
        assert.equal(
            redHouse.params.abilities[1].params.trigger,
            TRIGGER_SCHEME_GET_THWART
        );
        assert.equal(
            redHouse.params.abilities[1].params.effect.type,
            EFFECT_SET_THWART_VALUE
        );
        assert.equal(
            redHouse.params.abilities[1].params.effect.params.paramsCalc.formula,
            CALC_ATTACK
        );
        for (const villain of config.villains) {
            assert.equal(villain.params.abilities[0].type, ABILITY_CONSTANT);
            assert.equal(
                villain.params.abilities.some(({params}) => params.validation),
                false
            );
        }
        assert.equal(
            config.mainSchemes[0][1].params.abilities[0].type,
            ABILITY_FORCED_RESPONSE
        );
        assert.equal(
            config.villains[1].params.abilities[1].type,
            ABILITY_WHEN_REVEALED
        );
        assert.equal(
            config.mainSchemes[1][0].params.abilities[0].type,
            ABILITY_WHEN_REVEALED
        );
        const sleepingScheme = config.cards.find(({card}) =>
            card.params.name === 'El Durmiente ha despertado').card;
        assert.equal(sleepingScheme.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(sleepingScheme.params.startingThreat, 0);
        assert.equal(sleepingScheme.params.boost, 0);
        assert.equal(sleepingScheme.params.image, 'scenarios/red-skull/04140.png');
        assert.equal(sleepingScheme.params.abilities[0].type, ABILITY_CONSTANT);
        assert.equal(
            sleepingScheme.params.abilities[0].params.validation.type,
            EFFECT_CANNOT_TARGET
        );
        assert.deepEqual(
            sleepingScheme.params.abilities[0].params.validation.params.effectCategories,
            [EFFECT_CATEGORY_LEAVE_PLAY]
        );
        assert.deepEqual(
            sleepingScheme.params.abilities[0].params.validation.params.targetCondition,
            {name: 'El Durmiente ha despertado', isInPlay: true}
        );
        assert.deepEqual(
            sleepingScheme.params.abilities[0].params.validation.params.effectCondition,
            {'match.inPlayCards.*.name': 'El Durmiente'}
        );
        assert.equal(sleepingScheme.params.abilities[1].type, ABILITY_WHEN_REVEALED);
        assert.equal(sleepingScheme.params.abilities[1].params.effect.type, EFFECT_ENGAGE);
        assert.equal(
            sleepingScheme.params.abilities[1].params.effect.params.target,
            TARGET_INITIAL_PLAYER
        );
        assert.equal(
            sleepingScheme.params.abilities[2].type,
            ABILITY_FORCED_RESPONSE
        );
        assert.equal(
            sleepingScheme.params.abilities[2].params.trigger,
            TRIGGER_CHARACTER_DEFEATED
        );
        assert.deepEqual(
            sleepingScheme.params.abilities[2].params.triggerParams,
            {characterType: CARD_TYPE_MINION}
        );
        assert.equal(
            sleepingScheme.params.abilities[2].params.effect.type,
            EFFECT_REMOVE_CARD
        );
        const concentrationCampsEntry = config.cards.find(({card}) =>
            card.params.name === 'Campos de concentración');
        assert.ok(concentrationCampsEntry);
        assert.equal(concentrationCampsEntry.count, 1);
        const concentrationCamps = concentrationCampsEntry.card;
        assert.equal(concentrationCamps.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(
            concentrationCamps.params.image,
            'scenarios/red-skull/04141.png'
        );
        assert.deepEqual(concentrationCamps.params.startingThreat, [3, true]);
        assert.equal(concentrationCamps.params.boost, 0);
        assert.deepEqual(concentrationCamps.params.icons, {acceleration: 1});
        assert.equal(
            concentrationCamps.params.abilities[0].type,
            ABILITY_WHEN_DEFEATED
        );
        assert.equal(
            concentrationCamps.params.abilities[0].params.effect.type,
            EFFECT_CHAINED
        );
        assert.deepEqual(
            concentrationCamps.params.abilities[0].params.effect.params.effects.map(
                ({type}) => type
            ),
            [EFFECT_SEARCH_CARDS, EFFECT_PUT_PLAY]
        );
        const censorThePastEntry = config.cards.find(({card}) =>
            card.params.name === 'Censurar el pasado');
        assert.ok(censorThePastEntry);
        assert.equal(censorThePastEntry.count, 1);
        const censorThePast = censorThePastEntry.card;
        assert.equal(censorThePast.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(censorThePast.params.set, 'red-skull');
        assert.equal(
            censorThePast.params.image,
            'scenarios/red-skull/04142.png'
        );
        assert.deepEqual(censorThePast.params.startingThreat, [3, true]);
        assert.equal(censorThePast.params.boost, 0);
        assert.deepEqual(censorThePast.params.icons, {acceleration: 1});
        const censorAbility = censorThePast.params.abilities[0];
        assert.equal(censorAbility.type, ABILITY_WHEN_DEFEATED);
        assert.equal(censorAbility.params.effect.type, EFFECT_FOR_EACH);
        assert.equal(
            censorAbility.params.effect.params.target,
            TARGET_ALL_PLAYERS
        );
        const censorChain = censorAbility.params.effect.params.effect;
        assert.equal(censorChain.type, EFFECT_CHAINED);
        assert.deepEqual(
            censorChain.params.effects.map(({type}) => type),
            [EFFECT_SEARCH_CARDS, EFFECT_MOVE_TO_DECK]
        );
        assert.deepEqual(censorChain.params.effects[0].params.locations, [
            PLACE_DISCARD_PILE,
        ]);
        assert.equal(censorChain.params.effects[0].params.count, 3);
        assert.equal(censorChain.params.effects[0].params.upTo, true);
        assert.equal(censorChain.params.effects[1].params.target, TARGET_YOU);
        assert.equal(censorChain.params.effects[1].params.cards, 'selectedCards');
        assert.equal(
            censorChain.params.effects[1].params.position,
            DECK_POSITION_SHUFFLE
        );
        const sleeper = config.setAsideCards[0].card;
        assert.deepEqual(sleeper.params.traits, ['elite', 'hydra', 'robot']);
        assert.deepEqual(sleeper.params.keywords, {
            guard: true,
            retaliate: 1,
            toughness: true,
        });
        assert.equal(sleeper.params.abilities[0].type, ABILITY_WHEN_REVEALED);
        assert.equal(sleeper.params.abilities[0].params.effect.type, EFFECT_ENGAGE);
        assert.equal(
            sleeper.params.abilities[0].params.effect.params.target,
            TARGET_INITIAL_PLAYER
        );
        assert.equal(sleeper.params.abilities[1].params.effect.type, EFFECT_REMOVE_CARD);
        assert.equal(
            sleeper.params.abilities[1].params.effect.params.target,
            TARGET_THIS
        );

        const factory = new CardsFactory({
            match: {players: [], triggerCards: {}},
        });
        const cardConfigs = [
            ...config.villains,
            ...config.mainSchemes.flat(),
            ...config.cards.map(({card}) => card),
            ...config.setAsideCards.map(({card}) => card),
        ];

        for (const cardConfig of cardConfigs) {
            const card = factory.createGameCardFromConfig(
                structuredClone(cardConfig)
            );
            const abilities = [
                ...card.abilities,
                ...card.sides.flatMap(side => side.abilities),
            ];

            for (const ability of abilities) {
                if (ability.effect) {
                    assert.equal(typeof ability.effect.canRun, 'function', card.name);
                    assert.equal(Array.isArray(ability.effect), false, card.name);
                }
            }
        }

        const houseAbilities = factory.createGameCardFromConfig(
            structuredClone(redHouse)
        ).abilities;
        assert.ok(houseAbilities[0].validation instanceof CannotTargetEffect);
        assert.ok(houseAbilities[1] instanceof InterruptAbility);
        assert.ok(houseAbilities[1].effect instanceof SetThwartValueEffect);
        assert.equal(houseAbilities[1].effect.target, TARGET_EFFECT);

        const concentrationCampsCard = factory.createGameCardFromConfig(
            structuredClone(concentrationCamps)
        );
        const defeatedAbility = concentrationCampsCard.abilities[0];
        assert.ok(defeatedAbility.effect instanceof ChainedEffect);
        assert.ok(defeatedAbility.effect.effects[0] instanceof SearchCardsEffect);
        assert.ok(defeatedAbility.effect.effects[1] instanceof PutPlayEffect);
        assert.deepEqual(defeatedAbility.effect.effects[0].locations, [
            PLACE_DECK,
            PLACE_DISCARD_PILE,
        ]);
        assert.deepEqual(defeatedAbility.effect.effects[0].filter, {isAlly: true});

        const censorThePastCard = factory.createGameCardFromConfig(
            structuredClone(censorThePast)
        );
        const censorEffect = censorThePastCard.abilities[0].effect;
        assert.ok(censorEffect instanceof ForEachEffect);
        assert.equal(censorEffect.effectDefinition.type, EFFECT_CHAINED);
        assert.deepEqual(
            censorEffect.effectDefinition.params.effects.map(({type}) => type),
            [EFFECT_SEARCH_CARDS, EFFECT_MOVE_TO_DECK]
        );
    });

    test('Refuerzos de Hydra configures its per-player threat and non-elite discard ability', () => {
        const entry = redSkull.config.cards.find(({card}) =>
            card.params.name === 'Refuerzos de Hydra');
        assert.ok(entry);
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(entry.card.params.set, 'red-skull');
        assert.equal(entry.card.params.image, 'scenarios/red-skull/04143.png');
        assert.deepEqual(entry.card.params.startingThreat, [2, true]);
        assert.equal(entry.card.params.boost, 0);
        assert.deepEqual(entry.card.params.icons, {hazard: 1});

        const abilityConfig = entry.card.params.abilities[0];
        assert.equal(abilityConfig.type, ABILITY_WHEN_DEFEATED);
        assert.equal(abilityConfig.params.effect.type, EFFECT_DISCARD_GAME);
        assert.equal(
            abilityConfig.params.effect.params.target,
            TARGET_CONDITION_CARD
        );
        assert.deepEqual(abilityConfig.params.effect.params.condition, {
            isMinion: true,
            isInPlay: true,
            not: {traits: TRAIT_ELITE},
        });

        const factory = new CardsFactory({
            match: {players: [], triggerCards: {}},
        });
        const card = factory.createGameCardFromConfig(
            structuredClone(entry.card)
        );
        assert.ok(card.abilities[0].effect instanceof DiscardFromGameEffect);
        assert.equal(typeof card.abilities[0].effect.canRun, 'function');
    });

    test('Caos generalizado configures its per-player discard and resource calculation', () => {
        const entry = redSkull.config.cards.find(({card}) =>
            card.params.name === 'Caos generalizado');
        assert.ok(entry);
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(entry.card.params.set, 'red-skull');
        assert.equal(entry.card.params.image, 'scenarios/red-skull/04144.png');
        assert.equal(entry.card.params.startingThreat, 0);
        assert.equal(entry.card.params.boost, 0);
        assert.deepEqual(entry.card.params.icons, {crisis: true});

        const abilityConfig = entry.card.params.abilities[0];
        assert.equal(abilityConfig.type, ABILITY_WHEN_REVEALED);
        assert.equal(abilityConfig.params.effect.type, EFFECT_FOR_EACH);
        assert.equal(
            abilityConfig.params.effect.params.target,
            TARGET_ALL_PLAYERS
        );
        const chainConfig = abilityConfig.params.effect.params.effect;
        assert.equal(chainConfig.type, EFFECT_CHAINED);
        assert.deepEqual(
            chainConfig.params.effects.map(({type}) => type),
            [EFFECT_DISCARD_FROM_DECK, EFFECT_PLACE_THREAT]
        );
        assert.deepEqual(chainConfig.params.effects[0].params, {
            target: TARGET_YOU,
            count: 5,
        });
        assert.equal(
            chainConfig.params.effects[1].params.target,
            TARGET_THIS
        );
        assert.equal(
            chainConfig.params.effects[1].params.paramsCalc.formula,
            CALC_DIFFERENT_RESOURCE_TYPE
        );
        assert.equal(
            chainConfig.params.effects[1].params.paramsCalc.target,
            'effects.0.cards'
        );

        const factory = new CardsFactory({
            match: {players: [], triggerCards: {}},
        });
        const card = factory.createGameCardFromConfig(
            structuredClone(entry.card)
        );
        const ability = card.abilities[0];
        assert.ok(ability.effect instanceof ForEachEffect);
        assert.equal(ability.effect.effectDefinition.type, EFFECT_CHAINED);
        assert.equal(typeof ability.effect.canRun, 'function');
    });

    test('Poder infinito configures ordered identity-specific effects and its printed boost', async () => {
        const entry = redSkull.config.cards.find(({card}) =>
            card.params.name === 'Poder infinito');
        assert.ok(entry);
        assert.equal(entry.count, 2);
        assert.equal(entry.card.type, CARD_TYPE_TREACHERY);
        assert.equal(entry.card.params.set, 'red-skull');
        assert.equal(entry.card.params.image, 'scenarios/red-skull/04138.png');
        assert.equal(entry.card.params.boost, 2);
        assert.equal(entry.card.params.boostAbility, undefined);

        const {scenario} = await createScenario();
        assert.equal(
            scenario.deck.cards.filter(({name}) =>
                name === entry.card.params.name
            ).length,
            2
        );

        const [alterEgoConfig, heroConfig] = entry.card.params.abilities;
        assert.equal(alterEgoConfig.type, ABILITY_WHEN_REVEALED_ALTEREGO);
        assert.deepEqual(alterEgoConfig.params.effect, {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_TOUGH,
                        params: {target: TARGET_VILLAIN},
                    },
                    {
                        type: EFFECT_ENEMY_SCHEME,
                        params: {
                            enemyType: CHARACTER_VILLAIN,
                            target: TARGET_MAIN_SCHEME,
                        },
                    },
                ],
            },
        });
        assert.equal(heroConfig.type, ABILITY_WHEN_REVEALED_HERO);
        assert.deepEqual(heroConfig.params.effect, {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_TOUGH,
                        params: {target: TARGET_VILLAIN},
                    },
                    {
                        type: EFFECT_ENEMY_ATTACK,
                        params: {
                            enemyType: CHARACTER_VILLAIN,
                            target: TARGET_YOU,
                        },
                    },
                ],
            },
        });

        const factory = new CardsFactory({
            match: {players: [], triggerCards: {}},
        });
        const card = factory.createGameCardFromConfig(
            structuredClone(entry.card)
        );
        const [alterEgoAbility, heroAbility] = card.abilities;
        assert.ok(alterEgoAbility.effect instanceof ChainedEffect);
        assert.ok(alterEgoAbility.effect.effects[0] instanceof ToughEffect);
        assert.ok(alterEgoAbility.effect.effects[1] instanceof EnemySchemeEffect);
        assert.ok(heroAbility.effect instanceof ChainedEffect);
        assert.ok(heroAbility.effect.effects[0] instanceof ToughEffect);
        assert.ok(heroAbility.effect.effects[1] instanceof EnemyAttackEffect);
        assert.equal(typeof alterEgoAbility.effect.canRun, 'function');
        assert.equal(typeof heroAbility.effect.canRun, 'function');
        assert.equal(
            await alterEgoAbility.canRun({
                player: {isHero: true, isAlterEgo: false},
            }),
            false
        );
        assert.equal(
            await heroAbility.canRun({
                player: {isHero: false, isAlterEgo: true},
            }),
            false
        );
    });

    test('Difundir mentiras places threat on every scheme when revealed and gives Red Skull Tough as a boost', async () => {
        const entry = redSkull.config.cards.find(({card}) =>
            card.params.name === 'Difundir mentiras');
        assert.ok(entry);
        assert.equal(entry.count, 2);
        assert.equal(entry.card.type, CARD_TYPE_TREACHERY);
        assert.equal(entry.card.params.set, 'red-skull');
        assert.equal(entry.card.params.image, 'scenarios/red-skull/04137.png');
        assert.equal(entry.card.params.boost, 1);

        const [whenRevealedConfig] = entry.card.params.abilities;
        assert.equal(whenRevealedConfig.type, ABILITY_WHEN_REVEALED);
        assert.deepEqual(whenRevealedConfig.params.effect, {
            type: EFFECT_PLACE_THREAT,
            params: {
                target: TARGET_ALL_SCHEMES,
                threat: 2,
            },
        });
        assert.equal(entry.card.params.boostAbility.type, ABILITY_BOOST);
        assert.deepEqual(entry.card.params.boostAbility.params.effect, {
            type: EFFECT_TOUGH,
            params: {
                target: TARGET_VILLAIN,
            },
        });

        const {factory, match, scenario} = await createScenario();
        const copies = scenario.deck.cards.filter(({name}) =>
            name === 'Difundir mentiras');
        assert.equal(copies.length, 2);
        const [treachery] = copies;
        const sideSchemes = Array.from({length: 2}, (_, index) =>
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
                params: {
                    name: `Plan secundario de prueba ${index + 1}`,
                    set: 'unrelated-modular-set',
                    boost: 0,
                    startingThreat: index + 1,
                },
            }, {owner: scenario}));
        scenario.gameZone.cards = sideSchemes;

        const schemes = match.schemes;
        const originalThreat = schemes.map(({threat}) => threat);
        const player = match.initialPlayer;
        const whenRevealed = treachery.abilities.find(({isWhenRevealed}) =>
            isWhenRevealed);
        assert.ok(whenRevealed.effect instanceof PlaceThreatEffect);
        await whenRevealed.resolveAbility({player, card: treachery});
        assert.deepEqual(
            schemes.map(({threat}) => threat),
            originalThreat.map(threat => threat + 2)
        );

        const villain = scenario.villains[0];
        scenario.gameZone.currentVillain = villain;
        const enemyActivation = {
            enemy: villain,
            boostCards: [treachery],
        };
        const boost = new ResolveBoostEffect({
            enemyActivation,
            card: treachery,
            match,
        });
        await boost.runEffect({match, player});
        assert.equal(villain.isTough, true);
        assert.equal(villain.tough, 1);
    });

    test('Enemigo acérrimo exhausts a calculated number of controlled characters and one for its boost', async () => {
        const entry = redSkull.config.cards.find(({card}) =>
            card.params.name === 'Enemigo acérrimo');
        assert.ok(entry);
        assert.equal(entry.count, 2);
        assert.equal(entry.card.type, CARD_TYPE_TREACHERY);
        assert.equal(entry.card.params.set, 'red-skull');
        assert.equal(entry.card.params.image, 'scenarios/red-skull/04136.png');
        assert.equal(entry.card.params.boost, 0);

        const whenRevealedConfig = entry.card.params.abilities[0];
        assert.equal(whenRevealedConfig.type, ABILITY_WHEN_REVEALED);
        assert.equal(
            whenRevealedConfig.params.effect.type,
            EFFECT_EXHAUST
        );
        assert.equal(
            whenRevealedConfig.params.effect.params.target,
            TARGET_ALL_CHARACTERS_YOU_CONTROL
        );
        assert.equal(
            whenRevealedConfig.params.effect.params.multipleTarget,
            true
        );
        assert.deepEqual(
            whenRevealedConfig.params.effect.params.targetCountCalc,
            {
                target: 'match.sideSchemes',
                formula: CALC_COUNT,
            }
        );
        assert.equal(entry.card.params.boostAbility.type, ABILITY_BOOST);
        assert.deepEqual(entry.card.params.boostAbility.params.effect, {
            type: EFFECT_EXHAUST,
            params: {
                target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                selectCount: 1,
            },
        });

        const {factory, match, scenario} = await createScenario();
        const copies = scenario.deck.cards.filter(({name}) =>
            name === 'Enemigo acérrimo');
        assert.equal(copies.length, 2);
        const [treachery] = copies;
        const player = match.players.find(({initial}) => initial);
        const otherPlayer = match.players.find(({initial}) => !initial);
        const characters = Array.from({length: 3}, (_, index) => ({
            id: `controlled-character-${index + 1}`,
            name: `Personaje controlado ${index + 1}`,
            exhausted: false,
            exhaust() {
                this.exhausted = true;
            },
            async refresh() {},
            toObj() {
                return {id: this.id, name: this.name};
            },
        }));
        const otherCharacter = {
            id: 'other-player-character',
            name: 'Personaje de otro jugador',
            exhausted: false,
            exhaust() {
                this.exhausted = true;
            },
            async refresh() {},
        };
        player.friends = characters;
        otherPlayer.friends = [otherCharacter];

        const sideSchemes = Array.from({length: 2}, (_, index) =>
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
                params: {
                    name: `Plan secundario de prueba ${index + 1}`,
                    set: 'unrelated-modular-set',
                    boost: 0,
                    startingThreat: 1,
                },
            }, {owner: scenario}));
        scenario.gameZone.cards = sideSchemes;
        assert.equal(match.sideSchemes.length, 2);

        match.openDialog = async ({dialogType, data}) => dialogType ===
            DIALOG_SELECT_TARGET ?
            {selected: data.cards.slice(0, data.count)} :
            {};

        const whenRevealed = treachery.abilities.find(({isWhenRevealed}) =>
            isWhenRevealed);
        assert.ok(whenRevealed.effect instanceof ExhaustEffect);
        assert.equal(typeof whenRevealed.effect.canRun, 'function');
        assert.equal(whenRevealed.effect.match, match);
        await whenRevealed.resolveAbility({player, card: treachery});
        assert.deepEqual(characters.map(({exhausted}) => exhausted), [
            true,
            true,
            false,
        ]);
        assert.equal(otherCharacter.exhausted, false);

        assert.ok(treachery.boostAbility.effect instanceof ExhaustEffect);
        const enemyActivation = {
            enemy: scenario.villains[0],
            boostCards: [treachery],
        };
        const boost = new ResolveBoostEffect({
            enemyActivation,
            card: treachery,
            match,
        });
        await boost.runEffect({
            match,
            player,
        });
        assert.deepEqual(characters.map(({exhausted}) => exhausted), [
            true,
            true,
            true,
        ]);
        assert.equal(otherCharacter.exhausted, false);
    });

    test('Luger de Cráneo Rojo configures its attachment, attack keywords, action, and boost ability', () => {
        const entry = redSkull.config.cards.find(({card}) =>
            card.params.name === 'Luger de Cráneo Rojo');
        assert.ok(entry);
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_ATTACHMENT);
        assert.equal(entry.card.params.set, 'red-skull');
        assert.equal(entry.card.params.image, 'scenarios/red-skull/04132.png');
        assert.deepEqual(entry.card.params.traits, [TRAIT_WEAPON]);
        assert.equal(entry.card.params.unique, true);
        assert.equal(entry.card.params.attack, 1);
        assert.equal(entry.card.params.scheme, 1);
        assert.equal(entry.card.params.boost, 0);
        assert.equal(entry.card.params.attach, TARGET_VILLAIN);

        const [attackAbility, heroAction] = entry.card.params.abilities;
        assert.equal(attackAbility.type, ABILITY_CONSTANT);
        assert.equal(attackAbility.params.trigger, TRIGGER_VILLAIN_ATTACKS);
        assert.deepEqual(attackAbility.params.effect, {
            type: EFFECT_MODIFY_ATTACK,
            params: {
                target: TARGET_EFFECT,
                modify: {
                    keywords: {
                        ranged: true,
                        piercing: true,
                    },
                },
            },
        });
        assert.equal(heroAction.type, ABILITY_HERO_ACTION);
        assert.deepEqual(heroAction.params.arrow, {
            type: EFFECT_SPEND,
            params: {
                resources: [
                    RESOURCE_ENERGY,
                    RESOURCE_MENTAL,
                    RESOURCE_PHYSICAL,
                ],
            },
        });
        assert.deepEqual(heroAction.params.effect, {
            type: EFFECT_DISCARD_GAME,
            params: {target: TARGET_THIS},
        });
        assert.deepEqual(entry.card.params.boostAbility, {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_PUT_PLAY,
                    params: {
                        cardSource: 'card',
                        controller: 'player.match.scenario',
                        target: TARGET_VILLAIN,
                    },
                },
            },
        });

        const factory = new CardsFactory({
            match: {players: [], triggerCards: {}},
        });
        const card = factory.createGameCardFromConfig(
            structuredClone(entry.card)
        );
        assert.equal(typeof card.abilities[0].effect.canRun, 'function');
        assert.equal(typeof card.abilities[1].effect.canRun, 'function');
        assert.ok(card.boostAbility.effect instanceof PutPlayEffect);
        assert.equal(typeof card.boostAbility.effect.canRun, 'function');
    });

    test('Derechazo de Cráneo Rojo configures Retaliate, its printed boost, and Hero Action', () => {
        const entry = redSkull.config.cards.find(({card}) =>
            card.params.name === 'Derechazo de Cráneo Rojo');
        assert.ok(entry);
        assert.equal(entry.count, 2);
        assert.equal(entry.card.type, CARD_TYPE_ATTACHMENT);
        assert.equal(entry.card.params.set, 'red-skull');
        assert.equal(entry.card.params.image, 'scenarios/red-skull/04133.png');
        assert.deepEqual(entry.card.params.traits, [TRAIT_SKILL]);
        assert.equal(entry.card.params.boost, 3);
        assert.equal(entry.card.params.attach, TARGET_VILLAIN);
        assert.deepEqual(entry.card.params.keywords, {retaliate: 1});
        assert.equal(entry.card.params.boostAbility, undefined);

        const [heroAction] = entry.card.params.abilities;
        assert.equal(entry.card.params.abilities.length, 1);
        assert.equal(heroAction.type, ABILITY_HERO_ACTION);
        assert.deepEqual(heroAction.params.arrow, {
            type: EFFECT_SPEND,
            params: {
                resources: [
                    RESOURCE_ENERGY,
                    RESOURCE_MENTAL,
                    RESOURCE_PHYSICAL,
                ],
            },
        });
        assert.deepEqual(heroAction.params.effect, {
            type: EFFECT_DISCARD_GAME,
            params: {target: TARGET_THIS},
        });

        const factory = new CardsFactory({
            match: {players: [], triggerCards: {}},
        });
        const card = factory.createGameCardFromConfig(
            structuredClone(entry.card)
        );
        assert.equal(typeof card.abilities[0].effect.canRun, 'function');
        assert.equal(card.boost, 3);
    });

    test('Realidad distorsionada incites and gives the initial player an encounter card when its side scheme is about to be defeated', async () => {
        const {factory, match, scenario, sideScheme} = await createScenario({
            includeSideScheme: true,
        });
        const initialPlayer = match.initialPlayer;
        const otherPlayer = match.players.find(player => player !== initialPlayer);
        const encounterCard = {name: 'Encuentro de prueba'};

        scenario.gameZone.cards = scenario.gameZone.cards.filter(
            gameCard => !gameCard.isScheme
        );
        sideScheme.controller = scenario;
        scenario.gameZone.addToGameZone(sideScheme);

        const entry = redSkull.config.cards.find(({card}) =>
            card.params.name === 'Realidad distorsionada');
        assert.ok(entry);
        assert.equal(entry.count, 2);
        assert.equal(entry.card.type, CARD_TYPE_ATTACHMENT);
        assert.equal(entry.card.params.set, 'red-skull');
        assert.equal(entry.card.params.image, 'scenarios/red-skull/04135.png');
        assert.deepEqual(entry.card.params.traits, [TRAIT_CONDITION]);
        assert.equal(entry.card.params.boost, 2);
        assert.equal(entry.card.params.attach, TARGET_SIDE_SCHEME);
        assert.deepEqual(entry.card.params.keywords, {incite: 1});

        const [forcedInterrupt] = entry.card.params.abilities;
        assert.equal(forcedInterrupt.type, ABILITY_FORCED_INTERRUPT);
        assert.equal(forcedInterrupt.params.trigger, TRIGGER_ATTACHED_DEFEAT);
        assert.deepEqual(forcedInterrupt.params.effect, {
            type: EFFECT_DEAL_ENCOUNTER,
            params: {
                target: TARGET_INITIAL_PLAYER,
                count: 1,
            },
        });

        const attachment = factory.cardsFactory.createGameCardFromConfig(
            structuredClone(entry.card)
        );
        const [ability] = attachment.abilities;
        assert.ok(ability.effect instanceof DealEncounterEffect);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(attachment.incite, 1);
        assert.equal(await ability.canRun({match, player: otherPlayer}), true);

        match.drawEncounterCards = async count => {
            assert.equal(count, 1);
            assert.equal(attachment.attachedTo, sideScheme);
            assert.equal(sideScheme.isInPlay, true);
            return [encounterCard];
        };
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }

            return {};
        };
        await new PutPlayEffect({
            card: attachment,
            controller: scenario,
            match,
            target: TARGET_SIDE_SCHEME,
        }).runEffect({match, player: otherPlayer});

        assert.equal(attachment.attachedTo, sideScheme);
        assert.equal(sideScheme.attached.length, 1);
        assert.equal(
            attachment.triggers[TRIGGER_ATTACHED_DEFEAT][PRIORITY_FORCED_INTERRUPT].length,
            1
        );
        await new DefeatEffect({
            match,
            selectedTarget: sideScheme,
            target: TARGET_SIDE_SCHEME,
        }).runEffect({match, player: otherPlayer});

        assert.equal(sideScheme.isInPlay, false);
        assert.equal(attachment.attachedTo, undefined);
        assert.deepEqual(initialPlayer.gameZone.encounters, [encounterCard]);
        assert.deepEqual(otherPlayer.gameZone.encounters, []);
    });

    test('Estratega consumado adds one boost per side scheme once per Red Skull activation, then discards', async () => {
        const {factory, match, scenario, sideScheme} = await createScenario({
            includeSideScheme: true,
        });
        const player = match.initialPlayer;
        const villain = scenario.villains[0];
        scenario.gameZone.currentVillain = villain;
        player.superhero = {currentSide: {name: 'Héroe de prueba'}};
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }

            return {};
        };

        const entry = redSkull.config.cards.find(({card}) =>
            card.params.name === 'Estratega consumado');
        assert.ok(entry);
        assert.equal(entry.count, 2);
        assert.equal(entry.card.type, CARD_TYPE_ATTACHMENT);
        assert.equal(entry.card.params.set, 'red-skull');
        assert.equal(entry.card.params.image, 'scenarios/red-skull/04134.png');
        assert.deepEqual(entry.card.params.traits, [TRAIT_SKILL]);
        assert.equal(entry.card.params.boost, 2);
        assert.equal(entry.card.params.attach, TARGET_VILLAIN);

        const [abilityConfig] = entry.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_FORCED_INTERRUPT);
        assert.equal(
            abilityConfig.params.trigger,
            TRIGGER_VILLAIN_ACTIVATES
        );
        assert.deepEqual(abilityConfig.params.condition, {
            'effect.character.name': 'Cráneo Rojo',
        });
        assert.deepEqual(abilityConfig.params.maximum, {
            count: 1,
            target: TARGET_ACTIVATION,
        });
        assert.deepEqual(abilityConfig.params.effect, {
            type: EFFECT_DEAL_BOOST,
            params: {
                paramsCalc: {
                    target: 'match.sideSchemes',
                    formula: CALC_COUNT,
                },
                thenEffect: {
                    type: EFFECT_DISCARD_GAME,
                    params: {target: TARGET_THIS},
                },
            },
        });

        const cardsFactory = new CardsFactory({
            match: {players: [], triggerCards: {}},
        });
        const card = cardsFactory.createGameCardFromConfig(
            structuredClone(entry.card)
        );
        assert.ok(card.abilities[0].effect instanceof DealBoostEffect);
        assert.ok(
            card.abilities[0].effect.thenEffect instanceof DiscardFromGameEffect
        );
        assert.equal(typeof card.abilities[0].effect.canRun, 'function');

        scenario.gameZone.cards = scenario.gameZone.cards.filter(
            gameCard => !gameCard.isScheme
        );
        const secondSideScheme = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
            params: {
                name: 'Segundo plan secundario de prueba',
                set: 'unrelated-modular-set',
                boost: 0,
                startingThreat: 2,
            },
        });
        scenario.gameZone.addToGameZone(sideScheme);
        scenario.gameZone.addToGameZone(secondSideScheme);
        assert.equal(match.sideSchemes.length, 2);

        const strategistCards = scenario.deck.cards.filter(gameCard =>
            gameCard.name === 'Estratega consumado'
        );
        assert.equal(strategistCards.length, 2);
        for (const strategist of strategistCards) {
            await new PutPlayEffect({
                card: strategist,
                controller: scenario,
                match,
                target: TARGET_VILLAIN,
            }).runEffect({match, player});
        }

        const otherVillain = {isVillain: true, name: 'Otro villano'};
        const unrelatedSchemeActivation = new EnemySchemeEffect({
            enemy: otherVillain,
            match,
        });
        unrelatedSchemeActivation.execute = async () => {};
        unrelatedSchemeActivation.getActivationCharacterData = async () => ({});
        unrelatedSchemeActivation.getCharacterDialogData = async () => ({});
        await unrelatedSchemeActivation.runEffect({match, player});
        assert.equal(unrelatedSchemeActivation.boostCards.length, 0);
        assert.ok(strategistCards.every(({attachedTo}) =>
            attachedTo === villain
        ));

        const firstActivation = new EnemySchemeEffect({
            enemy: villain,
            match,
        });
        firstActivation.execute = async () => {};
        firstActivation.getActivationCharacterData = async () => ({});
        firstActivation.getCharacterDialogData = async () => ({});
        const firstActivationParams = firstActivation.getTriggersParams({
            match,
            player,
        });
        const strategistTriggers = strategistCards.flatMap(strategist =>
            strategist.triggers[TRIGGER_VILLAIN_ACTIVATES][
                PRIORITY_FORCED_INTERRUPT
            ]
        );
        assert.equal(strategistTriggers.length, 2);
        assert.equal(
            await strategistTriggers[0].canTrigger(firstActivationParams),
            true
        );
        await firstActivation.runEffect({match, player});

        assert.equal(firstActivation.boostCards.length, 2);
        assert.equal(
            strategistCards.filter(({attachedTo}) => attachedTo === villain).length,
            1
        );
        assert.equal(match.limits[TARGET_ACTIVATION], undefined);

        const secondActivation = new EnemyAttackEffect({
            enemy: villain,
            match,
            selectedTarget: player,
        });
        secondActivation.execute = async () => {};
        secondActivation.getCharacterDialogData = async () => ({});
        await secondActivation.runEffect({match, player});

        assert.equal(secondActivation.boostCards.length, 2);
        assert.equal(
            strategistCards.some(({attachedTo}) => attachedTo === villain),
            false
        );
        assert.equal(match.limits[TARGET_ACTIVATION], undefined);
    });

    test('Estratega consumado resolves its Then clause when there are no side schemes', async () => {
        const {match, scenario} = await createScenario();
        const player = match.initialPlayer;
        const villain = scenario.villains[0];
        scenario.gameZone.currentVillain = villain;
        player.superhero = {currentSide: {name: 'Héroe de prueba'}};
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }

            return {};
        };
        scenario.gameZone.cards = scenario.gameZone.cards.filter(
            gameCard => !gameCard.isScheme
        );
        assert.equal(match.sideSchemes.length, 0);

        const strategist = scenario.deck.cards.find(card =>
            card.name === 'Estratega consumado'
        );
        assert.ok(strategist);
        await new PutPlayEffect({
            card: strategist,
            controller: scenario,
            match,
            target: TARGET_VILLAIN,
        }).runEffect({match, player});

        const activation = new EnemyAttackEffect({
            enemy: villain,
            match,
            selectedTarget: player,
        });
        activation.execute = async () => {};
        activation.getCharacterDialogData = async () => ({});
        await activation.runEffect({match, player});

        assert.equal(activation.boostCards.length, 0);
        assert.equal(strategist.attachedTo, undefined);
    });

    test('attack keywords follow their active source and retain recorded use after it leaves play', async () => {
        const match = {triggerCards: {}};
        const attacker = {
            isInPlay: true,
            isVillain: true,
            name: 'Cráneo Rojo',
        };
        const source = {isInPlay: true};
        const ability = {card: source};
        const attack = new EnemyAttackEffect({
            enemy: attacker,
            match,
            selectedTarget: {},
        });
        const nonAttackEffect = new ModifyAttackEffect({
            match,
            modify: {},
            selectedTarget: {},
        });
        assert.equal('attackKeywordModifiers' in nonAttackEffect, false);
        assert.equal('usedAttackKeywords' in nonAttackEffect, false);
        assert.equal(typeof nonAttackEffect.getAttackKeyword, 'undefined');
        assert.ok(Array.isArray(attack.attackKeywordModifiers));
        assert.ok(attack.usedAttackKeywords instanceof Set);
        new ModifyAttackEffect({
            ability,
            match,
            modify: {
                keywords: {
                    piercing: true,
                    ranged: true,
                },
            },
            selectedTarget: attack,
        }).execute({});

        assert.equal(attack.piercing, true);
        assert.equal(attack.ranged, true);

        const toughTarget = {
            isTough: true,
            removeTough() {
                this.isTough = false;
            },
            async refresh() {},
        };
        const damage = new TakeDamageEffect({
            activation: new Attack({effect: attack}),
            damage: 1,
            isAttack: true,
            match,
            selectedTarget: toughTarget,
        });
        assert.equal(await damage.triggerWould({effect: damage, match}), true);
        assert.equal(toughTarget.isTough, false);
        assert.equal(attack.usedAttackKeywords.has('piercing'), true);

        source.isInPlay = false;
        assert.equal(attack.piercing, false);
        assert.equal(attack.ranged, false);
        assert.equal(damage.piercing, false);
        assert.equal(attack.usedAttackKeywords.has('piercing'), true);

        const unusedSource = {isInPlay: true};
        const unusedAttack = new EnemyAttackEffect({
            enemy: attacker,
            match,
            selectedTarget: {},
        });
        new ModifyAttackEffect({
            ability: {card: unusedSource},
            match,
            modify: {keywords: {piercing: true}},
            selectedTarget: unusedAttack,
        }).execute({});
        const unusedToughTarget = {
            isTough: true,
            removeTough() {
                this.isTough = false;
            },
            async refresh() {},
        };
        const unusedDamage = new TakeDamageEffect({
            activation: new Attack({effect: unusedAttack}),
            damage: 1,
            isAttack: true,
            match,
            selectedTarget: unusedToughTarget,
        });
        unusedSource.isInPlay = false;

        assert.equal(
            await unusedDamage.triggerWould({effect: unusedDamage, match}),
            false
        );
        assert.equal(unusedToughTarget.isTough, false);
        assert.equal(unusedAttack.usedAttackKeywords.has('piercing'), false);
    });

    test('Soldado de Hydra con exoarmadura configures toughness and its boost ability', () => {
        const entry = redSkull.config.cards.find(({card}) =>
            card.params.name === 'Soldado de Hydra con exoarmadura');
        assert.ok(entry);
        assert.equal(entry.count, 1);
        assert.equal(entry.card.type, CARD_TYPE_MINION);
        assert.equal(entry.card.params.set, 'red-skull');
        assert.equal(entry.card.params.image, 'scenarios/red-skull/04131.png');
        assert.deepEqual(entry.card.params.traits, [TRAIT_HYDRA]);
        assert.equal(entry.card.params.attack, 2);
        assert.equal(entry.card.params.scheme, 2);
        assert.equal(entry.card.params.hitPoints, 5);
        assert.deepEqual(entry.card.params.keywords, {toughness: true});
        assert.equal(entry.card.params.boost, 0);

        const boostAbilityConfig = entry.card.params.boostAbility;
        assert.equal(boostAbilityConfig.type, ABILITY_BOOST);
        assert.equal(
            boostAbilityConfig.params.effect.type,
            EFFECT_SIMULTANEOUS
        );
        assert.deepEqual(
            boostAbilityConfig.params.effect.params.effects.map(({type}) =>
                type
            ),
            [EFFECT_TOUGH, EFFECT_DEAL_BOOST]
        );
        for (
            const effectConfig of boostAbilityConfig.params.effect.params.effects
        ) {
            assert.equal(effectConfig.params.target, TARGET_VILLAIN);
        }

        const factory = new CardsFactory({
            match: {players: [], triggerCards: {}},
        });
        const card = factory.createGameCardFromConfig(
            structuredClone(entry.card)
        );
        assert.equal(card.toughness, true);
        assert.ok(card.boostAbility.effect instanceof SimultaneousEffect);
        assert.ok(card.boostAbility.effect.effects[0] instanceof ToughEffect);
        assert.ok(card.boostAbility.effect.effects[1] instanceof DealBoostEffect);
        assert.equal(typeof card.boostAbility.effect.canRun, 'function');
    });

    test('Soldado de Hydra con exoarmadura gives the Villain Tough and an extra boost during its boost resolution', async () => {
        const {factory, match, scenario} = await createScenario();
        const villain = scenario.villains[0];
        scenario.gameZone.currentVillain = villain;
        const soldierConfig = redSkull.config.cards.find(({card}) =>
            card.params.name === 'Soldado de Hydra con exoarmadura').card;
        const soldierCopies = scenario.deck.cards.filter(({name}) =>
            name === soldierConfig.params.name);
        assert.equal(soldierCopies.length, 1);
        const [soldier] = soldierCopies;
        const additionalBoostCards = [
            'Aumento adicional 1',
            'Aumento adicional 2',
        ].map(name => ({
            isMainScheme: false,
            isSideScheme: false,
            toObj() {
                return {name};
            },
        }));
        const enemyActivation = {
            enemy: villain,
            boostCards: [soldier],
        };
        let drawCount = 0;
        match.drawEncounterCards = async () => {
            const card = additionalBoostCards[drawCount];
            drawCount++;

            return [card];
        };

        const boost = new ResolveBoostEffect({
            enemyActivation,
            card: soldier,
            match,
        });
        await boost.runEffect({
            match,
            player: match.initialPlayer,
        });

        assert.equal(villain.isTough, true);
        assert.equal(villain.tough, 1);
        assert.equal(drawCount, 1);
        assert.deepEqual(
            enemyActivation.boostCards,
            [soldier, additionalBoostCards[0]]
        );

        const alreadyToughSoldier = factory.cardsFactory.createGameCardFromConfig(
            structuredClone(soldierConfig)
        );
        const alreadyToughActivation = {
            enemy: villain,
            boostCards: [alreadyToughSoldier],
        };
        const alreadyToughBoost = new ResolveBoostEffect({
            enemyActivation: alreadyToughActivation,
            card: alreadyToughSoldier,
            match,
        });
        await alreadyToughBoost.runEffect({
            match,
            player: match.initialPlayer,
        });

        assert.equal(villain.tough, 1);
        assert.equal(drawCount, 2);
        assert.deepEqual(
            alreadyToughActivation.boostCards,
            [alreadyToughSoldier, additionalBoostCards[1]]
        );
    });

    test('Luger de Cráneo Rojo attaches on boost, modifies attacks while attached, and discards through its Hero Action', async () => {
        const {match, scenario} = await createScenario();
        const player = match.initialPlayer;
        const villain = scenario.villains[0];
        scenario.gameZone.currentVillain = villain;

        player.damage = 0;
        player.placeDamage = damage => {
            player.damage += damage;
        };
        player.getLife = async () => 15 - player.damage;
        const heroSide = {
            isHero: true,
            isInPlay: true,
            isTough: true,
            retaliate: 1,
            async refresh() {},
            removeTough() {
                this.isTough = false;
            },
        };
        const superhero = {
            name: 'Superhéroe de prueba',
            owner: player,
            selectedSide: 1,
            sides: [{isHero: false}, heroSide],
            isSuperhero: true,
            isInPlay: true,
            amplificationIcons: 0,
            get currentSide() {
                return this.sides[this.selectedSide];
            },
            placeDamage(damage) {
                player.placeDamage(damage);
            },
            getLife() {
                return player.getLife();
            },
            removeTough() {
                this.currentSide.removeTough();
            },
        };
        player.superhero = superhero;
        player.isHero = true;

        const lugerCopies = scenario.deck.cards.filter(card =>
            card.name === 'Luger de Cráneo Rojo');
        assert.equal(lugerCopies.length, 1);
        const [luger] = lugerCopies;
        assert.ok(luger);
        const statsBefore = await villain.getEffectiveStats({player});
        const attackBefore = statsBefore.attack;
        const schemeBefore = statsBefore.scheme;
        const attack = new EnemyAttackEffect({
            enemy: villain,
            match,
            selectedTarget: player,
        });
        attack.dealBoostCards = async () => {
            attack.boostCards = [luger];
        };
        attack.showBoostCards = async () => {};
        attack.defense = async () => {};
        attack.getCharacterDialogData = async () => ({});
        await attack.runEffect({match, player});

        assert.equal(luger.attachedTo, villain);
        assert.equal(scenario.deck.cards.includes(luger), false);
        const attackAfter = await villain.getEffectiveStats({player});
        assert.equal(attackAfter.attack, attackBefore + 1);
        assert.equal(attackAfter.scheme, schemeBefore + 1);
        assert.equal(attack.ranged, true);
        assert.equal(attack.piercing, true);
        assert.equal(heroSide.isTough, false);
        assert.equal(player.damage, 1);
        assert.equal(attack.usedAttackKeywords.has('piercing'), true);
        assert.equal(attack.usedAttackKeywords.has('ranged'), true);

        const attackWhileAttached = new EnemyAttackEffect({
            enemy: villain,
            match,
            selectedTarget: player,
        });
        await attackWhileAttached.triggerInit(
            attackWhileAttached.getTriggersParams({match, player})
        );
        assert.equal(attackWhileAttached.ranged, true);
        assert.equal(attackWhileAttached.piercing, true);

        await luger.abilities[1].resolveAbility({
            match,
            player,
            arrowPaid: true,
        });
        assert.equal(Boolean(luger.attachedTo), false);
        const statsAfterDiscard = await villain.getEffectiveStats({player});
        assert.equal(statsAfterDiscard.attack, attackBefore);
        assert.equal(statsAfterDiscard.scheme, schemeBefore);

        const attackWithoutLuger = new EnemyAttackEffect({
            enemy: villain,
            match,
            selectedTarget: player,
        });
        await attackWithoutLuger.triggerInit(
            attackWithoutLuger.getTriggersParams({match, player})
        );
        assert.equal(Boolean(attackWithoutLuger.ranged), false);
        assert.equal(Boolean(attackWithoutLuger.piercing), false);
    });

    test('Derechazo de Cráneo Rojo grants Retaliate while attached and loses it when discarded', async () => {
        const {match, scenario} = await createScenario();
        const player = match.initialPlayer;
        player.isHero = true;
        const villain = scenario.villains[0];
        scenario.gameZone.currentVillain = villain;
        villain.attached ??= [];
        const attachment = scenario.deck.cards.find(card =>
            card.name === 'Derechazo de Cráneo Rojo');
        assert.ok(attachment);

        const putPlay = new PutPlayEffect({
            card: attachment,
            controller: scenario,
            match,
            target: TARGET_VILLAIN,
        });
        await putPlay.runEffect({match, player});

        assert.equal(attachment.attachedTo, villain);
        assert.equal(villain.retaliate, 1);

        await attachment.abilities[0].resolveAbility({
            arrowPaid: true,
            match,
            player,
        });

        assert.equal(Boolean(attachment.attachedTo), false);
        assert.equal(villain.retaliate, 0);
    });

    test('Campos de concentración puts an Ally from the defeating player deck or discard into play, then shuffles that deck', async () => {
        const {factory, match, scenario} = await createScenario();
        const defeatingPlayer = match.players[1];
        const otherPlayer = match.players[0];
        const initializePlayerDeck = player => {
            player.deck = new Deck({owner: player, isPlayerDeck: true});
            player.deck.refresh = async () => {};
            player.allies = [];
            player.gameZone.addToGameZone = card => {
                player.gameZone.cards.push(card);
                if (card.isAlly) {
                    player.allies.push(card);
                }
            };
        };
        initializePlayerDeck(defeatingPlayer);
        initializePlayerDeck(otherPlayer);

        let allyIndex = 0;
        const createAlly = (owner, name) => factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name,
                hitPoints: 2,
                attack: 1,
                thwart: 1,
            },
        }, {index: ++allyIndex, owner});
        const deckAlly = createAlly(defeatingPlayer, 'Aliado del mazo');
        const discardAlly = createAlly(defeatingPlayer, 'Aliado del descarte');
        const otherPlayerAlly = createAlly(otherPlayer, 'Aliado de otro jugador');
        defeatingPlayer.deck.cards = [deckAlly];
        defeatingPlayer.deck.discardPile = [discardAlly];
        otherPlayer.deck.cards = [otherPlayerAlly];

        let shuffleCount = 0;
        defeatingPlayer.deck.shuffle = () => {
            shuffleCount++;
            defeatingPlayer.deck.knownCards = [];
            assert.ok(defeatingPlayer.gameZone.cards.includes(discardAlly));
        };

        const sideSchemeDeck = scenario.getExtraDeck(SIDE_SCHEME_DECK);
        const concentrationCamps = sideSchemeDeck.cards.find(({name}) =>
            name === 'Campos de concentración');
        assert.ok(concentrationCamps);

        const getCard = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            cardSource: [concentrationCamps],
            match,
        });
        await getCard.runEffect({match, player: defeatingPlayer});
        const reveal = new RevealEncounterEffect({
            card: 'effects.0.card',
            match,
        });
        await reveal.runEffect({
            match,
            player: defeatingPlayer,
            effects: [getCard],
        });

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }
            if (dialog.dialogType === DIALOG_SELECT_CARD) {
                return {selected: [{id: discardAlly.id}]};
            }

            return {};
        };
        const defeat = match.effectsFactory.createEffect({
            type: EFFECT_DEFEAT,
            target: TARGET_SIDE_SCHEME,
            selectedTarget: concentrationCamps,
            match,
        });
        await defeat.runEffect({match, player: defeatingPlayer});

        const searchDialog = dialogs.find(({dialogType}) =>
            dialogType === DIALOG_SELECT_CARD);
        assert.ok(searchDialog);
        assert.deepEqual(
            searchDialog.data.cards.map(({id}) => id),
            [deckAlly.id, discardAlly.id]
        );
        assert.ok(defeatingPlayer.gameZone.cards.includes(discardAlly));
        assert.ok(defeatingPlayer.allies.includes(discardAlly));
        assert.strictEqual(discardAlly.controller, defeatingPlayer);
        assert.equal(defeatingPlayer.deck.discardPile.includes(discardAlly), false);
        assert.deepEqual(defeatingPlayer.deck.cards, [deckAlly]);
        assert.deepEqual(otherPlayer.deck.cards, [otherPlayerAlly]);
        assert.equal(shuffleCount, 1);
    });

    test('Censurar el pasado returns up to three discard cards to each player deck and shuffles it', async () => {
        const {factory, match, scenario} = await createScenario();
        const [firstPlayer, secondPlayer] = match.players;
        const shuffleCounts = new Map();
        const initializePlayerDeck = player => {
            player.deck = new Deck({owner: player, isPlayerDeck: true});
            player.deck.refresh = async () => {};
            const shuffle = player.deck.shuffle.bind(player.deck);
            player.deck.shuffle = () => {
                shuffleCounts.set(
                    player,
                    (shuffleCounts.get(player) || 0) + 1
                );
                shuffle();
            };
        };
        initializePlayerDeck(firstPlayer);
        initializePlayerDeck(secondPlayer);

        let cardIndex = 0;
        const createAlly = (owner, name) =>
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_ALLY,
                params: {
                    name,
                    hitPoints: 2,
                    attack: 1,
                    thwart: 1,
                },
            }, {index: ++cardIndex, owner});
        const firstDeckCard = createAlly(firstPlayer, 'Carta del mazo 1');
        const firstDiscardCards = Array.from({length: 4}, (_, index) =>
            createAlly(firstPlayer, `Descarte jugador 1 ${index + 1}`));
        const secondDeckCard = createAlly(secondPlayer, 'Carta del mazo 2');
        const secondDiscardCards = Array.from({length: 2}, (_, index) =>
            createAlly(secondPlayer, `Descarte jugador 2 ${index + 1}`));
        firstPlayer.deck.cards = [firstDeckCard];
        firstPlayer.deck.discardPile = firstDiscardCards.slice();
        secondPlayer.deck.cards = [secondDeckCard];
        secondPlayer.deck.discardPile = secondDiscardCards.slice();

        const selectedIds = new Set(
            firstDiscardCards.slice(0, 3).map(({id}) => id)
        );
        const selectionDialogs = [];
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }
            if (dialog.dialogType !== DIALOG_SELECT_CARD) {
                return {};
            }

            selectionDialogs.push(dialog);

            return {
                selected: dialog.data.cards
                    .filter(({id}) => selectedIds.has(id))
                    .map(({id}) => ({id})),
            };
        };

        const sideSchemeDeck = scenario.getExtraDeck(SIDE_SCHEME_DECK);
        const censorThePast = sideSchemeDeck.cards.find(({name}) =>
            name === 'Censurar el pasado');
        assert.ok(censorThePast);
        const censorEffect = censorThePast.abilities[0].effect;
        assert.ok(censorEffect instanceof ForEachEffect);
        const censorChainEffect = censorEffect.createTargetEffect();
        assert.ok(censorChainEffect instanceof ChainedEffect);
        assert.ok(censorChainEffect.effects[0] instanceof SearchCardsEffect);
        assert.ok(censorChainEffect.effects[1] instanceof MoveToDeckEffect);
        assert.equal(censorChainEffect.effects[0].count, 3);
        assert.equal(censorChainEffect.effects[0].upTo, true);
        assert.equal(censorChainEffect.effects[1].target, TARGET_YOU);
        assert.equal(censorChainEffect.effects[1].cardsSource, 'selectedCards');
        assert.equal(
            censorChainEffect.effects[1].position,
            DECK_POSITION_SHUFFLE
        );
        const getCard = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            cardSource: [censorThePast],
            match,
        });
        await getCard.runEffect({match, player: firstPlayer});
        const reveal = new RevealEncounterEffect({
            card: 'effects.0.card',
            match,
        });
        await reveal.runEffect({
            match,
            player: firstPlayer,
            effects: [getCard],
        });
        assert.strictEqual(getCard.card, censorThePast);
        assert.ok(scenario.sideSchemes.includes(censorThePast));

        const defeat = match.effectsFactory.createEffect({
            type: EFFECT_DEFEAT,
            target: TARGET_SIDE_SCHEME,
            selectedTarget: censorThePast,
            match,
        });
        await defeat.runEffect({match, player: firstPlayer});

        assert.equal(selectionDialogs.length, 2);
        for (const dialog of selectionDialogs) {
            assert.equal(dialog.data.count, 3);
            assert.equal(dialog.data.upTo, true);
        }
        assert.deepEqual(new Set(firstPlayer.deck.cards), new Set([
            firstDeckCard,
            ...firstDiscardCards.slice(0, 3),
        ]));
        assert.deepEqual(firstPlayer.deck.discardPile, [firstDiscardCards[3]]);
        assert.deepEqual(secondPlayer.deck.cards, [secondDeckCard]);
        assert.deepEqual(secondPlayer.deck.discardPile, secondDiscardCards);
        assert.equal(shuffleCounts.get(firstPlayer), 1);
        assert.equal(shuffleCounts.get(secondPlayer), 1);
    });

    test('Refuerzos de Hydra lets the player who defeated it discard a non-elite minion', async () => {
        const {match, scenario} = await createScenario();
        const [otherPlayer, defeatingPlayer] = match.players;
        for (const player of match.players) {
            player.deck = {async refresh() {}};
        }

        let minionIndex = 0;
        const createMinion = (player, name, traits = []) => {
            const minion = {
                id: `test-minion-${++minionIndex}`,
                name,
                traits,
                isMinion: true,
                isInPlay: true,
                abilities: [],
                controller: player,
                toObj() {
                    return {id: this.id, name: this.name};
                },
                async discard() {
                    this.isInPlay = false;
                    this.controller.removeEngaged(this);
                },
            };
            player.engage(minion);

            return minion;
        };
        const eliteMinion = createMinion(
            defeatingPlayer,
            'Esbirro de Élite',
            [TRAIT_ELITE]
        );
        const otherPlayerMinion = createMinion(
            otherPlayer,
            'Esbirro no élite del otro jugador'
        );
        const defeatingPlayerMinion = createMinion(
            defeatingPlayer,
            'Esbirro no élite del jugador que derrotó el Plan'
        );

        const sideSchemeDeck = scenario.getExtraDeck(SIDE_SCHEME_DECK);
        const hydraReinforcements = sideSchemeDeck.cards.find(({name}) =>
            name === 'Refuerzos de Hydra');
        assert.ok(hydraReinforcements);
        const getCard = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            cardSource: [hydraReinforcements],
            match,
        });
        await getCard.runEffect({match, player: defeatingPlayer});
        const reveal = new RevealEncounterEffect({
            card: 'effects.0.card',
            match,
        });
        await reveal.runEffect({
            match,
            player: defeatingPlayer,
            effects: [getCard],
        });

        const ability = hydraReinforcements.abilities[0];
        assert.ok(ability.effect instanceof DiscardFromGameEffect);
        assert.deepEqual(
            ability.effect.getValidTarget({match, player: defeatingPlayer}),
            [otherPlayerMinion, defeatingPlayerMinion]
        );

        let targetDialog;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }
            if (dialog.dialogType === DIALOG_SELECT_TARGET) {
                targetDialog = dialog;

                return {selected: {id: otherPlayerMinion.id}};
            }

            return {};
        };
        const defeat = match.effectsFactory.createEffect({
            type: EFFECT_DEFEAT,
            target: TARGET_SIDE_SCHEME,
            selectedTarget: hydraReinforcements,
            match,
        });
        await defeat.runEffect({match, player: defeatingPlayer});

        assert.deepEqual(
            targetDialog.data.cards.map(({id}) => id),
            [otherPlayerMinion.id, defeatingPlayerMinion.id]
        );
        assert.equal(eliteMinion.isInPlay, true);
        assert.equal(otherPlayerMinion.isInPlay, false);
        assert.equal(defeatingPlayerMinion.isInPlay, true);
        assert.ok(sideSchemeDeck.discardPile.includes(hydraReinforcements));
    });

    test('Caos generalizado discards five cards per player and places threat for each player\'s distinct resources', async () => {
        const {match, scenario} = await createScenario();
        const resourceTypesByPlayer = [
            [
                [RESOURCE_PHYSICAL],
                [RESOURCE_PHYSICAL],
                [RESOURCE_MENTAL],
                [],
                [],
                [],
            ],
            [
                [RESOURCE_PHYSICAL],
                [RESOURCE_ENERGY],
                [RESOURCE_ENERGY],
                [],
                [],
                [],
            ],
        ];
        const discardedByPlayer = [];
        match.players.forEach((player, playerIndex) => {
            const deck = new Deck({owner: player, isPlayerDeck: true});
            deck.cards = resourceTypesByPlayer[playerIndex].map(
                (resources, cardIndex) => ({
                    name: `Carta ${playerIndex}-${cardIndex}`,
                    resources,
                    toObj() {
                        return {name: this.name};
                    },
                })
            );
            deck.refresh = async () => {};
            player.deck = deck;
            discardedByPlayer.push(deck.cards.slice(0, 5));
        });

        const sideSchemeDeck = scenario.getExtraDeck(SIDE_SCHEME_DECK);
        const generalizedChaosCopies = sideSchemeDeck.cards.filter(({name}) =>
            name === 'Caos generalizado');
        assert.equal(generalizedChaosCopies.length, 1);
        const [generalizedChaos] = generalizedChaosCopies;
        assert.ok(generalizedChaos);
        const playerEffect = generalizedChaos.abilities[0].effect.createTargetEffect();
        assert.ok(playerEffect instanceof ChainedEffect);
        assert.ok(playerEffect.effects[0] instanceof DiscardFromDeckEffect);
        assert.ok(playerEffect.effects[1] instanceof PlaceThreatEffect);

        const getCard = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            cardSource: [generalizedChaos],
            match,
        });
        await getCard.runEffect({match, player: match.initialPlayer});
        const reveal = new RevealEncounterEffect({
            card: 'effects.0.card',
            match,
        });
        await reveal.runEffect({
            match,
            player: match.initialPlayer,
            effects: [getCard],
        });

        assert.equal(generalizedChaos.threat, 4);
        match.players.forEach((player, playerIndex) => {
            assert.deepEqual(player.deck.discardPile, discardedByPlayer[playerIndex]);
            assert.equal(player.deck.cards.length, 1);
        });
        assert.ok(scenario.sideSchemes.includes(generalizedChaos));
    });

    test('El Durmiente ha despertado starts without threat, stays in play while El Durmiente is in play, and is removed when it is defeated', async () => {
        const {factory, match, scenario} = await createScenario();
        const sideSchemeDeck = scenario.getExtraDeck(SIDE_SCHEME_DECK);
        const sleepingScheme = sideSchemeDeck.cards.find(({name}) =>
            name === 'El Durmiente ha despertado');
        const sleeper = scenario.apart.find(({name}) => name === 'El Durmiente');
        const heroicStrikeConfig = captainAmerica.config.cards.find(({card}) =>
            card.params.name === 'Golpe heroico');

        assert.ok(sleepingScheme);
        assert.ok(sleeper);
        assert.ok(heroicStrikeConfig);

        const heroicStrike = factory.cardsFactory.createGameCardFromConfig(
            structuredClone(heroicStrikeConfig.card)
        );
        const [heroicStrikeAbility] = heroicStrike.abilities;
        const [heroicStrikeDamage] = heroicStrikeAbility.effect.effects;

        const minionEntryDialogs = [];
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_ENCOUNTERS_REVEAL &&
                dialog.title === 'Esbirro puesto en juego') {
                minionEntryDialogs.push({
                    card: dialog.data.card,
                    isInPlay: sleeper.isInPlay,
                });
            }

            return {};
        };

        const getSleepingScheme = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            cardSource: [sleepingScheme],
            match,
        });
        await getSleepingScheme.runEffect({
            match,
            player: match.initialPlayer,
        });
        assert.strictEqual(getSleepingScheme.card, sleepingScheme);

        const reveal = new RevealEncounterEffect({
            card: 'effects.0.card',
            match,
        });
        await reveal.runEffect({
            match,
            player: match.initialPlayer,
            effects: [getSleepingScheme],
        });

        assert.ok(scenario.sideSchemes.includes(sleepingScheme));
        assert.equal(sleepingScheme.threat, 0);
        assert.strictEqual(sleeper.engaged, match.initialPlayer);
        assert.ok(match.initialPlayer.minions.includes(sleeper));
        assert.equal(minionEntryDialogs.length, 1);
        assert.equal(minionEntryDialogs[0].card.name, sleeper.name);
        assert.equal(minionEntryDialogs[0].isInPlay, true);

        const leavePlayEffectTypes = [
            EFFECT_DEFEAT,
            EFFECT_DISCARD_GAME,
            EFFECT_MOVE_TO_DECK,
            EFFECT_MOVE_TO_HAND,
            EFFECT_REMOVE_CARD,
            EFFECT_RETURN_HAND,
        ];
        for (const type of leavePlayEffectTypes) {
            const effect = match.effectsFactory.createEffect({
                type,
                target: TARGET_SIDE_SCHEME,
                selectedTarget: sleepingScheme,
                match,
            });
            assert.ok(effect.effectCategories.includes(EFFECT_CATEGORY_LEAVE_PLAY), type);
        }

        const removeScheme = match.effectsFactory.createEffect({
            type: EFFECT_REMOVE_CARD,
            target: TARGET_SIDE_SCHEME,
            selectedTarget: sleepingScheme,
            match,
        });
        assert.equal(removeScheme.validTarget.filter(sleepingScheme, {
            match,
            player: match.initialPlayer,
            effect: removeScheme,
        }), false);

        const moveScheme = match.effectsFactory.createEffect({
            type: EFFECT_MOVE_TO_DECK,
            target: TARGET_ENCOUNTER_DECK,
            cards: [sleepingScheme],
            position: DECK_POSITION_TOP,
            match,
        });
        await moveScheme.runEffect({
            match,
            player: match.initialPlayer,
        });
        assert.ok(scenario.sideSchemes.includes(sleepingScheme));
        assert.equal(scenario.deck.cards.includes(sleepingScheme), false);

        sleepingScheme.placeThreat(2);
        const {ability: basicThwart, character} =
            createBasicThwart(match, sleepingScheme);
        const removeThreat = basicThwart.effect;
        assert.equal(
            await removeThreat.canRun({
                match,
                player: match.initialPlayer,
            }),
            true
        );
        await removeThreat.runEffect({
            match,
            player: match.initialPlayer,
            card: character,
            threat: 2,
        });

        assert.equal(sleepingScheme.threat, 0);
        assert.ok(scenario.sideSchemes.includes(sleepingScheme));

        match.openDialog = async ({dialogType, data}) =>
            dialogType === DIALOG_USE_CARD ?
                {selected: {id: data.cards[0].id}} :
                {};
        const defeatSleeper = match.effectsFactory.createEffect({
            type: EFFECT_DEFEAT,
            target: TARGET_MINION,
            selectedTarget: sleeper,
            match,
        });
        await defeatSleeper.runEffect({
            match,
            player: match.initialPlayer,
            preselectedEffectTargets: new Set([heroicStrikeDamage]),
        });

        assert.ok(match.removedCards.includes(sleepingScheme));
        assert.equal(scenario.sideSchemes.includes(sleepingScheme), false);
        assert.equal(scenario.deck.discardPile.includes(sleepingScheme), false);
    });

    test('a minion shown by RevealEncounterEffect does not get a duplicate put-in-play dialog', async () => {
        const {match, scenario} = await createScenario();
        const sleeper = scenario.apart.find(({name}) => name === 'El Durmiente');
        const dialogs = [];

        assert.ok(sleeper);
        match.openDialog = async dialog => {
            dialogs.push(dialog);

            return {};
        };

        const reveal = new RevealEncounterEffect({
            selectedTarget: sleeper,
            match,
        });
        await reveal.runEffect({
            match,
            player: match.initialPlayer,
        });

        assert.equal(sleeper.isInPlay, true);
        assert.ok(match.initialPlayer.minions.includes(sleeper));
        assert.ok(dialogs.some(({dialogType, data}) =>
            dialogType === DIALOG_ENCOUNTERS_REVEAL &&
            data.card.name === sleeper.name
        ));
        assert.equal(dialogs.some(({title, data}) =>
            title === 'Esbirro puesto en juego' &&
            data.card.name === sleeper.name
        ), false);
    });

    test('a basic thwart defeats an unprotected side scheme after removing its last threat', async () => {
        const {match, scenario} = await createScenario();
        const redHouse = scenario.sideSchemes.find(({name}) =>
            name === 'La Casa Roja');
        const {ability: basicThwart, character} =
            createBasicThwart(match, redHouse);
        let basicThwartResponseCount = 0;
        const responseCard = {
            id: 'test-basic-thwart-response',
            name: 'Respuesta de intervención básica',
            owner: match.initialPlayer,
            triggers: {},
        };
        responseCard.triggers[TRIGGER_YOU_BASIC_THWART] = {
            [PRIORITY_FORCED_RESPONSE]: [{
                ability: {hideDialog: true},
                card: responseCard,
                async canTrigger() {
                    return true;
                },
                async runTrigger() {
                    basicThwartResponseCount++;
                },
            }],
        };
        match.triggerCards[responseCard.id] = responseCard;

        assert.ok(redHouse);
        assert.equal(
            await basicThwart.effect.canRun({
                match,
                player: match.initialPlayer,
            }),
            true
        );

        await basicThwart.effect.runEffect({
            match,
            player: match.initialPlayer,
            card: character,
            threat: redHouse.threat,
        });

        assert.equal(redHouse.threat, 0);
        assert.equal(scenario.sideSchemes.includes(redHouse), false);
        assert.ok(
            scenario.getExtraDeck(SIDE_SCHEME_DECK).discardPile.includes(redHouse)
        );
        assert.equal(basicThwartResponseCount, 1);
    });

    test('setup creates a filtered, shuffled side-scheme deck and the forced response reveals its top card', async () => {
        const {match, scenario, sideScheme} = await createScenario({
            includeSideScheme: true,
        });
        const redHouse = scenario.sideSchemes.find(({name}) =>
            name === 'La Casa Roja');
        const sideSchemeDeck = scenario.getExtraDeck(SIDE_SCHEME_DECK);
        const sleepingScheme = sideSchemeDeck.cards.find(({name}) =>
            name === 'El Durmiente ha despertado');

        assert.ok(redHouse);
        assert.ok(sleepingScheme);
        assert.equal(sideSchemeDeck.name, 'Planes secundarios');
        assert.equal(sideSchemeDeck.isScenarioExtraDeck, true);
        assert.equal(sideSchemeDeck.hasDiscard, true);
        assert.deepEqual(sideSchemeDeck.collectCondition, {isSideScheme: true});
        assert.equal(sideSchemeDeck.cards.length, 7);
        assert.equal(sideScheme.set, 'unrelated-modular-set');
        assert.ok(sideSchemeDeck.cards.includes(sideScheme));
        assert.ok(sideSchemeDeck.cards.includes(sleepingScheme));
        const concentrationCamps = sideSchemeDeck.cards.find(({name}) =>
            name === 'Campos de concentración');
        assert.ok(concentrationCamps);
        const censorThePast = sideSchemeDeck.cards.find(({name}) =>
            name === 'Censurar el pasado');
        assert.ok(censorThePast);
        const hydraPatrolScheme = sideSchemeDeck.cards.find(({name}) =>
            name === 'Patrulla de Hydra');
        assert.ok(hydraPatrolScheme);
        assert.equal(hydraPatrolScheme.set, 'hydra-patrol');
        assert.equal(
            sideSchemeDeck.cards.filter(({name}) =>
                name === 'Campos de concentración').length,
            1
        );
        sideSchemeDeck.cards = [
            sideScheme,
            sleepingScheme,
            concentrationCamps,
            censorThePast,
            hydraPatrolScheme,
        ];
        assert.equal(scenario.deck.cards.includes(redHouse), false);
        assert.equal(scenario.deck.cards.includes(sideScheme), false);
        assert.equal(scenario.deck.cards.includes(sleepingScheme), false);
        assert.equal(scenario.deck.cards.includes(concentrationCamps), false);
        assert.equal(scenario.deck.cards.includes(censorThePast), false);
        assert.equal(scenario.deck.cards.includes(hydraPatrolScheme), false);
        assert.equal(
            scenario.deck.cards.some(card =>
                card.isSideScheme && card.set === 'hydra-patrol'),
            false
        );

        const forcedResponse = scenario.mainScheme.abilities[0];
        assert.ok(forcedResponse);
        assert.equal(forcedResponse.trigger, TRIGGER_VILLAIN_PHASE_STEP);
        assert.deepEqual(forcedResponse.condition, {step: 1});

        await forcedResponse.effect.runEffect({
            match,
            player: match.initialPlayer,
        });
        assert.equal(sideSchemeDeck.cards.length, 4);
        assert.ok(scenario.sideSchemes.includes(sideScheme));

        const getFromSideSchemeDeck = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            match,
        });
        assert.equal(await getFromSideSchemeDeck.canRun({match}), true);
    });

    test('the side-scheme reveal response uses a fresh effect tree on each resolution', async () => {
        const {match, scenario} = await createScenario();
        const redHouse = scenario.sideSchemes.find(({name}) =>
            name === 'La Casa Roja');
        const forcedResponse = scenario.mainScheme.abilities[0];
        const sideSchemeDeck = scenario.getExtraDeck(SIDE_SCHEME_DECK);
        const sleepingScheme = sideSchemeDeck.cards.find(({name}) =>
            name === 'El Durmiente ha despertado');
        const concentrationCamps = sideSchemeDeck.cards.find(({name}) =>
            name === 'Campos de concentración');

        assert.ok(redHouse);
        assert.ok(forcedResponse);
        assert.ok(sleepingScheme);
        assert.ok(concentrationCamps);
        await redHouse.defeat();
        assert.ok(sideSchemeDeck.discardPile.includes(redHouse));
        sideSchemeDeck.cards = [sleepingScheme];

        const revealSideScheme = async () => {
            await forcedResponse.resolveAbility({
                match,
                player: match.initialPlayer,
                step: 1,
            });
        };

        await revealSideScheme();

        assert.ok(scenario.sideSchemes.includes(sleepingScheme));
        assert.ok(sideSchemeDeck.cards.includes(redHouse));

        await revealSideScheme();

        assert.ok(scenario.sideSchemes.includes(redHouse));
        assert.equal(sideSchemeDeck.cards.includes(redHouse), false);
    });

    test('a restored side-scheme response reveals the drawn card despite a stale reveal target', async () => {
        const {match, scenario} = await createScenario();
        const sideSchemeDeck = scenario.getExtraDeck(SIDE_SCHEME_DECK);
        const concentrationCamps = sideSchemeDeck.cards.find(({name}) =>
            name === 'Campos de concentración');
        const censorThePast = sideSchemeDeck.cards.find(({name}) =>
            name === 'Censurar el pasado');
        const forcedResponse = scenario.mainScheme.abilities[0];

        assert.ok(concentrationCamps);
        assert.ok(censorThePast);
        assert.ok(forcedResponse);

        const revealEffect = forcedResponse.effectDefinition.effects[1];
        sideSchemeDeck.cards = [];
        sideSchemeDeck.discardPile = [censorThePast];
        const getEffect = forcedResponse.effectDefinition.effects[0];
        getEffect.card = concentrationCamps;
        getEffect.resolved = true;
        revealEffect.card = concentrationCamps;
        revealEffect.selectedTarget = {name: 'RRR'};
        revealEffect.resolved = false;

        const players = match.players;
        const matchOpenDialog = match.openDialog;
        const scenarioSelectVillain = scenario.selectVillain;
        match.players = [];
        delete match.openDialog;
        delete scenario.selectVillain;

        let snapshot;
        try {
            snapshot = serializeMatch(match);
        } finally {
            match.players = players;
            match.openDialog = matchOpenDialog;
            scenario.selectVillain = scenarioSelectVillain;
        }
        snapshot.nodes.forEach(node => {
            if (Array.isArray(node.properties)) {
                node.properties = node.properties.filter(([property]) =>
                    ![
                        '_effectInstanceDefinition',
                        '_modifiedConfigValues',
                        'cardSource',
                    ].includes(property));
            }
        });

        const restoredMatch = restoreMatch(snapshot, match.mc);
        restoredMatch.openDialog = async () => ({});
        const restoredScenario = restoredMatch.scenario;
        const restoredSideSchemeDeck =
            restoredScenario.getExtraDeck(SIDE_SCHEME_DECK);
        const restoredForcedResponse = restoredScenario.mainScheme.abilities[0];
        const restoredConcentrationCamps = restoredSideSchemeDeck.cards[0];
        const restoredCensorThePast = restoredSideSchemeDeck.discardPile[0];
        const player = {
            isPlayer: true,
            match: restoredMatch,
            name: 'test-player',
        };

        assert.equal(
            restoredForcedResponse.effectDefinition.effects[1].cardSource,
            'effects.0.card'
        );
        assert.ok(restoredConcentrationCamps);
        assert.equal(restoredConcentrationCamps.name, 'Campos de concentración');

        const revealNextSideScheme = () =>
            restoredForcedResponse.resolveAbility({
                match: restoredMatch,
                player,
                selectedTarget: {name: 'RRR'},
                step: 1,
            });

        await revealNextSideScheme();

        assert.ok(restoredScenario.sideSchemes.includes(restoredConcentrationCamps));
        assert.ok(restoredSideSchemeDeck.cards.includes(restoredCensorThePast));

        await revealNextSideScheme();

        assert.ok(restoredScenario.sideSchemes.includes(restoredCensorThePast));
        assert.equal(restoredSideSchemeDeck.cards.length, 0);
    });

    test('normal and expert setup select their printed villain stages', async () => {
        const standard = await createScenario();
        const expert = await createScenario({expert: true});

        assert.deepEqual(standard.scenario.villains.map(({stage}) => stage), [1, 2]);
        assert.deepEqual(expert.scenario.villains.map(({stage}) => stage), [2, 3]);
    });

    test('stage II and III give one encounter card to each player when revealed', async () => {
        const {factory, match} = await createScenario();
        let cardNumber = 0;
        match.drawEncounterCards = async () => [{
            id: `encounter-${++cardNumber}`,
        }];

        for (const stage of [2, 3]) {
            const villainConfig = redSkull.config.villains.find(({params}) =>
                params.stage === stage);
            const villain = factory.cardsFactory.createGameCardFromConfig(
                structuredClone(villainConfig)
            );
            const whenRevealed = villain.abilities.find(ability =>
                ability.isWhenRevealed);

            assert.ok(whenRevealed);
            assert.ok(whenRevealed.effect instanceof ForEachEffect);
            await whenRevealed.effect.runEffect({
                match,
                player: match.initialPlayer,
                card: villain,
            });
        }

        assert.deepEqual(
            match.players.map(({gameZone}) => gameZone.encounters.length),
            [2, 2]
        );
    });

    test('all villain stages gain attack for each side scheme in play', async () => {
        const {factory, scenario, match} = await createScenario({
            includeSideScheme: true,
        });
        const villainStages = redSkull.config.villains.map(villain =>
            factory.cardsFactory.createGameCardFromConfig(
                structuredClone(villain)
            ));
        const getStageAttackValues = async expectedByStage => {
            const values = [];
            for (const villain of villainStages) {
                scenario.gameZone.currentVillain = villain;
                villain.owner = scenario;
                await villain.initTriggers();
                values.push(await villain.getAttackValue({
                    match,
                    player: match.initialPlayer,
                }));
                villain.endTriggers();
            }

            assert.deepEqual(values, expectedByStage);
        };

        await getStageAttackValues([1, 2, 3]);

        const getCard = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            match,
        });
        await getCard.execute({match});
        const reveal = new RevealEncounterEffect({
            card: 'effects.0.card',
            match,
        });
        await reveal.runEffect({
            match,
            player: match.initialPlayer,
            effects: [getCard],
        });

        assert.ok(scenario.sideSchemes.includes(getCard.card));
        await getStageAttackValues([2, 3, 4]);
    });

    test('Red House prevents damage to Red Skull only while it is in play', async () => {
        const {scenario, match} = await createScenario();
        const villain = scenario.villains.find(({stage}) => stage === 1);
        scenario.gameZone.currentVillain = villain;
        villain.owner = scenario;
        const redHouse = scenario.sideSchemes.find(({name}) =>
            name === 'La Casa Roja');
        const damage = new DealDamageEffect({
            target: TARGET_VILLAIN,
            damage: 1,
            match,
        });
        const targetParams = {
            effect: damage,
            match,
            player: match.initialPlayer,
        };

        assert.deepEqual(
            redHouse.abilities[0].validation.blockedEffectCategories,
            [EFFECT_CATEGORY_DAMAGE]
        );
        assert.equal(
            villain.abilities.some(({validation}) => Boolean(validation)),
            false
        );
        assert.equal(damage.validTarget.filter(villain, targetParams), false);
        assert.equal(damage.validTarget.filter({
            name: 'Otro villano',
            abilities: [],
        }, targetParams), true);

        await redHouse.remove();
        assert.equal(damage.validTarget.filter(villain, targetParams), true);
    });

    test('Red House offers its thwart-value interrupt only when thwarting that scheme', async () => {
        const {match, scenario} = await createScenario();
        const redHouse = scenario.sideSchemes.find(({name}) =>
            name === 'La Casa Roja');
        const interrupt = redHouse.triggers[TRIGGER_SCHEME_GET_THWART][PRIORITY_INTERRUPT][0];
        const character = {
            id: 'test-character',
            name: 'Personaje de prueba',
            attack: 3,
            thwart: 2,
            isConfused: false,
            toObj() {
                return {
                    id: this.id,
                    name: this.name,
                    attack: this.attack,
                    thwart: this.thwart,
                };
            },
            async getAttackValue(params) {
                const effect = new GetAttackEffect({
                    selectedTarget: this,
                    match,
                });
                await effect.runEffect(params);

                return effect.attack;
            },
        };
        const registerTrigger = (
            id,
            type,
            priority,
            runTrigger,
            canTrigger = async () => true
        ) => {
            const card = {
                id,
                name: id,
                owner: match.initialPlayer,
                triggers: {},
            };
            const trigger = {
                ability: {hideDialog: true},
                canTrigger,
                card,
                name: id,
                runTrigger,
            };
            card.triggers[type] = {
                [priority]: [trigger],
            };
            match.triggerCards[id] = card;
        };
        let thwartInterruptCount = 0;
        let attackInterruptCount = 0;
        registerTrigger(
            'red-house-thwart-interrupt',
            TRIGGER_SCHEME_GET_THWART,
            PRIORITY_INTERRUPT,
            async () => {
                thwartInterruptCount++;
            },
            async params => params.scheme === redHouse
        );
        registerTrigger(
            'attack-stat-modifier',
            TRIGGER_CHARACTER_GET_ATTACK,
            PRIORITY_CONSTANT,
            async ({effect}) => {
                effect.modifyAttack += 2;
            },
            async ({effect}) => effect.selectedTarget === character
        );
        registerTrigger(
            'attack-action-interrupt',
            TRIGGER_THIS_ATTACK,
            PRIORITY_INTERRUPT,
            async () => {
                attackInterruptCount++;
            }
        );
        const basicThwart = new ThwartBasicAbility({
            card: character,
            match,
            player: match.initialPlayer,
        });
        basicThwart.effect.selectedTarget = redHouse;
        const dialogs = [];
        match.openDialog = async params => {
            dialogs.push(params);
            if (params.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: params.data.cards[0].id}};
            }

            return {};
        };

        const thwart = await basicThwart.getThwartValue({
            match,
            player: match.initialPlayer,
            card: character,
        });

        assert.equal(dialogs.length, 1);
        assert.equal(dialogs[0].title, '¿Quieres usar alguna Interrupción?');
        assert.equal(dialogs[0].data.cards[0].name, redHouse.name);
        assert.equal(thwart, 5);
        assert.equal(interrupt.card, redHouse);
        assert.ok(interrupt.ability.effect instanceof SetThwartValueEffect);
        assert.equal(thwartInterruptCount, 1);
        assert.equal(attackInterruptCount, 0);
        assert.equal(basicThwart.isThwart, true);
        assert.equal(basicThwart.effect.isAttack, false);
        assert.ok(basicThwart.effect.activation instanceof Thwart);

        match.openDialog = async params => {
            dialogs.push(params);

            return {};
        };
        const rejectedThwart = await basicThwart.getThwartValue({
            match,
            player: match.initialPlayer,
            card: character,
        });

        assert.equal(rejectedThwart, 2);
        assert.equal(dialogs.length, 2);

        const otherScheme = {id: 'other-side-scheme'};
        const otherThwart = new GetThwartEffect({
            selectedTarget: character,
            scheme: otherScheme,
            match,
        });
        await otherThwart.runEffect({
            match,
            player: match.initialPlayer,
            card: character,
        });

        assert.equal(dialogs.length, 2);
        assert.equal(thwartInterruptCount, 2);
        assert.equal(attackInterruptCount, 0);
        assert.equal(otherThwart.thwart, 2);
    });

    test('side schemes entering play join the side-scheme discard and cycle when its deck empties', async () => {
        const {factory, match, scenario} = await createScenario({
            includeSideScheme: true,
        });
        const sideSchemeDeck = scenario.getExtraDeck(SIDE_SCHEME_DECK);
        const nemesisSideScheme = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
            params: {
                name: 'Plan secundario de archienemigo',
                set: 'nemesis',
                boost: 0,
                startingThreat: 2,
            },
        });
        nemesisSideScheme.owner = match.initialPlayer;
        nemesisSideScheme.controller = scenario;
        scenario.gameZone.addToGameZone(nemesisSideScheme);

        await nemesisSideScheme.defeat();

        assert.ok(sideSchemeDeck.discardPile.includes(nemesisSideScheme));
        assert.equal(scenario.deck.discardPile.includes(nemesisSideScheme), false);

        sideSchemeDeck.cards = sideSchemeDeck.cards.slice(0, 4);
        const initialSideSchemeCards = sideSchemeDeck.cards.slice();
        const getCard = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            match,
        });
        assert.equal(await getCard.canRun({match}), true);
        await getCard.execute({match});

        assert.ok(initialSideSchemeCards.includes(getCard.card));
        assert.equal(sideSchemeDeck.cards.length, initialSideSchemeCards.length - 1);
        assert.ok(sideSchemeDeck.discardPile.includes(nemesisSideScheme));

        const getSecondCard = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            match,
        });
        await getSecondCard.execute({match});

        assert.ok(initialSideSchemeCards.includes(getSecondCard.card));
        assert.notStrictEqual(getSecondCard.card, getCard.card);
        assert.equal(sideSchemeDeck.cards.length, 2);
        const getThirdCard = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            match,
        });
        await getThirdCard.execute({match});
        assert.ok(initialSideSchemeCards.includes(getThirdCard.card));
        assert.notStrictEqual(getThirdCard.card, getSecondCard.card);
        assert.equal(sideSchemeDeck.cards.length, 1);

        const getFourthCard = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            match,
        });
        await getFourthCard.execute({match});
        assert.ok(initialSideSchemeCards.includes(getFourthCard.card));
        assert.notStrictEqual(getFourthCard.card, getThirdCard.card);
        assert.equal(sideSchemeDeck.cards.length, 1);
        assert.ok(sideSchemeDeck.cards.includes(nemesisSideScheme));
        assert.equal(sideSchemeDeck.discardPile.includes(nemesisSideScheme), false);

        const getCycledCard = new GetEncounterCardEffect({
            from: PLACE_SCENARIO_EXTRA_DECK,
            deckId: SIDE_SCHEME_DECK,
            match,
        });
        assert.equal(await getCycledCard.canRun({match}), true);
        await getCycledCard.execute({match});
        assert.strictEqual(getCycledCard.card, nemesisSideScheme);
    });

    test('non-constant thwart-value effects directly replace the calculated value', async () => {
        const {match} = await createScenario();
        const getThwartEffect = new GetThwartEffect({match});
        const setThwartValue = new SetThwartValueEffect({
            selectedTarget: getThwartEffect,
            value: 4,
            match,
        });

        await setThwartValue.execute({});

        assert.equal(getThwartEffect.thwartOverride, 4);
        assert.equal(getThwartEffect.thwartAlternative, undefined);
    });
});
