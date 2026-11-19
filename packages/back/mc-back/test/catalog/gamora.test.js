import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_JUSTICE,
    CLASSIFICATION_PROTECTION,
    EFFECT_CANNOT_ATTACK,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DELAYED,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF,
    EFFECT_HEAL,
    EFFECT_ENGAGE,
    EFFECT_LOOK_AT_TOP_CARDS,
    EFFECT_MOVE_TO_HAND,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REMOVE_THREAT,
    EFFECT_SEARCH_CARDS,
    LABEL_ATTACK,
    LABEL_DEFENSE,
    LABEL_THWART,
    PLACE_DECK,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_DISCARD_PILE,
    RESOURCE_PHYSICAL,
    TARGET_ENEMY,
    TARGET_PHASE,
    TARGET_PLAYER_DECK,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ATTACK,
    TRAIT_GUARDIAN,
    TRAIT_OUTLAW,
    TRAIT_THWART,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_ENEMY_ATTACKS_YOU,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_YOU_END_PLAY_CARD,
} from 'mc-shared';
import {EVENTS} from 'mc-endpoints';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {checkCondition} from '../../src/engine/utils.js';
import {ActivationsFactory} from '../../src/factory/activations/activations-factory.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Player} from '../../src/model/match/player.js';

const createGamora = async () => {
    const catalog = await loadCatalog();
    const hero = catalog.heroes.find(({_id}) => _id === 'gamora');
    assert.ok(hero);

    const match = {
        currentRound: 1,
        dialogs: [],
        lasting: [],
        limits: {},
        mc: {mcSocket: {send() {}}},
        players: [],
        scenario: {deck: {}},
        triggerCards: {},
        async openDialog(dialog) {
            this.dialogs.push(dialog);
        },
    };
    const cardsFactory = new CardsFactory({match});
    match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;

    const [alterEgoConfig, heroConfig] = hero.config.sides;
    const alterEgo = cardsFactory.createGameCardFromConfig(alterEgoConfig);
    const gamora = cardsFactory.createGameCardFromConfig(heroConfig);
    const player = new Player({name: 'Gamora', superhero: alterEgo});
    match.players.push(player);

    return {
        alterEgo,
        cardsFactory,
        catalog,
        gamora,
        hero,
        match,
        player,
    };
};

const findFixedCard = (hero, name) =>
    hero.config.cards.find(({card}) => card.params.name === name);

const createFixedGameCard = (hero, cardsFactory, player, name) => {
    const entry = findFixedCard(hero, name);
    assert.ok(entry, `Missing fixed card "${name}".`);

    return {
        entry,
        gameCard: cardsFactory.createGameCardFromConfig(entry.card, {
            owner: player,
        }),
    };
};

