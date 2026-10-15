import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_WHEN_COMPLETED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CALC_STAGE,
    CALC_TRAITS_COUNT,
    CARD_TYPE_MAIN_SCHEME_A_CARD,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    DIALOG_ACTIVATE,
    DIALOG_DEFENSE,
    DIALOG_ENCOUNTERS_REVEAL,
    DIALOG_USE_CARD,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_ENGAGE,
    EFFECT_MODIFY_BOOST_ICONS,
    EFFECT_PUT_PLAY,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_YOU,
    TARGET_VILLAIN,
    TRAIT_GOBLIN,
    TRIGGER_VILLAIN_ACTIVATES,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {AccelerateSchemeEffect} from '../../src/effects/accelerate-scheme-effect.js';
import {DealEncounterEffect} from '../../src/effects/deal-encounter-effect.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {EnemyActivationEffect} from '../../src/effects/enemy-activation-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {ModifyBoostIconsEffect} from '../../src/effects/modify-boost-icons-effect.js';
import {PlaceThreatEffect} from '../../src/effects/place-threat-effect.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {Scenario} from '../../src/model/match/scenario.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';
import {WhenCompletedAbility} from '../../src/abilities/when/when-completed-ability.js';
import {ScenarioRest} from '../../src/server/rest/scenario-rest.js';

const getMutagenFormula = async () => {
    const {scenarios} = await loadCatalog();
    const scenario = scenarios.find(({_id}) => _id === 'mutagen-formula');

    assert.ok(scenario);
    return scenario;
};

const createMatchFactory = () => {
    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'mutagen-formula-test',
    });
    match.openDialog = async () => {};

    return {
        factory: new MatchFactory(match),
        match,
    };
};

const createRuntime = async (scenarioData, playerCount = 2) => {
    const {factory, match} = createMatchFactory();
    const scenario = new Scenario({
        mainSchemes: [],
        match,
        name: 'mutagen-formula-runtime-test',
        scenarioCards: [],
        sets: [],
        villains: [],
    });
    scenario.gameZone = new ScenarioZone({owner: scenario});
    scenario.deck = new Deck({owner: scenario, isScenarioDeck: true});
    scenario.deck.refresh = async () => {};
    scenario.gameZone.refresh = async () => {};
    scenario.gameZone.currentScheme = {
        currentSide: {
            isMainScheme: true,
            addAccelerationToken(count) {
                this.accelerationTokens =
                    (this.accelerationTokens || 0) + count;
            },
            async refresh() {},
        },
    };
    scenario.gameZone.currentVillain =
        factory.cardsFactory.createGameCardFromConfig(
            scenarioData.config.villains[0],
            {owner: scenario}
        );
    match.scenario = scenario;

    const players = Array.from({length: playerCount}, (_, index) => ({
        gameZone: {
            encounters: [],
            dealEncounterCard(cards) {
                this.encounters.push(...cards);
            },
            async refresh() {},
        },
        hand: {cards: [], async refresh() {}},
        initial: index === 0,
        isHero: true,
        isPlayer: true,
        match,
        minions: [],
        name: `player-${index + 1}`,
        async getEffectiveStats() {
            return {};
        },
        toObj() {
            return {name: this.name};
        },
        async refresh() {},
        engage(minion) {
            this.minions.push(minion);
            minion.engaged = this;
        },
        removeEngaged(minion) {
            this.minions = this.minions.filter(current => current !== minion);
        },
    }));
    match.players = players;
    match.currentPlayer = players[0];

    return {factory, match, players, scenario};
};

const findEncounter = (scenario, name) => {
    const entry = scenario.config.cards.find(({card}) =>
        card.params.name === name);
    assert.ok(entry, `Expected ${name} in La fórmula mutagénica.`);

    return entry;
};

