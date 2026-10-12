import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_SUPPORT,
    DIALOG_REVEAL_CARDS,
    EFFECT_CHAINED,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_MOVE_TO_HAND,
    EFFECT_MOVE_TO_DECK,
    EFFECT_SEARCH_CARDS,
    EFFECT_TUCK_UNDER,
    DECK_POSITION_BOTTOM,
    DECK_POSITION_SHUFFLE,
    PLACE_HAND,
    RESOURCE_ANY,
    TARGET_SOURCE,
    TARGET_THIS,
    TRAIT_PERSONA,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import blackPanther from '../../../mc-data/seed/catalog/heroes/blackpanther.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Deck} from '../../src/model/match/deck.js';

test('Ms. Marvel catalog has a complete precon and valid card references', async () => {
    const catalog = await loadCatalog();
    const hero = catalog.heroes.find(({_id}) => _id === 'ms-marvel');
    assert.ok(hero);
    assert.equal(hero.config.sides.length, 2);
    const signatureCount = hero.config.cards.reduce(
        (total, {count}) => total + count,
        0
    );
    assert.equal(
        signatureCount,
        15
    );
    assert.equal(
        hero.config.nemesis.reduce((total, {count}) => total + count, 0),
        5
    );
    const redDagger = hero.config.cards.find(({card}) =>
        card.params.name === 'Puñal Rojo');
    assert.ok(redDagger);
    assert.deepEqual(
        redDagger.card.params.abilities[0].params.arrow.params.resources,
        [RESOURCE_ANY, RESOURCE_ANY]
    );
    assert.equal(
        redDagger.card.params.abilities[0].params.arrow.params.differentTypes,
        true
    );
    const bruno = hero.config.cards.find(({card}) =>
        card.params.name === 'Bruno Carrelli');
    assert.ok(bruno);
    assert.deepEqual(
        bruno.card.params.abilities.map(({params}) => params.name),
        [
            'Meter una carta de tu mano debajo de Bruno',
            'Recuperar hasta 3 cartas metidas debajo de Bruno',
        ]
    );
    const brunoTuckEffect = bruno.card.params.abilities[0].params.effect;
    assert.equal(brunoTuckEffect.type, EFFECT_CHAINED);
    assert.equal(brunoTuckEffect.params.target, TARGET_THIS);
    const [selectHandCard, tuckSelectedCards] = brunoTuckEffect.params.effects;
    assert.equal(selectHandCard.type, EFFECT_SEARCH_CARDS);
    assert.deepEqual(selectHandCard.params.locations, [PLACE_HAND]);
    assert.equal(selectHandCard.params.count, 1);
    assert.equal(selectHandCard.params.requireMatch, true);
    assert.equal(tuckSelectedCards.type, EFFECT_TUCK_UNDER);
    assert.equal(tuckSelectedCards.params.target, TARGET_THIS);
    assert.equal(tuckSelectedCards.params.cards, 'selectedCards');
    const brunoReturnEffect = bruno.card.params.abilities[1].params.effect;
    assert.equal(brunoReturnEffect.type, EFFECT_MOVE_TO_HAND);
    assert.equal(brunoReturnEffect.params.target, TARGET_SOURCE);
    assert.equal(brunoReturnEffect.params.source, 'ability.card.tuckedCards');
    assert.equal(brunoReturnEffect.params.selectCount, 3);
    assert.equal(brunoReturnEffect.params.selectUpTo, true);
    assert.equal(brunoReturnEffect.params.multipleTarget, true);

    const aamir = hero.config.cards.find(({card}) =>
        card.params.name === 'Aamir Khan').card;
    const aamirMoveToDeck = aamir.params.abilities[0].params.effect.params.effects
        .find(({type}) => type === EFFECT_MOVE_TO_DECK);
    assert.equal(
        aamirMoveToDeck.params.position,
        DECK_POSITION_BOTTOM
    );

    const ancestralWisdom = blackPanther.config.cards.find(({card}) =>
        card.params.name === 'Sabiduría ancestral').card;
    const wisdomEffects = ancestralWisdom.params.abilities[0].params.effect.params.effects;
    const wisdomMoveToDeck = wisdomEffects.find(({type}) =>
        type === EFFECT_MOVE_TO_DECK);
    assert.equal(
        wisdomMoveToDeck.params.position,
        DECK_POSITION_SHUFFLE
    );
    assert.equal(wisdomEffects.length, 2);

    const preconSize = hero.config.precon.reduce((total, entry) =>
        total + (entry.cardRefs ?
            entry.cardRefs.reduce((referenceTotal, reference) =>
                referenceTotal + reference.count, 0) :
            entry.count),
    0);
    assert.equal(preconSize + signatureCount, 40);

    const preconCards = hero.config.precon.flatMap(entry => {
        if (!entry.cardRefs) {
            return [entry.card];
        }

        return entry.cardRefs.map(({id}) => {
            const aspectCard = catalog.aspects.find(({_id}) => _id === id);
            assert.ok(aspectCard, `Missing precon aspect card reference: ${id}`);
            assert.equal(aspectCard.aspect, entry.aspect);
            return aspectCard.card;
        });
    });
    const cardConfigs = [
        ...hero.config.sides,
        ...hero.config.cards.map(({card}) => card),
        hero.config.obligation.card,
        ...hero.config.nemesis.map(({card}) => card),
        ...preconCards,
    ];
    const cardsFactory = new CardsFactory({match: {triggerCards: {}}});

    for (const cardConfig of cardConfigs) {
        const gameCard = cardsFactory.createGameCardFromConfig(cardConfig);
        assert.ok(gameCard, `Could not create ${cardConfig.params.name}`);
        if (cardConfig.params.name === 'Barrera de energía') {
            assert.equal(gameCard.abilities[0].isDefense, false);
        }
        for (const ability of gameCard.abilities) {
            assert.ok(ability, `Could not parse an ability on ${cardConfig.params.name}`);
            if (ability.effect) {
                assert.equal(
                    typeof ability.effect.canRun,
                    'function',
                    `Unparsed effect on ${cardConfig.params.name}`
                );
            }
            if (ability.validation) {
                assert.equal(
                    typeof ability.validation.isInvalidTarget,
                    'function',
                    `Unparsed validation on ${cardConfig.params.name}`
                );
            }
        }
    }
});

