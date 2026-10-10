import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    TRAIT_AERIAL,
    TRAIT_ARMOR,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_CONDITION,
    TRAIT_DEFENDER,
    TRAIT_DEFENSE,
    TRAIT_DROID,
    TRAIT_LOCATION,
    TRAIT_SKILL,
    TRAIT_SPY,
    TRAIT_TACTIC,
    TRAIT_THWART,
    TRAIT_TITLE,
    TRAIT_VEHICLE,
    translateTrait,
} from '../index.js';

test('translates supported traits to Spanish labels', () => {
    const translations = new Map([
        [TRAIT_THWART, 'Intervención'],
        [TRAIT_ATTACK, 'Ataque'],
        [TRAIT_ARMOR, 'Armadura'],
        [TRAIT_AVENGER, 'Vengador'],
        [TRAIT_CONDITION, 'Alteración'],
        [TRAIT_DEFENDER, 'Defensor'],
        [TRAIT_DEFENSE, 'Defensa'],
        [TRAIT_LOCATION, 'Lugar'],
        [TRAIT_SKILL, 'Habilidad'],
        [TRAIT_AERIAL, 'Aéreo'],
        [TRAIT_TACTIC, 'Táctica'],
        [TRAIT_SPY, 'Espía'],
        [TRAIT_VEHICLE, 'Vehículo'],
        [TRAIT_TITLE, 'Título'],
        [TRAIT_DROID, 'Androide'],
    ]);

    translations.forEach((label, trait) => {
        assert.equal(translateTrait(trait), label);
    });
});

test('preserves labels for unknown traits', () => {
    assert.equal(translateTrait('custom trait'), 'custom trait');
});
