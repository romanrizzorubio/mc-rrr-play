import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_SETUP,
    EFFECT_ACTIVATE,
    EFFECT_CREATE_EXTRA_DECK,
    PLACE_SCENARIO_EXTRA_DECK,
    TARGET_VILLAIN,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import crossbones from '../../../mc-data/seed/catalog/scenarios/crossbones.js';
import experimentalWeapons from '../../../mc-data/seed/catalog/sets/experimental-weapons.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {GetEncounterCardEffect} from '../../src/effects/get-encounter-card-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';
import {RemoveCountersEffect} from '../../src/effects/remove-counters-effect.js';
import {restoreMatch, serializeMatch} from '../../src/utils/match-serialization.js';

const createScenario = async (numPlayers = 1) => {
    const {scenarios, sets} = await loadCatalog();
    const scenarioRecord = scenarios.find(({_id}) => _id === 'crossbones');
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
        name: 'crossbones-test',
    });
    match.openDialog = async () => {};
    match.players = Array.from({length: numPlayers}, (_, index) => ({
        name: `test-player-${index + 1}`,
        initial: index === 0,
    }));

    const factory = new MatchFactory(match);
    const scenario = await factory.createScenario(scenarioRecord.config);
    match.scenario = scenario;
    scenario.selectVillain = async () => {};
    await scenario.initScenario([], false);

    return {factory, match, scenario};
};

test('Calavera catalog defines stages, scheme thresholds, counts, and separate sets', () => {
    const {config} = crossbones;

    assert.deepEqual(config.villains.map(({params}) => [
        params.stage,
        params.attack,
        params.scheme,
        params.hitPoints,
    ]), [
        [1, 1, 1, [12, true]],
        [2, 2, 2, [14, true]],
        [3, 3, 2, [16, true]],
    ]);
    assert.deepEqual(config.mainSchemes.map(([, sideB]) => [
        sideB.params.name,
        sideB.params.startingThreat,
        sideB.params.acceleration,
        sideB.params.value,
        sideB.params.final,
    ]), [
        ['Ataque al monte Atenea', 0, [1, true], [3, true], undefined],
        ['La piedra del infinito', [1, true], [1, true], [6, true], undefined],
        ['La huida', [1, true], [1, true], [5, true], true],
    ]);
    assert.deepEqual(config.sets, ['standard', 'experimental-weapons']);
    assert.deepEqual(config.defaultSets, [
        'hydra-assault',
        'weapon-master',
        'legions-of-hydra',
    ]);
    assert.equal(Object.hasOwn(config, 'extraDecks'), false);
    assert.equal(
        config.mainSchemes[0][0].params.abilities[0].type,
        ABILITY_SETUP
    );
    assert.equal(
        config.mainSchemes[0][0].params.abilities[0].params.effect.type,
        EFFECT_CREATE_EXTRA_DECK
    );

    const defeatedPlan = config.cards.find(({card}) =>
        card.params.name === 'El ataque de Calavera').card;
    assert.equal(
        defeatedPlan.params.abilities[0].params.effect.type,
        EFFECT_ACTIVATE
    );
    assert.equal(
        defeatedPlan.params.abilities[0].params.effect.params.target,
        TARGET_VILLAIN
    );
    assert.deepEqual(defeatedPlan.params.icons, {acceleration: 1});

    const corneredStaff = config.cards.find(({card}) =>
        card.params.name === 'Personal acorralado').card;
    assert.deepEqual(corneredStaff.params.icons, {crisis: true});

    const counts = Object.fromEntries(config.cards.map(({count, card}) => [
        card.params.name,
        count,
    ]));
    assert.deepEqual(counts, {
        'Ametralladora de Calavera': 1,
        'Armadura de Calavera': 1,
        'Terrorista de Hydra': 2,
        'Fuego automático': 2,
        'Duro de pelar': 2,
        'Saquear el arsenal': 2,
        'El ataque de Calavera': 2,
        'Personal acorralado': 1,
    });
});

test('Calavera side schemes expose their acceleration and crisis icons', () => {
    const factory = new CardsFactory({
        match: {
            players: [],
            triggerCards: {},
        },
    });
    const sideSchemeConfig = name => crossbones.config.cards.find(({card}) =>
        card.params.name === name).card;
    const crossbonesAttack = factory.createGameCardFromConfig(
        structuredClone(sideSchemeConfig('El ataque de Calavera'))
    );
    const corneredStaff = factory.createGameCardFromConfig(
        structuredClone(sideSchemeConfig('Personal acorralado'))
    );

    assert.equal(crossbonesAttack.accelerationIcons, 1);
    assert.equal(corneredStaff.hasCrisis, true);
});

