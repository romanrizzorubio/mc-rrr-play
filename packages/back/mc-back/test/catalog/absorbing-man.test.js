import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CARD_TYPE_VILLAIN,
    DECK_POSITION_SHUFFLE,
    PRIORITY_FORCED_INTERRUPT,
    TRAIT_ICE,
    TRAIT_METAL,
    TRAIT_STONE,
    TRAIT_WOOD,
    TRIGGER_CARD_ENTER_PLAY,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {MoveToDeckEffect} from '../../src/effects/move-to-deck-effect.js';
import {Match} from '../../src/model/match/match.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Scenario} from '../../src/model/match/scenario.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';

const getScenario = async () => {
    const {scenarios} = await loadCatalog();
    const scenario = scenarios.find(({_id}) => _id === 'absorbing-man');

    assert.ok(scenario);

    return scenario;
};

const createContext = async () => {
    const scenarioData = await getScenario();
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'absorbing-man-test',
    });
    const factory = new MatchFactory(match);
    const scenario = new Scenario({
        mainSchemes: [],
        match,
        name: scenarioData.name,
        scenarioCards: [],
        sets: [],
        villains: [],
    });

    scenario.gameZone = new ScenarioZone({owner: scenario});
    scenario.gameZone.refresh = async () => {};
    scenario.deck = {
        cards: [{}],
        discardPile: [],
        addToDeck(cards) {
            this.cards.push(...cards);
        },
        searchDiscard(card) {
            const index = this.discardPile.indexOf(card);
            if (index > -1) {
                this.discardPile.splice(index, 1);
            }
        },
        shuffle() {},
        async discard(card) {
            this.discardPile.push(card);
        },
        async refresh() {},
    };
    match.scenario = scenario;

    const player = {
        initial: true,
        isPlayer: true,
        match,
        hand: {
            cards: [],
            async refresh() {},
        },
        friends: [],
    };
    match.players = [player];

    return {
        factory,
        match,
        player,
        scenario,
        scenarioData,
    };
};

test('Absorbing Man catalog defines the printed stages, sets, and copies', async () => {
    const scenario = await getScenario();

    assert.equal(scenario.name, 'Hombre Absorbente');
    assert.deepEqual(scenario.config.sets, ['standard']);
    assert.deepEqual(scenario.config.defaultSets, ['hydra-patrol']);
    assert.deepEqual(
        scenario.config.villains.map(({type, params}) => [
            type,
            params.stage,
            params.attack,
            params.scheme,
            params.hitPoints,
        ]),
        [
            [CARD_TYPE_VILLAIN, 1, 2, 1, [14, true]],
            [CARD_TYPE_VILLAIN, 2, 2, 2, [15, true]],
            [CARD_TYPE_VILLAIN, 3, 3, 2, [16, true]],
        ]
    );
    assert.deepEqual(scenario.config.mainSchemes[0][1].params, {
        acceleration: [1, true],
        abilities: scenario.config.mainSchemes[0][1].params.abilities,
        final: true,
        image: 'scenarios/absorbing-man/04079.png',
        name: 'Por aquí no pasa nadie',
        set: 'absorbing-man',
        stage: 1,
        startingThreat: [2, true],
        value: [12, true],
    });

    const copies = Object.fromEntries(scenario.config.cards.map(({count, card}) => [
        card.params.name,
        count,
    ]));
    assert.deepEqual(copies, {
        'Bola y cadena': 1,
        'Bosque frondoso': 1,
        'Colina nevada': 1,
        'Complejo abandonado': 1,
        'Duplicación omnimórfica': 3,
        'Espinas perforantes': 2,
        'Patada de acero': 2,
        'Poder de absorción superior': 1,
        'Promontorio rocoso': 1,
        'Presa gélida': 2,
        'Tácticas dilatorias': 2,
        'Barrido pétreo': 2,
        '¡Avalancha!': 2,
    });
    assert.equal(
        scenario.config.cards.reduce((total, {count}) => total + count, 0),
        21
    );
});

test('Absorbing Man card abilities compile to individual runnable effects', async () => {
    const scenario = await getScenario();
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'absorbing-man-compile-test',
    });
    const factory = new MatchFactory(match);
    const definitions = [
        ...scenario.config.villains,
        ...scenario.config.mainSchemes.flat(),
        ...scenario.config.cards.map(({card}) => card),
    ];

    for (const definition of definitions) {
        const gameCard = factory.cardsFactory.createGameCardFromConfig(definition);
        const sides = gameCard.sides.length ? gameCard.sides : [gameCard];

        for (const side of sides) {
            for (const ability of [...side.abilities, side.boostAbility].filter(Boolean)) {
                if (ability.effect) {
                    assert.equal(Array.isArray(ability.effect), false, side.name);
                    assert.equal(typeof ability.effect.canRun, 'function', side.name);
                }
                if (ability.arrow?.cost) {
                    assert.equal(typeof ability.arrow.cost.canRun, 'function', side.name);
                }
            }
        }
    }
});