test('La fórmula mutagénica registers its villain stages, schemes, and encounter cards', async () => {
    const scenario = await getMutagenFormula();
    const {config} = scenario;

    assert.equal(scenario.name, 'La fórmula mutagénica');
    assert.deepEqual(config.sets, ['standard']);
    assert.deepEqual(config.defaultSets, ['goblin-gimmicks']);
    assert.deepEqual(config.villains.map(({params}) => [
        params.name,
        params.stage,
        params.attack,
        params.scheme,
        params.hitPoints,
        params.image,
    ]), [
        ['Duende Verde', 1, 2, 1, [16, true], 'scenarios/mutagen-formula/02014.png'],
        ['Duende Verde', 2, 2, 2, [18, true], 'scenarios/mutagen-formula/02015.png'],
        ['Duende Verde', 3, 3, 2, [20, true], 'scenarios/mutagen-formula/02016.png'],
    ]);
    assert.deepEqual(config.mainSchemes.map(([sideA, sideB]) => [
        sideA.params.name,
        sideA.params.stage,
        sideA.type,
        sideB.params.startingThreat,
        sideB.params.acceleration,
        sideB.params.value,
        sideB.params.final,
    ]), [
        ['Liberar el mutágeno', 1, CARD_TYPE_MAIN_SCHEME_A_CARD, [2, true], [1, true], [7, true], undefined],
        ['Nube de mutágeno', 2, CARD_TYPE_MAIN_SCHEME_A_CARD, [4, true], 0, [11, true], true],
    ]);
    assert.deepEqual(config.mainSchemes.map(([, sideB]) => sideB.type), [
        CARD_TYPE_MAIN_SCHEME_B_CARD,
        CARD_TYPE_MAIN_SCHEME_B_CARD,
    ]);
    assert.deepEqual(config.mainSchemes[0][0].params.content, {
        villains: [1, 2],
        villainsExpert: [2, 3],
    });
    assert.deepEqual(config.mainSchemes[1][1].params.accelerationCalc, {
        target: 'match.enemies',
        formula: CALC_TRAITS_COUNT,
        trait: TRAIT_GOBLIN,
    });
    assert.equal(
        config.mainSchemes[0][1].params.abilities[0].type,
        ABILITY_WHEN_COMPLETED
    );

    const counts = Object.fromEntries(config.cards.map(({count, card}) => [
        card.params.name,
        count,
    ]));
    assert.deepEqual(counts, {
        'Planeador duende': 1,
        Histeria: 1,
        'Bombas calabaza': 1,
        'Caballero Duende': 1,
        'Soldado duende': 4,
        'Esclavo duende': 6,
        Monstruo: 1,
        'Duendes de refuerzo': 2,
        'Nación duende': 1,
        'Horda imparable': 2,
        'Muerte desde el cielo': 2,
        'Te veo': 1,
        'Exceso de confianza': 1,
        'Ambición cruel': 2,
    });
    assert.equal(config.cards.reduce((total, {count}) => total + count, 0), 26);

    const hysteria = findEncounter(scenario, 'Histeria').card;
    assert.equal(hysteria.params.boost, 1);
    assert.equal(hysteria.params.attach, TARGET_VILLAIN);
    assert.deepEqual(
        hysteria.params.abilities
            .map(({params}) => params.trigger)
            .filter(Boolean),
        [TRIGGER_VILLAIN_ACTIVATES]
    );

    const nation = findEncounter(scenario, 'Nación duende').card;
    assert.equal(nation.params.boost, 0);
    assert.equal(nation.params.boostAbility.type, ABILITY_BOOST);
    assert.equal(
        nation.params.boostAbility.params.effect.type,
        EFFECT_PUT_PLAY
    );
    assert.equal(
        nation.params.boostAbility.params.effect.params.controller,
        'player.match.scenario'
    );
});

test('Mutagen Formula creates with its configured encounter sets', async () => {
    const {scenarios, sets} = await loadCatalog();
    const scenarioData = scenarios.find(({_id}) => _id === 'mutagen-formula');
    assert.ok(scenarioData);
    const setConfigs = new Map(sets.map(({_id, config}) => [_id, config]));
    const mc = {
        data: {
            async getScenarioConfig(id) {
                assert.equal(id, scenarioData._id);
                return structuredClone(scenarioData.config);
            },
            async getSetConfig(id) {
                const config = setConfigs.get(id);
                if (!config) {
                    throw new Error(`No sets configuration found for "${id}"`);
                }
                return config;
            },
        },
        mcSocket: {send() {}},
    };
    const match = new Match({mc, name: 'mutagen-formula-create-test'});
    const scenarioRest = new ScenarioRest({mc});

    await scenarioRest.createScenario({match, scenario: scenarioData._id});

    assert.deepEqual(
        match.scenario.sets.map(({name}) => name),
        ['standard', 'Trucos de duende']
    );
    assert.equal(
        match.scenario.scenarioCards.length,
        scenarioData.config.cards.reduce((total, {count}) => total + count, 0)
    );
});

