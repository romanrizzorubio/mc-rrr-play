import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_WHEN_DEFEATED,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    EFFECT_ACTIVATE,
    EFFECT_CHAINED,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF_CARD_GAME,
    EFFECT_ENGAGE,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_SCHEME_VALUE,
    EFFECT_SEARCH_CARDS,
    TARGET_CARD,
    TARGET_ENEMY,
    TARGET_MINION,
    TRAIT_ELITE,
    TRAIT_TEMPORAL,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Amo del tiempo modular encounter set', () => {
    const SET = 'master-of-time';
    const KANG_NAME = 'Kang (Amo del tiempo)';

    const getFixture = async ({side = 1} = {}) => {
        const catalog = await loadCatalog();
        const encounterSet = catalog.sets.find(({_id}) => _id === SET);
        const thor = catalog.heroes.find(({_id}) => _id === 'thor');
        assert.ok(encounterSet);
        assert.ok(thor);

        const match = new Match({
            mc: {
                mcSocket: {
                    send() {},
                },
            },
            name: 'master-of-time-set-test',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(thor.config);
        const player = match.createPlayer({
            name: 'Thor',
            superhero,
            initial: true,
        });
        player.initPlayer();
        superhero.selectedSide = side;
        player.gameZone.refresh = async () => {};
        player.refresh = async () => {};
        player.hand.refresh = async () => {};
        superhero.refresh = async () => {};
        superhero.sides.forEach(heroSide => {
            heroSide.refresh = async () => {};
        });

        const scenario = {
            match,
            name: encounterSet.config.name,
        };
        scenario.deck = new Deck({
            owner: scenario,
            isScenarioDeck: true,
        });
        scenario.deck.refresh = async () => {};
        scenario.drawEncounterCards = count => scenario.deck.draw(count);
        scenario.gameZone = new ScenarioZone({owner: scenario});
        scenario.gameZone.refresh = async () => {};
        scenario.zones = [scenario.gameZone];
        scenario.searchCard = condition =>
            scenario.zones
                .flatMap(zone => zone.searchCards(condition))
                .find(Boolean);
        scenario.searchCards = condition =>
            scenario.zones.flatMap(zone => zone.searchCards(condition));
        match.scenario = scenario;
        match.openDialog = async ({data}) =>
            data?.cards?.length ? {selected: data.cards[0]} : {};

        const getCardEntry = name =>
            encounterSet.config.cards.find(({card}) => card.params.name === name);
        const createCard = (name, owner) =>
            matchFactory.cardsFactory.createGameCardFromConfig(
                getCardEntry(name).card,
                {owner}
            );
        const createEncounterCard = (name, boost = 0) =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_TREACHERY,
                params: {
                    name,
                    set: SET,
                    image: 'sets/master-of-time/test.png',
                    boost,
                },
            }, {owner: scenario});

        return {
            catalog,
            createCard,
            createEncounterCard,
            encounterSet,
            getCardEntry,
            match,
            matchFactory,
            player,
            scenario,
            thor,
        };
    };

    test('registers the printed cards, counts, stats, traits, keywords, and images', async () => {
        const {encounterSet, getCardEntry} = await getFixture();
        const entries = encounterSet.config.cards;

        assert.equal(encounterSet.config.name, 'Amo del tiempo');
        assert.equal(encounterSet.config.standard, false);
        assert.deepEqual(
            entries.map(({count, card}) => [card.params.image, count]),
            [
                ['sets/master-of-time/11047.png', 1],
                ['sets/master-of-time/11048.png', 2],
                ['sets/master-of-time/11049.png', 2],
                ['sets/master-of-time/11050.png', 1],
                ['sets/master-of-time/11051.png', 2],
            ]
        );

        const kang = getCardEntry(KANG_NAME).card;
        assert.equal(kang.type, CARD_TYPE_MINION);
        assert.deepEqual(kang.params.traits, [TRAIT_ELITE, TRAIT_TEMPORAL]);
        assert.deepEqual(
            {
                attack: kang.params.attack,
                scheme: kang.params.scheme,
                hitPoints: kang.params.hitPoints,
                boost: kang.params.boost,
            },
            {attack: 1, scheme: 1, hitPoints: 6, boost: 2}
        );
        assert.deepEqual(kang.params.keywords, {
            toughness: true,
            villainous: true,
        });

        const soldier = getCardEntry('Soldado de otra época').card;
        assert.deepEqual(soldier.params.traits, [TRAIT_ELITE, TRAIT_TEMPORAL]);
        assert.deepEqual(
            {
                attack: soldier.params.attack,
                scheme: soldier.params.scheme,
                hitPoints: soldier.params.hitPoints,
                boost: soldier.params.boost,
            },
            {attack: 2, scheme: 1, hitPoints: 3, boost: 0}
        );
        assert.deepEqual(soldier.params.keywords, {incite: 1, surge: true});
        assert.equal(soldier.params.boostAbility.type, ABILITY_BOOST);
        assert.equal(
            soldier.params.boostAbility.params.effect.type,
            EFFECT_DEAL_ENCOUNTER
        );

        const obligation = getCardEntry('Miedo a Kang').card;
        assert.equal(obligation.type, CARD_TYPE_OBLIGATION);
        assert.deepEqual(obligation.params.traits, [TRAIT_TEMPORAL]);
        assert.equal(obligation.params.boost, 2);

        const sideScheme = getCardEntry('La esfera con la luz de los siglos').card;
        assert.equal(sideScheme.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(sideScheme.params.startingThreat, 3);
        assert.equal(sideScheme.params.boost, 3);

        const treachery = getCardEntry('Antigua rencilla').card;
        assert.equal(treachery.type, CARD_TYPE_TREACHERY);
        assert.equal(treachery.params.boost, 1);
    });

    test('compiles each printed and Boost ability into a runnable effect or validation', async () => {
        const {encounterSet, matchFactory} = await getFixture();

        encounterSet.config.cards.forEach(({card}) => {
            const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(card);

            gameCard.abilities.forEach(ability => {
                if (ability.effect) {
                    assert.equal(typeof ability.effect.canRun, 'function');
                }
                if (ability.validation) {
                    assert.equal(typeof ability.validation.isInvalidTarget, 'function');
                }
            });
            if (gameCard.boostAbility) {
                assert.equal(typeof gameCard.boostAbility.effect.canRun, 'function');
            }
        });

        const kang = matchFactory.cardsFactory.createGameCardFromConfig(
            encounterSet.config.cards[0].card
        );
        assert.equal(kang.abilities[0].effect.effectType, EFFECT_MODIFY_ATTACK_VALUE);
        assert.equal(kang.abilities[1].effect.effectType, EFFECT_MODIFY_SCHEME_VALUE);

        const sphere = matchFactory.cardsFactory.createGameCardFromConfig(
            encounterSet.config.cards[3].card
        );
        assert.equal(sphere.abilities[0].abilityType, ABILITY_WHEN_DEFEATED);
        assert.equal(sphere.abilities[0].effect.effectType, EFFECT_CHAINED);
        assert.equal(sphere.abilities[0].effect.effects[0].effectType, EFFECT_DISCARD_UNTIL);
        assert.equal(sphere.abilities[0].effect.effects[1].effectType, EFFECT_ENGAGE);

        const grudge = matchFactory.cardsFactory.createGameCardFromConfig(
            encounterSet.config.cards[4].card
        );
        assert.equal(grudge.abilities[0].abilityType, ABILITY_WHEN_REVEALED);
        assert.equal(grudge.abilities[0].effect.effectType, EFFECT_DO_IF_CARD_GAME);
        assert.equal(grudge.abilities[0].effect.effect.effectType, EFFECT_ACTIVATE);
        assert.equal(grudge.abilities[0].effect.effect.target, TARGET_ENEMY);
        assert.equal(grudge.abilities[0].effect.effectNot.effectType, EFFECT_CHAINED);
        const searchKang = grudge.abilities[0].effect.effectNot.effects[0];
        assert.equal(searchKang.effectType, EFFECT_SEARCH_CARDS);
        assert.deepEqual(searchKang.filter, {name: KANG_NAME});
        assert.equal(searchKang.firstMatch, false);
        assert.equal(grudge.abilities[0].effect.effectNot.effects[1].effectType, EFFECT_ENGAGE);
        assert.equal(
            grudge.abilities[0].effect.effectNot.effects[1].cardSource,
            'selectedCards'
        );
    });

    test('Kang gains one ATQ and PLA per obligation and Fear only blocks its owner’s attacks', async () => {
        const {
            createCard,
            getCardEntry,
            match,
            matchFactory,
            player,
            scenario,
            thor,
        } = await getFixture();
        const kang = createCard(KANG_NAME, scenario);
        kang.controller = player;
        kang.engaged = player;
        player.engage(kang);
        await kang.initTriggers();

        assert.equal(await kang.getAttackValue({match, player}), 1);
        assert.equal(await kang.getSchemeValue({match, player}), 1);

        const obligation = createCard('Miedo a Kang', player);
        obligation.controller = player;
        player.gameZone.addToGameZone(obligation);
        await obligation.initTriggers();

        assert.equal(await kang.getAttackValue({match, player}), 2);
        assert.equal(await kang.getSchemeValue({match, player}), 2);

        const secondObligation = createCard('Miedo a Kang', player);
        secondObligation.controller = player;
        player.gameZone.addToGameZone(secondObligation);
        await secondObligation.initTriggers();

        assert.equal(await kang.getAttackValue({match, player}), 3);
        assert.equal(await kang.getSchemeValue({match, player}), 3);

        const otherSuperhero = matchFactory.createSuperhero(thor.config);
        const otherPlayer = match.createPlayer({
            name: 'Otro jugador',
            superhero: otherSuperhero,
        });
        otherPlayer.initPlayer();
        otherPlayer.gameZone.refresh = async () => {};
        otherPlayer.refresh = async () => {};
        otherPlayer.hand.refresh = async () => {};

        const attackEffect = new DealDamageEffect({
            match,
            target: TARGET_MINION,
            damage: 1,
            isAttack: true,
        });
        const createNamedMinion = name => {
            const kangConfig = getCardEntry(KANG_NAME).card;
            const config = {
                ...kangConfig,
                params: {
                    ...kangConfig.params,
                    name,
                },
            };

            return matchFactory.cardsFactory.createGameCardFromConfig(
                config,
                {owner: scenario}
            );
        };
        const kangVariants = [
            createNamedMinion('Kang (Rama-Tut)'),
            createNamedMinion('Kang (Iron Lad)'),
        ];
        const nonKang = createNamedMinion('Kangaroo');
        for (const minion of [...kangVariants, nonKang]) {
            minion.controller = player;
            minion.engaged = player;
            player.engage(minion);
            await minion.initTriggers();
        }

        const ownerAttackTargets = attackEffect.getValidTarget({match, player});
        for (const target of [kang, ...kangVariants]) {
            assert.equal(ownerAttackTargets.includes(target), false);
        }
        assert.equal(ownerAttackTargets.includes(nonKang), true);

        const otherPlayerAttackTargets = attackEffect.getValidTarget({
            match,
            player: otherPlayer,
        });
        for (const target of [kang, ...kangVariants]) {
            assert.equal(otherPlayerAttackTargets.includes(target), true);
        }

        const damageEffect = new DealDamageEffect({
            match,
            target: TARGET_MINION,
            damage: 1,
        });
        const ownerDamageTargets = damageEffect.getValidTarget({match, player});
        for (const target of [kang, ...kangVariants]) {
            assert.equal(ownerDamageTargets.includes(target), true);
        }
    });

    test('the Alter Ego action discards a random hand card and then the obligation', async () => {
        const {createCard, match, player} = await getFixture({side: 0});
        const obligation = createCard('Miedo a Kang', player);
        obligation.controller = player;
        player.gameZone.addToGameZone(obligation);
        await obligation.initTriggers();

        const [handCard] = player.deck.cards;
        assert.ok(handCard);
        player.deck.removeCardFromDeck(handCard);
        player.hand.addCard(handCard);

        const action = obligation.abilities.find(({name}) =>
            name.startsWith('Descarta una carta al azar'));
        assert.ok(action);
        await action.resolveAbility({card: obligation, match, player});

        assert.equal(player.hand.cards.includes(handCard), false);
        assert.equal(player.gameZone.cards.includes(obligation), false);
    });

    test('defeating the sphere puts the discarded minion into play engaged with the defeating player', async () => {
        const {
            createCard,
            match,
            player,
            scenario,
        } = await getFixture();
        const sphere = createCard(
            'La esfera con la luz de los siglos',
            scenario
        );
        sphere.controller = scenario;
        scenario.gameZone.addToGameZone(sphere);
        await sphere.initTriggers();

        const kang = createCard(KANG_NAME, scenario);
        scenario.deck.cards = [kang];

        const defeatEffect = new DefeatEffect({
            match,
            selectedTarget: sphere,
            target: TARGET_CARD,
        });
        await defeatEffect.runEffect({match, player, card: sphere});

        assert.equal(defeatEffect.defeated, true);
        assert.equal(player.minions.includes(kang), true);
        assert.equal(kang.engaged, player);
        assert.equal(scenario.deck.discardPile.includes(kang), false);
    });

    test('Old Grudge finds and engages Kang when he is absent', async () => {
        const absentFixture = await getFixture();
        const {
            createCard,
            match,
            player,
            scenario,
        } = absentFixture;
        const grudge = createCard('Antigua rencilla', scenario);
        const kang = createCard(KANG_NAME, scenario);
        scenario.deck.cards = [kang];

        await grudge.abilities[0].resolveAbility({card: grudge, match, player});

        assert.equal(player.minions.includes(kang), true);
        assert.equal(kang.engaged, player);
        assert.equal(scenario.deck.cards.includes(kang), false);
        assert.equal(scenario.deck.discardPile.includes(kang), false);
    });

    test('Old Grudge finds and engages Kang from the encounter discard pile', async () => {
        const {createCard, match, player, scenario} = await getFixture();
        const grudge = createCard('Antigua rencilla', scenario);
        const kang = createCard(KANG_NAME, scenario);
        scenario.deck.discardPile = [kang];

        await grudge.abilities[0].resolveAbility({card: grudge, match, player});

        assert.equal(player.minions.includes(kang), true);
        assert.equal(kang.engaged, player);
        assert.equal(scenario.deck.discardPile.includes(kang), false);
    });

    test('Old Grudge selects an in-play Kang and preserves the activation handler', async () => {
        const activeFixture = await getFixture();
        const activeKang = activeFixture.createCard(
            KANG_NAME,
            activeFixture.scenario
        );
        activeKang.controller = activeFixture.player;
        activeKang.engaged = activeFixture.player;
        activeFixture.player.engage(activeKang);
        await activeKang.initTriggers();
        const activeGrudge = activeFixture.createCard(
            'Antigua rencilla',
            activeFixture.scenario
        );
        const conditional = activeGrudge.abilities[0].effect;
        const activation = conditional.effect;
        let activated = false;
        activation.attack = async ({player}) => {
            activated = player === activeFixture.player &&
                activation.selectedTarget === activeKang;
        };
        const params = {
            match: activeFixture.match,
            player: activeFixture.player,
        };
        const matchingCard = conditional.checkCondition(params);

        assert.equal(matchingCard?.name, KANG_NAME);
        assert.equal(activation.effectType, EFFECT_ACTIVATE);
        await conditional.runEffect(params);

        assert.equal(activated, true);
    });

    test('the Soldier Boost ability deals one facedown encounter card to the revealing player', async () => {
        const {createCard, createEncounterCard, match, player, scenario} =
            await getFixture();
        const soldier = createCard('Soldado de otra época', scenario);
        const encounterCard = createEncounterCard('Carta boca abajo');
        scenario.deck.cards = [encounterCard];

        await soldier.boostAbility.resolveAbility({card: soldier, match, player});

        assert.equal(player.encounters.length, 1);
        assert.equal(player.encounters[0], encounterCard);
        assert.equal(scenario.deck.cards.length, 0);
    });
});
