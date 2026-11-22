import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {CannotAttackEffect} from '../../src/effects/cannot-attack-effect.js';

describe('CannotAttackEffect', () => {
    test('blocks only attack effects from the configured character and target', () => {
        const drax = {name: 'Drax'};
        const validation = new CannotAttackEffect({
            targetCondition: {isMinion: true},
            effectCondition: {'effect.character.name': 'Drax'},
        });
        const attack = {
            character: drax,
            isAttack: true,
        };

        assert.equal(validation.isInvalidTarget({
            effect: attack,
            targetCard: {isMinion: true},
        }), true);
        assert.equal(validation.isInvalidTarget({
            effect: {...attack, isAttack: false},
            targetCard: {isMinion: true},
        }), false);
        assert.equal(validation.isInvalidTarget({
            effect: {...attack, character: {name: 'Gamora'}},
            targetCard: {isMinion: true},
        }), false);
        assert.equal(validation.isInvalidTarget({
            effect: attack,
            targetCard: {isMinion: false},
        }), false);
    });

    test('respects blank text on its source card', () => {
        const validation = new CannotAttackEffect({
            targetCondition: {isMinion: true},
        });
        validation.ability = {card: {printedTextBlank: true}};

        assert.equal(validation.isInvalidTarget({
            effect: {isAttack: true},
            targetCard: {isMinion: true},
        }), false);
    });
});