test('all Mutagen Formula card abilities compile into one runnable effect each', async () => {
    const scenario = await getMutagenFormula();
    const {factory} = createMatchFactory();
    const configs = [
        ...scenario.config.villains,
        ...scenario.config.mainSchemes.flat(),
        ...scenario.config.cards.map(({card}) => card),
    ];

    configs.forEach(config => {
        const card = factory.cardsFactory.createGameCardFromConfig(config, {
            owner: {},
        });
        const abilities = [
            ...card.abilities,
            ...(card.boostAbility ? [card.boostAbility] : []),
        ];

        abilities.forEach(ability => {
            assert.ok(ability.effect);
            assert.equal(typeof ability.effect.canRun, 'function');
        });
    });

    const stageOneB = factory.cardsFactory.createGameCardFromConfig(
        scenario.config.mainSchemes[0][1],
        {owner: {}}
    );
    assert.ok(stageOneB.abilities[0] instanceof WhenCompletedAbility);
    assert.equal(stageOneB.abilities[0].isWhenCompleted, true);

    const seeYou = findEncounter(scenario, 'Te veo').card;
    assert.equal(seeYou.params.boostAbility.type, ABILITY_BOOST);
    assert.equal(
        seeYou.params.boostAbility.params.effect.params.effect.type,
        EFFECT_MODIFY_BOOST_ICONS
    );
    assert.equal(
        seeYou.params.boostAbility.params.effect.params.effect.params.target,
        TARGET_EFFECT
    );

    const deathFromAbove = findEncounter(scenario, 'Muerte desde el cielo').card;
    const attackAbility = deathFromAbove.params.abilities.find(({type}) =>
        type === ABILITY_WHEN_REVEALED_HERO);
    const attackEffect = attackAbility.params.effect;
    assert.equal(attackEffect.type, EFFECT_ENEMY_ATTACK);
    assert.equal(attackEffect.params.attackModifierCalc.formula, CALC_STAGE);
    assert.equal(attackEffect.params.attackModifierCalc.target, TARGET_VILLAIN);

    const alterEgoAbility = deathFromAbove.params.abilities.find(({type}) =>
        type === ABILITY_WHEN_REVEALED_ALTEREGO);
    const schemeEffect = alterEgoAbility.params.effect;
    assert.equal(schemeEffect.type, EFFECT_ENEMY_SCHEME);
    assert.equal(schemeEffect.params.schemeModifierCalc.formula, CALC_STAGE);
    assert.equal(schemeEffect.params.schemeModifierCalc.target, TARGET_VILLAIN);
});

test('Duendes de refuerzo counts Goblin minions from the player match context', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData, 1);
    const player = players[0];
    player.minions.push(
        {traits: [TRAIT_GOBLIN]},
        {traits: []},
        {traits: [TRAIT_GOBLIN]}
    );

    const reinforcements = factory.cardsFactory.createGameCardFromConfig(
        findEncounter(scenarioData, 'Duendes de refuerzo').card,
        {owner: scenario}
    );
    reinforcements.initScheme();

    const whenRevealed = reinforcements.abilities.find(ability =>
        ability.isWhenRevealed);
    assert.ok(whenRevealed);

    await whenRevealed.resolveAbility({
        card: reinforcements,
        match,
        player,
    });

    assert.equal(reinforcements.threat, 4);
});

test('DealEncounterEffect deals the configured number of cards to its selected player', async () => {
    const cards = [{id: 1}, {id: 2}, {id: 3}];
    let requestedCount;
    let dealtCards;
    const player = {
        gameZone: {
            dealEncounterCard(selectedCards) {
                dealtCards = selectedCards;
            },
            async refresh() {},
        },
    };
    const match = {
        async drawEncounterCards(count) {
            requestedCount = count;
            return cards.slice(0, count);
        },
    };
    const effect = new DealEncounterEffect({
        count: 3,
        match,
        selectedTarget: player,
    });

    await effect.execute({player});

    assert.equal(requestedCount, 3);
    assert.deepEqual(dealtCards, cards);
});

test('ModifyBoostIconsEffect does not reduce a boost resolution below zero icons', async () => {
    const effect = new ModifyBoostIconsEffect({
        count: -2,
        selectedTarget: {boostValue: 1},
    });

    await effect.execute({});

    assert.equal(effect.selectedTarget.boostValue, 0);
});

test('Green Goblin II deals two encounter cards to each player when revealed', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData);
    const hysteriaConfig = findEncounter(scenarioData, 'Histeria').card;
    scenario.deck.cards = Array.from({length: 4}, () =>
        factory.cardsFactory.createGameCardFromConfig(hysteriaConfig, {
            owner: scenario,
        }));
    const villain = factory.cardsFactory.createGameCardFromConfig(
        scenarioData.config.villains[1],
        {owner: scenario}
    );
    const whenRevealed = villain.abilities.find(ability => ability.isWhenRevealed);

    await whenRevealed.resolveAbility({
        card: villain,
        match,
        player: players[0],
    });

    assert.deepEqual(
        players.map(player => player.gameZone.encounters.length),
        [2, 2]
    );
});

test('EnemyActivationEffect can omit its normal boost card while keeping stored boost cards', async () => {
    const storedCard = {boost: 2};
    let drawCount = 0;
    const enemy = {
        faceDown: [{
            card: storedCard,
            isFutureBoost: true,
            removeCard() {},
        }],
        async refresh() {},
    };
    const match = {
        async drawEncounterCards() {
            drawCount++;
            return [{boost: 1}];
        },
    };
    const effect = new EnemyActivationEffect({
        enemy,
        giveBoost: false,
        match,
    });

    await effect.dealBoostCards({player: {}});

    assert.equal(drawCount, 0);
    assert.deepEqual(effect.boostCards, [storedCard]);
});