test('Fervor adolescente finds a Ms. Marvel card after 13 cards and adds it to hand', async () => {
    const catalog = await loadCatalog();
    const hero = catalog.heroes.find(({_id}) => _id === 'ms-marvel');
    const alterEgoConfig = hero.config.sides.find(({type}) =>
        type === CARD_TYPE_ALTEREGO);
    const signatureCardConfig = hero.config.cards.find(({card}) =>
        card.params.set === 'Ms. Marvel')?.card;
    assert.ok(alterEgoConfig);
    assert.ok(signatureCardConfig);

    const dialogs = [];
    const match = {
        triggerCards: {},
        async openDialog(dialog) {
            dialogs.push(dialog);
        },
    };
    const cardsFactory = new CardsFactory({match});
    const player = {
        hand: {
            cards: [],
            addCard(card) {
                this.cards.push(card);
            },
            async refresh() {},
        },
    };
    const deck = new Deck({owner: player});
    player.deck = deck;

    const createOtherCard = index => cardsFactory.createGameCardFromConfig({
        type: CARD_TYPE_EVENT,
        params: {
            name: `Carta ajena ${index}`,
            set: 'Otro conjunto',
            image: 'test.png',
        },
    }, {owner: player});
    const discardedCards = Array.from({length: 12}, (_, index) =>
        createOtherCard(index));
    const foundCard = cardsFactory.createGameCardFromConfig(
        signatureCardConfig,
        {owner: player}
    );
    const remainingCard = createOtherCard(12);
    deck.cards = [...discardedCards, foundCard, remainingCard];
    deck.refresh = async () => {};

    const alterEgo = cardsFactory.createGameCardFromConfig(
        alterEgoConfig,
        {owner: player}
    );
    const teenSpirit = alterEgo.abilities.find(({name}) =>
        name === 'Fervor adolescente');
    assert.ok(teenSpirit?.effect);
    const [discardUntil, moveToHand] = teenSpirit.effect.effects;
    assert.deepEqual(discardUntil.condition, {set: 'Ms. Marvel'});
    assert.equal(discardUntil.showDiscardedCards, true);

    const params = {player};
    discardUntil.selectedTarget = deck;
    await discardUntil.execute(params);

    assert.equal(params.selectedCard, foundCard);
    assert.deepEqual(deck.discardPile, [...discardedCards, foundCard]);
    assert.deepEqual(deck.cards, [remainingCard]);
    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].dialogType, DIALOG_REVEAL_CARDS);
    assert.equal(dialogs[0].title, 'Cartas descartadas');
    assert.deepEqual(
        dialogs[0].data.cards.map(({id}) => id),
        [...discardedCards, foundCard].map(({id}) => id)
    );

    moveToHand.selectedTarget = params.selectedCards;
    await moveToHand.execute(params);

    assert.deepEqual(player.hand.cards, [foundCard]);
    assert.deepEqual(deck.discardPile, discardedCards);
});

