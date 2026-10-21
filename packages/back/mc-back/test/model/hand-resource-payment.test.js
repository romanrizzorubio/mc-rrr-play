import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
} from 'mc-shared';
import aggressionResources from '../../../mc-data/seed/catalog/aspects/aggression/resources.js';
import msMarvel from '../../../mc-data/seed/catalog/heroes/ms-marvel.js';
import {PayCostEffect} from '../../src/effects/pay-cost-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {Hand} from '../../src/model/match/hand.js';
import {Player} from '../../src/model/match/player.js';
import {ResourceCard} from '../../src/model/printed/resource-card.js';

test('Hand.getCardsToPay includes conditional wild resources for a specific resource cost', () => {
    const printedResourceCard = new ResourceCard(
        aggressionResources[0].card.params
    );
    const conditionalWild = {
        id: 'conditional-wild',
        isPlaying: false,
        card: printedResourceCard,
        resources: printedResourceCard.resources,
    };
    const mentalCard = {
        id: 'mental-resource',
        isPlaying: false,
        card: {
            getResources: () => [RESOURCE_MENTAL],
        },
    };
    const hand = Object.create(Hand.prototype);
    hand.cards = [conditionalWild, mentalCard];
    const cardToPay = {
        card: {
            set: 'captain-marvel',
        },
    };

    assert.deepEqual(
        hand.getCardsToPay(cardToPay, RESOURCE_ENERGY).map(card => card.id),
        [conditionalWild.id]
    );
    assert.deepEqual(
        printedResourceCard.getResources(cardToPay),
        [RESOURCE_WILD]
    );
});

test('Hand.getCardsToPay filters to any requested specific resource and universal resources', () => {
    const cards = [
        [RESOURCE_ENERGY, 'energy'],
        [RESOURCE_MENTAL, 'mental'],
        [RESOURCE_PHYSICAL, 'physical'],
        [RESOURCE_WILD, 'wild'],
    ].map(([resource, id]) => ({
        id,
        isPlaying: false,
        card: {
            getResources: () => [resource],
        },
    }));
    const hand = Object.create(Hand.prototype);
    hand.cards = cards;

    assert.deepEqual(
        hand.getCardsToPay({}, [RESOURCE_MENTAL, RESOURCE_PHYSICAL])
            .map(card => card.id),
        ['mental', 'physical', 'wild']
    );
    assert.deepEqual(
        hand.getCardsToPay({}, [RESOURCE_ANY]).map(card => card.id),
        ['energy', 'mental', 'physical', 'wild']
    );
});

test('Hand.getCardsToPay excludes cards with no resources for unrestricted costs', () => {
    const cards = [
        {
            id: 'no-resources',
            isPlaying: false,
            card: {
                getResources: () => [],
            },
        },
        {
            id: 'physical',
            isPlaying: false,
            card: {
                getResources: () => [RESOURCE_PHYSICAL],
            },
        },
    ];
    const hand = Object.create(Hand.prototype);
    hand.cards = cards;

    assert.deepEqual(
        hand.getCardsToPay({}, undefined).map(card => card.id),
        ['physical']
    );
    assert.deepEqual(
        hand.getCardsToPay({}, RESOURCE_ANY).map(card => card.id),
        ['physical']
    );
});

test('Hand.getCardsToPay distinguishes separate cards that share a legacy id', () => {
    const resourceCard = {
        id: 'duplicate-copy-id',
        isPlaying: false,
        card: {
            getResources: () => [RESOURCE_ENERGY],
        },
    };
    const hand = Object.create(Hand.prototype);
    hand.cards = [resourceCard];

    assert.deepEqual(
        hand.getCardsToPay({id: 'duplicate-copy-id'}, RESOURCE_ENERGY),
        [resourceCard]
    );
});