test('Goblin Knight returns its boost card to the encounter deck after the activation', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData, 1);
    const knight = factory.cardsFactory.createGameCardFromConfig(
        findEncounter(scenarioData, 'Caballero Duende').card,
        {owner: scenario}
    );
    const delayedEffects = [];
    let shuffleCount = 0;
    scenario.deck.cards = [
        factory.cardsFactory.createGameCardFromConfig(
            findEncounter(scenarioData, 'Histeria').card,
            {owner: scenario}
        ),
    ];
    scenario.deck.shuffle = () => {
        shuffleCount++;
    };
    const activation = {
        createDelayedEffect(effect) {
            delayedEffects.push(effect);
        },
    };
    const boostResolution = new ResolveBoostEffect({
        activation,
        card: knight,
        enemyActivation: {
            enemy: scenario.villain,
            boostCards: [],
        },
        match,
        selectedTarget: players[0],
    });
    boostResolution.boostValue = 2;

    await boostResolution.execute({
        card: knight,
        match,
        player: players[0],
    });

    assert.equal(delayedEffects.length, 1);
    scenario.deck.discardPile.push(knight);
    await delayedEffects[0].resolve({
        match,
        player: players[0],
    });

    assert.ok(scenario.deck.cards.includes(knight));
    assert.equal(scenario.deck.discardPile.includes(knight), false);
    assert.equal(shuffleCount, 1);
});

test('Muerte desde el cielo applies its ATK increase only to its attack', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData, 1);
    const dialogs = [];
    match.openDialog = async dialog => {
        dialogs.push(dialog);

        return {};
    };
    scenario.gameZone.currentVillain =
        factory.cardsFactory.createGameCardFromConfig(
            scenarioData.config.villains[2],
            {owner: scenario}
        );
    const card = factory.cardsFactory.createGameCardFromConfig(
        findEncounter(scenarioData, 'Muerte desde el cielo').card,
        {owner: scenario}
    );
    const ability = card.abilities.find(({effect}) =>
        effect instanceof EnemyAttackEffect);
    const attack = ability.effect;

    assert.ok(attack instanceof EnemyAttackEffect);
    assert.equal(scenario.villain.attack, 3);
    await attack.prepare({
        card,
        match,
        player: players[0],
    });

    const activationDialog = dialogs.find(({dialogType}) =>
        dialogType === DIALOG_ACTIVATE);
    assert.equal(activationDialog.data.character.attack, 6);
    assert.equal(await attack.getAttackValue({match, player: players[0]}), 6);
    assert.equal(attack.modifyAttack, 3);

    players[0].defenders = [{
        id: 'test-defender',
        async getEffectiveStats() {
            return {hitPoints: 10, life: 10};
        },
        toObj() {
            return {id: this.id};
        },
    }];
    await attack.defense({
        card,
        match,
        player: players[0],
    });

    const defenseDialog = dialogs.find(({dialogType}) =>
        dialogType === DIALOG_DEFENSE);
    assert.equal(defenseDialog.data.attack.character.attack, 6);

    assert.equal(scenario.villain.attack, 3);
    assert.equal(attack.modifyAttack, 3);
});

test('Muerte desde el cielo keeps its scheme modifier on the scheme activation', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData, 1);
    const dialogs = [];
    const mainScheme = scenario.gameZone.currentScheme.currentSide;
    mainScheme.canScheme = () => true;
    mainScheme.toObj = () => ({name: 'Plan principal'});
    const targetCharacter = {
        name: 'Peter Parker',
        image: 'heroes/spider-man/hero.png',
        attack: 1,
        scheme: 2,
        thwart: 2,
        defense: 3,
        recovery: 3,
        async getEffectiveStats() {
            return {
                attack: this.attack,
                defense: this.defense,
                hitPoints: 10,
                life: 10,
                recovery: this.recovery,
                thwart: this.thwart,
            };
        },
        toObj() {
            return {
                name: this.name,
                image: this.image,
                attack: this.attack,
                scheme: this.scheme,
                thwart: this.thwart,
                defense: this.defense,
                recovery: this.recovery,
            };
        },
    };
    players[0].superhero = {currentSide: targetCharacter};
    match.openDialog = async dialog => dialogs.push(dialog);
    scenario.gameZone.currentVillain =
        factory.cardsFactory.createGameCardFromConfig(
            scenarioData.config.villains[2],
            {owner: scenario}
        );
    const card = factory.cardsFactory.createGameCardFromConfig(
        findEncounter(scenarioData, 'Muerte desde el cielo').card,
        {owner: scenario}
    );
    const ability = card.abilities.find(({effect}) =>
        effect instanceof EnemySchemeEffect);
    const scheme = ability.effect;

    assert.ok(scheme instanceof EnemySchemeEffect);
    assert.equal(scheme.target, TARGET_MAIN_SCHEME);
    assert.equal(scenario.villain.scheme, 2);
    scheme.configuredEnemy = scenario.villain;
    const params = {
        card,
        match,
        player: players[0],
    };

    assert.equal(await scheme.canRun(params), true);
    await scheme.prepare(params);
    assert.equal(scheme.selectedTarget, mainScheme);

    const activationDialog = dialogs.find(({dialogType}) =>
        dialogType === DIALOG_ACTIVATE);
    assert.equal(activationDialog.data.target.name, 'Peter Parker');
    assert.equal(activationDialog.data.target.attack, 1);
    assert.equal(activationDialog.data.character.scheme, 5);
    assert.equal(await scheme.getSchemeValue({match, player: players[0]}), 5);
    assert.equal(scheme.modifyScheme, 3);
    assert.equal(scenario.villain.scheme, 2);
});

