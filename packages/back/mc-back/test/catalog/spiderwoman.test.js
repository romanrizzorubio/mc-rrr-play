import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_RESOURCE,
    ABILITY_RESPONSE,
    ABILITY_WHEN_REVEALED,
    ASPECT_IDS,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    CARD_TYPE_MINION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    CLASSIFICATION_JUSTICE,
    CLASSIFICATION_LEADERSHIP,
    CLASSIFICATION_PROTECTION,
    EFFECT_ADD_TRAIT,
    EFFECT_CHAINED,
    EFFECT_ASSIGN_THREAT,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_HEAL,
    EFFECT_LASTING,
    EFFECT_LOOK_AT_TOP_CARDS,
    EFFECT_MOVE_TO_HAND,
    EFFECT_MODIFY_HAND_SIZE,
    EFFECT_PLACE_THREAT,
    EFFECT_SEARCH_CARDS,
    EFFECT_READY,
    EFFECT_REMOVE_THREAT,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_TOUGH,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_DECK,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ENEMY,
    TARGET_ALL_CHARACTERS,
    TARGET_ALL_SCHEMES,
    TARGET_EFFECT,
    TARGET_ENGAGED,
    TARGET_HERO,
    TARGET_MINION,
    TARGET_PARENT,
    TARGET_ROUND,
    TARGET_SIDE_SCHEME,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_YOU,
    TIME_ROUND,
    TRAIT_AERIAL,
    TRAIT_AVENGER,
    TRAIT_ATTACK,
    TRAIT_CONDITION,
    TRAIT_ELITE,
    TRAIT_HYDRA,
    TRAIT_LOCATION,
    TRAIT_SUPERPOWER,
    TRAIT_SKILL,
    TRIGGER_GET_HAND_SIZE,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_THWARTS,
    TRIGGER_YOU_END_PLAY_CARD,
    TRIGGER_YOU_PLAY_CARD,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {HeroResourceAbility} from '../../src/abilities/resource/hero-resource-ability.js';
import {Attack} from '../../src/activations/attack.js';
import {Thwart} from '../../src/activations/thwart.js';
import {Engine} from '../../src/engine/engine.js';
import {checkCondition} from '../../src/engine/utils.js';
import {Effect} from '../../src/effects/effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PlayRoundEffect} from '../../src/effects/play-round-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {TriggersFactory} from '../../src/factory/triggers/triggers-factory.js';
import {Hand} from '../../src/model/match/hand.js';
import {Player} from '../../src/model/match/player.js';

const createSpiderwoman = async () => {
    const catalog = await loadCatalog();
    const hero = catalog.heroes.find(({_id}) => _id === 'spiderwoman');
    const match = {
        currentRound: 1,
        lasting: [],
        limits: {},
        players: [],
        scenario: {},
        triggerCards: {},
        async openDialog(dialog) {
            this.dialogs.push(dialog);
        },
        dialogs: [],
    };
    const cardsFactory = new CardsFactory({match});
    match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;

    const alterEgo = cardsFactory.createGameCardFromConfig(hero.config.sides[0]);
    const spiderwoman = cardsFactory.createGameCardFromConfig(hero.config.sides[1]);
    const player = {
        isPlayer: true,
        isAlterEgo: true,
        isHero: false,
        match,
        superhero: alterEgo,
    };
    match.players.push(player);

    return {
        catalog,
        hero,
        match,
        player,
        cardsFactory,
        alterEgo,
        spiderwoman,
    };
};