test('scenario construction keeps experimental weapons out of the encounter deck', async () => {
    const {match, scenario} = await createScenario();
    const extraDeck = scenario.getExtraDeck('experimental-weapons');
    const experimentalCardNames = new Set(
        experimentalWeapons.config.cards.map(({card}) => card.params.name)
    );

    assert.equal(extraDeck.name, 'Armas experimentales');
    assert.equal(extraDeck.isScenarioExtraDeck, true);
    assert.equal(extraDeck.hasDiscard, false);
    assert.equal(extraDeck.cards.length, 4);
    assert.equal(extraDeck.name, 'Armas experimentales');
    assert.equal(
        scenario.deck.cards.some(card => experimentalCardNames.has(card.name)),
        false
    );
    assert.equal(scenario.villains.length, 2);

    const topCard = extraDeck.cards.shift();
    await extraDeck.discard(topCard);
    assert.equal(extraDeck.discardPile.length, 0);
    assert.ok(scenario.deck.discardPile.includes(topCard));

    const scenarioObject = scenario.toObj();
    assert.equal(scenarioObject.extraDecks['experimental-weapons'].hasDiscard, false);
    assert.equal(
        Object.hasOwn(scenarioObject.extraDecks['experimental-weapons'], 'discard'),
        false
    );

    delete scenario.selectVillain;
    delete match.openDialog;
    const restoredMatch = restoreMatch(serializeMatch(match), {mc: match.mc});
    assert.strictEqual(
        restoredMatch.scenario.getExtraDeck('experimental-weapons').discardTarget,
        restoredMatch.scenario.deck
    );
});

test('scenario setup shuffles the experimental weapons deck when it is created', async () => {
    const shuffledExtraDecks = [];
    const originalShuffle = Deck.prototype.shuffle;
    Deck.prototype.shuffle = function() {
        if (this.isScenarioExtraDeck) {
            shuffledExtraDecks.push(this);
        }

        return originalShuffle.call(this);
    };

    try {
        const {scenario} = await createScenario();
        const extraDeck = scenario.getExtraDeck('experimental-weapons');

        assert.ok(shuffledExtraDecks.includes(extraDeck));
    } finally {
        Deck.prototype.shuffle = originalShuffle;
    }
});

test('Ametralladora has two Uses per player and discards when the last counter is removed', async () => {
    const {factory, match} = await createScenario(3);
    const machinegunConfig = crossbones.config.cards.find(({card}) =>
        card.params.name === 'Ametralladora de Calavera').card;
    const machinegun = factory.cardsFactory.createGameCardFromConfig(
        structuredClone(machinegunConfig)
    );
    const putPlayEffect = new PutPlayEffect({match});
    putPlayEffect.initializeCardState(machinegun);

    assert.equal(machinegun.uses, 6);
    assert.equal(machinegun.counters, 6);
    assert.equal(machinegun.abilities[0].condition, undefined);

    let discarded = false;
    machinegun.counters = 1;
    machinegun.discard = async () => {
        discarded = true;
    };
    machinegun.init = async () => {};
    machinegun.refresh = async () => {};

    const removeCounter = new RemoveCountersEffect({
        selectedTarget: machinegun,
        count: 1,
        match,
    });
    await removeCounter.execute({player: match.initialPlayer});

    assert.equal(machinegun.counters, 0);
    assert.equal(discarded, true);
});

test('El ataque de Calavera activates Crossbones according to the defeated player form', async () => {
    const {factory} = await createScenario();
    const defeatedPlanConfig = crossbones.config.cards.find(({card}) =>
        card.params.name === 'El ataque de Calavera').card;
    const defeatedPlan = factory.cardsFactory.createGameCardFromConfig(
        structuredClone(defeatedPlanConfig)
    );
    const activate = defeatedPlan.abilities[0].effect;
    const activations = [];

    activate.selectedTarget = {name: 'Calavera'};
    activate.attack = async () => activations.push('attack');
    activate.scheme = async () => activations.push('scheme');

    await activate.execute({player: {isHero: true}});
    await activate.execute({player: {isAlterEgo: true}});

    assert.deepEqual(activations, ['attack', 'scheme']);
});

