import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_FORCED_INTERRUPT,
    CARD_TYPE_ALLY,
    CARD_TYPE_MINION,
    EFFECT_DEAL_ENCOUNTER,
    EFFECT_ENEMY_ATTACK,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_BOOST_ICONS,
    EFFECT_TOUGH,
    TARGET_ACTIVATION,
    TARGET_EFFECT,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOU,
    TRAIT_BADOON,
    TRIGGER_ENGAGE_HERO,
    TRIGGER_ENGAGE_PLAYER,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {Attack} from '../../src/activations/attack.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {ScenarioZone} from '../../src/model/match/scenario-zone.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {RevealEncounterEffect} from '../../src/effects/reveal-encounter-effect.js';
import {SchemeGameCard} from '../../src/model/cards/scheme-game-card.js';

describe('Banda Badoon modular encounter set', () => {
    const getFixture = async (heroSide = 1) => {
        const catalog = await loadCatalog();
        const set = catalog.sets.find(({_id}) => _id === 'band-of-badoon');
        const thor = catalog.heroes.find(({_id}) => _id === 'thor');
        assert.ok(set);
        assert.ok(thor);

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'band-of-badoon-test',
        });
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(thor.config);
        superhero.selectedSide = heroSide;
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
        match.openDialog = async ({data}) => {
            const card = data?.cards?.[0];

            return card ? {selected: {id: card.id}} : {};
        };

        const scenario = {
            match,
            name: set.config.name,
        };
        scenario.deck = new Deck({owner: scenario, isScenarioDeck: true});
        scenario.gameZone = new ScenarioZone({owner: scenario});
        scenario.gameZone.refresh = async () => {};
        match.scenario = scenario;

        return {
            cardsFactory: matchFactory.cardsFactory,
            match,
            player,
            scenario,
            set,
        };
    };

    const getEntry = (set, name) => {
        const entry = set.config.cards.find(({card}) =>
            card.params.name === name);
        assert.ok(entry, `Expected ${name} in Banda Badoon.`);

        return entry;
    };

    const createCard = (cardsFactory, scenario, set, name) =>
        cardsFactory.createGameCardFromConfig(
            getEntry(set, name).card,
            {owner: scenario}
        );

    const runBoostAbility = async ({
        activation,
        boostValue = 1,
        cardsFactory,
        match,
        player,
        scenario,
        set,
        name,
    }) => {
        const card = createCard(cardsFactory, scenario, set, name);
        const boostResolution = {boostValue};

        await card.boostAbility.resolveAbility({
            activation,
            card,
            effect: boostResolution,
            match,
            player,
        });

        return {boostResolution, card};
    };

    test('registers the printed cards, counts, traits, stats, and image order', async () => {
        const {set} = await getFixture();
        const entries = set.config.cards;

        assert.equal(set.config.name, 'Banda Badoon');
        assert.equal(set.config.standard, false);
        entries.forEach(entry => {
            assert.deepEqual(Object.keys(entry).sort(), ['card', 'count']);
            assert.equal(entry.card.params.set, 'band-of-badoon');
            assert.equal(entry.card.type, CARD_TYPE_MINION);
            assert.deepEqual(entry.card.params.traits, [TRAIT_BADOON]);
        });
        assert.deepEqual(
            entries.map(({count, card}) => [
                card.params.image,
                card.params.name,
                count,
            ]),
            [
                ['sets/band-of-badoon/16117.png', 'Asesino badoon', 2],
                ['sets/band-of-badoon/16118.png', 'Infantería badoon', 3],
                ['sets/band-of-badoon/16119.png', 'Lugarteniente badoon', 1],
                ['sets/band-of-badoon/16120.png', 'Centinela badoon', 2],
                ['sets/band-of-badoon/16121.png', 'Caudillo badoon', 2],
            ]
        );

        const stats = entries.map(({card}) => [
            card.params.attack,
            card.params.scheme,
            card.params.hitPoints,
            card.params.boost,
        ]);
        assert.deepEqual(stats, [
            [1, 1, 1, 0],
            [2, 2, 2, 0],
            [2, 2, 6, 1],
            [1, 1, 5, 1],
            [3, 1, 4, 0],
        ]);
    });

    test('compiles each printed and Boost ability into a runnable effect', async () => {
        const {cardsFactory, scenario, set} = await getFixture();

        for (const {card: config} of set.config.cards) {
            const card = cardsFactory.createGameCardFromConfig(config, {
                owner: scenario,
            });

            card.abilities.forEach(ability => {
                assert.ok(ability.effect);
                assert.equal(typeof ability.effect.canRun, 'function');
            });
            if (card.boostAbility) {
                assert.ok(card.boostAbility.effect);
                assert.equal(typeof card.boostAbility.effect.canRun, 'function');
            }
        }

        const assassin = getEntry(set, 'Asesino badoon').card;
        assert.equal(assassin.params.abilities[0].params.trigger, TRIGGER_ENGAGE_HERO);
        assert.equal(
            assassin.params.abilities[0].params.effect.type,
            EFFECT_ENEMY_ATTACK
        );
        assert.equal(
            assassin.params.abilities[0].params.effect.params.enemyType,
            TARGET_THIS
        );
        assert.equal(
            assassin.params.abilities[0].params.effect.params.target,
            TARGET_YOU
        );
        assert.equal(
            assassin.params.abilities[0].params.effect.params.attackModifier,
            2
        );

        const infantry = getEntry(set, 'Infantería badoon').card;
        assert.equal(
            infantry.params.abilities[0].type,
            ABILITY_FORCED_INTERRUPT
        );
        assert.equal(
            infantry.params.abilities[0].params.trigger,
            TRIGGER_ENGAGE_PLAYER
        );
        assert.equal(
            infantry.params.abilities[0].params.effect.type,
            EFFECT_DEAL_ENCOUNTER
        );

        const sentinel = getEntry(set, 'Centinela badoon').card;
        assert.deepEqual(sentinel.params.keywords, {retaliate: 1});
        assert.deepEqual(
            getEntry(set, 'Lugarteniente badoon').card.params.keywords,
            {patrol: true}
        );
        assert.equal(
            getEntry(set, 'Caudillo badoon').card.params.abilities[0]
                .params.trigger,
            TRIGGER_THIS_ATTACK
        );
    });

    test('Patrol blocks an engaged player from thwarting the main scheme, including with an ally', async () => {
        const {cardsFactory, player, scenario, set} = await getFixture();
        const minion = createCard(
            cardsFactory,
            scenario,
            set,
            'Lugarteniente badoon'
        );
        player.engage(minion);
        minion.engaged = player;

        const ally = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado de prueba',
                set: 'patrol-test',
                image: 'patrol-test.png',
                cost: 1,
                attack: 1,
                thwart: 1,
                hitPoints: 2,
                resources: [],
                traits: [],
            },
        }, {owner: player});
        ally.controller = player;
        const thwartAbility = ally.abilities.find(ability =>
            ability.isBasic && ability.isThwart);
        assert.ok(thwartAbility);

        const createScheme = isMainScheme => ({
            isCard: true,
            isScheme: true,
            isMainScheme,
            threat: 1,
            match: {hasCrisis: false},
            canRemoveThreat(options) {
                return SchemeGameCard.prototype.canRemoveThreat.call(this, options);
            },
            canThwart(targetPlayer, options) {
                return SchemeGameCard.prototype.canThwart.call(
                    this,
                    targetPlayer,
                    options
                );
            },
        });
        const mainScheme = createScheme(true);
        const sideScheme = createScheme(false);
        const activation = thwartAbility.effect.activation;
        const activationParams = {
            effect: thwartAbility.effect,
            player,
        };

        assert.equal(minion.patrol, true);
        assert.equal(player.hasPatrol, true);
        assert.equal(
            activation.filterTarget(mainScheme, activationParams),
            false
        );
        assert.equal(activation.filterTarget(sideScheme, activationParams), true);
        assert.equal(
            activation.filterTarget(mainScheme, {
                ...activationParams,
                player: {hasPatrol: false},
            }),
            true
        );

        player.removeEngaged(minion);
        minion.engaged = null;
        assert.equal(player.hasPatrol, false);
        assert.equal(activation.filterTarget(mainScheme, activationParams), true);
    });

    test('Boost abilities apply only their printed activation modifiers', async () => {
        const {cardsFactory, match, player, scenario, set} = await getFixture();
        const attack = {isAttack: true, keywords: {}};
        const {card: assassin} = await runBoostAbility({
            activation: {effect: attack},
            cardsFactory,
            match,
            player,
            scenario,
            set,
            name: 'Asesino badoon',
        });
        assert.deepEqual(attack.keywords, {
            ranged: true,
            overkill: true,
            piercing: true,
        });
        const scheme = {isScheme: true, keywords: {}};
        await runBoostAbility({
            activation: {effect: scheme},
            cardsFactory,
            match,
            player,
            scenario,
            set,
            name: 'Asesino badoon',
        });
        assert.deepEqual(scheme.keywords, {});
        assert.equal(assassin.boostAbility.effect.effect.effectType, EFFECT_MODIFY_ATTACK);
        assert.equal(
            assassin.boostAbility.effect.effect.target,
            TARGET_ACTIVATION
        );

        const lieutenantAttack = await runBoostAbility({
            activation: {effect: {isAttack: true}},
            cardsFactory,
            match,
            player,
            scenario,
            set,
            name: 'Lugarteniente badoon',
        });
        assert.equal(lieutenantAttack.boostResolution.boostValue, 1);
        const lieutenantScheme = await runBoostAbility({
            activation: {effect: {isScheme: true}},
            cardsFactory,
            match,
            player,
            scenario,
            set,
            name: 'Lugarteniente badoon',
        });
        assert.equal(lieutenantScheme.boostResolution.boostValue, 3);

        const chieftainAttack = await runBoostAbility({
            activation: {effect: {isAttack: true}},
            cardsFactory,
            match,
            player,
            scenario,
            set,
            name: 'Caudillo badoon',
        });
        assert.equal(chieftainAttack.boostResolution.boostValue, 3);
        const chieftainScheme = await runBoostAbility({
            activation: {effect: {isScheme: true}},
            cardsFactory,
            match,
            player,
            scenario,
            set,
            name: 'Caudillo badoon',
        });
        assert.equal(chieftainScheme.boostResolution.boostValue, 1);

        const villain = {
            tough: 0,
            toughStatusesGiven: 0,
            get isTough() {
                return this.tough > 0;
            },
            setTough() {
                this.toughStatusesGiven++;
                this.tough = 1;
            },
            async refresh() {},
        };
        scenario.villain = villain;
        const sentinelWithoutTough = await runBoostAbility({
            activation: {effect: {isAttack: true}},
            cardsFactory,
            match,
            player,
            scenario,
            set,
            name: 'Centinela badoon',
        });
        assert.equal(villain.tough, 1);
        assert.equal(villain.toughStatusesGiven, 1);
        assert.equal(sentinelWithoutTough.boostResolution.boostValue, 1);

        const sentinelWithTough = await runBoostAbility({
            activation: {effect: {isAttack: true}},
            cardsFactory,
            match,
            player,
            scenario,
            set,
            name: 'Centinela badoon',
        });
        assert.equal(villain.tough, 1);
        assert.equal(villain.toughStatusesGiven, 1);
        assert.equal(sentinelWithTough.boostResolution.boostValue, 3);

        assert.equal(
            sentinelWithTough.card.boostAbility.effect.effect.effectType,
            EFFECT_MODIFY_BOOST_ICONS
        );
        assert.equal(
            sentinelWithTough.card.boostAbility.effect.effect.count,
            2
        );
        assert.equal(
            sentinelWithTough.card.boostAbility.effect.effect.target,
            TARGET_EFFECT
        );
        assert.equal(
            sentinelWithTough.card.boostAbility.effect.effectNot.effectType,
            EFFECT_TOUGH
        );
        assert.equal(
            sentinelWithTough.card.boostAbility.effect.effectNot.target,
            TARGET_VILLAIN
        );
    });

    test('Infantería badoon interrupts in either identity only when it is the sole engaged minion', async () => {
        for (const heroSide of [0, 1]) {
            const {
                cardsFactory,
                match,
                player,
                scenario,
                set,
            } = await getFixture(heroSide);
            const encounterCard = {id: `encounter-${heroSide}`};
            const cardsToDeal = [encounterCard];
            const dealtCards = [];
            match.drawEncounterCards = async count =>
                cardsToDeal.splice(0, count);
            player.gameZone.dealEncounterCard = cards =>
                dealtCards.push(...cards);

            const infantry = createCard(
                cardsFactory,
                scenario,
                set,
                'Infantería badoon'
            );
            const engage = new EngageEffect({
                card: infantry,
                cardShownInRevealDialog: true,
                controller: scenario,
                match,
                selectedTarget: player,
                target: TARGET_YOU,
            });
            await engage.runEffect({match, player});

            assert.equal(player.gameZone.minions.includes(infantry), true);
            assert.deepEqual(dealtCards, [encounterCard]);
            assert.equal(cardsToDeal.length, 0);
        }

        const {cardsFactory, match, player, scenario, set} =
            await getFixture(0);
        const cardsToDeal = [{id: 'should-not-be-dealt'}];
        const dealtCards = [];
        match.drawEncounterCards = async count =>
            cardsToDeal.splice(0, count);
        player.gameZone.dealEncounterCard = cards =>
            dealtCards.push(...cards);
        player.engage({engaged: player, isMinion: true});

        const infantry = createCard(
            cardsFactory,
            scenario,
            set,
            'Infantería badoon'
        );
        const engage = new EngageEffect({
            card: infantry,
            cardShownInRevealDialog: true,
            controller: scenario,
            match,
            selectedTarget: player,
            target: TARGET_YOU,
        });
        await engage.runEffect({match, player});

        assert.deepEqual(dealtCards, []);
        assert.equal(cardsToDeal.length, 1);
    });

    test('Infantería badoon waits until the revealed minion finishes its When Revealed abilities', async () => {
        const {cardsFactory, match, player, scenario, set} =
            await getFixture();
        const resolutionOrder = [];
        match.drawEncounterCards = async () => {
            resolutionOrder.push('engagement interrupt');

            return [{id: 'facedown-encounter'}];
        };
        const infantry = createCard(
            cardsFactory,
            scenario,
            set,
            'Infantería badoon'
        );
        Object.defineProperty(infantry, 'faceTo', {value: TARGET_YOU});
        infantry.abilities.push({
            isWhenRevealed: true,
            isValidIdentity: () => true,
            resolved: false,
            async initTriggers() {},
            toObj() {
                return {};
            },
            async resolveAbility() {
                resolutionOrder.push('when revealed');
                this.resolved = true;
            },
        });

        const reveal = new RevealEncounterEffect({
            card: infantry,
            match,
            player,
        });
        await reveal.runEffect({match, player});

        assert.deepEqual(resolutionOrder, [
            'when revealed',
            'engagement interrupt',
        ]);
    });

    test('Asesino badoon Forced Response attacks its engaged Hero for the printed bonus', async () => {
        const {cardsFactory, match, player, scenario, set} =
            await getFixture();
        const assassin = createCard(
            cardsFactory,
            scenario,
            set,
            'Asesino badoon'
        );
        const engage = new EngageEffect({
            card: assassin,
            cardShownInRevealDialog: true,
            controller: scenario,
            match,
            selectedTarget: player,
            target: TARGET_YOU,
        });

        await engage.runEffect({match, player});

        assert.equal(player.superhero.currentSide.damage, 3);
        assert.equal(assassin.isInPlay, true);

        const {
            cardsFactory: alterEgoCardsFactory,
            match: alterEgoMatch,
            player: alterEgoPlayer,
            scenario: alterEgoScenario,
            set: alterEgoSet,
        } = await getFixture(0);
        const alterEgoAssassin = createCard(
            alterEgoCardsFactory,
            alterEgoScenario,
            alterEgoSet,
            'Asesino badoon'
        );
        const alterEgoEngage = new EngageEffect({
            card: alterEgoAssassin,
            cardShownInRevealDialog: true,
            controller: alterEgoScenario,
            match: alterEgoMatch,
            selectedTarget: alterEgoPlayer,
            target: TARGET_YOU,
        });

        await alterEgoEngage.runEffect({
            match: alterEgoMatch,
            player: alterEgoPlayer,
        });

        assert.notEqual(alterEgoPlayer.isHero, true);
        assert.equal(alterEgoPlayer.superhero.currentSide.damage, 0);
    });

    test('Caudillo badoon attacks gain Overkill', async () => {
        const {cardsFactory, match, player, scenario, set} =
            await getFixture();
        const chieftain = createCard(
            cardsFactory,
            scenario,
            set,
            'Caudillo badoon'
        );
        chieftain.controller = scenario;
        scenario.gameZone.addToGameZone(chieftain);
        await chieftain.initTriggers();

        const attackEffect = new EnemyAttackEffect({
            enemy: chieftain,
            match,
            selectedTarget: player,
        });
        const attack = new Attack({effect: attackEffect});
        await attackEffect.triggerInit(
            attackEffect.getTriggersParams({player})
        );

        assert.equal(attack.effect.overkill, true);
        assert.equal(
            chieftain.abilities[0].effect.effectType,
            EFFECT_MODIFY_ATTACK
        );
    });
});