describe('Gamora', () => {
    test('defines her identities, off-aspect rule, fixed cards, and supplied precon', async () => {
        const {catalog, hero} = await createGamora();
        const [alterEgo, gamora] = hero.config.sides;
        const aspectCards = new Map(catalog.aspects.map(({_id, card}) =>
            [_id, card]));

        assert.equal(alterEgo.type, CARD_TYPE_ALTEREGO);
        assert.equal(alterEgo.params.name, 'Gamora');
        assert.equal(alterEgo.params.recovery, 3);
        assert.equal(alterEgo.params.handSize, 6);
        assert.equal(alterEgo.params.hitPoints, 10);
        assert.deepEqual(alterEgo.params.traits, [TRAIT_OUTLAW]);
        assert.equal(gamora.type, CARD_TYPE_HERO);
        assert.deepEqual(gamora.params.traits, [TRAIT_GUARDIAN]);
        assert.deepEqual([
            gamora.params.thwart,
            gamora.params.attack,
            gamora.params.defense,
            gamora.params.handSize,
            gamora.params.hitPoints,
        ], [2, 2, 2, 5, 10]);
        assert.deepEqual(hero.config.deckBuildingRules.offAspectCards, {
            maxCount: 6,
            types: [CARD_TYPE_EVENT],
            traits: [TRAIT_ATTACK, TRAIT_THWART],
        });
        assert.equal(hero.config.cards.reduce((count, {count: copies}) =>
            count + copies, 0), 15);
        assert.deepEqual(
            hero.config.precon.flatMap(({aspect, classification, cardRefs}) =>
                cardRefs.map(({id, count}) => [
                    aspect || classification,
                    aspectCards.get(id)?.params.name,
                    count,
                ])),
            [
                [CLASSIFICATION_AGGRESSION, 'Gancho', 2],
                [CLASSIFICATION_AGGRESSION, 'Entrenamiento de combate', 2],
                [CLASSIFICATION_AGGRESSION, 'Angela', 1],
                [CLASSIFICATION_AGGRESSION, 'Vapuleo', 3],
                [CLASSIFICATION_AGGRESSION, 'Plan de ataque', 3],
                [CLASSIFICATION_AGGRESSION, 'Matadioses', 1],
                [CLASSIFICATION_PROTECTION, 'Primer impacto', 3],
                [CLASSIFICATION_JUSTICE, 'Cortar el paso', 3],
                [CLASSIFICATION_BASIC, 'Drax', 1],
                [CLASSIFICATION_BASIC, 'Ataque relámpago', 3],
                [CLASSIFICATION_BASIC, 'Energía', 1],
                [CLASSIFICATION_BASIC, 'Fuerza', 1],
                [CLASSIFICATION_BASIC, 'Genio', 1],
            ],
        );
        assert.equal(
            hero.config.precon.reduce((total, {cardRefs}) =>
                total + cardRefs.reduce((count, {count: copies}) =>
                    count + copies, 0), 0),
            25,
        );
        assert.equal(
            hero.config.cards.reduce((count, {count: copies}) =>
                count + copies, 0) +
            hero.config.precon.reduce((total, {cardRefs}) =>
                total + cardRefs.reduce((count, {count: copies}) =>
                    count + copies, 0), 0),
            40,
        );
    });

    test('registers the supplied cards with their expected runnable abilities', async () => {
        const {cardsFactory, catalog, hero, player} = await createGamora();
        const aspectCards = new Map(catalog.aspects.map(entry =>
            [entry._id, entry]));
        const cardIds = [
            'aggression-angela',
            'aggression-vapuleo',
            'aggression-plan-de-ataque',
            'protection-primer-impacto',
            'justice-cortar-el-paso',
            'aggression-matadioses',
            'basic-drax',
            'basic-ataque-relampago',
        ];
        const cards = new Map(cardIds.map(id => {
            const entry = aspectCards.get(id);
            assert.ok(entry, `Missing shared card "${id}".`);
            assert.equal(entry.count, undefined);
            const gameCard = cardsFactory.createGameCardFromConfig(
                entry.card,
                {owner: player},
            );
            assert.ok(gameCard.abilities.length > 0);

            return [id, {entry, gameCard}];
        }));

        assert.equal(hero.config.precon.flatMap(({cardRefs}) =>
            cardRefs.map(({id}) => id)).length, 13);

        const angela = cards.get('aggression-angela').gameCard;
        const angelaConfig = cards.get('aggression-angela').entry.card.params;
        const angelaResponse = angela.abilities.find(({trigger}) =>
            trigger === TRIGGER_CARD_ENTER_PLAY);
        assert.equal(angelaConfig.abilities[0].type, ABILITY_FORCED_RESPONSE);
        assert.deepEqual(
            angelaResponse.effect.effects.map(({effectType}) => effectType),
            [EFFECT_SEARCH_CARDS, EFFECT_ENGAGE, EFFECT_DO_IF],
        );
        assert.deepEqual(
            angelaResponse.effect.effects[0].locations,
            [PLACE_ENCOUNTER_DECK_CARDS],
        );
        assert.equal(angelaResponse.effect.effects[0].topCount, 10);
        assert.deepEqual(angelaResponse.effect.effects[0].filter, {
            isMinion: true,
        });
        const discardAngela = angelaResponse.effect.effects[2];
        assert.deepEqual(discardAngela.condition, {
            'effects.1.didEngage': false,
        });
        assert.equal(discardAngela.effect.effectType, EFFECT_DISCARD_GAME);
        assert.equal(discardAngela.effect.target, TARGET_THIS);

        const vapuleo = cards.get('aggression-vapuleo').gameCard;
        const vapuleoConfig =
            cards.get('aggression-vapuleo').entry.card.params;
        const vapuleoAction = vapuleo.abilities.find(({isAttack}) => isAttack);
        const [damage, returnIfFirst] = vapuleoAction.effect.effects;
        assert.equal(vapuleoConfig.abilities[0].type, ABILITY_HERO_ACTION);
        assert.equal(damage.effectType, EFFECT_DEAL_DAMAGE);
        assert.equal(returnIfFirst.effectType, EFFECT_DO_IF);
        assert.equal(checkCondition({
            playCardEffect: {isFirstCardThisRound: true},
        }, returnIfFirst.condition), true);
        assert.equal(checkCondition({
            playCardEffect: {isFirstCardThisRound: false},
        }, returnIfFirst.condition), false);
        assert.equal(returnIfFirst.effect.effectType, EFFECT_DELAYED);

        const plan = cards.get('aggression-plan-de-ataque');
        const [planSearch] = plan.gameCard.abilities[0].effect.effects;
        assert.equal(plan.entry.card.params.abilities[0].type, ABILITY_ACTION);
        assert.equal(planSearch.effect.effectType, EFFECT_SEARCH_CARDS);
        assert.equal(planSearch.effect.topCount, 4);
        assert.equal(planSearch.effectNot.topCount, 7);
        assert.deepEqual(planSearch.effect.filter, {
            isEvent: true,
            traits: [TRAIT_ATTACK],
        });
        assert.deepEqual(planSearch.effectNot.filter, {
            isEvent: true,
            traits: [TRAIT_ATTACK],
        });

        const primer = cards.get('protection-primer-impacto').gameCard;
        const primerConfig =
            cards.get('protection-primer-impacto').entry.card.params;
        assert.equal(primerConfig.abilities[0].type, ABILITY_HERO_ACTION);
        assert.equal(primerConfig.abilities[1].type, ABILITY_HERO_INTERRUPT);
        assert.equal(primer.abilities[1].trigger, TRIGGER_ENEMY_ATTACKS_YOU);

        const matadioses = cards.get('aggression-matadioses').gameCard;
        assert.equal(matadioses.card.keywords.restricted, true);
        assert.equal(
            matadioses.abilities[0].effect.effectType,
            EFFECT_MODIFY_ATTACK_VALUE,
        );

        const drax = cards.get('basic-drax').gameCard;
        const draxRestriction = drax.abilities.find(({abilityType}) =>
            abilityType === ABILITY_CONSTANT);
        assert.equal(
            cards.get('basic-drax').entry.card.params.abilities[0].type,
            ABILITY_CONSTANT,
        );
        assert.equal(
            draxRestriction.validation.effectType,
            EFFECT_CANNOT_ATTACK,
        );
        const minion = {isMinion: true};
        const basicAttack = {
            isAttack: true,
            character: drax,
            ability: {
                card: drax,
                isBasic: true,
                isAttack: true,
            },
        };
        assert.equal(draxRestriction.validation.isInvalidTarget({
            effect: basicAttack,
            targetCard: minion,
        }), true);
        assert.equal(draxRestriction.validation.isInvalidTarget({
            effect: {
                ...basicAttack,
                ability: {...basicAttack.ability, isBasic: false},
            },
            targetCard: minion,
        }), true);
        assert.equal(draxRestriction.validation.isInvalidTarget({
            effect: {...basicAttack, isAttack: false},
            targetCard: minion,
        }), false);
        assert.equal(draxRestriction.validation.isInvalidTarget({
            effect: basicAttack,
            targetCard: {isMinion: false},
        }), false);

        const lightning = cards.get('basic-ataque-relampago').gameCard;
        assert.deepEqual(
            lightning.abilities[0].effect.effects.map(({effectType}) =>
                effectType),
            [EFFECT_DEAL_DAMAGE, EFFECT_REMOVE_THREAT],
        );
    });

    test('constructs runnable abilities and keeps each printed response condition', async () => {
        const {cardsFactory, gamora, hero, player} = await createGamora();
        const definitions = [
            ...hero.config.sides,
            ...hero.config.cards.map(({card}) => card),
        ];

        definitions.forEach(definition => {
            const card = cardsFactory.createGameCardFromConfig(definition, {
                owner: player,
            });
            card.abilities.forEach(ability => {
                const effect = ability.effect || ability.arrow?.cost;
                assert.equal(
                    typeof effect?.canRun,
                    'function',
                    `${card.name} must construct a runnable ability effect.`,
                );
            });
        });

        const subtlety = gamora.abilities.find(({name}) => name === 'Sutileza');
        const precision = gamora.abilities.find(({name}) => name === 'Precisión');
        assert.equal(subtlety.trigger, TRIGGER_YOU_END_PLAY_CARD);
        assert.equal(precision.trigger, TRIGGER_YOU_END_PLAY_CARD);
        assert.equal(subtlety.limit.target, TARGET_PHASE);
        assert.equal(precision.limit.target, TARGET_PHASE);
        assert.equal(checkCondition({
            effect: {card: {isEvent: true, traits: [TRAIT_ATTACK]}},
        }, subtlety.condition), true);
        assert.equal(checkCondition({
            effect: {card: {isEvent: true, traits: [TRAIT_THWART]}},
        }, precision.condition), true);
        assert.equal(checkCondition({
            effect: {card: {isEvent: false, traits: [TRAIT_ATTACK]}},
        }, subtlety.condition), false);

        const {gameCard: nebula} = createFixedGameCard(
            hero,
            cardsFactory,
            player,
            'Nébula',
        );
        const nebulaResponse = nebula.abilities.find(ability =>
            ability.trigger === TRIGGER_CARD_ENTER_PLAY);
        assert.equal(nebulaResponse.effect.effectType, EFFECT_CHAINED);
        assert.deepEqual(
            nebulaResponse.effect.effects.map(({effectType}) => effectType),
            [EFFECT_SEARCH_CARDS, EFFECT_MOVE_TO_HAND],
        );
        assert.deepEqual(nebulaResponse.effect.effects[0].locations, [PLACE_DECK]);
        assert.deepEqual(nebulaResponse.effect.effects[0].filter, {
            isEvent: true,
            traits: [TRAIT_ATTACK, TRAIT_THWART],
        });
    });

    test('uses the played-event history for both conditional events', async () => {
        const {cardsFactory, hero, player} = await createGamora();
        const {gameCard: decisive} = createFixedGameCard(
            hero,
            cardsFactory,
            player,
            'Golpe decisivo',
        );
        const {gameCard: impetus} = createFixedGameCard(
            hero,
            cardsFactory,
            player,
            'Ímpetu',
        );
        assert.deepEqual(impetus.traits, [TRAIT_THWART]);
        const decisiveEffect = decisive.abilities.find(ability =>
            ability.isAttack).effect;
        const impetusEffect = impetus.abilities.find(ability =>
            ability.isThwart).effect;

        assert.equal(decisiveEffect.effectType, EFFECT_DO_IF);
        assert.equal(impetusEffect.effectType, EFFECT_DO_IF);
        assert.equal(checkCondition({
            player: {playedEventsThisTurn: [{traits: [TRAIT_THWART]}]},
        }, decisiveEffect.condition), true);
        assert.equal(checkCondition({
            player: {playedEventsThisTurn: []},
        }, decisiveEffect.condition), false);
        assert.equal(checkCondition({
            player: {playedEventsThisTurn: [{traits: [TRAIT_ATTACK]}]},
        }, impetusEffect.condition), true);
        assert.equal(decisiveEffect.effect.effectType, EFFECT_DEAL_DAMAGE);
        assert.equal(decisiveEffect.effect.baseDamage, 7);
        assert.equal(decisiveEffect.effectNot.baseDamage, 4);
        assert.equal(impetusEffect.effect.effectType, EFFECT_REMOVE_THREAT);
        assert.equal(impetusEffect.effectNot.effectType, EFFECT_REMOVE_THREAT);
    });

    test('Nébula searches for and moves a matching Event to hand', async () => {
        const {cardsFactory, catalog, hero, match, player} =
            await createGamora();
        const {gameCard: matchingEvent} = createFixedGameCard(
            hero,
            cardsFactory,
            player,
            'Movimiento acrobático',
        );
        const {gameCard: secondMatchingEvent} = createFixedGameCard(
            hero,
            cardsFactory,
            player,
            'Devolver el golpe',
        );
        const nonMatchingEntry = catalog.aspects.find(({card}) =>
            card.type === CARD_TYPE_EVENT &&
            !card.params.traits?.some(trait =>
                [TRAIT_ATTACK, TRAIT_THWART].includes(trait)));
        assert.ok(nonMatchingEntry);
        const nonMatchingCard = cardsFactory.createGameCardFromConfig(
            nonMatchingEntry.card,
            {owner: player},
        );

        player.deck = new Deck({owner: player, isPlayerDeck: true});
        player.deck.refresh = async () => {};
        player.deck.addToDeck([
            nonMatchingCard,
            matchingEvent,
            secondMatchingEvent,
        ]);
        player.hand.refresh = async () => {};
        let searchDialog;
        match.openDialog = async dialog => {
            searchDialog = dialog;

            return {selected: [dialog.data.cards[0]]};
        };

        const nebulaEntry = createFixedGameCard(
            hero,
            cardsFactory,
            player,
            'Nébula',
        );
        const nebulaResponse = nebulaEntry.gameCard.abilities.find(ability =>
            ability.trigger === TRIGGER_CARD_ENTER_PLAY);
        const [search, moveToHand] = nebulaResponse.effect.effects;
        const params = {match, player};
        const searchOptions = await search.getOptions(params);

        assert.deepEqual(searchOptions, [matchingEvent, secondMatchingEvent]);
        await search.execute(params);
        assert.deepEqual(searchDialog.data.cards.map(({id}) => id), [
            matchingEvent.id,
            secondMatchingEvent.id,
        ]);
        assert.deepEqual(params.selectedCards, [matchingEvent]);

        moveToHand.selectedTarget = matchingEvent;
        await moveToHand.execute(params);

        assert.deepEqual(player.hand.cards, [matchingEvent]);
        assert.equal(player.deck.cards.includes(nonMatchingCard), true);
        assert.equal(player.deck.cards.includes(matchingEvent), false);
        assert.equal(player.deck.cards.includes(secondMatchingEvent), true);
    });

    test('looks only at its own deck and moves a matching top Event to hand', async () => {
        const {alterEgo, cardsFactory, hero, match, player} =
            await createGamora();
        match.isUniqueCard = () => false;
        const otherPlayer = new Player({
            name: 'Other player',
            superhero: cardsFactory.createGameCardFromConfig(
                hero.config.sides[0],
            ),
        });
        match.players.push(otherPlayer);
        const socketEvents = [];
        match.mc.mcSocket.send = (matchName, event, params) =>
            socketEvents.push({matchName, event, params});

        const createDeck = owner => {
            const deck = new Deck({owner, isPlayerDeck: true});
            deck.refresh = async () => {};
            return deck;
        };
        player.deck = createDeck(player);
        otherPlayer.deck = createDeck(otherPlayer);

        const {gameCard: topEvent} = createFixedGameCard(
            hero,
            cardsFactory,
            player,
            'Movimiento acrobático',
        );
        player.deck.addToDeck([topEvent]);
        const ability = alterEgo.abilities.find(({name}) =>
            name === 'Experta en tácticas');
        const [lookAtTop, drawIfMatching] = ability.effect.effects;

        assert.equal(
            hero.config.sides[0].params.abilities[0].type,
            ABILITY_ALTEREGO_ACTION,
        );
        assert.equal(lookAtTop.effectType, EFFECT_LOOK_AT_TOP_CARDS);
        assert.equal(lookAtTop.target, TARGET_PLAYER_DECK);
        assert.equal(lookAtTop.getTargetSelectionMode(), 'deck');
        assert.deepEqual(
            await lookAtTop.getValidTarget({player, match}),
            [player.deck],
        );
        lookAtTop.selectedTarget = player.deck;
        await lookAtTop.execute({player, match});
        assert.equal(drawIfMatching.checkCondition({
            effects: [lookAtTop],
            match,
            player,
        }), true);
        assert.equal(drawIfMatching.checkCondition({
            effects: [{matchingCards: []}],
            match,
            player,
        }), false);

        const moveToHand = drawIfMatching.effect;
        moveToHand.selectedTarget = topEvent;
        await moveToHand.execute({
            effects: [lookAtTop, drawIfMatching],
            match,
            player,
        });

        assert.deepEqual(player.hand.cards, [topEvent]);
        const handRefresh = socketEvents.find(({event}) =>
            event === EVENTS.HAND.REFRESH);
        assert.ok(handRefresh);
        assert.deepEqual(handRefresh.params.hand.map(({id}) => id), [
            topEvent.id,
        ]);
        assert.equal(socketEvents.some(({event}) =>
            typeof event !== 'string'), false);
        assert.deepEqual(player.deck.cards, []);
        assert.deepEqual(otherPlayer.deck.cards, []);
    });

    test('implements the defense interrupt, discard recovery, and restricted sword', async () => {
        const {cardsFactory, hero, player} = await createGamora();
        const {gameCard: returnTheBlow} = createFixedGameCard(
            hero,
            cardsFactory,
            player,
            'Devolver el golpe',
        );
        const {gameCard: trainingRoom} = createFixedGameCard(
            hero,
            cardsFactory,
            player,
            'Sala de ejercicio',
        );
        const {gameCard: sword} = createFixedGameCard(
            hero,
            cardsFactory,
            player,
            'Espada de Gamora',
        );
        const interrupt = returnTheBlow.abilities[0];
        const [prevent, damage, threat] = interrupt.effect.effects;

        assert.equal(
            findFixedCard(hero, 'Devolver el golpe').card.params.abilities[0].type,
            ABILITY_HERO_INTERRUPT,
        );
        assert.equal(interrupt.trigger, TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE);
        assert.equal(interrupt.triggerParams.target, TARGET_YOUR_SUPERHERO);
        assert.deepEqual(interrupt.labels, [
            LABEL_ATTACK,
            LABEL_DEFENSE,
            LABEL_THWART,
        ]);
        assert.equal(prevent.effectType, EFFECT_PREVENT_DAMAGE);
        assert.equal(prevent.damage, 3);
        assert.equal(damage.effectType, EFFECT_DEAL_DAMAGE);
        assert.equal(damage.target, TARGET_ENEMY);
        assert.equal(threat.effectType, EFFECT_REMOVE_THREAT);
        assert.equal(threat.target, TARGET_SCHEME);

        assert.deepEqual(
            trainingRoom.abilities[0].effect.effects.map(({effectType}) =>
                effectType),
            [EFFECT_SEARCH_CARDS, EFFECT_MOVE_TO_HAND, EFFECT_HEAL],
        );
        const recoverySearch = trainingRoom.abilities[0].effect.effects[0];
        assert.deepEqual(recoverySearch.locations, [PLACE_DISCARD_PILE]);
        assert.deepEqual(recoverySearch.reverseLocations, [PLACE_DISCARD_PILE]);
        assert.equal(recoverySearch.firstMatch, true);
        assert.equal(trainingRoom.abilities[0].effect.effects[2].damage, 1);
        assert.equal(sword.card.keywords.restricted, true);
        assert.equal(sword.abilities[0].trigger, TRIGGER_YOU_END_PLAY_CARD);
        assert.deepEqual(sword.card.resources, [RESOURCE_PHYSICAL]);
    });

    test('returns Vapuleo to hand when its delayed effect resolves', async () => {
        const {cardsFactory, catalog, match, player} = await createGamora();
        match.activationsFactory = new ActivationsFactory(match);
        const vapuleoEntry = catalog.aspects.find(({_id}) =>
            _id === 'aggression-vapuleo');
        assert.ok(vapuleoEntry);
        const vapuleo = cardsFactory.createGameCardFromConfig(
            vapuleoEntry.card,
            {owner: player},
        );
        player.hand = {
            cards: [],
            addCards(cards) {
                this.cards.push(...cards);
            },
            async refresh() {},
        };
        player.deck = {
            discardPile: [vapuleo],
            async checkCycle() {},
            async refresh() {},
            searchDiscard(card) {
                const index = this.discardPile.indexOf(card);
                if (index !== -1) {
                    this.discardPile.splice(index, 1);
                }
            },
        };
        vapuleo.refresh = async () => {};

        const playCardEffect = new PlayCardEffect({card: vapuleo, match});
        playCardEffect.isFirstCardThisRound = true;
        const returnIfFirst = vapuleo.abilities[0].effect.effects[1];

        await returnIfFirst.execute({
            card: vapuleo,
            match,
            player,
            playCardEffect,
        });
        await playCardEffect.resolveDelayedEffects({player});

        assert.deepEqual(player.hand.cards, [vapuleo]);
        assert.deepEqual(player.deck.discardPile, []);
    });
});