test('main scheme escalation calculation counts Goblin enemies in the acceleration dialog', async () => {
    const scenario = await getMutagenFormula();
    const mainSchemeConfig = scenario.config.mainSchemes[1][1].params;
    let accelerationDialog;
    const mainScheme = {
        accelerationCalc: mainSchemeConfig.accelerationCalc,
        accelerationValue: 0,
        toObj() {
            return {name: mainSchemeConfig.name};
        },
    };
    const match = {
        accelerationIcons: 1,
        accelerationTokens: 2,
        enemies: [
            {traits: [TRAIT_GOBLIN]},
            {traits: [TRAIT_GOBLIN]},
            {traits: ['Criminal']},
        ],
        mainScheme,
        async openDialog(dialog) {
            accelerationDialog = dialog;
        },
    };
    const effect = new AccelerateSchemeEffect({match});

    await effect.prepare({match, player: {}});

    assert.equal(effect.accelerationBase, 2);
    assert.equal(accelerationDialog.data.accelerateBase, 2);
    assert.equal(accelerationDialog.data.accelerate, 5);
});

test('Te veo adds its conditional boost icon to the current boost resolution', async () => {
    const scenario = await getMutagenFormula();
    const config = findEncounter(scenario, 'Te veo').card;
    const {factory, match} = createMatchFactory();
    const dialogs = [];
    match.scenario = {amplificationIcons: 0};
    match.openDialog = async dialog => {
        dialogs.push(dialog);

        return {};
    };
    const card = factory.cardsFactory.createGameCardFromConfig(config, {owner: {}});
    const minion = {traits: [TRAIT_GOBLIN]};
    const enemyActivation = {
        enemy: {isVillain: true, name: 'Duende Verde'},
        boostCards: [card],
    };
    const player = {isPlayer: true, minions: [minion]};
    const effect = new ResolveBoostEffect({
        activation: {},
        card,
        enemyActivation,
        match,
        selectedTarget: player,
    });
    effect.boostValue = 1;

    await effect.prepare({card, match, player});
    await effect.execute({card, match, player});

    assert.equal(effect.boostValue, 2);
    assert.equal(effect.value, 2);
    assert.deepEqual(dialogs.map(({dialogType}) => dialogType), [
        DIALOG_ENCOUNTERS_REVEAL,
        DIALOG_ENCOUNTERS_REVEAL,
    ]);
    assert.equal(dialogs[0].title, 'Aumento');
    assert.equal(dialogs[1].title, 'Aumento actualizado');
    assert.equal(dialogs[0].subtitle, undefined);
    assert.equal(
        dialogs[1].subtitle,
        'Se muestran los iconos de aumento actualizados.'
    );
    assert.equal(dialogs[0].data.card.boost, 1);
    assert.equal(dialogs[1].data.card.boost, 2);
});

test('Goblin minions enter play engaged with you when revealed as a boost', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData, 1);
    const minions = ['Soldado duende', 'Esclavo duende'].map(name => {
        const config = findEncounter(scenarioData, name).card;
        assert.equal(config.params.boostAbility.type, ABILITY_BOOST);
        assert.equal(
            config.params.boostAbility.params.effect.type,
            EFFECT_ENGAGE
        );
        assert.equal(
            config.params.boostAbility.params.effect.params.target,
            TARGET_YOU
        );

        return factory.cardsFactory.createGameCardFromConfig(config, {
            owner: scenario,
        });
    });

    for (const minion of minions) {
        const boostResolution = new ResolveBoostEffect({
            activation: {},
            card: minion,
            enemyActivation: {
                enemy: scenario.villain,
                boostCards: [minion],
            },
            match,
            selectedTarget: players[0],
        });

        await boostResolution.execute({
            card: minion,
            match,
            player: players[0],
        });

        assert.equal(minion.isInPlay, true);
        assert.equal(minion.engaged, players[0]);
    }

    assert.deepEqual(players[0].minions, minions);
});

