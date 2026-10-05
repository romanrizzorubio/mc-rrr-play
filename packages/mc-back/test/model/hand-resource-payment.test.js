import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_WILD,
} from 'mc-shared';
import aggressionResources from '../../../mc-data/seed/catalog/aspects/aggression/resources.js';
import {Hand} from '../../src/model/match/hand.js';
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