test('Player.spendResources only offers cards that can pay its resource requirements', async () => {
    const cards = [
        [RESOURCE_ENERGY, 'energy'],
        [RESOURCE_MENTAL, 'mental'],
        [RESOURCE_PHYSICAL, 'physical'],
        [RESOURCE_WILD, 'wild'],
    ].map(([resource, id]) => ({
        id,
        isPlaying: false,
        card: {
            getResources: () => [resource],
        },
        toObj: () => ({id}),
    }));
    const hand = Object.create(Hand.prototype);
    hand.cards = cards;
    const player = Object.create(Player.prototype);
    const cardToPay = {
        id: 'card-to-pay',
        toObj: () => ({id: 'card-to-pay'}),
    };
    let paymentDialog;

    player.hand = hand;
    player.getResourceGenerators = async (_card, resourceTypes) => {
        assert.deepEqual(resourceTypes, [RESOURCE_MENTAL]);

        return [];
    };
    player.openDialog = async options => {
        paymentDialog = options;
    };

    await player.spendResources([RESOURCE_MENTAL], cardToPay);

    assert.deepEqual(
        paymentDialog.data.cards.hand.map(card => card.id),
        ['mental', 'wild']
    );
});

test('Player.getDirectResourcePayment resolves a dragged hand resource', async () => {
    const resourceCard = {
        card: {
            getResources: () => [RESOURCE_ENERGY],
        },
        id: 'energy-card',
        isPlaying: false,
    };
    const hand = Object.create(Hand.prototype);
    hand.cards = [resourceCard];
    hand.getCard = cardId => hand.cards.find(card => card.id === cardId);
    const player = Object.create(Player.prototype);
    player.hand = hand;
    player.getCardsToPay = async () => ({
        generators: [],
        hand: [resourceCard],
    });

    const payment = await player.getDirectResourcePayment({
        cardId: resourceCard.id,
        cardToPay: {id: 'energy-channel'},
        resourceType: RESOURCE_ENERGY,
        source: 'hand',
    });

    assert.deepEqual(payment, {
        generators: [],
        hand: [resourceCard],
        resources: [RESOURCE_ENERGY],
    });
});

test('Player.getDirectResourcePayment resolves a dragged resource generator', async () => {
    const generator = {
        abilities: [{
            getGeneratedResources: () => [RESOURCE_ENERGY],
            isResource: true,
        }],
        id: 'energy-generator',
    };
    const player = Object.create(Player.prototype);
    player.getCardsToPay = async () => ({
        generators: [generator],
        hand: [],
    });

    const payment = await player.getDirectResourcePayment({
        cardId: generator.id,
        cardToPay: {id: 'energy-channel'},
        resourceType: RESOURCE_ENERGY,
        source: 'generators',
    });

    assert.deepEqual(payment, {
        generators: [generator],
        hand: [],
        resources: [RESOURCE_ENERGY],
    });
});

test('resource-session dialogs show only remaining hand icons and enable icon selection', async () => {
    const doubleResourceCard = {
        card: {
            getResources: () => [RESOURCE_ENERGY, RESOURCE_MENTAL],
        },
        id: 'double-resource',
        isPlaying: false,
        toObj() {
            return {
                id: this.id,
                resources: this.card.getResources(),
            };
        },
    };
    const hand = Object.create(Hand.prototype);
    hand.cards = [doubleResourceCard];
    const player = Object.create(Player.prototype);
    const dialogs = [];
    player.hand = hand;
    player.getResourceGenerators = async () => [];
    player.openDialog = async options => {
        dialogs.push(options);
    };
    const cardToPay = {
        id: 'event',
        toObj: () => ({id: 'event'}),
    };

    await player.spendResources(
        [RESOURCE_MENTAL],
        cardToPay,
        new Set(),
        {
            resourceUsage: new Map([
                [doubleResourceCard.id, [RESOURCE_MENTAL]],
            ]),
        }
    );
    await player.spendResourcesX(
        0,
        cardToPay,
        RESOURCE_ENERGY,
        new Set(),
        new Map([
            [doubleResourceCard.id, [RESOURCE_ENERGY]],
        ])
    );

    assert.equal(dialogs[0].data.resourceSelectionMode, true);
    assert.deepEqual(
        dialogs[0].data.cards.hand[0].resources,
        [RESOURCE_MENTAL]
    );
    assert.equal(dialogs[1].data.resourceSelectionMode, true);
    assert.deepEqual(
        dialogs[1].data.cards.hand[0].resources,
        [RESOURCE_ENERGY]
    );
});