test('experimental weapon reveal uses the standard encounter reveal display', async () => {
    const {match, scenario} = await createScenario();
    const extraDeck = scenario.getExtraDeck('experimental-weapons');
    const topCard = extraDeck.cards[0];
    let revealedCard;
    extraDeck.refresh = async () => {};

    const getEffect = new GetEncounterCardEffect({
        from: PLACE_SCENARIO_EXTRA_DECK,
        deckId: 'experimental-weapons',
        match,
    });
    const effect = new RevealEncounterEffect({
        card: 'effects.0.card',
        match,
    });
    const params = {
        effects: [getEffect],
        player: match.initialPlayer,
    };
    effect.openDialog = async ({data}) => {
        revealedCard = data.card;
    };

    assert.equal(await getEffect.canRun(params), true);
    await getEffect.execute(params);
    assert.equal(extraDeck.cards.includes(topCard), false);

    assert.equal(await effect.canRun(params), true);
    await effect.prepare(params);

    assert.strictEqual(effect.selectedTarget, topCard);
    assert.equal(extraDeck.cards.includes(topCard), false);
    assert.equal(revealedCard.name, topCard.name);
});

test('Duro de pelar heals a tough Calavera in reveal and boost contexts', async () => {
    const {factory, match, scenario} = await createScenario();
    const treacheryConfig = crossbones.config.cards.find(({card}) =>
        card.params.name === 'Duro de pelar').card;
    const treachery = factory.cardsFactory.createGameCardFromConfig(
        structuredClone(treacheryConfig)
    );
    const villain = scenario.villains[0];
    scenario.gameZone.currentVillain = villain;
    const player = match.players[0];
    villain.refresh = async () => {};

    const revealContext = new RevealEncounterEffect({
        card: treachery,
        match,
    });
    const enemyActivation = {};
    const boostContext = new ResolveBoostEffect({
        card: treachery,
        enemyActivation,
        match,
    });

    villain.damage = 2;
    villain.tough = 1;
    await treachery.abilities[0].resolveAbility({
        card: treachery,
        effect: revealContext,
        player,
    });
    assert.equal(villain.damage, 0);
    assert.equal(villain.tough, 1);

    villain.damage = 2;
    await treachery.boostAbility.resolveAbility({
        activation: {},
        card: treachery,
        effect: boostContext,
        enemyActivation,
        player,
    });
    assert.equal(villain.damage, 0);
    assert.equal(villain.tough, 1);

    villain.damage = 2;
    villain.tough = 0;
    await treachery.boostAbility.resolveAbility({
        activation: {},
        card: treachery,
        effect: boostContext,
        enemyActivation,
        player,
    });
    assert.equal(villain.damage, 2);
    assert.equal(villain.tough, 1);
});

test('Calavera card abilities compile to single runnable effects', () => {
    const factory = new CardsFactory({
        match: {
            players: [],
            triggerCards: {},
        },
    });
    const configs = [
        ...crossbones.config.villains,
        ...crossbones.config.mainSchemes.flat(),
        ...crossbones.config.cards.map(({card}) => card),
        ...experimentalWeapons.config.cards.map(({card}) => card),
    ];

    for (const cardConfig of configs) {
        const card = factory.createGameCardFromConfig(cardConfig);
        const abilities = [
            ...card.abilities,
            ...(card.boostAbility ? [card.boostAbility] : []),
            ...card.sides.flatMap(side => side.abilities),
        ];

        for (const ability of abilities) {
            if (ability.effect) {
                assert.equal(typeof ability.effect.canRun, 'function', card.name);
                assert.notEqual(Array.isArray(ability.effect), true, card.name);
            }
        }
    }

    assert.equal(
        crossbones.config.cards[0].card.params.attach,
        TARGET_VILLAIN
    );
});

test('Armadura de Calavera discards after it has absorbed five damage', () => {
    const factory = new CardsFactory({
        match: {
            players: [],
            triggerCards: {},
        },
    });
    const armorConfig = crossbones.config.cards.find(({card}) =>
        card.params.name === 'Armadura de Calavera').card;
    const armorCard = factory.createGameCardFromConfig(armorConfig);
    const damageThreshold = armorCard.abilities[0]
        .effect.replacement.effects[1];

    assert.equal(damageThreshold.checkCondition({
        effects: [{selectedTarget: {damage: 5}}],
    }), true);
    assert.equal(damageThreshold.checkCondition({
        effects: [{selectedTarget: {damage: 4}}],
    }), false);
});
