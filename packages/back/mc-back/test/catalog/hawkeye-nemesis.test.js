import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_BOOST,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CLASSIFICATION_HERO,
    EFFECT_DISCARD_GAME,
    EFFECT_CHAINED,
    EFFECT_EXHAUST,
    EFFECT_LASTING,
    EFFECT_MOVE_TO_HAND,
    EFFECT_PLACE_THREAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_TAKE_DAMAGE,
    PLACE_DISCARD_PILE,
    PLACE_DECK,
    PLACE_HAND,
    PLACE_IN_PLAY,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_FORCED_RESPONSE,
    RESOURCE_WILD,
    TARGET_CARD,
    TARGET_ENEMY,
    TARGET_MAIN_SCHEME,
    TARGET_VILLAIN,
    TARGET_YOUR_HERO,
    TRAIT_MERCENARY,
    TRAIT_WEAPON,
    TRIGGER_ENGAGE_HERO,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {QuickstrikeAbility} from '../../src/abilities/misc/quickstrike-ability.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';

const createHawkeyeGame = async ({isHero = true} = {}) => {
    const catalog = await loadCatalog();
    const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
    assert.ok(hawkeye);

    const match = new Match({
        mc: {mcSocket: {send() {}}},
        name: 'hawkeye-nemesis-test',
    });
    match.isUniqueCard = () => false;
    match.openDialog = async () => ({});

    const matchFactory = new MatchFactory(match);
    const superhero = matchFactory.createSuperhero({
        ...hawkeye.config,
        precon: [],
    });
    superhero.selectedSide = isHero ? 1 : 0;

    const player = match.createPlayer({
        name: 'Clint Barton',
        superhero,
    });
    player.initPlayer();

    const scenario = {
        match,
        schemes: [],
        sideSchemes: [],
        async completeMainScheme() {
            return false;
        },
        deck: {
            cards: [],
            discardPile: [],
            async discard(card) {
                this.discardPile.push(card);
            },
            async refresh() {},
            async shuffle() {},
        },
        gameZone: {
            cards: [],
            addToGameZone(card) {
                if (!this.cards.includes(card)) {
                    this.cards.push(card);
                }
            },
            discard(card) {
                const index = this.cards.indexOf(card);
                if (index > -1) {
                    this.cards.splice(index, 1);
                }
            },
            async refresh() {},
        },
        villain: {
            name: 'Villano',
            isVillain: true,
            isEnemy: true,
            isInPlay: true,
            abilities: [],
            attached: [],
            canBeAttacked() {
                return true;
            },
            async refresh() {},
        },
    };
    match.scenario = scenario;

    return {
        catalog,
        hawkeye,
        match,
        matchFactory,
        player,
        scenario,
        superhero,
    };
};

const createNemesisCard = (matchFactory, config, owner) =>
    matchFactory.cardsFactory.createGameCardFromConfig(config, {owner});

const setMatchEnemies = (match, enemies) => {
    Object.defineProperty(match, 'enemies', {
        configurable: true,
        value: enemies,
    });
};