test('Generación "¿Por qué?" discards for allies and Persona supports in play', async () => {
    const catalog = await loadCatalog();
    const hero = catalog.heroes.find(({_id}) => _id === 'ms-marvel');
    const sideSchemeConfig = hero.config.nemesis.find(({card}) =>
        card.params.name === 'Generación "¿Por qué?"').card;
    const dialogs = [];
    const match = {
        players: [],
        initialPlayer: undefined,
        triggerCards: {},
    };
    const player = {
        name: 'Player',
        match,
        gameZone: {cards: []},
    };
    match.players = [player];
    match.initialPlayer = player;

    const cardsFactory = new CardsFactory({match});
    const createCard = (type, name, traits = []) =>
        cardsFactory.createGameCardFromConfig({
            type,
            params: {
                name,
                set: 'Test',
                image: 'test.png',
                traits,
                abilities: [],
                cost: 0,
                resources: [],
                hitPoints: 2,
                attack: 1,
                thwart: 1,
            },
        }, {owner: player});

    player.gameZone.cards = [
        createCard(CARD_TYPE_ALLY, 'Test ally'),
        createCard(CARD_TYPE_SUPPORT, 'Persona support', [TRAIT_PERSONA]),
        createCard(CARD_TYPE_SUPPORT, 'Other support'),
    ];

    const deck = new Deck({owner: player});
    const deckCards = Array.from({length: 3}, (_, index) =>
        createCard(CARD_TYPE_EVENT, `Deck card ${index}`));
    deck.cards = deckCards.slice();
    deck.refresh = async () => {};
    player.deck = deck;

    const sideScheme = cardsFactory.createGameCardFromConfig(sideSchemeConfig);
    const discardEffect = sideScheme.abilities[0].effect;
    assert.equal(discardEffect.effectType, EFFECT_DISCARD_FROM_DECK);
    discardEffect.openDialog = async dialog => {
        dialogs.push(dialog);
    };

    await discardEffect.execute({player});

    assert.deepEqual(deck.discardPile, deckCards.slice(0, 2));
    assert.deepEqual(deck.cards, deckCards.slice(2));
    assert.equal(dialogs.length, 1);
    assert.equal(dialogs[0].dialogType, DIALOG_REVEAL_CARDS);
    assert.deepEqual(
        dialogs[0].data.cards.map(({id}) => id),
        deckCards.slice(0, 2).map(({id}) => id)
    );
});
