import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ALLY,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    DECK_POSITION_SHUFFLE,
    DIALOG_DISCARD_RANDOM_HAND,
    DIALOG_REVEAL_CARDS,
    DIALOG_SELECT_TARGET,
    DIALOG_USE_CARD,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_RANDOM,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DEAL_BOOST,
    EFFECT_MOVE_TO_DECK,
    EFFECT_MODIFY_ATTACK,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_SIMULTANEOUS,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_SOURCE,
    TRAIT_ELITE,
    TRAIT_TEMPORAL,
    TRIGGER_ENGAGE_HERO,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {ResolveBoostEffect} from '../../src/effects/resolve-boost-effect.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';

describe('Anacronautas modular encounter set', () => {
    const getFixture = async () => {
        const catalog = await loadCatalog();
        const set = catalog.sets.find(({_id}) => _id === 'anachronauts');
        const thor = catalog.heroes.find(({_id}) => _id === 'thor');
        assert.ok(set);
        assert.ok(thor);

        const match = new Match({
            mc: {
                mcSocket: {
                    send() {},
                },
            },
            name: 'anachronauts-test',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(thor.config);
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Thor',
            superhero,
            initial: true,
        });
        player.initPlayer();
        player.gameZone.refresh = async () => {};
        player.refresh = async () => {};
        superhero.refresh = async () => {};
        superhero.sides.forEach(side => {
            side.refresh = async () => {};
        });

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_USE_CARD &&
                dialog.data?.cards?.length) {
                return {selected: dialog.data.cards[0]};
            }
            if (dialog.dialogType === DIALOG_DISCARD_RANDOM_HAND) {
                return {selected: dialog.data.cards[0]};
            }
            if (dialog.dialogType === DIALOG_SELECT_TARGET &&
                dialog.data?.cards?.length > 1) {
                const support = dialog.data.cards.find(card =>
                    card.name.includes('Apoyo'));

                return {selected: support || dialog.data.cards[0]};
            }

            return {};
        };

        const scenario = {
            match,
            name: set.config.name,
        };
        scenario.deck = new Deck({
            owner: scenario,
            isScenarioDeck: true,
        });
        scenario.deck.refresh = async () => {};
        scenario.gameZone = new ScenarioZone({owner: scenario});
        scenario.gameZone.refresh = async () => {};
        scenario.gameZone.addPlayer(player);
        scenario.drawEncounterCards = count => scenario.deck.draw(count);
        match.scenario = scenario;

        return {
            cardsFactory: matchFactory.cardsFactory,
            catalog,
            dialogs,
            match,
            player,
            scenario,
            set,
        };
    };

    const getCardEntry = (set, name) =>
        set.config.cards.find(({card}) => card.params.name === name);

    const createGameCard = (cardsFactory, config, owner) =>
        cardsFactory.createGameCardFromConfig(config, {owner});

    const createEncounterCard = (cardsFactory, scenario, name, traits = []) =>
        createGameCard(cardsFactory, {
            type: CARD_TYPE_TREACHERY,
            params: {
                name,
                set: 'test',
                image: 'sets/test/00000.png',
                boost: 0,
                traits,
            },
        }, scenario);

    test('registers printed card data in image order and compiles runnable abilities', async () => {
        const {cardsFactory, set} = await getFixture();
        const entries = set.config.cards;

        assert.equal(set.config.name, 'Anacronautas');
        assert.equal(set.config.standard, false);
        assert.deepEqual(
            entries.map(({count, card}) => [card.params.image, count]),
            [
                ['sets/anachronauts/11040.png', 1],
                ['sets/anachronauts/11041.png', 1],
                ['sets/anachronauts/11042.png', 1],
                ['sets/anachronauts/11043.png', 1],
                ['sets/anachronauts/11044.png', 1],
                ['sets/anachronauts/11045.png', 2],
                ['sets/anachronauts/11046.png', 2],
            ]
        );

        for (const {card: config} of entries) {
            const gameCard = cardsFactory.createGameCardFromConfig(config);
            if (gameCard.isMinion) {
                assert.equal(config.params.unique, true);
                assert.deepEqual(config.params.traits, [
                    TRAIT_ELITE,
                    TRAIT_TEMPORAL,
                ]);
                assert.equal(config.params.boost, 0);
            }

            for (const ability of [
                ...gameCard.abilities,
                ...(gameCard.boostAbility ? [gameCard.boostAbility] : []),
            ]) {
                assert.ok(ability.effect, `${config.params.name} needs an effect.`);
                assert.equal(Array.isArray(ability.effect), false);
                assert.equal(typeof ability.effect.canRun, 'function');
            }
        }

        const apocrifus = getCardEntry(set, 'Apócrifus').card;
        assert.deepEqual(
            [apocrifus.params.attack, apocrifus.params.scheme, apocrifus.params.hitPoints],
            [3, 1, 4]
        );
        assert.equal(
            apocrifus.params.abilities[0].type,
            ABILITY_WHEN_REVEALED
        );
        const apocrifusReveal = apocrifus.params.abilities[0].params.effect;
        assert.equal(apocrifusReveal.type, EFFECT_DISCARD_GAME);
        assert.equal(apocrifusReveal.params.target, TARGET_SOURCE);
        assert.equal(apocrifusReveal.params.source, 'player.gameZone.cards');
        assert.deepEqual(
            apocrifusReveal.params.condition,
            [{isAlly: true}, {isSupport: true}]
        );
        assert.equal(apocrifusReveal.params.selectCount, 1);
        const apocrifusBoost =
            apocrifus.params.boostAbility.params.effect.params.effects[1];
        assert.equal(apocrifusBoost.type, EFFECT_DEAL_BOOST);
        assert.deepEqual(apocrifusBoost.params, {
            target: TARGET_SOURCE,
            source: 'enemyActivation.enemy',
        });

        const deadlyPursuit = getCardEntry(set, 'Caza Mortal 9000').card;
        assert.deepEqual(deadlyPursuit.params.keywords, {
            toughness: true,
            villainous: true,
        });
        assert.deepEqual(
            [deadlyPursuit.params.attack, deadlyPursuit.params.scheme, deadlyPursuit.params.hitPoints],
            [1, 1, 6]
        );
        assert.equal(
            deadlyPursuit.params.boostAbility.params.effect.type,
            EFFECT_SIMULTANEOUS
        );
        const deadlyPursuitEffects =
            deadlyPursuit.params.boostAbility.params.effect.params.effects;
        assert.deepEqual(
            deadlyPursuitEffects.map(({params}) =>
                [params.target, params.source]),
            Array.from({length: 2}, () =>
                [TARGET_SOURCE, 'enemyActivation.enemy'])
        );

        const sirRaston = getCardEntry(set, 'Sir Raston').card;
        assert.deepEqual(sirRaston.params.keywords, {
            guard: true,
            retaliate: 1,
        });
        assert.equal(sirRaston.params.boost, 0);
        assert.deepEqual(
            sirRaston.params.boostAbility.params.effect.params.effects[1].params,
            {
                target: TARGET_SOURCE,
                source: 'enemyActivation.enemy',
            }
        );

        const terminatrix = getCardEntry(set, 'Terminatrix').card;
        assert.deepEqual(terminatrix.params.keywords, {quickStrike: true});
        assert.equal(
            terminatrix.params.abilities[0].type,
            ABILITY_CONSTANT
        );
        assert.equal(
            terminatrix.params.abilities[0].params.trigger,
            TRIGGER_THIS_ATTACK
        );
        assert.equal(
            terminatrix.params.abilities[0].params.effect.type,
            EFFECT_MODIFY_ATTACK
        );
        assert.equal(
            terminatrix.params.abilities[0].params.effect.params.target,
            TARGET_EFFECT
        );
        assert.equal(
            terminatrix.params.boostAbility.params.effect.params.count,
            2
        );
        assert.equal(
            terminatrix.params.boostAbility.params.effect.params.target,
            TARGET_SOURCE
        );
        assert.equal(
            terminatrix.params.boostAbility.params.effect.params.source,
            'enemyActivation.enemy'
        );
        const terminatrixCard = cardsFactory.createGameCardFromConfig(terminatrix);
        assert.equal(terminatrixCard.quickStrike, true);
        assert.ok(terminatrixCard.abilities.some(ability =>
            ability.trigger === TRIGGER_ENGAGE_HERO));

        const wildrun = getCardEntry(set, 'Wildrun').card;
        assert.equal(
            wildrun.params.abilities[0].params.effect.type,
            EFFECT_DISCARD_RANDOM
        );
        assert.deepEqual(
            wildrun.params.boostAbility.params.effect.params.effects[1].params,
            {
                target: TARGET_SOURCE,
                source: 'enemyActivation.enemy',
            }
        );

        const sideScheme = getCardEntry(set, 'Los Anacronautas').card;
        assert.equal(sideScheme.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.deepEqual(sideScheme.params.startingThreat, [3, true]);
        assert.equal(sideScheme.params.boost, 3);
        assert.deepEqual(sideScheme.params.icons, {hazard: 1});
        assert.equal(
            sideScheme.params.abilities[0].type,
            ABILITY_WHEN_DEFEATED
        );
        assert.equal(
            sideScheme.params.abilities[0].params.effect.type,
            EFFECT_MOVE_TO_DECK
        );
        assert.equal(
            sideScheme.params.abilities[0].params.effect.params.target,
            TARGET_ENCOUNTER_DECK
        );
        assert.deepEqual(
            sideScheme.params.abilities[0].params.effect.params.cardCondition,
            {traits: TRAIT_TEMPORAL}
        );
        assert.equal(
            sideScheme.params.abilities[0].params.effect.params.position,
            DECK_POSITION_SHUFFLE
        );

        const treachery = getCardEntry(set, 'Los elegidos de Kang').card;
        assert.equal(treachery.type, CARD_TYPE_TREACHERY);
        assert.equal(treachery.params.boost, 2);
        assert.deepEqual(treachery.params.keywords, {incite: 1});
        const treacheryEffects =
            treachery.params.abilities[0].params.effect.params.effects;
        assert.equal(
            treachery.params.abilities[0].type,
            ABILITY_WHEN_REVEALED
        );
        assert.deepEqual(
            treacheryEffects.map(({type}) => type),
            [
                EFFECT_DISCARD_UNTIL,
                EFFECT_REVEAL_ENCOUNTER,
            ]
        );
        assert.equal(
            treacheryEffects[0].params.condition.traits,
            TRAIT_TEMPORAL
        );
        assert.equal(treacheryEffects[0].params.removeFromDiscard, true);
        assert.equal(treacheryEffects[1].params.card, 'selectedCard');
    });

    test('Apócrifus makes the revealing player discard one Ally or Support they control', async () => {
        const {cardsFactory, dialogs, match, player, scenario, set} =
            await getFixture();
        const ally = createGameCard(cardsFactory, {
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado de prueba',
                set: 'test',
                image: 'sets/test/00001.png',
                cost: 0,
                attack: 1,
                thwart: 1,
                hitPoints: 2,
            },
        }, player);
        const support = createGameCard(cardsFactory, {
            type: CARD_TYPE_SUPPORT,
            params: {
                name: 'Apoyo de prueba',
                set: 'test',
                image: 'sets/test/00002.png',
                cost: 0,
            },
        }, player);
        player.addToGameZone(ally);
        player.addToGameZone(support);

        const apocrifus = createGameCard(
            cardsFactory,
            getCardEntry(set, 'Apócrifus').card,
            scenario
        );
        const reveal = new RevealEncounterEffect({
            match,
            selectedTarget: apocrifus,
            player,
        });

        await reveal.runEffect({match, player});

        assert.equal(player.gameZone.cards.includes(ally), true);
        assert.equal(player.gameZone.cards.includes(support), false);
        const selectionDialog = dialogs.find(dialog =>
            dialog.dialogType === DIALOG_SELECT_TARGET);
        assert.ok(selectionDialog);
        assert.deepEqual(
            selectionDialog.data.cards.map(({name}) => name).sort(),
            ['Aliado de prueba', 'Apoyo de prueba'].sort()
        );
    });

    test('Terminatrix attacks gain Piercing', async () => {
        const {cardsFactory, match, player, scenario, set} = await getFixture();
        const terminatrix = createGameCard(
            cardsFactory,
            getCardEntry(set, 'Terminatrix').card,
            scenario
        );
        terminatrix.controller = scenario;
        scenario.gameZone.addToGameZone(terminatrix);
        await terminatrix.initTriggers();

        const attack = new EnemyAttackEffect({
            enemy: terminatrix,
            match,
            selectedTarget: player,
        });
        await attack.triggerInit(attack.getTriggersParams({
            effect: attack,
            match,
            player,
        }));

        assert.equal(attack.piercing, true);
    });

    test('defeating Los Anacronautas returns only Temporal encounter discard cards and shows them publicly', async () => {
        const {cardsFactory, dialogs, match, player, scenario, set} =
            await getFixture();
        const sideScheme = createGameCard(
            cardsFactory,
            getCardEntry(set, 'Los Anacronautas').card,
            scenario
        );
        sideScheme.controller = scenario;
        scenario.gameZone.addToGameZone(sideScheme);
        await sideScheme.initTriggers();

        const temporalCard = createGameCard(
            cardsFactory,
            getCardEntry(set, 'Apócrifus').card,
            scenario
        );
        const nonTemporalCard = createEncounterCard(
            cardsFactory,
            scenario,
            'Carta no temporal',
            []
        );
        scenario.deck.discardPile = [temporalCard, nonTemporalCard];

        const defeat = new DefeatEffect({
            match,
            selectedTarget: sideScheme,
            target: TARGET_CARD,
        });
        await defeat.runEffect({card: sideScheme, match, player});

        const returnDialog = dialogs.find(dialog =>
            dialog.dialogType === DIALOG_REVEAL_CARDS &&
            dialog.title === 'Cartas que vuelven al mazo de Encuentros');
        assert.ok(returnDialog);
        assert.equal(returnDialog.showToAll, true);
        assert.deepEqual(
            returnDialog.data.cards.map(card => card.name),
            ['Apócrifus']
        );
        assert.equal(returnDialog.data.rotatePlanCards, true);
        assert.ok(scenario.deck.cards.includes(temporalCard));
        assert.ok(scenario.deck.discardPile.includes(nonTemporalCard));
        assert.equal(scenario.gameZone.cards.includes(sideScheme), false);
    });

    test('Los elegidos de Kang reveals the last discarded Temporal Minion directly', async () => {
        const {cardsFactory, match, player, scenario, set} = await getFixture();
        const chosenOfKang = createGameCard(
            cardsFactory,
            getCardEntry(set, 'Los elegidos de Kang').card,
            scenario
        );
        const nonTemporalCard = createEncounterCard(
            cardsFactory,
            scenario,
            'Carta no temporal'
        );
        const sirRaston = createGameCard(
            cardsFactory,
            getCardEntry(set, 'Sir Raston').card,
            scenario
        );
        scenario.deck.cards = [nonTemporalCard, sirRaston];

        const reveal = new RevealEncounterEffect({
            match,
            selectedTarget: chosenOfKang,
            player,
        });
        await reveal.runEffect({match, player});

        assert.ok(player.minions.includes(sirRaston));
        assert.equal(scenario.deck.discardPile.includes(nonTemporalCard), false);
        assert.equal(scenario.deck.discardPile.includes(sirRaston), false);
        assert.deepEqual(scenario.deck.cards, [nonTemporalCard]);
    });

    test('Boost abilities resolve their printed exhaust, damage, Tough, discard, and extra-card effects', async () => {
        const {cardsFactory, match, player, scenario, set} = await getFixture();
        const villain = {
            id: 'test-villain',
            name: 'Kang',
            isVillain: true,
            abilities: [],
            tough: 0,
            get isTough() {
                return this.tough > 0;
            },
            setTough() {
                this.tough++;
            },
            async refresh() {},
        };
        scenario.gameZone.currentVillain = villain;
        scenario.deck.cards = Array.from({length: 10}, (_, index) =>
            createEncounterCard(
                cardsFactory,
                scenario,
                `Extra boost ${index}`
            ));

        const resolveBoost = async (name, enemy = villain) => {
            const card = createGameCard(
                cardsFactory,
                getCardEntry(set, name).card,
                scenario
            );
            const enemyActivation = {
                enemy,
                boostCards: [card],
            };
            const boost = new ResolveBoostEffect({
                card,
                enemyActivation,
                match,
            });
            await boost.runEffect({match, player});

            return {card, enemyActivation};
        };

        const {card: apocrifusCard, enemyActivation: apocrifusActivation} =
            await resolveBoost('Apócrifus');
        assert.equal(player.superhero.exhausted, true);
        assert.equal(
            apocrifusActivation.boostCards.length,
            2,
            JSON.stringify({
                abilityResolved: apocrifusCard.boostAbility.resolved,
                enemy: apocrifusActivation.enemy,
                effects: apocrifusCard.boostAbility.effect.effects.map(effect => ({
                    effectType: effect.effectType,
                    resolved: effect.resolved,
                    selectedTarget: effect.selectedTarget?.name,
                    source: effect.source,
                    target: effect.target,
                })),
            })
        );

        const villainousMinion = {
            id: 'test-minion',
            name: 'Esbirro infame',
            isMinion: true,
            villainous: true,
            tough: 0,
            get isTough() {
                return this.tough > 0;
            },
            setTough() {
                this.tough++;
            },
            async refresh() {},
        };
        const {enemyActivation: deadlyPursuitActivation} = await resolveBoost(
            'Caza Mortal 9000',
            villainousMinion
        );
        assert.equal(villainousMinion.isTough, true);
        assert.equal(villain.isTough, false);
        assert.equal(deadlyPursuitActivation.boostCards.length, 2);

        const healthBeforeRaston = player.superhero.damage;
        const {enemyActivation: rastonActivation} = await resolveBoost('Sir Raston');
        assert.equal(player.superhero.damage, healthBeforeRaston + 1);
        assert.equal(rastonActivation.boostCards.length, 2);

        const {enemyActivation: terminatrixActivation} =
            await resolveBoost('Terminatrix');
        assert.equal(terminatrixActivation.boostCards.length, 3);

        const handCard = createGameCard(cardsFactory, {
            type: CARD_TYPE_SUPPORT,
            params: {
                name: 'Carta aleatoria de prueba',
                set: 'test',
                image: 'sets/test/00003.png',
                cost: 0,
            },
        }, player);
        player.hand.addCard(handCard);
        const {enemyActivation: wildrunActivation} = await resolveBoost('Wildrun');
        assert.equal(player.hand.cards.includes(handCard), false);
        assert.equal(wildrunActivation.boostCards.length, 2);
    });
});