test('Player.getResourceGenerators filters abilities by every required resource type', async () => {
    const resourceTypes = [];
    const makeGenerator = (id, generatedResource) => ({
        id,
        async hasResourceGenerators(_card, resourceType) {
            resourceTypes.push([id, resourceType]);

            return resourceType === generatedResource;
        },
    });
    const superheroSide = makeGenerator('hero');
    const mentalGenerator = makeGenerator('mental-generator', RESOURCE_MENTAL);
    const physicalGenerator = makeGenerator('physical-generator', RESOURCE_PHYSICAL);
    const energyGenerator = makeGenerator('energy-generator', RESOURCE_ENERGY);
    const player = Object.create(Player.prototype);
    player.superhero = {
        currentSide: superheroSide,
    };
    player.gameZone = {
        cards: [mentalGenerator, physicalGenerator, energyGenerator],
    };

    const generators = await player.getResourceGenerators(
        {},
        [RESOURCE_MENTAL, RESOURCE_PHYSICAL]
    );

    assert.deepEqual(generators, [mentalGenerator, physicalGenerator]);
    assert.deepEqual(resourceTypes, [
        ['hero', RESOURCE_MENTAL],
        ['hero', RESOURCE_PHYSICAL],
        ['mental-generator', RESOURCE_MENTAL],
        ['physical-generator', RESOURCE_MENTAL],
        ['physical-generator', RESOURCE_PHYSICAL],
        ['energy-generator', RESOURCE_MENTAL],
        ['energy-generator', RESOURCE_PHYSICAL],
    ]);
});

test('Ms. Marvel suit can pay for an event and resolves against that event', async () => {
    const match = {triggerCards: {}};
    const cardsFactory = new CardsFactory({match});
    const player = Object.create(Player.prototype);
    player.isPlayer = true;
    player.superhero = {
        isHero: true,
        currentSide: {
            id: 'hero-side',
            isHero: true,
            async hasResourceGenerators() {
                return false;
            },
        },
    };
    player.gameZone = {
        cards: [],
        getCard(cardId) {
            return this.cards.find(card => card.id === cardId);
        },
        async refresh() {},
    };
    player.hand = {
        cards: [],
        getCardsToPay() {
            return [];
        },
    };
    let paymentDialog;
    player.openDialog = async dialog => {
        paymentDialog = dialog;
    };

    const suitConfig = msMarvel.config.cards.find(({card}) =>
        card.params.name === 'Traje de polímero biocinético').card;
    const eventConfig = msMarvel.config.cards.find(({card}) =>
        card.params.name === 'Escabullirse').card;
    const suit = cardsFactory.createGameCardFromConfig(suitConfig, {owner: player});
    const event = cardsFactory.createGameCardFromConfig(eventConfig, {owner: player});
    suit.controller = player;
    suit.refresh = async () => {};
    player.gameZone.cards.push(suit);

    assert.deepEqual(await player.getResourceGenerators(suit), []);
    await player.spendResources([RESOURCE_ANY, RESOURCE_ANY], event);

    assert.deepEqual(
        paymentDialog.data.cards.generators.map(({id}) => id),
        [suit.id]
    );
    assert.deepEqual(
        paymentDialog.data.cards.generators[0].abilities
            .filter(({isResource}) => isResource)
            .map(({resource}) => resource),
        [RESOURCE_WILD]
    );

    const payCostEffect = new PayCostEffect({
        generators: [suit],
        hand: [],
        selectedTarget: event,
        match,
    });
    await payCostEffect.payGenerators({player});

    assert.equal(suit.exhausted, true);
});