test('Absorbing Man gains environment and Superior Absorption traits', async () => {
    const {
        factory,
        player,
        scenario,
        scenarioData,
    } = await createContext();
    const villain = factory.cardsFactory.createGameCardFromConfig(
        scenarioData.config.villains[0]
    );
    const environmentConfig = scenarioData.config.cards.find(({card}) =>
        card.params.name === 'Bosque frondoso').card;
    const environment = factory.cardsFactory.createGameCardFromConfig(environmentConfig);
    const superiorConfig = scenarioData.config.cards.find(({card}) =>
        card.params.name === 'Poder de absorción superior').card;
    const superior = factory.cardsFactory.createGameCardFromConfig(superiorConfig);

    for (const card of [villain, environment]) {
        card.owner = scenario;
        card.controller = scenario;
        scenario.gameZone.addToGameZone(card);
    }
    scenario.gameZone.currentVillain = villain;
    await villain.initTriggers({player});

    const environmentTraits = await villain.getEffectiveTraits();
    assert.ok(environmentTraits.includes(TRAIT_WOOD));
    assert.equal(environmentTraits.includes(TRAIT_ICE), false);

    superior.owner = scenario;
    superior.controller = scenario;
    scenario.gameZone.addToGameZone(superior);
    await superior.initTriggers({player});

    const superiorTraits = await villain.getEffectiveTraits();
    assert.ok(superiorTraits.includes(TRAIT_ICE));
    assert.ok(superiorTraits.includes(TRAIT_METAL));
    assert.ok(superiorTraits.includes(TRAIT_STONE));
    assert.ok(superiorTraits.includes(TRAIT_WOOD));

    villain.controller = undefined;
    const serializedVillain = await villain.toObjWithAbilityAvailability(player);
    assert.ok(serializedVillain.extraTraits.includes(TRAIT_ICE));
    assert.ok(serializedVillain.extraTraits.includes(TRAIT_METAL));
    assert.ok(serializedVillain.extraTraits.includes(TRAIT_STONE));
    assert.ok(serializedVillain.extraTraits.includes(TRAIT_WOOD));
});

test('Absorbing Man setup shuffle combines the encounter discard with its deck', async () => {
    const {match, player, scenario} = await createContext();
    const discardedCard = {id: 'discarded'};
    scenario.deck.discardPile = [discardedCard];

    const moveToDeck = new MoveToDeckEffect({
        cards: 'player.match.scenario.deck.discardPile',
        match,
        position: DECK_POSITION_SHUFFLE,
        selectedTarget: scenario,
    });
    await moveToDeck.execute({player});

    assert.equal(scenario.deck.discardPile.length, 0);
    assert.equal(scenario.deck.cards.includes(discardedCard), true);
});

test('Absorbing Man main scheme serializes delay counters from its active side', async () => {
    const {
        factory,
        match,
        player,
        scenario,
        scenarioData,
    } = await createContext();
    const mainScheme = factory.cardsFactory.createCardSides(
        factory.cardsFactory.createSides(scenarioData.config.mainSchemes[0])
    );

    mainScheme.owner = scenario;
    mainScheme.controller = scenario;
    scenario.gameZone.currentScheme = mainScheme;
    mainScheme.selectedSide = 1;
    mainScheme.currentSide.placeCounters(2);
    scenario.deck.toObj = () => ({});

    assert.equal(mainScheme.toObj().counters, 2);

    const serializedScenario = await scenario.toObjWithAbilityAvailability(player);

    assert.equal(serializedScenario.mainScheme.counters, 2);
    assert.equal(match.mainScheme.currentSide.counters, 2);
});

test('main scheme discards every previous environment when one enters play', async () => {
    const {
        factory,
        match,
        player,
        scenario,
        scenarioData,
    } = await createContext();
    const mainScheme = factory.cardsFactory.createCardSides(
        factory.cardsFactory.createSides(scenarioData.config.mainSchemes[0])
    );
    mainScheme.selectedSide = 1;
    mainScheme.owner = scenario;
    mainScheme.controller = scenario;
    scenario.gameZone.currentScheme = mainScheme;
    await mainScheme.initTriggers({player});

    const createEnvironment = name => factory.cardsFactory.createGameCardFromConfig(
        scenarioData.config.cards.find(({card}) => card.params.name === name).card
    );
    const previousEnvironment = createEnvironment('Bosque frondoso');
    previousEnvironment.owner = scenario;
    previousEnvironment.controller = scenario;
    scenario.gameZone.addToGameZone(previousEnvironment);

    const enteringEnvironment = createEnvironment('Colina nevada');
    enteringEnvironment.owner = scenario;

    const putPlay = new PutPlayEffect({
        card: enteringEnvironment,
        controller: scenario,
        match,
    });
    await putPlay.runEffect({player});

    assert.equal(scenario.gameZone.cards.includes(enteringEnvironment), true);
    assert.equal(scenario.gameZone.cards.includes(previousEnvironment), false);
    assert.deepEqual(scenario.deck.discardPile, [previousEnvironment]);
    assert.equal(
        mainScheme.triggers[TRIGGER_CARD_ENTER_PLAY][PRIORITY_FORCED_INTERRUPT]
            .length,
        1
    );
});
