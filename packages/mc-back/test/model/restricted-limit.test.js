import assert from 'node:assert/strict';
import test from 'node:test';

import {enforceRestrictedLimit} from '../../src/utils/enforce-restricted-limit.js';
import {Keywords} from '../../src/model/commons/keywords.js';

test('Restricted cards are limited to two per player', async () => {
    const cards = [];
    const player = {
        isPlayer: true,
        gameZone: {
            cards,
            async refresh() {},
        },
        deck: {
            refresh() {},
        },
    };
    cards.push(...[0, 1, 2].map(index => ({
        id: `restricted-${index}`,
        name: `Restricted ${index}`,
        abilities: [],
        attachedTo: undefined,
        controller: player,
        restricted: true,
        toObj() {
            return {
                id: this.id,
                name: this.name,
            };
        },
        async discard() {
            cards.splice(cards.indexOf(this), 1);
        },
    })));

    const match = {
        triggerCards: {},
        async openDialog({data}) {
            return {
                selected: data.cards[0],
            };
        },
    };

    await enforceRestrictedLimit(player, match);

    assert.equal(cards.length, 2);
    assert.equal(cards.every(card => card.restricted), true);
});

test('Restricted is false unless explicitly configured', () => {
    assert.equal(new Keywords({}).restricted, false);
    assert.equal(new Keywords({restricted: true}).restricted, true);
});