test('Soldado duende shows its When Defeated response before dealing damage', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData, 1);
    const player = players[0];
    const dialogs = [];
    let damageAtResponseDialog;
    player.damage = 0;
    player.superhero = {
        currentSide: {isTough: false},
    };
    player.getLife = async () => 10 - player.damage;
    player.placeDamage = damage => {
        player.damage += damage;
    };
    match.openDialog = async dialog => {
        dialogs.push(dialog);
        if (dialog.dialogType === DIALOG_USE_CARD) {
            damageAtResponseDialog = player.damage;
            return {selected: {id: dialog.data.cards[0].id}};
        }
        return {};
    };

    const soldier = factory.cardsFactory.createGameCardFromConfig(
        findEncounter(scenarioData, 'Soldado duende').card,
        {owner: scenario}
    );
    const boostResolution = new ResolveBoostEffect({
        activation: {},
        card: soldier,
        enemyActivation: {
            enemy: scenario.villain,
            boostCards: [soldier],
        },
        match,
        selectedTarget: player,
    });

    await boostResolution.execute({card: soldier, match, player});

    const defeat = new DefeatEffect({
        match,
        selectedTarget: soldier,
    });
    await defeat.runEffect({card: soldier, match, player});

    const responseDialog = dialogs.find(({dialogType}) =>
        dialogType === DIALOG_USE_CARD);
    assert.ok(responseDialog);
    assert.equal(
        responseDialog.title,
        'Resolviendo «Cuando se derrote» de Soldado duende'
    );
    assert.equal(responseDialog.hideOk, true);
    assert.equal(responseDialog.data.mandatory, true);
    assert.deepEqual(
        responseDialog.data.cards[0].abilityNames,
        ['Cuando se derrote']
    );
    assert.equal(damageAtResponseDialog, 0);
    assert.equal(player.damage, 1);
    assert.equal(soldier.isInPlay, false);
});

test('PutPlayEffect accepts a single card from the current ForEach target', async () => {
    const card = {
        isInPlay: false,
        isMinion: true,
        isPlayerCard: false,
        async initTriggers() {},
    };
    const player = {
        gameZone: {async refresh() {}},
        minions: [],
        async refresh() {},
        engage(minion) {
            this.minions.push(minion);
        },
    };
    const match = {
        isUniqueCard() {
            return false;
        },
    };
    const effect = new EngageEffect({
        cardSource: 'forEachTarget',
        match,
        selectedTarget: player,
        target: TARGET_YOU,
    });

    await effect.execute({
        forEachTarget: card,
        match,
        player,
    });

    assert.deepEqual(player.minions, [card]);
    assert.equal(card.engaged, player);
});

test('stage 1A puts a Goblin Thrall engaged with each player and shuffles the deck', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData);
    const thrallConfig = findEncounter(scenarioData, 'Esclavo duende').card;
    const thralls = Array.from({length: 6}, () =>
        factory.cardsFactory.createGameCardFromConfig(thrallConfig, {
            owner: scenario,
        }));
    let shuffleCount = 0;
    scenario.deck.cards = thralls;
    scenario.deck.shuffle = () => {
        shuffleCount++;
    };

    const stageOneA = factory.cardsFactory.createGameCardFromConfig(
        scenarioData.config.mainSchemes[0][0],
        {owner: scenario}
    );
    const setup = stageOneA.abilities.find(ability => ability.isSetup);

    assert.ok(setup);
    await setup.resolveAbility({
        card: stageOneA,
        match,
        player: players[0],
    });

    assert.equal(players[0].minions.length, 1);
    assert.equal(players[1].minions.length, 1);
    assert.deepEqual(
        players.map(player => player.minions[0].name),
        ['Esclavo duende', 'Esclavo duende']
    );
    assert.equal(scenario.deck.cards.length, 4);
    assert.equal(shuffleCount, 1);
});

test('Horda imparable resolves when defeated and puts discarded Goblin minions into play', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData);
    const soldierConfig = findEncounter(scenarioData, 'Soldado duende').card;
    const thrallConfig = findEncounter(scenarioData, 'Esclavo duende').card;
    const hysteriaConfig = findEncounter(scenarioData, 'Histeria').card;
    const nonGoblinMinionConfig = {
        ...soldierConfig,
        params: {
            ...soldierConfig.params,
            name: 'Esbirro no duende',
            traits: [],
        },
    };
    scenario.deck.cards = [
        factory.cardsFactory.createGameCardFromConfig(soldierConfig, {owner: scenario}),
        factory.cardsFactory.createGameCardFromConfig(
            nonGoblinMinionConfig,
            {owner: scenario}
        ),
        factory.cardsFactory.createGameCardFromConfig(thrallConfig, {owner: scenario}),
        factory.cardsFactory.createGameCardFromConfig(hysteriaConfig, {owner: scenario}),
        factory.cardsFactory.createGameCardFromConfig(soldierConfig, {owner: scenario}),
    ];
    const horde = factory.cardsFactory.createGameCardFromConfig(
        findEncounter(scenarioData, 'Horda imparable').card,
        {owner: scenario}
    );
    assert.equal(horde.isSideScheme, true);
    assert.equal(horde.isMinion, false);
    horde.controller = scenario;
    horde.threat = 1;
    scenario.gameZone.addToGameZone(horde);
    await horde.initTriggers({player: players[0]});

    match.openDialog = async dialog => {
        if (dialog.dialogType === DIALOG_USE_CARD) {
            return {selected: {id: dialog.data.cards[0].id}};
        }

        return {};
    };

    const removeThreat = new RemoveThreatEffect({
        match,
        selectedTarget: horde,
        threat: 1,
    });
    await removeThreat.runEffect({
        card: horde,
        player: players[0],
    });

    assert.deepEqual(players.map(player =>
        player.minions.map(minion => minion.name)), [
        ['Soldado duende'],
        ['Esclavo duende'],
    ]);
    assert.equal(horde.isInPlay, false);
    assert.equal(scenario.deck.cards.length, 1);
    assert.deepEqual(
        scenario.deck.discardPile.map(card => card.name),
        ['Esbirro no duende', 'Histeria', 'Horda imparable']
    );
});

