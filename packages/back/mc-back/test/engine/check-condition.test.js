import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {TRAIT_AVENGER} from 'mc-shared';
import {checkCondition, path} from '../../src/engine/utils.js';

describe('checkCondition', () => {
    test('every conditions require every array item to match', () => {
        const condition = {
            'player.allies': {
                'every': {
                    'traits': TRAIT_AVENGER
                }
            }
        };

        assert.equal(checkCondition({player: {allies: []}}, condition), true);
        assert.equal(checkCondition({
            player: {
                allies: [
                    {traits: [TRAIT_AVENGER]},
                    {traits: [TRAIT_AVENGER, 'Soldado']}
                ]
            }
        }, condition), true);
        assert.equal(checkCondition({
            player: {
                allies: [
                    {traits: [TRAIT_AVENGER]},
                    {traits: ['Soldado']}
                ]
            }
        }, condition), false);
    });

    test('condition alternatives match when any alternative is true', () => {
        const condition = [
            {'player.deck.cards.*.name': 'Mjolnir'},
            {'player.deck.discardPile.*.name': 'Mjolnir'},
        ];

        assert.equal(checkCondition({
            player: {
                deck: {
                    cards: [],
                    discardPile: [],
                },
            },
        }, condition), false);
        assert.equal(checkCondition({
            player: {
                deck: {
                    cards: [{name: 'Mjolnir'}],
                    discardPile: [],
                },
            },
        }, condition), true);
        assert.equal(checkCondition({
            player: {
                deck: {
                    cards: [],
                    discardPile: [{name: 'Mjolnir'}],
                },
            },
        }, condition), true);
    });

    test('name title conditions match a parenthetical subtitle but not a longer title', () => {
        const condition = {
            name: {
                operator: 'matchesTitle',
                value: 'Kang',
            },
        };

        assert.equal(checkCondition({name: 'Kang'}, condition), true);
        assert.equal(checkCondition({name: 'Kang (Rama-Tut)'}, condition), true);
        assert.equal(checkCondition({name: 'Kang (Iron Lad)'}, condition), true);
        assert.equal(checkCondition({name: 'Kangaroo'}, condition), false);
        assert.equal(checkCondition({name: 'Kang (the Conqueror) II'}, condition), false);
    });

    test('paths expand wildcards over arrays and keep defined values', () => {
        const firstPlayer = {id: 'first'};
        const secondPlayer = {id: 'second'};
        const params = {
            effects: [{
                attacks: [
                    {selectedTarget: firstPlayer},
                    {defender: {owner: secondPlayer}},
                    {selectedTarget: undefined},
                ],
            }],
        };

        assert.deepEqual(
            path(params, 'effects.0.attacks.*.selectedTarget'),
            [firstPlayer]
        );
        assert.deepEqual(
            path(params, 'effects.0.attacks.*.defender.owner'),
            [secondPlayer]
        );
        assert.deepEqual(path(params, 'effects.0.attacks.*.missing'), []);
    });
});
