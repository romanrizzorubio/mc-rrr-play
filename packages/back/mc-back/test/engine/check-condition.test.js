import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    TRAIT_AVENGER,
    TRAIT_TECH,
    TRAIT_WEAPON,
} from 'mc-shared';
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

    test('some conditions require at least one array item to match', () => {
        const condition = {
            'character.attached': {
                'some': {
                    'isUpgrade': true,
                    'traits': TRAIT_WEAPON,
                },
            },
        };

        assert.equal(checkCondition({
            character: {
                attached: [
                    {isUpgrade: false, traits: [TRAIT_WEAPON]},
                    {isUpgrade: true, traits: [TRAIT_WEAPON]},
                ],
            },
        }, condition), true);
        assert.equal(checkCondition({
            character: {
                attached: [
                    {isUpgrade: true, traits: [TRAIT_TECH]},
                    {isUpgrade: false, traits: [TRAIT_WEAPON]},
                ],
            },
        }, condition), false);
        assert.equal(checkCondition({
            character: {attached: []},
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

    test('conditions compare finite numeric values from separate runtime paths', () => {
        const condition = {
            'hero.life': {
                operator: 'gte',
                path: 'hero.initialLife',
            },
        };

        assert.equal(checkCondition({
            hero: {life: 10, initialLife: 10},
        }, condition), true);
        assert.equal(checkCondition({
            hero: {life: 9, initialLife: 10},
        }, condition), false);
        assert.equal(checkCondition({
            hero: {life: 10},
        }, condition), false);
        assert.equal(checkCondition({
            hero: {life: Infinity, initialLife: 10},
        }, condition), false);
        assert.equal(checkCondition({
            hero: {life: 4, initialLife: 5},
        }, {
            'hero.life': {
                operator: 'lt',
                path: 'hero.initialLife',
            },
        }), true);
    });

    test('conditions compare string values from separate runtime paths', () => {
        const condition = {
            'discardedCard.type': {
                operator: 'eq',
                path: 'namedCardType',
            },
        };

        assert.equal(checkCondition({
            discardedCard: {type: CARD_TYPE_ALLY},
            namedCardType: CARD_TYPE_ALLY,
        }, condition), true);
        assert.equal(checkCondition({
            discardedCard: {type: CARD_TYPE_EVENT},
            namedCardType: CARD_TYPE_ALLY,
        }, condition), false);
        assert.equal(checkCondition({
            discardedCard: {},
            namedCardType: undefined,
        }, condition), false);
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
