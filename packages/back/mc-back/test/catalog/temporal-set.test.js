import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    CALC_BOOST_ICONS,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    DECK_POSITION_SHUFFLE,
    DIALOG_USE_CARD,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MOVE_TO_DECK,
    EFFECT_STUN,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_YOU,
    TRAIT_CREATURE,
    TRAIT_SOLDIER,
    TRAIT_TEMPORAL,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_DEFEAT,
    TRIGGER_ENGAGE_HERO,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Temporal modular encounter set', () => {
    const getFixture = async () => {
        const catalog = await loadCatalog();
        const temporal = catalog.sets.find(({_id}) => _id === 'temporal');
        const thor = catalog.heroes.find(({_id}) => _id === 'thor');
        assert.ok(temporal);
        assert.ok(thor);

        const match = new Match({
            mc: {
                mcSocket: {
                    send() {},
                },
            },
            name: 'temporal-set-test',
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
        match.openDialog = async ({dialogType, data}) =>
            dialogType === DIALOG_USE_CARD && data.cards?.length ?
                {selected: data.cards[0]} :
                {};

        const scenario = {
            match,
            name: temporal.config.name,
        };
        scenario.deck = new Deck({
            owner: scenario,
            isScenarioDeck: true,
        });
        scenario.gameZone = new ScenarioZone({owner: scenario});
        scenario.gameZone.refresh = async () => {};
        match.scenario = scenario;

        return {
            cardsFactory: matchFactory.cardsFactory,
            match,
            player,
            scenario,
            temporal,
        };
    };

    const getCardEntry = (temporal, name) =>
        temporal.config.cards.find(({card}) => card.params.name === name);

    const createEncounterCard = (cardsFactory, scenario, name, boost) =>
        cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name,
                set: 'temporal',
                image: 'sets/temporal/test.png',
                boost,
            },
        }, {owner: scenario});

    test('registers the printed cards, counts, traits, stats, and images', async () => {
        const {temporal} = await getFixture();
        const entries = temporal.config.cards;

        assert.equal(temporal.config.name, 'Temporal');
        assert.equal(temporal.config.standard, false);
        entries.forEach(entry => {
            assert.deepEqual(Object.keys(entry).sort(), ['card', 'count']);
        });
        assert.deepEqual(
            entries.map(({count, card}) => [card.params.image, count]),
            [
                ['sets/temporal/11030.png', 3],
                ['sets/temporal/11031.png', 2],
                ['sets/temporal/11032.png', 1],
                ['sets/temporal/11033.png', 1],
            ]
        );

        const ancientWarrior = getCardEntry(
            temporal,
            'Guerrero de la antigüedad'
        ).card;
        assert.equal(ancientWarrior.type, CARD_TYPE_MINION);
        assert.deepEqual(ancientWarrior.params.traits, [
            TRAIT_SOLDIER,
            TRAIT_TEMPORAL,
        ]);
        assert.deepEqual(
            {
                attack: ancientWarrior.params.attack,
                scheme: ancientWarrior.params.scheme,
                hitPoints: ancientWarrior.params.hitPoints,
                boost: ancientWarrior.params.boost,
            },
            {attack: 2, scheme: 1, hitPoints: 2, boost: 0}
        );
        assert.deepEqual(ancientWarrior.params.keywords, {
            quickStrike: true,
        });
        assert.deepEqual(ancientWarrior.params.boostAbility, {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_STUN,
                    params: {target: TARGET_YOU},
                },
            },
        });

        const chitauri = getCardEntry(temporal, 'Soldado chitauri').card;
        assert.deepEqual(chitauri.params.traits, [
            TRAIT_SOLDIER,
            TRAIT_TEMPORAL,
        ]);
        assert.deepEqual(
            {
                attack: chitauri.params.attack,
                scheme: chitauri.params.scheme,
                hitPoints: chitauri.params.hitPoints,
                boost: chitauri.params.boost,
            },
            {attack: 1, scheme: 1, hitPoints: 3, boost: 1}
        );

        const tyrannosaurus = getCardEntry(
            temporal,
            'Tiranosaurio rex'
        ).card;
        assert.deepEqual(tyrannosaurus.params.traits, [
            TRAIT_CREATURE,
            TRAIT_TEMPORAL,
        ]);
        assert.deepEqual(
            {
                attack: tyrannosaurus.params.attack,
                scheme: tyrannosaurus.params.scheme,
                hitPoints: tyrannosaurus.params.hitPoints,
                boost: tyrannosaurus.params.boost,
            },
            {attack: 3, scheme: 0, hitPoints: 6, boost: 3}
        );
        assert.deepEqual(tyrannosaurus.params.keywords, {
            toughness: true,
        });

        const portal = getCardEntry(
            temporal,
            'Portal a través del tiempo'
        ).card;
        assert.equal(portal.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(portal.params.startingThreat[0], 2);
        assert.equal(portal.params.startingThreat[1], true);
        assert.equal(portal.params.boost, 2);
        assert.deepEqual(portal.params.icons, {hazard: 1});
    });

    test('compiles each printed and Boost ability into a runnable effect', async () => {
        const {cardsFactory, temporal} = await getFixture();

        temporal.config.cards.forEach(({card}) => {
            const gameCard = cardsFactory.createGameCardFromConfig(card);

            gameCard.abilities.forEach(ability => {
                assert.ok(ability.effect);
                assert.equal(typeof ability.effect.canRun, 'function');
            });
            if (gameCard.boostAbility) {
                assert.ok(gameCard.boostAbility.effect);
                assert.equal(typeof gameCard.boostAbility.effect.canRun, 'function');
            }
        });

        const warrior = cardsFactory.createGameCardFromConfig(
            getCardEntry(temporal, 'Guerrero de la antigüedad').card
        );
        const quickstrike = warrior.abilities.find(({trigger}) =>
            trigger === TRIGGER_ENGAGE_HERO);
        assert.equal(warrior.quickStrike, true);
        assert.ok(quickstrike);
        assert.equal(typeof quickstrike.effect.canRun, 'function');
    });

    test('Guerrero de la antigüedad Boost stuns the revealing player', async () => {
        const {cardsFactory, match, player, scenario, temporal} =
            await getFixture();
        const warrior = cardsFactory.createGameCardFromConfig(
            getCardEntry(temporal, 'Guerrero de la antigüedad').card,
            {owner: scenario}
        );

        await warrior.boostAbility.resolveAbility({
            card: warrior,
            match,
            player,
        });

        assert.equal(player.superhero.stunned, 1);
    });

    test('Chitauri forced interrupt assigns damage from the discarded card boost icons', async () => {
        const {cardsFactory, match, player, scenario, temporal} =
            await getFixture();
        const chitauriConfig = getCardEntry(temporal, 'Soldado chitauri').card;
        const chitauri = cardsFactory.createGameCardFromConfig(chitauriConfig, {
            owner: scenario,
        });
        const discardedCard = createEncounterCard(
            cardsFactory,
            scenario,
            'Carta con dos aumentos',
            2
        );
        const remainingCard = createEncounterCard(
            cardsFactory,
            scenario,
            'Carta restante',
            1
        );
        scenario.deck.cards = [discardedCard, remainingCard];
        chitauri.controller = scenario;
        scenario.gameZone.addToGameZone(chitauri);
        await chitauri.initTriggers();

        const [interruptConfig] = chitauriConfig.params.abilities;
        const [interrupt] = chitauri.abilities;
        assert.equal(interruptConfig.type, ABILITY_FORCED_INTERRUPT);
        assert.equal(interrupt.trigger, TRIGGER_THIS_ATTACK);
        assert.equal(interrupt.effect.effectType, EFFECT_CHAINED);
        assert.deepEqual(interrupt.effect.effects.map(({effectType}) => effectType), [
            EFFECT_DISCARD_FROM_DECK,
            EFFECT_ASSIGN_DAMAGE,
        ]);
        assert.deepEqual(interrupt.effect.effects[0].target, TARGET_ENCOUNTER_DECK);
        assert.deepEqual(interrupt.effect.effects[1].target, TARGET_ALL_CHARACTERS_YOU_CONTROL);
        assert.deepEqual(interrupt.effect.effects[1].paramsCalc, {
            target: 'effects.0.cards',
            formula: CALC_BOOST_ICONS,
        });

        const attack = new EnemyAttackEffect({
            enemy: chitauri,
            match,
            selectedTarget: player,
        });
        const triggerParams = attack.getTriggersParams({
            effect: attack,
            match,
            player,
        });
        await attack.triggerInit(triggerParams);

        assert.equal(player.superhero.damage, 2);
        assert.deepEqual(scenario.deck.discardPile, [discardedCard]);
        assert.deepEqual(scenario.deck.cards, [remainingCard]);
    });

    test('Tiranosaurio rex attacks gain Piercing', async () => {
        const {cardsFactory, match, player, scenario, temporal} =
            await getFixture();
        const rexConfig = getCardEntry(temporal, 'Tiranosaurio rex').card;
        const rex = cardsFactory.createGameCardFromConfig(rexConfig, {
            owner: scenario,
        });
        rex.controller = scenario;
        scenario.gameZone.addToGameZone(rex);
        await rex.initTriggers();
        assert.equal(rex.toughness, true);

        const attack = new EnemyAttackEffect({
            enemy: rex,
            match,
            selectedTarget: player,
        });
        const triggerParams = attack.getTriggersParams({
            effect: attack,
            match,
            player,
        });
        await attack.triggerInit(triggerParams);

        assert.equal(rexConfig.params.abilities[0].type, ABILITY_CONSTANT);
        assert.equal(rex.abilities[0].trigger, TRIGGER_THIS_ATTACK);
        assert.equal(rex.abilities[0].effect.effectType, EFFECT_MODIFY_ATTACK);
        assert.equal(rex.abilities[0].effect.target, TARGET_EFFECT);
        assert.equal(attack.piercing, true);
    });

    test('Portal returns to the encounter deck instead of its discard pile when defeated', async () => {
        const {cardsFactory, match, player, scenario, temporal} =
            await getFixture();
        const portalConfig = getCardEntry(
            temporal,
            'Portal a través del tiempo'
        ).card;
        const portal = cardsFactory.createGameCardFromConfig(portalConfig, {
            owner: scenario,
        });
        portal.controller = scenario;
        scenario.gameZone.addToGameZone(portal);
        scenario.deck.cards = [
            createEncounterCard(cardsFactory, scenario, 'Carta restante', 1),
        ];
        await portal.initTriggers();

        const [forcedInterruptConfig] = portalConfig.params.abilities;
        const [forcedInterrupt] = portal.abilities;
        assert.equal(forcedInterruptConfig.type, ABILITY_FORCED_INTERRUPT);
        assert.equal(forcedInterrupt.trigger, TRIGGER_THIS_DEFEAT);
        assert.equal(forcedInterrupt.effect.effectType, EFFECT_MOVE_TO_DECK);
        assert.equal(forcedInterrupt.effect.target, TARGET_ENCOUNTER_DECK);
        assert.equal(
            forcedInterrupt.effect.position,
            DECK_POSITION_SHUFFLE
        );

        const defeatEffect = new DefeatEffect({
            match,
            selectedTarget: portal,
            target: TARGET_CARD,
        });
        const triggerParams = {
            card: portal,
            effect: defeatEffect,
            match,
            player,
        };

        await defeatEffect.runEffect(triggerParams);

        assert.equal(defeatEffect.resolved, true);
        assert.equal(forcedInterrupt.resolved, true);
        assert.equal(defeatEffect.defeated, true);
        assert.equal(scenario.gameZone.cards.includes(portal), false);
        assert.equal(scenario.deck.cards.includes(portal), true);
        assert.equal(scenario.deck.discardPile.includes(portal), false);
    });
});