describe('Hawkeye nemesis set', () => {
    test('defines and compiles the four cards, including Crossfire Quickstrike', async () => {
        const {hawkeye, matchFactory, scenario} = await createHawkeyeGame();
        const entries = hawkeye.config.nemesis;

        assert.deepEqual(
            entries.map(({count, card}) => [card.params.name, count]),
            [
                ['Fuego Cruzado', 1],
                ['En el punto de mira', 1],
                ['Fusil de Fuego Cruzado', 1],
                ['Disparo de francotirador', 2],
            ]
        );

        const [crossfireEntry, schemeEntry, rifleEntry, sniperEntry] = entries;
        const crossfireConfig = crossfireEntry.card;
        assert.equal(crossfireConfig.type, CARD_TYPE_MINION);
        assert.equal(crossfireConfig.params.image, 'heroes/hawkeye/04027.png');
        assert.equal(crossfireConfig.params.nemesis, true);
        assert.equal(crossfireConfig.params.unique, true);
        assert.deepEqual(crossfireConfig.params.traits, [TRAIT_MERCENARY]);
        assert.deepEqual(crossfireConfig.params.keywords, {quickStrike: true});
        assert.equal(crossfireConfig.params.boost, 0);
        assert.equal(crossfireConfig.params.boostAbility.type, ABILITY_BOOST);

        const crossfire = createNemesisCard(
            matchFactory,
            crossfireConfig,
            scenario
        );
        const quickstrike = crossfire.abilities.find(ability =>
            ability instanceof QuickstrikeAbility);
        assert.equal(crossfire.quickStrike, true);
        assert.ok(quickstrike);
        assert.equal(quickstrike.trigger, TRIGGER_ENGAGE_HERO);

        assert.equal(schemeEntry.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(schemeEntry.card.params.startingThreat, 5);
        assert.deepEqual(schemeEntry.card.params.icons, {acceleration: 1});
        assert.equal(schemeEntry.card.params.boost, 3);

        assert.equal(rifleEntry.card.type, CARD_TYPE_ATTACHMENT);
        assert.equal(rifleEntry.card.params.image, 'heroes/hawkeye/04029.png');
        assert.equal(rifleEntry.card.params.unique, true);
        assert.deepEqual(rifleEntry.card.params.traits, [TRAIT_WEAPON]);
        assert.equal(rifleEntry.card.params.attack, 2);
        assert.deepEqual(rifleEntry.card.params.attach, {
            target: TARGET_ENEMY,
            condition: {name: 'Fuego Cruzado'},
            fallbackTarget: TARGET_VILLAIN,
        });

        assert.equal(sniperEntry.card.type, CARD_TYPE_TREACHERY);
        assert.equal(sniperEntry.card.params.image, 'heroes/hawkeye/04030.png');
        assert.equal(sniperEntry.card.params.boost, 1);

        for (const {card: config} of entries) {
            const gameCard = createNemesisCard(matchFactory, config, scenario);
            for (const ability of gameCard.abilities) {
                assert.ok(ability.effect);
                assert.equal(typeof ability.effect.canRun, 'function');
            }
            if (gameCard.boostAbility) {
                assert.ok(gameCard.boostAbility.effect);
                assert.equal(typeof gameCard.boostAbility.effect.canRun, 'function');
            }
        }
    });

    test('Crossfire gains Piercing on its attacks and from boost only during an attack', async () => {
        const {
            match,
            matchFactory,
            player,
            scenario,
            superhero,
            hawkeye,
        } = await createHawkeyeGame();
        const crossfireConfig = hawkeye.config.nemesis.find(({card}) =>
            card.params.name === 'Fuego Cruzado').card;
        const crossfire = createNemesisCard(
            matchFactory,
            crossfireConfig,
            scenario
        );
        crossfire.controller = scenario;
        scenario.gameZone.addToGameZone(crossfire);

        const attack = new EnemyAttackEffect({
            enemy: crossfire,
            match,
            selectedTarget: superhero,
        });
        const attackActivation = {effect: attack};
        const boostResolution = new ResolveBoostEffect({
            activation: attackActivation,
            card: crossfire,
            enemyActivation: attack,
            match,
        });

        await boostResolution.execute({player});
        assert.equal(attack.piercing, true);

        const schemeActivation = {effect: attack};
        const nonAttackBoost = new ResolveBoostEffect({
            activation: schemeActivation,
            card: crossfire,
            enemyActivation: {isAttack: false},
            match,
        });
        attack.keywords.piercing = false;
        await nonAttackBoost.execute({player});
        assert.equal(attack.piercing, false);

        const attackAbility = crossfire.abilities.find(ability =>
            ability.trigger === TRIGGER_THIS_ATTACK);
        assert.ok(attackAbility);
        await attackAbility.resolveAbility({
            player,
            effect: attack,
        });
        assert.equal(attack.piercing, true);
    });

    test('the side scheme targets Clint by Alter Ego and applies referential priority', async () => {
        const {
            catalog,
            hawkeye,
            match,
            matchFactory,
            player,
            scenario,
        } = await createHawkeyeGame();
        const alternateHawkeyeConfig = {
            ...hawkeye.config,
            sides: hawkeye.config.sides.map((side, index) => index === 0 ? {
                ...side,
                params: {
                    ...side.params,
                    name: 'Kate Bishop',
                },
            } : side),
            precon: [],
        };
        const alternateHawkeye = matchFactory.createSuperhero(
            alternateHawkeyeConfig
        );
        alternateHawkeye.selectedSide = 1;
        const otherPlayer = match.createPlayer({
            name: 'Kate Bishop',
            superhero: alternateHawkeye,
        });
        otherPlayer.initPlayer();

        const basicMockingbirdConfig = catalog.aspects.find(({_id}) =>
            _id === 'basic-mockingbird');
        assert.ok(basicMockingbirdConfig);
        const basicMockingbird =
            matchFactory.cardsFactory.createGameCardFromConfig(
                basicMockingbirdConfig.card,
                {owner: player}
            );
        basicMockingbird.controller = player;
        player.hand.addCard(basicMockingbird);

        const obligation = createNemesisCard(
            matchFactory,
            hawkeye.config.obligation.card,
            player
        );
        obligation.controller = player;
        player.gameZone.addToGameZone(obligation);

        const crossfireConfig = hawkeye.config.nemesis.find(({card}) =>
            card.params.name === 'Fuego Cruzado').card;
        const crossfire = createNemesisCard(
            matchFactory,
            crossfireConfig,
            scenario
        );
        crossfire.controller = scenario;
        scenario.gameZone.addToGameZone(crossfire);

        const mockingbirdConfig = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Pájaro Burlón').card;
        const deckMockingbirdIndex = player.deck.cards.findIndex(card =>
            card.name === 'Pájaro Burlón');
        const mockingbird = deckMockingbirdIndex > -1 ?
            player.deck.cards.splice(deckMockingbirdIndex, 1)[0] :
            createNemesisCard(matchFactory, mockingbirdConfig, player);
        mockingbird.controller = player;
        player.gameZone.addToGameZone(mockingbird);

        const otherMockingbird = createNemesisCard(
            matchFactory,
            mockingbirdConfig,
            otherPlayer
        );
        otherPlayer.hand.addCard(otherMockingbird);

        const dialogs = [];
        match.openDialog = async options => {
            dialogs.push(options);
            if (options.data?.title !== 'Busca a Pájaro Burlón') {
                return {};
            }
            const selectedCard = options.data.cards.find(({id}) =>
                id === mockingbird.id) || options.data.cards[0];

            return {selected: selectedCard ? [selectedCard] : []};
        };

        const schemeConfig = hawkeye.config.nemesis.find(({card}) =>
            card.params.name === 'En el punto de mira').card;
        const scheme = createNemesisCard(
            matchFactory,
            schemeConfig,
            scenario
        );
        scheme.controller = scenario;
        scheme.refresh = async () => {};
        scenario.gameZone.addToGameZone(scheme);

        const revealAbility = scheme.abilities.find(ability =>
            ability.effect?.effectType === EFFECT_CHAINED);
        assert.ok(revealAbility);
        assert.equal(
            scheme.abilities.some(ability =>
                ability.trigger === TRIGGER_THIS_DEFEAT),
            false
        );
        assert.equal(player.superhero.mainName, 'Ojo de Halcón');
        assert.equal(otherPlayer.superhero.mainName, player.superhero.mainName);
        assert.equal(player.superhero.sides[0].name, 'Clint Barton');
        assert.equal(otherPlayer.superhero.sides[0].name, 'Kate Bishop');

        const revealEffects =
            schemeConfig.params.abilities[0].params.effect.params.effects;
        const revealConfig = revealEffects[0].params;
        assert.deepEqual(revealConfig.condition, {
            'superhero.sides.0.name': 'Clint Barton',
        });

        const searchConfig =
            revealConfig.effect.params.effects[0];
        assert.equal(searchConfig.type, EFFECT_SEARCH_CARDS);
        assert.deepEqual(searchConfig.params.locations, [
            PLACE_HAND,
            PLACE_DECK,
            PLACE_DISCARD_PILE,
            PLACE_IN_PLAY,
        ]);
        assert.equal(searchConfig.params.firstMatch, undefined);
        assert.equal(searchConfig.params.requireMatch, undefined);
        assert.deepEqual(searchConfig.params.filter, {
            name: 'Pájaro Burlón',
        });
        assert.equal(revealEffects[1].type, EFFECT_LASTING);
        assert.equal(revealEffects[1].params.until, TRIGGER_THIS_DEFEAT);
        assert.equal(
            revealEffects[1].params.endEffect.type,
            EFFECT_MOVE_TO_HAND
        );
        assert.equal(scheme.isEncounterCard, true);

        await revealAbility.resolveAbility({player});

        assert.equal(scheme.tuckedCards.length, 1);
        assert.equal(scheme.tuckedCards[0], mockingbird);
        assert.equal(mockingbird.card.classification, CLASSIFICATION_HERO);
        assert.equal(mockingbird.set, 'Hawkeye');
        assert.equal(basicMockingbird.card.classification, 'basic');
        assert.equal(basicMockingbird.set, 'basic');
        assert.equal(player.hand.cards.includes(basicMockingbird), true);
        assert.equal(player.gameZone.cards.includes(mockingbird), false);
        assert.equal(player.gameZone.cards.includes(obligation), true);
        assert.equal(scenario.gameZone.cards.includes(crossfire), true);
        assert.equal(otherPlayer.hand.cards.includes(otherMockingbird), true);

        const [lasting] = match.lasting;
        assert.ok(lasting);
        assert.equal(lasting.card, scheme);
        assert.equal(lasting.until, TRIGGER_THIS_DEFEAT);
        assert.equal(
            scheme.triggers[TRIGGER_THIS_DEFEAT]?.[
                PRIORITY_FORCED_RESPONSE
            ]?.length ?? 0,
            0
        );
        assert.equal(
            scheme.triggers[TRIGGER_THIS_DEFEAT]?.[
                PRIORITY_FORCED_INTERRUPT
            ]?.length,
            1
        );
        assert.equal(lasting.selectedTarget, mockingbird);

        const defeat = new DefeatEffect({
            match,
            selectedTarget: scheme,
        });
        const dialogsBeforeDefeat = dialogs.length;
        await defeat.runEffect({match, player: otherPlayer});

        assert.equal(scheme.tuckedCards.length, 0);
        assert.equal(player.hand.cards.includes(mockingbird), true);
        assert.equal(otherPlayer.hand.cards.includes(mockingbird), false);
        assert.equal(otherPlayer.hand.cards.includes(otherMockingbird), true);
        assert.equal(match.lasting.includes(lasting), false);
        assert.deepEqual(dialogs.slice(dialogsBeforeDefeat), []);

        player.hand.cards.splice(player.hand.cards.indexOf(mockingbird), 1);
        const emptySearchScheme = createNemesisCard(
            matchFactory,
            schemeConfig,
            scenario
        );
        emptySearchScheme.controller = scenario;
        emptySearchScheme.refresh = async () => {};
        scenario.gameZone.addToGameZone(emptySearchScheme);
        const emptySearchAbility = emptySearchScheme.abilities.find(ability =>
            ability.effect?.effectType === EFFECT_CHAINED);
        await emptySearchAbility.resolveAbility({player});

        assert.equal(emptySearchScheme.tuckedCards.length, 0);
        assert.equal(player.hand.cards.includes(basicMockingbird), true);
        assert.equal(otherPlayer.hand.cards.includes(otherMockingbird), true);
        assert.equal(match.lasting.length, 0);
    });

    test('the Crossfire rifle prioritizes Crossfire and falls back to the Villain', async () => {
        const {
            hawkeye,
            match,
            matchFactory,
            player,
            scenario,
            superhero,
        } = await createHawkeyeGame();
        const crossfireConfig = hawkeye.config.nemesis.find(({card}) =>
            card.params.name === 'Fuego Cruzado').card;
        const rifleConfig = hawkeye.config.nemesis.find(({card}) =>
            card.params.name === 'Fusil de Fuego Cruzado').card;
        const crossfire = createNemesisCard(
            matchFactory,
            crossfireConfig,
            scenario
        );
        const rifle = createNemesisCard(matchFactory, rifleConfig, scenario);
        const villain = {
            name: 'Villano',
            isVillain: true,
            isEnemy: true,
            isInPlay: true,
            abilities: [],
            attached: [],
            canBeAttacked() {
                return true;
            },
            async refresh() {},
        };
        scenario.villain = villain;
        crossfire.controller = scenario;
        crossfire.refresh = async () => {};
        rifle.refresh = async () => {};

        setMatchEnemies(match, [crossfire, villain]);
        const attachEffect = rifle.card.createAttachEffect(rifle);
        const selectedTarget = await attachEffect.selectTarget({
            match,
            player,
        });
        assert.equal(selectedTarget, crossfire);
        attachEffect.selectedTarget = selectedTarget;
        await attachEffect.execute({player});

        assert.equal(rifle.attachedTo, crossfire);
        assert.equal(crossfire.attack, 4);

        await Promise.all([
            crossfire.initTriggers(),
            rifle.initTriggers(),
        ]);
        const enemyAttack = new EnemyAttackEffect({
            enemy: crossfire,
            match,
            selectedTarget: superhero,
        });
        enemyAttack.dealBoostCards = async () => {};
        enemyAttack.showBoostCards = async () => {};
        enemyAttack.defense = async () => {};
        enemyAttack.resolveBoostCards = async () => 0;
        enemyAttack.getCharacterDialogData = async () => ({});
        await enemyAttack.runEffect({match, player});
        assert.equal(enemyAttack.ranged, true);

        const heroAction = rifle.abilities.find(ability =>
            ability.arrow?.cost?.effectType === EFFECT_SIMULTANEOUS);
        assert.ok(heroAction);
        await heroAction.resolveAbility({
            arrowPaid: true,
            card: rifle,
            player,
        });
        assert.equal(crossfire.attack, 2);
        assert.equal(scenario.deck.discardPile.includes(rifle), true);
        const attackWithoutRifle = new EnemyAttackEffect({
            enemy: crossfire,
            match,
            selectedTarget: superhero,
        });
        attackWithoutRifle.dealBoostCards = async () => {};
        attackWithoutRifle.showBoostCards = async () => {};
        attackWithoutRifle.defense = async () => {};
        attackWithoutRifle.resolveBoostCards = async () => 0;
        attackWithoutRifle.getCharacterDialogData = async () => ({});
        await attackWithoutRifle.runEffect({match, player});
        assert.equal(attackWithoutRifle.ranged, false);

        const fallbackRifle = createNemesisCard(
            matchFactory,
            rifleConfig,
            scenario
        );
        fallbackRifle.refresh = async () => {};
        setMatchEnemies(match, [villain]);
        const reveal = new RevealEncounterEffect({
            card: fallbackRifle,
            match,
            player,
        });
        await reveal.runEffect({
            card: fallbackRifle,
            match,
            player,
        });
        assert.equal(fallbackRifle.attachedTo, villain);
    });

    test('the rifle Hero Action has its simultaneous exhaust and wild-resource costs', async () => {
        const {
            hawkeye,
            match,
            matchFactory,
            player,
            scenario,
        } = await createHawkeyeGame();
        const rifleConfig = hawkeye.config.nemesis.find(({card}) =>
            card.params.name === 'Fusil de Fuego Cruzado').card;
        const rifle = createNemesisCard(matchFactory, rifleConfig, scenario);
        const heroAction = rifle.abilities.find(ability =>
            ability.arrow?.cost?.effectType === EFFECT_SIMULTANEOUS);

        assert.ok(heroAction);
        assert.equal(heroAction.arrow.cost.effects[0].effectType, EFFECT_EXHAUST);
        assert.equal(heroAction.arrow.cost.effects[0].target, TARGET_YOUR_HERO);
        assert.equal(heroAction.arrow.cost.effects[1].effectType, EFFECT_SPEND);
        assert.deepEqual(heroAction.arrow.cost.effects[1].resources, [RESOURCE_WILD]);
        assert.equal(heroAction.effect.effectType, EFFECT_DISCARD_GAME);
        assert.equal(heroAction.effect.target, TARGET_CARD);

        const bowConfig = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Arco de Ojo de Halcón').card;
        const wildResource = createNemesisCard(matchFactory, bowConfig, player);
        player.hand.addCard(wildResource);
        assert.equal(
            await heroAction.arrow.cost.canRun({
                card: rifle,
                isCost: true,
                match,
                matchAll: true,
                player,
            }),
            true
        );
    });

    test('Sniper Shot deals damage in hero form and adds threat in alter-ego form', async () => {
        const {
            hawkeye,
            matchFactory,
            player,
            scenario,
            superhero,
        } = await createHawkeyeGame();
        const treacheryConfig = hawkeye.config.nemesis.find(({card}) =>
            card.params.name === 'Disparo de francotirador').card;
        const treachery = createNemesisCard(
            matchFactory,
            treacheryConfig,
            scenario
        );
        const heroAbility = treachery.abilities.find(ability =>
            ability.effect?.effectType === EFFECT_TAKE_DAMAGE);
        const alteregoAbility = treachery.abilities.find(ability =>
            ability.effect?.effectType === EFFECT_PLACE_THREAT);
        const mainScheme = {
            isMainScheme: true,
            threat: 0,
            abilities: [],
            canRemoveThreat() {
                return this.threat > 0;
            },
            placeThreat(amount) {
                this.threat += amount;
            },
            async refresh() {},
        };
        scenario.mainScheme = mainScheme;
        scenario.schemes = [mainScheme];

        assert.ok(heroAbility);
        assert.ok(alteregoAbility);
        assert.equal(heroAbility.effect.target, TARGET_YOUR_HERO);
        assert.equal(alteregoAbility.effect.target, TARGET_MAIN_SCHEME);

        await heroAbility.resolveAbility({player});
        assert.equal(superhero.damage, 3);

        superhero.selectedSide = 0;
        await alteregoAbility.resolveAbility({player});
        assert.equal(mainScheme.threat, 3);
    });
});