describe('Spiderwoman', () => {
    test('defines the supplied identities, deckbuilding rule, and precon cards', async () => {
        const {catalog, hero} = await createSpiderwoman();
        const aspectCards = new Map(catalog.aspects.map(card => [card._id, card.card]));
        const preconCards = hero.config.precon.flatMap(({aspect, classification, cardRefs}) =>
            cardRefs.map(({id, count}) => ({
                category: aspect || classification,
                name: aspectCards.get(id).params.name,
                count,
            })));

        assert.deepEqual(hero.config.deckBuildingRules, {
            aspectCount: 2,
            equalAspectCardCounts: true,
        });
        assert.equal(hero.config.cards.length, 8);
        assert.equal(hero.config.sides[0].params.name, 'Jessica Drew');
        assert.equal(hero.config.sides[0].params.recovery, 3);
        assert.equal(hero.config.sides[0].params.handSize, 6);
        assert.equal(hero.config.sides[0].params.hitPoints, 11);
        assert.equal(hero.config.sides[1].params.name, 'Spiderwoman');
        assert.equal(hero.config.sides[1].params.thwart, 1);
        assert.equal(hero.config.sides[1].params.attack, 1);
        assert.equal(hero.config.sides[1].params.defense, 1);
        assert.equal(hero.config.sides[1].params.handSize, 5);
        assert.equal(hero.config.sides[1].params.hitPoints, 11);
        assert.deepEqual(
            preconCards.map(({category, name, count}) => [category, name, count]),
            [
                [CLASSIFICATION_BASIC, 'Energía', 1],
                [CLASSIFICATION_BASIC, 'Fuerza', 1],
                [CLASSIFICATION_BASIC, 'Genio', 1],
                [CLASSIFICATION_AGGRESSION, 'Aprovechar la ventaja', 3],
                [CLASSIFICATION_AGGRESSION, 'Golpe imparable', 3],
                [CLASSIFICATION_AGGRESSION, 'Entrenamiento de combate', 2],
                [CLASSIFICATION_AGGRESSION, 'Unidad táctica', 2],
                [CLASSIFICATION_AGGRESSION, 'Spidergirl', 1],
                [CLASSIFICATION_JUSTICE, 'Intuición heróica', 2],
                [CLASSIFICATION_JUSTICE, 'Sala de interrogatorios', 2],
                [CLASSIFICATION_JUSTICE, 'Spiderman', 1],
                [CLASSIFICATION_JUSTICE, 'Investigador sagaz', 3],
                [CLASSIFICATION_JUSTICE, 'Despejar la zona', 3],
            ],
        );
        assert.equal(
            hero.config.precon[0].classification,
            CLASSIFICATION_BASIC,
        );
        assert.equal(Object.hasOwn(hero.config.precon[0], 'aspect'), false);
        const basicCard = catalog.aspects.find(({_id}) => _id === 'basic-energy');
        assert.equal(basicCard.classification, CLASSIFICATION_BASIC);
        assert.equal(Object.hasOwn(basicCard, 'aspect'), false);
        const aspectCard = catalog.aspects.find(({_id}) =>
            _id === 'aggression-entrenamiento-de-combate');
        assert.equal(aspectCard.aspect, 'aggression');
    });

    test('defines Viper and its nemesis side scheme', async () => {
        const {hero} = await createSpiderwoman();
        const viper = hero.config.nemesis.find(({card}) =>
            card.params.name === 'Víbora');
        const ambition = hero.config.nemesis.find(({card}) =>
            card.params.name === 'La ambición de Víbora');

        assert.ok(viper);
        assert.equal(viper.count, 1);
        assert.equal(viper.card.type, CARD_TYPE_MINION);
        assert.deepEqual(viper.card.params.traits, [TRAIT_ELITE, TRAIT_HYDRA]);
        assert.equal(viper.card.params.unique, true);
        assert.equal(viper.card.params.attack, 2);
        assert.equal(viper.card.params.scheme, 2);
        assert.equal(viper.card.params.hitPoints, 5);
        assert.equal(viper.card.params.boost, 3);
        assert.equal(viper.card.params.nemesis, true);
        assert.equal(
            viper.card.params.abilities[0].params.trigger,
            TRIGGER_GET_HAND_SIZE,
        );
        assert.equal(
            viper.card.params.abilities[0].params.triggerParams.target,
            TARGET_ENGAGED,
        );
        assert.equal(
            viper.card.params.abilities[0].params.effect.type,
            EFFECT_MODIFY_HAND_SIZE,
        );
        assert.equal(
            viper.card.params.abilities[0].params.effect.params.target,
            TARGET_EFFECT,
        );
        assert.equal(viper.card.params.abilities[0].params.effect.params.count, -1);

        assert.ok(ambition);
        assert.equal(ambition.count, 1);
        assert.equal(ambition.card.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.equal(ambition.card.params.boost, 2);
        assert.equal(ambition.card.params.startingThreat, 2);
        assert.equal(
            ambition.card.params.abilities[0].type,
            ABILITY_WHEN_REVEALED,
        );
        assert.deepEqual(
            ambition.card.params.abilities[0].params.effect,
            {
                type: EFFECT_PLACE_THREAT,
                params: {
                    target: TARGET_THIS,
                    threat: [1, true],
                },
            },
        );
    });

    test('includes Tropa de Hydra and ¡Hail, Hydra! in the nemesis set', async () => {
        const {hero} = await createSpiderwoman();
        const hydraTroop = hero.config.nemesis.find(({card}) =>
            card.params.name === 'Tropa de Hydra');
        const hailHydra = hero.config.nemesis.find(({card}) =>
            card.params.name === '¡Hail, Hydra!');

        assert.ok(hydraTroop);
        assert.equal(hydraTroop.count, 2);
        assert.equal(hydraTroop.card.type, CARD_TYPE_MINION);
        assert.equal(hydraTroop.card.params.set, 'Spiderwoman');
        assert.equal(hydraTroop.card.params.nemesis, undefined);

        assert.ok(hailHydra);
        assert.equal(hailHydra.count, 1);
        assert.equal(hailHydra.card.type, CARD_TYPE_TREACHERY);
        assert.equal(hailHydra.card.params.set, 'Spiderwoman');
    });

    test('Viper reduces only the hand size of the player it is engaged with', async () => {
        const {hero, match, cardsFactory} = await createSpiderwoman();
        const [viperEntry] = hero.config.nemesis;
        const engagedHero = cardsFactory.createGameCardFromConfig(
            hero.config.sides[1],
        );
        const otherHero = cardsFactory.createGameCardFromConfig(
            hero.config.sides[1],
        );
        const engagedPlayer = new Player({
            name: 'Engaged player',
            superhero: engagedHero,
        });
        const otherPlayer = new Player({
            name: 'Other player',
            superhero: otherHero,
        });
        match.players = [engagedPlayer, otherPlayer];
        const viper = cardsFactory.createGameCardFromConfig(
            viperEntry.card,
            {owner: match.scenario},
        );
        viper.engaged = engagedPlayer;
        await viper.initTriggers({player: engagedPlayer});

        assert.equal(await engagedPlayer.getHandSize(), 4);
        assert.equal(await otherPlayer.getHandSize(), 5);

        viper.engaged = otherPlayer;
        assert.equal(await engagedPlayer.getHandSize(), 5);
        assert.equal(await otherPlayer.getHandSize(), 4);

        viper.engaged = null;
        assert.equal(await engagedPlayer.getHandSize(), 5);
        assert.equal(await otherPlayer.getHandSize(), 5);

        viper.endTriggers();
    });

    test('La ambición de Víbora places one threat per player when revealed', async () => {
        const {hero, match, cardsFactory} = await createSpiderwoman();
        const playerHero = cardsFactory.createGameCardFromConfig(
            hero.config.sides[1],
        );
        const otherHero = cardsFactory.createGameCardFromConfig(
            hero.config.sides[1],
        );
        const player = new Player({name: 'Player', superhero: playerHero});
        const otherPlayer = new Player({
            name: 'Other player',
            superhero: otherHero,
        });
        const schemeEntry = hero.config.nemesis.find(({card}) =>
            card.params.name === 'La ambición de Víbora');
        const scheme = cardsFactory.createGameCardFromConfig(
            schemeEntry.card,
            {owner: match.scenario},
        );
        scheme.initScheme();
        scheme.refresh = () => {};
        match.players = [player, otherPlayer];
        match.numPlayers = match.players.length;

        await scheme.abilities[0].resolveAbility({player, card: scheme});

        assert.equal(scheme.abilities[0].resolved, true);
        assert.equal(scheme.abilities[0].effect.resolved, true);
        assert.equal(scheme.abilities[0].effect.selectedTarget, scheme);
        assert.equal(scheme.threat, 4);
    });

    test('Rayo venenoso is a fixed Spiderwoman Aggression attack event', async () => {
        const {hero, player, cardsFactory} = await createSpiderwoman();
        const entry = hero.config.cards.find(({card}) =>
            card.params.name === 'Rayo venenoso');
        assert.ok(entry);
        assert.equal(entry.count, 2);

        const venomBlast = cardsFactory.createGameCardFromConfig(
            entry.card,
            {owner: player},
        );
        const [ability] = venomBlast.abilities;

        assert.equal(venomBlast.card.type, CARD_TYPE_EVENT);
        assert.equal(venomBlast.name, 'Rayo venenoso');
        assert.equal(venomBlast.card.set, 'Spiderwoman');
        assert.equal(venomBlast.card.image, 'heroes/spiderwoman/04035.png');
        assert.equal(venomBlast.card.cost, 2);
        assert.deepEqual(venomBlast.card.resources, [RESOURCE_ENERGY]);
        assert.deepEqual(
            venomBlast.card.traits,
            [TRAIT_ATTACK, TRAIT_SUPERPOWER],
        );
        assert.deepEqual(
            venomBlast.card.classification,
            [CLASSIFICATION_HERO, CLASSIFICATION_AGGRESSION],
        );
        assert.equal(checkCondition(
            {card: venomBlast.card},
            {'card.classification': CLASSIFICATION_HERO},
        ), true);
        assert.equal(checkCondition(
            {card: venomBlast.card},
            {'card.classification': CLASSIFICATION_AGGRESSION},
        ), true);
        assert.equal(checkCondition(
            {card: venomBlast.card},
            {'card.classification': 'justice'},
        ), false);
        assert.equal(entry.card.params.abilities[0].type, ABILITY_HERO_ACTION);
        assert.equal(ability.isAttack, true);
        assert.deepEqual(ability.labels, [LABEL_ATTACK]);
        assert.equal(ability.effect.effectType, EFFECT_DEAL_DAMAGE);
        assert.equal(ability.effect.target, TARGET_ENEMY);
        assert.equal(ability.effect.baseDamage, 5);
        assert.equal(typeof ability.effect.canRun, 'function');
    });

    test('Spidergirl stuns and confuses a minion after you play her', async () => {
        const {catalog, hero, match, player, cardsFactory} =
            await createSpiderwoman();
        const entry = catalog.aspects.find(({_id}) =>
            _id === 'aggression-spidergirl');
        assert.ok(entry);
        assert.equal(entry.aspect, CLASSIFICATION_AGGRESSION);
        assert.equal(
            hero.config.precon
                .find(({aspect}) => aspect === CLASSIFICATION_AGGRESSION)
                .cardRefs.find(({id}) => id === entry._id).count,
            1,
        );
        assert.equal(
            hero.config.cards.some(({card}) =>
                card.params.name === 'Spidergirl'),
            false,
        );

        const spidergirl = cardsFactory.createGameCardFromConfig(
            entry.card,
            {owner: player},
        );
        spidergirl.controller = player;
        const ability = spidergirl.abilities.find(candidate =>
            candidate.condition?.['effect.card.name'] === 'Spidergirl');
        assert.ok(ability);
        const minion = {
            id: 'minion',
            isConfused: false,
            isStunned: false,
            confuse() {
                this.isConfused = true;
            },
            refresh() {},
            stun() {
                this.isStunned = true;
            },
        };
        match.minions = [minion];

        assert.equal(spidergirl.card.type, CARD_TYPE_ALLY);
        assert.equal(spidergirl.name, 'Spidergirl');
        assert.equal(spidergirl.card.subtitle, 'Anya Corazon');
        assert.equal(spidergirl.card.image, 'aspect/aggression/allies/04040.png');
        assert.equal(spidergirl.card.set, CLASSIFICATION_AGGRESSION);
        assert.deepEqual(spidergirl.card.traits, [TRAIT_AVENGER]);
        assert.equal(spidergirl.card.unique, true);
        assert.equal(spidergirl.card.cost, 2);
        assert.deepEqual(spidergirl.card.resources, [RESOURCE_ENERGY]);
        assert.equal(spidergirl.card.classification, CLASSIFICATION_AGGRESSION);
        assert.equal(spidergirl.card.hitPoints, 2);
        assert.equal(spidergirl.card.attack, 2);
        assert.equal(spidergirl.card.attackConsequential, 1);
        assert.equal(spidergirl.card.thwart, 1);
        assert.equal(spidergirl.card.thwartConsequential, 1);
        assert.equal(entry.card.params.abilities[0].type, ABILITY_RESPONSE);
        assert.equal(ability.trigger, TRIGGER_YOU_END_PLAY_CARD);
        assert.deepEqual(ability.condition, {
            'effect.card.name': 'Spidergirl',
        });
        assert.equal(ability.effect.effectType, EFFECT_SIMULTANEOUS);
        assert.equal(ability.effect.target, TARGET_MINION);
        assert.deepEqual(
            ability.effect.effects.map(effect => effect.effectType),
            [EFFECT_STUN, EFFECT_CONFUSE],
        );
        assert.ok(ability.effect.effects.every(effect =>
            effect.target === TARGET_MINION &&
            typeof effect.canRun === 'function'));
        assert.equal(typeof ability.effect.canRun, 'function');

        const playEffect = new PlayCardEffect({card: spidergirl, match});
        playEffect.resolved = true;
        const playParams = playEffect.getTriggersParams({player});
        const trigger = new TriggersFactory(match).createTrigger({
            ability,
            card: spidergirl,
            type: ability.trigger,
        });
        const otherCard = cardsFactory.createGameCardFromConfig(
            hero.config.cards.find(({card}) =>
                card.params.name === 'Rayo venenoso').card,
            {owner: player},
        );
        const otherPlayEffect = new PlayCardEffect({
            card: otherCard,
            match,
        });
        otherPlayEffect.resolved = true;
        const otherPlayParams = otherPlayEffect.getTriggersParams({player});

        assert.ok(
            playEffect.getTriggersEnds(playParams)
                .includes(TRIGGER_YOU_END_PLAY_CARD),
        );
        assert.equal(await trigger.canTrigger(playParams), true);
        assert.equal(await trigger.canTrigger(otherPlayParams), false);
        assert.equal(await trigger.canTrigger({
            ...playParams,
            player: {isPlayer: true},
        }), false);

        await trigger.runTrigger(playParams);

        assert.equal(minion.isStunned, true);
        assert.equal(minion.isConfused, true);
    });

    test('Spiderman removes threat from a side scheme after you play him', async () => {
        const {catalog, hero, match, player, cardsFactory} =
            await createSpiderwoman();
        const entry = catalog.aspects.find(({_id}) =>
            _id === 'justice-spiderman');
        assert.ok(entry);
        assert.equal(entry.aspect, CLASSIFICATION_JUSTICE);
        assert.equal(
            hero.config.precon
                .find(({aspect}) => aspect === CLASSIFICATION_JUSTICE)
                .cardRefs.find(({id}) => id === entry._id).count,
            1,
        );

        const spiderman = cardsFactory.createGameCardFromConfig(
            entry.card,
            {owner: player},
        );
        spiderman.controller = player;
        const ability = spiderman.abilities.find(candidate =>
            candidate.condition?.['effect.card.name'] === 'Spiderman');
        assert.ok(ability);
        assert.equal(spiderman.card.type, CARD_TYPE_ALLY);
        assert.equal(spiderman.name, 'Spiderman');
        assert.equal(spiderman.card.subtitle, 'Peter Parker');
        assert.equal(spiderman.card.image, 'aspect/justice/allies/04045.png');
        assert.equal(spiderman.card.set, CLASSIFICATION_JUSTICE);
        assert.deepEqual(spiderman.card.traits, [TRAIT_AVENGER]);
        assert.equal(spiderman.card.unique, true);
        assert.equal(spiderman.card.cost, 5);
        assert.deepEqual(spiderman.card.resources, [RESOURCE_MENTAL]);
        assert.equal(spiderman.card.classification, CLASSIFICATION_JUSTICE);
        assert.equal(spiderman.card.hitPoints, 4);
        assert.equal(spiderman.card.attack, 2);
        assert.equal(spiderman.card.attackConsequential, 1);
        assert.equal(spiderman.card.thwart, 2);
        assert.equal(spiderman.card.thwartConsequential, 1);
        assert.equal(entry.card.params.abilities[0].type, ABILITY_RESPONSE);
        assert.equal(ability.trigger, TRIGGER_YOU_END_PLAY_CARD);
        assert.deepEqual(ability.condition, {
            'effect.card.name': 'Spiderman',
        });
        assert.equal(ability.effect.effectType, EFFECT_REMOVE_THREAT);
        assert.equal(ability.effect.target, TARGET_SIDE_SCHEME);
        assert.deepEqual(ability.effect.baseThreat, [3, true]);
        assert.equal(typeof ability.effect.canRun, 'function');

        const sideScheme = {
            threat: 8,
            canRemoveThreat() {
                return this.threat > 0;
            },
            removeThreat(threat) {
                this.threat -= threat;
            },
            refresh() {},
        };
        match.sideSchemes = [sideScheme];
        match.players.push({});
        match.numPlayers = match.players.length;

        const playEffect = new PlayCardEffect({card: spiderman, match});
        playEffect.resolved = true;
        const playParams = playEffect.getTriggersParams({player});
        const trigger = new TriggersFactory(match).createTrigger({
            ability,
            card: spiderman,
            type: ability.trigger,
        });
        const otherCard = cardsFactory.createGameCardFromConfig(
            hero.config.cards.find(({card}) =>
                card.params.name === 'Rayo venenoso').card,
            {owner: player},
        );
        const otherPlayEffect = new PlayCardEffect({
            card: otherCard,
            match,
        });
        otherPlayEffect.resolved = true;
        const otherPlayParams = otherPlayEffect.getTriggersParams({player});

        assert.ok(
            playEffect.getTriggersEnds(playParams)
                .includes(TRIGGER_YOU_END_PLAY_CARD),
        );
        assert.equal(await trigger.canTrigger(playParams), true);
        assert.equal(await trigger.canTrigger(otherPlayParams), false);

        await trigger.runTrigger(playParams);

        assert.equal(sideScheme.threat, 2);
    });

    test('Feromonas stuns and confuses the same enemy as a fixed Leadership event', async () => {
        const {hero, match, player, cardsFactory, spiderwoman} =
            await createSpiderwoman();
        player.isAlterEgo = false;
        player.isHero = true;
        player.superhero = spiderwoman;
        const entry = hero.config.cards.find(({card}) =>
            card.params.name === 'Feromonas');
        assert.ok(entry);
        assert.equal(entry.count, 2);

        const pheromones = cardsFactory.createGameCardFromConfig(
            entry.card,
            {owner: player},
        );
        const [ability] = pheromones.abilities;
        const enemy = {
            id: 'enemy',
            isConfused: false,
            isStunned: false,
            confuse() {
                this.isConfused = true;
            },
            refresh() {},
            stun() {
                this.isStunned = true;
            },
        };
        match.enemies = [enemy];

        assert.equal(pheromones.card.type, CARD_TYPE_EVENT);
        assert.equal(pheromones.name, 'Feromonas');
        assert.equal(pheromones.card.image, 'heroes/spiderwoman/04036.png');
        assert.equal(pheromones.card.set, 'Spiderwoman');
        assert.deepEqual(pheromones.card.traits, [TRAIT_SUPERPOWER]);
        assert.equal(pheromones.card.cost, 2);
        assert.deepEqual(pheromones.card.resources, [RESOURCE_PHYSICAL]);
        assert.deepEqual(
            pheromones.card.classification,
            [CLASSIFICATION_HERO, CLASSIFICATION_LEADERSHIP],
        );
        assert.equal(
            entry.card.params.abilities[0].type,
            ABILITY_HERO_ACTION,
        );
        assert.equal(ability.effect.effectType, EFFECT_SIMULTANEOUS);
        assert.equal(ability.effect.target, TARGET_ENEMY);
        assert.deepEqual(
            ability.effect.effects.map(effect => effect.effectType),
            [EFFECT_STUN, EFFECT_CONFUSE],
        );
        assert.ok(ability.effect.effects.every(effect =>
            effect.target === TARGET_ENEMY &&
            typeof effect.canRun === 'function'));
        assert.equal(typeof ability.effect.canRun, 'function');

        const prepared = await ability.prepareToResolve({
            card: pheromones,
            player,
        });
        assert.equal(prepared.canRun, true);
        assert.equal(ability.effect.selectedTarget, enemy);

        await ability.resolveAbility({
            card: pheromones,
            player,
            ...prepared,
        });

        assert.equal(enemy.isStunned, true);
        assert.equal(enemy.isConfused, true);
    });

    test('Inmunidad a toxinas heals and gives Tough to Spiderwoman only', async () => {
        const {hero, match, player, cardsFactory} = await createSpiderwoman();
        player.isAlterEgo = false;
        player.isHero = true;
        const spiderwomanCharacter = {
            abilities: [],
            canHeal: true,
            damage: 5,
            id: 'spiderwoman',
            isPlayerCard: true,
            isInPlay: true,
            isTough: false,
            mainName: 'Spiderwoman',
            name: 'Spiderwoman',
            set: 'Spiderwoman',
            get currentSide() {
                return this;
            },
            healDamage(damage) {
                this.damage = Math.max(0, this.damage - damage);
            },
            async refresh() {},
            setTough() {
                this.isTough = true;
            },
        };
        const otherCharacter = {
            abilities: [],
            canHeal: true,
            damage: 2,
            id: 'captain-marvel',
            isInPlay: true,
            isTough: false,
            name: 'Capitana Marvel',
            get currentSide() {
                return this;
            },
            healDamage(damage) {
                this.damage = Math.max(0, this.damage - damage);
            },
            async refresh() {},
            setTough() {
                this.isTough = true;
            },
        };
        player.superhero = spiderwomanCharacter;
        match.heroes = [
            player,
            {
                isHero: true,
                superhero: otherCharacter,
            },
        ];

        const entry = hero.config.cards.find(({card}) =>
            card.params.name === 'Inmunidad a toxinas');
        assert.ok(entry);
        assert.equal(entry.count, 2);

        const toxinImmunity = cardsFactory.createGameCardFromConfig(
            entry.card,
            {owner: player},
        );
        const [ability] = toxinImmunity.abilities;
        const namedCharacter = {name: 'Spiderwoman'};

        assert.equal(toxinImmunity.card.type, CARD_TYPE_EVENT);
        assert.equal(toxinImmunity.name, 'Inmunidad a toxinas');
        assert.equal(toxinImmunity.card.image, 'heroes/spiderwoman/04037.png');
        assert.equal(toxinImmunity.card.set, 'Spiderwoman');
        assert.deepEqual(toxinImmunity.card.traits, [TRAIT_SUPERPOWER]);
        assert.equal(toxinImmunity.card.cost, 2);
        assert.deepEqual(toxinImmunity.card.resources, [RESOURCE_ENERGY]);
        assert.deepEqual(
            toxinImmunity.card.classification,
            [CLASSIFICATION_HERO, CLASSIFICATION_PROTECTION],
        );
        assert.equal(
            entry.card.params.abilities[0].type,
            ABILITY_HERO_ACTION,
        );
        assert.equal(ability.effect.effectType, EFFECT_SIMULTANEOUS);
        assert.equal(ability.effect.target, TARGET_HERO);
        assert.deepEqual(ability.effect.condition, namedCharacter);
        assert.deepEqual(
            ability.effect.effects.map(effect => effect.effectType),
            [EFFECT_HEAL, EFFECT_TOUGH],
        );
        assert.ok(ability.effect.effects.every(effect =>
            effect.target === TARGET_HERO &&
            typeof effect.canRun === 'function'));
        assert.equal(ability.effect.effects[0].damage, 3);
        assert.ok(ability.effect.effects.every(effect =>
            effect.condition.name === 'Spiderwoman'));
        assert.equal(typeof ability.effect.canRun, 'function');

        await ability.resolveAbility({
            card: toxinImmunity,
            player,
        });

        assert.equal(spiderwomanCharacter.damage, 2);
        assert.equal(spiderwomanCharacter.isTough, true);
        assert.equal(otherCharacter.damage, 2);
        assert.equal(otherCharacter.isTough, false);
    });

    test('Sutileza generates a wild resource only for Aspect cards in hero form', async () => {
        const {catalog, hero, player, cardsFactory, spiderwoman} =
            await createSpiderwoman();
        const sutilezaEntry = hero.config.cards.find(({card}) =>
            card.params.name === 'Sutileza');
        assert.ok(sutilezaEntry);
        assert.equal(sutilezaEntry.count, 2);

        const sutileza = cardsFactory.createGameCardFromConfig(
            sutilezaEntry.card,
            {owner: player},
        );
        sutileza.controller = player;
        player.isAlterEgo = false;
        player.isHero = true;

        const ability = sutileza.abilities[0];
        assert.equal(sutileza.card.type, CARD_TYPE_UPGRADE);
        assert.equal(sutileza.name, 'Sutileza');
        assert.equal(
            sutilezaEntry.card.params.abilities[0].type,
            ABILITY_HERO_RESOURCE,
        );
        assert.equal(sutileza.card.image, 'heroes/spiderwoman/04033.png');
        assert.equal(sutileza.card.set, 'Spiderwoman');
        assert.deepEqual(sutileza.card.traits, [TRAIT_CONDITION]);
        assert.equal(sutileza.card.cost, 2);
        assert.equal(sutileza.card.classification, CLASSIFICATION_HERO);
        assert.ok(ability instanceof HeroResourceAbility);
        assert.equal(ability.resource, RESOURCE_WILD);
        assert.deepEqual(
            ability.condition,
            ASPECT_IDS.map(classification => ({
                'cardToPay.card.classification': classification,
            })),
        );
        assert.equal(ability.arrow.cost.effectType, EFFECT_EXHAUST);
        assert.equal(ability.arrow.cost.target, TARGET_THIS);
        assert.equal(typeof ability.arrow.cost.canRun, 'function');

        let arrowChecks = 0;
        ability.arrow.canPay = async () => {
            arrowChecks++;

            return true;
        };

        const aggressionEntry = catalog.aspects.find(({_id}) =>
            _id === 'aggression-entrenamiento-de-combate');
        assert.ok(aggressionEntry);
        const aggressionCard = cardsFactory.createGameCardFromConfig(
            aggressionEntry.card,
            {owner: player},
        );
        assert.equal(aggressionCard.card.classification, 'aggression');
        assert.equal(
            await sutileza.hasResourceGenerators(aggressionCard, RESOURCE_WILD),
            true,
        );
        const venomBlastEntry = hero.config.cards.find(({card}) =>
            card.params.name === 'Rayo venenoso');
        assert.ok(venomBlastEntry);
        const venomBlast = cardsFactory.createGameCardFromConfig(
            venomBlastEntry.card,
            {owner: player},
        );
        assert.equal(
            await sutileza.hasResourceGenerators(venomBlast, RESOURCE_WILD),
            true,
        );
        const basicCard = catalog.aspects.find(({_id}) => _id === 'basic-energy');
        assert.ok(basicCard);
        const basicGameCard = cardsFactory.createGameCardFromConfig(
            basicCard.card,
            {owner: player},
        );
        for (const cardToPay of [basicGameCard, spiderwoman]) {
            assert.equal(
                await sutileza.hasResourceGenerators(cardToPay, RESOURCE_WILD),
                false,
            );
        }
        assert.equal(basicGameCard.card.classification, CLASSIFICATION_BASIC);
        assert.equal(spiderwoman.card.classification, CLASSIFICATION_HERO);
        assert.equal(arrowChecks, 2);

        player.isAlterEgo = true;
        player.isHero = false;
        assert.equal(
            await sutileza.hasResourceGenerators(aggressionCard, RESOURCE_WILD),
            false,
        );
        assert.equal(arrowChecks, 2);
    });

    test('Capitana Marvel is a fixed ally with a response after her basic attack or thwart', async () => {
        const {hero, match, player, cardsFactory} = await createSpiderwoman();
        const [captainMarvelEntry] = hero.config.cards;
        const captainMarvel = cardsFactory.createGameCardFromConfig(
            captainMarvelEntry.card,
            {owner: player},
        );
        const attackResponse = captainMarvel.abilities.find(ability =>
            ability.trigger === TRIGGER_THIS_ATTACK);
        const thwartResponse = captainMarvel.abilities.find(ability =>
            ability.trigger === TRIGGER_THIS_THWARTS);
        const triggersFactory = new TriggersFactory(match);

        assert.equal(captainMarvelEntry.count, 1);
        assert.equal(captainMarvel.card.type, CARD_TYPE_ALLY);
        assert.equal(captainMarvel.name, 'Capitana Marvel');
        assert.equal(captainMarvel.card.subtitle, 'Carol Danvers');
        assert.equal(captainMarvel.card.image, 'heroes/spiderwoman/04032.png');
        assert.equal(captainMarvel.card.set, 'Spiderwoman');
        assert.deepEqual(captainMarvel.card.traits, [TRAIT_AVENGER]);
        assert.equal(captainMarvel.card.unique, true);
        assert.equal(captainMarvel.card.cost, 4);
        assert.equal(captainMarvel.card.classification, CLASSIFICATION_HERO);
        assert.deepEqual(captainMarvel.card.resources, [RESOURCE_WILD]);
        assert.equal(captainMarvel.card.hitPoints, 3);
        assert.equal(captainMarvel.card.attack, 2);
        assert.equal(captainMarvel.card.attackConsequential, 1);
        assert.equal(captainMarvel.card.thwart, 2);
        assert.equal(captainMarvel.card.thwartConsequential, 1);
        assert.ok(captainMarvelEntry.card.params.abilities.every(
            ability => ability.type === ABILITY_RESPONSE,
        ));
        assert.ok(attackResponse);
        assert.ok(thwartResponse);
        for (const ability of [attackResponse, thwartResponse]) {
            assert.equal(ability.effect.effectType, EFFECT_DRAW_CARD);
            assert.equal(ability.effect.target, TARGET_YOU);
            assert.equal(ability.effect.count, 1);
            assert.equal(typeof ability.effect.canRun, 'function');
            assert.deepEqual(ability.condition, {
                'effect.ability.isBasic': true,
            });
        }

        const createActivation = (character, isBasic, isAttack) => {
            const effect = {
                ability: {isBasic},
                character,
                isAttack,
                isThwart: !isAttack,
                match,
            };
            const activation = isAttack ?
                new Attack({effect}) :
                new Thwart({effect});
            const params = activation.getTriggersParams({
                effect,
                match,
                player,
            });

            return {activation, params};
        };
        const createTrigger = ability => triggersFactory.createTrigger({
            ability,
            card: captainMarvel,
            type: ability.trigger,
        });
        const basicAttack = createActivation(captainMarvel, true, true);
        const nonBasicAttack = createActivation(captainMarvel, false, true);
        const otherCharacterAttack = createActivation(
            {id: 'another-character'},
            true,
            true,
        );
        const basicThwart = createActivation(captainMarvel, true, false);
        const nonBasicThwart = createActivation(captainMarvel, false, false);
        const cardsToDraw = [
            {id: 'draw-after-attack'},
            {id: 'draw-after-thwart'},
        ];
        player.deck = {
            async draw(count) {
                return cardsToDraw.splice(0, count);
            },
        };
        player.hand = {
            cards: [],
            addCards(cards) {
                this.cards.push(...cards);
            },
            async refresh() {},
        };

        assert.ok(
            basicAttack.activation.getTriggersEnds(basicAttack.params)
                .includes(TRIGGER_THIS_ATTACK),
        );
        assert.ok(
            basicThwart.activation.getTriggersEnds(basicThwart.params)
                .includes(TRIGGER_THIS_THWARTS),
        );
        const attackTrigger = createTrigger(attackResponse);
        assert.equal(
            await attackTrigger.canTrigger(basicAttack.params),
            true,
        );
        await attackTrigger.runTrigger(basicAttack.params);
        assert.deepEqual(player.hand.cards, [{id: 'draw-after-attack'}]);
        assert.equal(
            Boolean(await createTrigger(attackResponse).canTrigger(nonBasicAttack.params)),
            false,
        );
        assert.equal(
            Boolean(await createTrigger(attackResponse).canTrigger(otherCharacterAttack.params)),
            false,
        );
        const thwartTrigger = createTrigger(thwartResponse);
        assert.equal(
            await thwartTrigger.canTrigger(basicThwart.params),
            true,
        );
        await thwartTrigger.runTrigger(basicThwart.params);
        assert.deepEqual(player.hand.cards, [
            {id: 'draw-after-attack'},
            {id: 'draw-after-thwart'},
        ]);
        assert.equal(
            Boolean(await createTrigger(thwartResponse).canTrigger(nonBasicThwart.params)),
            false,
        );
    });

    test('Agilidad sobrehumana checks the played aspect and grants all three stats for the round', async () => {
        const {catalog, match, player, cardsFactory, spiderwoman} =
            await createSpiderwoman();
        const createPlayContext = cardConfig => {
            const card = cardsFactory.createCard(cardConfig);
            const gameCard = cardsFactory.createGameCard({card, owner: player});
            const effect = new PlayCardEffect({card: gameCard, match});

            return effect.getTriggersParams({player});
        };
        const aggressionPlay = createPlayContext(catalog.aspects.find(({_id}) =>
            _id === 'aggression-entrenamiento-de-combate').card);
        const basicPlay = createPlayContext(catalog.aspects.find(({_id}) =>
            _id === 'basic-energy').card);
        const justicePlay = createPlayContext(catalog.aspects.find(({_id}) =>
            _id === 'justice-interrogation-room').card);
        const aspectAbilities = spiderwoman.abilities.filter(ability =>
            typeof ability.condition?.['effect.card.card.classification'] === 'string');
        const aggressionAbility = aspectAbilities.find(ability =>
            ability.condition?.['effect.card.card.classification'] === 'aggression');
        const justiceAbility = aspectAbilities.find(ability =>
            ability.condition?.['effect.card.card.classification'] === 'justice');

        spiderwoman.refresh = async () => {};
        player.isAlterEgo = false;
        player.isHero = true;
        player.superhero = spiderwoman;

        assert.equal(aspectAbilities.length, 5);
        assert.equal(
            new Set(aspectAbilities.map(ability => ability.id)).size,
            5,
        );
        assert.deepEqual(
            aspectAbilities.map(ability =>
                ability.condition?.['effect.card.card.classification']),
            ASPECT_IDS,
        );
        assert.ok(aspectAbilities.every(ability =>
            ability.trigger === TRIGGER_YOU_PLAY_CARD &&
            ability.effect?.effectType === EFFECT_LASTING &&
            typeof ability.effect.canRun === 'function'));
        assert.equal(aggressionPlay.effect.card.card.classification, 'aggression');
        assert.equal(basicPlay.effect.card.card.classification, CLASSIFICATION_BASIC);
        assert.equal(await aggressionAbility.canTrigger(aggressionPlay), true);
        assert.equal(await aggressionAbility.canTrigger(basicPlay), false);
        assert.equal(await justiceAbility.canTrigger(justicePlay), true);

        await aggressionAbility.resolveAbility(aggressionPlay);

        assert.equal(spiderwoman.modifyThwart, 1);
        assert.equal(spiderwoman.modifyAttack, 1);
        assert.equal(spiderwoman.modifyDefense, 1);
        assert.equal(aggressionAbility.limit.used, 1);
        assert.equal(await aggressionAbility.canTrigger(aggressionPlay), false);
        assert.equal(await justiceAbility.canTrigger(justicePlay), true);

        new Effect({match}).endLimit(TARGET_ROUND);
        assert.equal(aggressionAbility.limit.used, 0);
        assert.equal(await aggressionAbility.canTrigger(aggressionPlay), true);
    });

    test('Jessica Drew looks at the top card of a chosen deck without moving it', async () => {
        const {alterEgo, match, player} = await createSpiderwoman();
        const topCard = {
            id: 'player-top-card',
            toObj: () => ({id: 'player-top-card'}),
        };
        const playerDeck = {
            id: 'player-deck',
            isPlayerDeck: true,
            cards: [topCard],
            markKnown(cards) {
                this.knownCards = cards;
            },
            async refresh() {},
        };
        const encounterDeck = {
            id: 'encounter-deck',
            isScenarioDeck: true,
            cards: [],
        };
        const ability = alterEgo.abilities.find(candidate =>
            candidate.effect?.effectType === EFFECT_LOOK_AT_TOP_CARDS);

        player.deck = playerDeck;
        match.scenario.deck = encounterDeck;

        assert.equal(ability.name, 'Consultar la carta superior de un mazo');
        assert.equal(ability.toObj().name, 'Consultar la carta superior de un mazo');
        assert.equal(ability.effect.effectType, EFFECT_LOOK_AT_TOP_CARDS);
        assert.equal(ability.effect.getTargetSelectionMode(), 'deck');
        assert.equal(await ability.canRun({player}), true);
        const validDecks = await ability.effect.getValidTarget({player});
        assert.deepEqual(validDecks.map(deck => deck.id), [
            playerDeck.id,
        ]);

        ability.effect.selectedTarget = playerDeck;
        await ability.effect.execute({player});

        assert.deepEqual(playerDeck.knownCards, [topCard]);
        assert.equal(playerDeck.cards[0], topCard);
        assert.equal(match.dialogs[0].data.cards[0].id, topCard.id);
        assert.equal(ability.limit.target, TARGET_ROUND);

        ability.useLimit();
        assert.equal(await ability.canRun({player}), false);
        new Effect({match}).endLimit(TARGET_ROUND);
        assert.equal(await ability.canRun({player}), true);
    });

    test('Apartamento de Jessica Drew searches the top five cards for an Aspect card', async () => {
        const {catalog, hero, match, player, cardsFactory} =
            await createSpiderwoman();
        match.name = 'test-match';
        player.name = 'Jessica Drew';

        const apartmentEntry = hero.config.cards.find(({card}) =>
            card.params.name === 'Apartamento de Jessica Drew');
        assert.ok(apartmentEntry);
        assert.equal(apartmentEntry.count, 1);

        const apartment = cardsFactory.createGameCardFromConfig(
            apartmentEntry.card,
            {owner: player},
        );
        apartment.controller = player;
        apartment.refresh = async () => {};
        player.gameZone = {
            cards: [apartment],
            async refresh() {},
        };

        const entryFor = id => catalog.aspects.find(entry => entry._id === id);
        const deckCards = [
            'basic-energy',
            'aggression-entrenamiento-de-combate',
            'basic-strength',
            'justice-interrogation-room',
            'basic-genius',
            'aggression-tac-team',
        ].map(id => {
            const entry = entryFor(id);
            assert.ok(entry, `expected ${id} in the Aspect catalog`);

            return cardsFactory.createGameCardFromConfig(
                entry.card,
                {owner: player},
            );
        });
        const [
            basicEnergy,
            aggressionCard,
            basicStrength,
            justiceCard,
            basicGenius,
            aspectCardBeyondTopFive,
        ] = deckCards;
        const selectedCard = justiceCard;
        let searchOptions;
        let shuffleCount = 0;
        player.deck = {
            cards: deckCards,
            discardPile: [],
            markKnown(cards) {
                this.knownCards = cards;
            },
            shuffle() {
                assert.equal(this.cards.includes(selectedCard), false);
                shuffleCount++;
                this.cards.reverse();
            },
            async searchDeck(card) {
                this.cards.splice(this.cards.indexOf(card), 1);
            },
            searchDiscard() {},
            async refresh() {},
        };
        player.hand = {
            cards: [],
            addCard(card) {
                this.cards.push(card);
            },
            async refresh() {},
        };
        match.openDialog = async dialog => {
            searchOptions = dialog.data.cards;
            const selected = searchOptions.find(({id}) =>
                id === selectedCard.id);

            return {selected: selected ? [selected] : []};
        };

        const [ability] = apartment.abilities;
        const [search, moveToHand] = ability.effect.effects;

        assert.equal(apartment.card.type, CARD_TYPE_SUPPORT);
        assert.equal(apartment.name, 'Apartamento de Jessica Drew');
        assert.equal(apartment.card.image, 'heroes/spiderwoman/04034.png');
        assert.equal(apartment.card.set, 'Spiderwoman');
        assert.equal(apartment.card.unique, true);
        assert.deepEqual(apartment.card.traits, [TRAIT_LOCATION]);
        assert.equal(apartment.card.cost, 1);
        assert.deepEqual(apartment.card.resources, [RESOURCE_PHYSICAL]);
        assert.equal(apartment.card.classification, CLASSIFICATION_HERO);
        assert.equal(
            apartmentEntry.card.params.abilities[0].type,
            ABILITY_ALTEREGO_ACTION,
        );
        assert.equal(ability.arrow.cost.effectType, EFFECT_EXHAUST);
        assert.equal(ability.arrow.cost.target, TARGET_THIS);
        assert.equal(ability.effect.effectType, EFFECT_CHAINED);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(search.effectType, EFFECT_SEARCH_CARDS);
        assert.deepEqual(search.locations, [PLACE_DECK]);
        assert.equal(search.topCount, 5);
        assert.deepEqual(
            search.filter,
            ASPECT_IDS.map(classification => ({
                'card.classification': classification,
            })),
        );
        assert.equal(moveToHand.effectType, EFFECT_MOVE_TO_HAND);
        assert.equal(moveToHand.target, TARGET_SOURCE);
        assert.equal(moveToHand.source, 'selectedCards');

        await ability.resolveAbility({match, player, card: apartment});

        assert.equal(apartment.exhausted, true);
        assert.deepEqual(
            searchOptions.map(({id}) => id),
            [aggressionCard.id, justiceCard.id],
        );
        assert.deepEqual(player.hand.cards, [selectedCard]);
        assert.equal(player.deck.cards.includes(selectedCard), false);
        assert.equal(shuffleCount, 1);
        assert.deepEqual(player.deck.cards, [
            aspectCardBeyondTopFive,
            basicGenius,
            basicStrength,
            aggressionCard,
            basicEnergy,
        ]);
    });

    test('Pasar desapercibida is a fixed Spiderwoman Justice thwart event', async () => {
        const {hero, player, cardsFactory} = await createSpiderwoman();
        const entry = hero.config.cards.find(({card}) =>
            card.params.name === 'Pasar desapercibida');
        assert.ok(entry);
        assert.equal(entry.count, 2);

        const card = cardsFactory.createGameCardFromConfig(
            entry.card,
            {owner: player},
        );
        const [ability] = card.abilities;

        assert.equal(card.card.type, CARD_TYPE_EVENT);
        assert.equal(card.name, 'Pasar desapercibida');
        assert.equal(card.card.set, 'Spiderwoman');
        assert.equal(card.card.image, 'heroes/spiderwoman/04038.png');
        assert.deepEqual(card.card.traits, [TRAIT_SKILL]);
        assert.equal(card.card.cost, 1);
        assert.deepEqual(card.card.resources, [RESOURCE_ENERGY]);
        assert.deepEqual(card.card.classification, [
            CLASSIFICATION_HERO,
            CLASSIFICATION_JUSTICE,
        ]);
        assert.equal(entry.card.params.abilities[0].type, ABILITY_HERO_ACTION);
        assert.deepEqual(ability.labels, [LABEL_THWART]);
        assert.equal(ability.effect.effectType, EFFECT_ASSIGN_THREAT);
        assert.equal(ability.effect.target, TARGET_ALL_SCHEMES);
        assert.equal(ability.effect.threat, 3);
        assert.equal(typeof ability.effect.canRun, 'function');
    });

    test('Planeo controlado readies Spiderwoman and grants Aerial until round end', async () => {
        const {alterEgo, catalog, hero, match, player, cardsFactory, spiderwoman} =
            await createSpiderwoman();
        const entry = hero.config.cards.find(({card}) =>
            card.params.name === 'Planeo controlado');
        assert.ok(entry);

        const card = cardsFactory.createGameCardFromConfig(
            entry.card,
            {owner: player},
        );
        const [ability] = card.abilities;
        const [readyEffect, lastingEffect] = ability.effect.effects;

        assert.equal(card.card.type, CARD_TYPE_EVENT);
        assert.equal(card.name, 'Planeo controlado');
        assert.equal(card.card.set, 'Spiderwoman');
        assert.equal(card.card.image, 'heroes/spiderwoman/04039.png');
        assert.deepEqual(card.card.traits, [TRAIT_SUPERPOWER]);
        assert.equal(card.card.cost, 1);
        assert.deepEqual(card.card.resources, [RESOURCE_MENTAL]);
        assert.equal(card.card.classification, CLASSIFICATION_HERO);
        assert.equal(entry.card.params.abilities[0].type, ABILITY_HERO_ACTION);
        assert.equal(ability.effect.effectType, EFFECT_CHAINED);
        assert.equal(ability.effect.target, TARGET_ALL_CHARACTERS);
        assert.deepEqual(ability.effect.condition, {name: 'Spiderwoman'});
        assert.deepEqual(
            ability.effect.effects.map(effect => effect.effectType),
            [EFFECT_READY, EFFECT_LASTING],
        );
        assert.equal(readyEffect.target, TARGET_PARENT);
        assert.equal(readyEffect.condition, undefined);
        assert.equal(lastingEffect.target, TARGET_PARENT);
        assert.equal(lastingEffect.condition, undefined);
        assert.equal(lastingEffect.until, TIME_ROUND);
        assert.equal(lastingEffect.effect.effectType, EFFECT_ADD_TRAIT);
        assert.equal(
            lastingEffect.effect.target,
            TARGET_PARENT,
        );
        assert.equal(lastingEffect.effect.condition, undefined);
        assert.equal(lastingEffect.effect.trait, TRAIT_AERIAL);
        assert.ok(
            [ability.effect, readyEffect, lastingEffect, lastingEffect.effect]
                .every(effect => typeof effect.canRun === 'function'),
        );
        assert.equal(typeof ability.effect.canRun, 'function');

        const captainMarvelConfig = catalog.heroes.find(({_id}) =>
            _id === 'captain-marvel').config.sides[1];
        const captainMarvel = cardsFactory.createGameCardFromConfig(
            captainMarvelConfig,
            {owner: player},
        );
        const spidergirlEntry = catalog.aspects.find(({_id}) =>
            _id === 'aggression-spidergirl');
        assert.ok(spidergirlEntry);
        const spidergirl = cardsFactory.createGameCardFromConfig(
            spidergirlEntry.card,
            {owner: player},
        );
        const refreshes = [];
        spiderwoman.owner = {
            isPlayer: true,
            async refresh() {
                refreshes.push({
                    target: 'Spiderwoman owner',
                    extraTraits: [...spiderwoman.extraTraits],
                });
            },
        };
        spiderwoman.refresh = async () => {
            refreshes.push({
                target: 'Spiderwoman side',
                extraTraits: [...spiderwoman.extraTraits],
            });
        };
        captainMarvel.refresh = async () => {};
        player.superhero = spiderwoman;
        match.enemies = [];
        match.friends = [spiderwoman, captainMarvel, spidergirl];

        player.isAlterEgo = false;
        player.isHero = true;
        match.heroes = [player];
        spiderwoman.exhausted = true;
        captainMarvel.exhausted = true;
        spidergirl.exhausted = true;

        const {playableTargetIds} = await new Hand(player).getPlayTargets(card);
        assert.ok(playableTargetIds.includes(spiderwoman.id));
        const faceTarget = (await ability.effect.getValidTarget({
            card,
            match,
            player,
        })).flat(Infinity)[0];
        assert.ok(faceTarget);
        assert.ok(playableTargetIds.includes(
            faceTarget.parent?.id ?? faceTarget.id
        ));
        assert.equal(playableTargetIds.includes(captainMarvel.id), false);
        assert.equal(playableTargetIds.includes(spidergirl.id), false);
        const invalidDrop = new PlayCardEffect({
            card,
            match,
            targetId: captainMarvel.id,
        });
        await assert.rejects(
            invalidDrop.preselectDroppedTarget({card, match, player}),
            /El objetivo seleccionado para jugar la carta ya no es válido/
        );

        player.superhero = alterEgo;
        player.isAlterEgo = true;
        player.isHero = false;
        match.heroes = [];
        const spiderwomanAlly = {
            abilities: [],
            id: 'spiderwoman-ally',
            isAlly: true,
            isInPlay: true,
            isPlayerCard: true,
            name: 'Spiderwoman',
            owner: player,
            set: 'Other player set',
        };
        match.friends = [
            alterEgo,
            captainMarvel,
            spidergirl,
            spiderwomanAlly,
        ];
        const {playableTargetIds: alterEgoTargetIds} =
            await new Hand(player).getPlayTargets(card);
        assert.deepEqual(alterEgoTargetIds, [spiderwomanAlly.id]);
        assert.deepEqual(
            await ability.effect.getValidTarget({
                card,
                match,
                player,
                playCardEffect: new PlayCardEffect({ability, card, match}),
            }),
            [spiderwomanAlly]
        );

        player.superhero = spiderwoman;
        player.isAlterEgo = false;
        player.isHero = true;
        match.heroes = [player];
        match.friends = [spiderwoman, captainMarvel, spidergirl];

        const prepared = await ability.prepareToResolve({
            card,
            player,
        });
        assert.equal(prepared.canRun, true);

        await ability.resolveAbility({
            card,
            player,
            ...prepared,
        });

        assert.equal(spiderwoman.exhausted, false);
        assert.equal(captainMarvel.exhausted, true);
        assert.equal(spidergirl.exhausted, true);
        assert.deepEqual(spiderwoman.extraTraits, [TRAIT_AERIAL]);
        assert.deepEqual(captainMarvel.extraTraits, []);
        assert.deepEqual(spidergirl.extraTraits, []);
        assert.deepEqual(refreshes.at(-1), {
            target: 'Spiderwoman owner',
            extraTraits: [TRAIT_AERIAL],
        });
        assert.equal(match.lasting.length, 1);
        assert.equal(match.lasting[0].until, TIME_ROUND);

        match.phase = 'villain';
        match.playing = true;
        match.persist = async () => {};
        match.refresh = async () => {};

        const previousRound = Engine.currentRound;
        const roundEffect = new PlayRoundEffect({match});
        roundEffect.villainPhase.runEffect = async () => {};
        roundEffect.endLimit = async () => {};

        try {
            await roundEffect.runEffect({player});
        } finally {
            Engine.currentRound = previousRound;
        }

        assert.deepEqual(spiderwoman.extraTraits, []);
        assert.deepEqual(refreshes.at(-1), {
            target: 'Spiderwoman owner',
            extraTraits: [],
        });
        assert.equal(match.lasting.length, 0);
    });

    test('drag target IDs include the visible parent of a superhero face', () => {
        const hand = new Hand({});
        const faceTarget = {
            id: 'spiderwoman-face',
            parent: {id: 'spiderwoman-card'},
        };

        assert.deepEqual(
            hand.getTargetIds([faceTarget]),
            ['spiderwoman-face', 'spiderwoman-card'],
        );
    });

    test('a dragged event resolves a superhero face by its parent card ID', async () => {
        const faceTarget = {
            id: 'spiderwoman-face',
            parent: {id: 'spiderwoman-card'},
        };
        const match = {};
        const effect = new Effect({
            match,
            target: TARGET_HERO,
        });
        effect.getValidTarget = () => [faceTarget];
        const card = {
            abilities: [{effect}],
            isEvent: true,
        };
        const playCardEffect = new PlayCardEffect({
            card,
            match,
            targetId: 'spiderwoman-card',
        });

        await playCardEffect.preselectDroppedTarget({
            card,
            match,
            player: {},
        });

        assert.strictEqual(effect.selectedTarget, faceTarget);
    });

    test('Planeo controlado is not available for Spidergirl as a referential target', async () => {
        const {catalog, hero, match, player, cardsFactory} =
            await createSpiderwoman();
        const entry = hero.config.cards.find(({card}) =>
            card.params.name === 'Planeo controlado');
        const spidergirlEntry = catalog.aspects.find(({_id}) =>
            _id === 'aggression-spidergirl');
        assert.ok(entry);
        assert.ok(spidergirlEntry);

        const card = cardsFactory.createGameCardFromConfig(
            entry.card,
            {owner: player},
        );
        const spidergirl = cardsFactory.createGameCardFromConfig(
            spidergirlEntry.card,
            {owner: player},
        );
        match.enemies = [];
        match.friends = [spidergirl];

        const prepared = await card.abilities[0].prepareToResolve({
            card,
            player,
        });

        assert.equal(prepared.canRun, false);
    });

    test('player snapshot includes Spiderwoman acquired Aerial trait', async () => {
        const {spiderwoman} = await createSpiderwoman();
        spiderwoman.extraTraits.push(TRAIT_AERIAL);
        spiderwoman.abilities = [];
        spiderwoman.getEffectiveTraits = async () => spiderwoman.traits;
        spiderwoman.getEffectiveStats = async () => ({});
        spiderwoman.getAttachedCards = () => [];

        const player = {
            superhero: spiderwoman,
            async canFlip() {
                return false;
            },
            async getHandSize() {
                return 5;
            },
            hand: {
                async toObjWithPlayability() {
                    return [];
                },
            },
            toObj() {
                return {
                    superhero: {
                        extraTraits: [...spiderwoman.extraTraits],
                    },
                };
            },
        };

        assert.equal(spiderwoman.card.traits.includes(TRAIT_AERIAL), false);
        assert.ok(spiderwoman.traits.includes(TRAIT_AERIAL));

        const snapshot = await Player.prototype.toObjWithPlayableHand.call(player);

        assert.deepEqual(snapshot.superhero.extraTraits, [TRAIT_AERIAL]);
    });
});
