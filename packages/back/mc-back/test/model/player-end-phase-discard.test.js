import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {Player} from '../../src/model/match/player.js';

describe('end of player phase hand discard', () => {
    test('discards every selected card from hand', async () => {
        const superhero = {
            match: {
                triggerCards: {},
            },
        };
        const player = new Player({name: 'Hulka', superhero});
        const cards = ['Gata Infernal', 'Tenacidad', 'A', 'B', 'C', 'D']
            .map((name, index) => ({
                id: `card-${index}`,
                isEvent: false,
                name,
                toObj() {
                    return {
                        id: this.id,
                        name: this.name,
                    };
                },
            }));
        const selected = cards.slice(0, 2);

        player.hand.cards.push(...cards);
        player.hand.refresh = async () => {};
        player.openDialog = async () => ({
            selected: selected.map(({id}) => ({id})),
        });
        player.getHandSize = async () => 4;
        player.deck = {
            discard: async () => {},
            refresh: () => {},
        };
        player.readyAllCards = async () => {};
        player.gameZone = {
            cards: [],
        };

        await player.runEndPlayersPhase({});

        assert.deepEqual(
            player.hand.cards.map(({id}) => id),
            cards.slice(2).map(({id}) => id)
        );
    });
});
