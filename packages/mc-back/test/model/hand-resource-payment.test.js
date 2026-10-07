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