test('completing stage 1B resolves Liberar el mutágeno for players not facing Goblins', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData, 3);
    match.currentPlayer = players[1];

    const thrallConfig = findEncounter(scenarioData, 'Esclavo duende').card;
    const existingGoblin = factory.cardsFactory.createGameCardFromConfig(
        thrallConfig,
        {owner: scenario}
    );
    existingGoblin.engaged = players[0];
    players[0].minions.push(existingGoblin);

    const soldierConfig = findEncounter(scenarioData, 'Soldado duende').card;
    const hysteriaConfig = findEncounter(scenarioData, 'Histeria').card;
    scenario.deck.cards = [
        factory.cardsFactory.createGameCardFromConfig(hysteriaConfig, {owner: scenario}),
        factory.cardsFactory.createGameCardFromConfig(soldierConfig, {owner: scenario}),
        factory.cardsFactory.createGameCardFromConfig(hysteriaConfig, {owner: scenario}),
        factory.cardsFactory.createGameCardFromConfig(hysteriaConfig, {owner: scenario}),
        factory.cardsFactory.createGameCardFromConfig(thrallConfig, {owner: scenario}),
        factory.cardsFactory.createGameCardFromConfig(hysteriaConfig, {owner: scenario}),
        factory.cardsFactory.createGameCardFromConfig(hysteriaConfig, {owner: scenario}),
    ];
    const stageOne = factory.cardsFactory.createCardSides(
        factory.cardsFactory.createSides(scenarioData.config.mainSchemes[0]),
        undefined,
        scenario
    );
    await stageOne.flip({match, player: players[0]});
    assert.ok(stageOne.currentSide.abilities[0] instanceof WhenCompletedAbility);
    scenario.gameZone.currentScheme = stageOne;
    scenario.mainSchemes = [];
    match.finishGame = async () => {};

    const placeThreat = new PlaceThreatEffect({
        match,
        selectedTarget: stageOne.currentSide,
        threat: stageOne.currentSide.value,
    });
    await placeThreat.runEffect({player: players[1]});

    assert.deepEqual(players.map(player =>
        player.minions.map(minion => minion.name)), [
        ['Esclavo duende'],
        ['Soldado duende'],
        ['Esclavo duende'],
    ]);
    assert.equal(scenario.deck.cards.length, 1);
    assert.equal(scenario.deck.discardPile.length, 4);
});

test('Ambición cruel discards twice the villain stage and handles each discarded Goblin minion', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData, 1);
    const villain = factory.cardsFactory.createGameCardFromConfig(
        scenarioData.config.villains[2],
        {owner: scenario}
    );
    scenario.gameZone.currentVillain = villain;
    const goblinConfigs = [
        findEncounter(scenarioData, 'Soldado duende').card,
        findEncounter(scenarioData, 'Esclavo duende').card,
    ];
    const hysteriaConfig = findEncounter(scenarioData, 'Histeria').card;
    scenario.deck.cards = [
        ...Array.from({length: 3}, (_, index) =>
            factory.cardsFactory.createGameCardFromConfig(
                goblinConfigs[index % goblinConfigs.length],
                {owner: scenario}
            )),
        ...Array.from({length: 3}, (_, index) =>
            factory.cardsFactory.createGameCardFromConfig(
                goblinConfigs[(index + 1) % goblinConfigs.length],
                {owner: scenario}
            )),
        factory.cardsFactory.createGameCardFromConfig(hysteriaConfig, {owner: scenario}),
        factory.cardsFactory.createGameCardFromConfig(hysteriaConfig, {owner: scenario}),
    ];
    let choiceCount = 0;
    const choiceDialogCards = [];
    match.openDialog = async dialog => {
        if (dialog.data?.options) {
            choiceCount++;
            choiceDialogCards.push(dialog.data.card);
            return {selected: {id: 1}};
        }
    };
    const ambitionConfig = findEncounter(scenarioData, 'Ambición cruel');
    const ambition = factory.cardsFactory.createGameCardFromConfig(
        ambitionConfig.card,
        {owner: scenario}
    );

    await ambition.abilities[0].resolveAbility({
        card: ambition,
        match,
        player: players[0],
    });

    assert.equal(scenario.deck.cards.length, 2);
    assert.equal(scenario.deck.discardPile.length, 0);
    assert.equal(choiceCount, 6);
    assert.ok(choiceDialogCards.every(({name, image}) =>
        goblinConfigs.some(card =>
            card.params.name === name && card.params.image === image)));
    assert.ok(choiceDialogCards.every(({image}) =>
        image !== ambitionConfig.card.params.image));
    assert.equal(players[0].minions.length, 6);
});

test('Nación duende enters play from its boost ability and stops modifying ATK when defeated', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData, 1);
    const nation = factory.cardsFactory.createGameCardFromConfig(
        findEncounter(scenarioData, 'Nación duende').card,
        {owner: scenario}
    );
    const boostResolution = new ResolveBoostEffect({
        activation: {},
        card: nation,
        enemyActivation: {
            enemy: {isVillain: true, name: 'Duende Verde'},
            boostCards: [],
        },
        match,
        selectedTarget: players[0],
    });
    boostResolution.boostValue = 0;

    await boostResolution.execute({
        card: nation,
        player: players[0],
    });

    assert.ok(scenario.gameZone.cards.includes(nation));
    assert.equal(nation.threat, 2);

    const soldier = factory.cardsFactory.createGameCardFromConfig(
        findEncounter(scenarioData, 'Soldado duende').card,
        {owner: scenario}
    );
    soldier.engaged = players[0];
    players[0].minions.push(soldier);
    assert.equal(await soldier.getAttackValue({match, player: players[0]}), 2);
    assert.equal(
        await scenario.villain.getAttackValue({match, player: players[0]}),
        3
    );

    scenario.deck.cards = [
        factory.cardsFactory.createGameCardFromConfig(
            findEncounter(scenarioData, 'Histeria').card,
            {owner: scenario}
        ),
    ];
    await nation.discard();

    assert.equal(await soldier.getAttackValue({match, player: players[0]}), 1);
    assert.equal(
        await scenario.villain.getAttackValue({match, player: players[0]}),
        2
    );
});

test('Nación duende gives each Goblin minion its own ATK modifier calculation', async () => {
    const scenarioData = await getMutagenFormula();
    const {factory, match, players, scenario} =
        await createRuntime(scenarioData, 1);
    const player = players[0];
    const nation = factory.cardsFactory.createGameCardFromConfig(
        findEncounter(scenarioData, 'Nación duende').card,
        {owner: scenario}
    );
    const boostResolution = new ResolveBoostEffect({
        activation: {},
        card: nation,
        enemyActivation: {
            enemy: scenario.villain,
            boostCards: [],
        },
        match,
        selectedTarget: player,
    });
    boostResolution.boostValue = 0;

    await boostResolution.execute({card: nation, player});

    const minions = ['Esclavo duende', 'Soldado duende'].map(name => {
        const minion = factory.cardsFactory.createGameCardFromConfig(
            findEncounter(scenarioData, name).card,
            {owner: scenario}
        );
        minion.engaged = player;
        player.minions.push(minion);

        return minion;
    });

    const attackValues = await Promise.all(minions.map(minion =>
        minion.getAttackValue({match, player})
    ));

    assert.deepEqual(attackValues, [2, 2]);
});

test('Green Goblin places threat only when attack damage is dealt to a superhero', async () => {
    const scenarioData = await getMutagenFormula();
    const mainScheme = {
        isMainScheme: true,
        threat: 0,
        value: 100,
        placeThreat(threat) {
            this.threat += threat;
        },
        async refresh() {},
    };
    const match = {
        mainScheme,
        triggerCards: {},
        openDialog: async () => {},
    };
    const cardsFactory = new CardsFactory({match});
    const villain = cardsFactory.createGameCardFromConfig(
        scenarioData.config.villains[0],
        {owner: {}}
    );
    const response = villain.abilities.find(ability =>
        ability.trigger === TRIGGER_VILLAIN_ATTACKS_YOU);

    assert.ok(response);
    const superheroTarget = {isSuperhero: true};
    const playerTarget = {
        isPlayer: true,
        superhero: {currentSide: superheroTarget},
    };
    const resolveResponse = async (attacked, takenDamage) => {
        const attack = new EnemyAttackEffect({match});
        attack._activation = {takenDamage};
        attack.attacked = attacked;

        await response.resolveAbility({
            effect: attack,
            match,
            player: playerTarget,
        });
    };

    await resolveResponse(playerTarget, 1);
    assert.equal(mainScheme.threat, 1);

    await resolveResponse(superheroTarget, 1);
    assert.equal(mainScheme.threat, 2);

    const alterEgoTarget = {isSuperhero: true, isAlterEgo: true};
    await resolveResponse(alterEgoTarget, 1);
    assert.equal(mainScheme.threat, 3);

    await resolveResponse(
        {isPlayer: true, superhero: {currentSide: alterEgoTarget}},
        1
    );
    assert.equal(mainScheme.threat, 4);

    await resolveResponse({isAlly: true}, 1);
    await resolveResponse(playerTarget, 0);
    assert.equal(mainScheme.threat, 4);
});
