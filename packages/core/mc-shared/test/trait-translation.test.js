import assert from 'node:assert/strict';
import {test} from 'node:test';

import {
    TRAIT_AERIAL,
    TRAIT_ASGARD,
    TRAIT_ARMOR,
    TRAIT_ARTIFACT,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_BUSINESSMAN,
    TRAIT_CONDITION,
    TRAIT_DEFENDER,
    TRAIT_DEFENSE,
    TRAIT_DROID,
    TRAIT_ELITE,
    TRAIT_GOBLIN,
    TRAIT_GIANT,
    TRAIT_ICE,
    TRAIT_INVOCATION,
    TRAIT_LOCATION,
    TRAIT_METAL,
    TRAIT_MYSTIC,
    TRAIT_OLYMPUS,
    TRAIT_PERSONA,
    TRAIT_PREPARATION,
    TRAIT_SKILL,
    TRAIT_STONE,
    TRAIT_SPY,
    TRAIT_SPELL,
    TRAIT_TACTIC,
    TRAIT_THWART,
    TRAIT_TITLE,
    TRAIT_VEHICLE,
    TRAIT_TECH,
    translateTrait,
    TRAIT_WOOD,
} from '../index.js';

test('translates supported traits to Spanish labels', () => {
    const translations = new Map([
        [TRAIT_THWART, 'Intervención'],
        [TRAIT_ATTACK, 'Ataque'],
        [TRAIT_ARMOR, 'Armadura'],
        [TRAIT_ARTIFACT, 'Artefacto'],
        [TRAIT_AVENGER, 'Vengador'],
        [TRAIT_BUSINESSMAN, 'Empresario'],
        [TRAIT_CONDITION, 'Alteración'],
        [TRAIT_DEFENDER, 'Defensor'],
        [TRAIT_DEFENSE, 'Defensa'],
        [TRAIT_ELITE, 'Élite'],
        [TRAIT_LOCATION, 'Lugar'],
        [TRAIT_SKILL, 'Habilidad'],
        [TRAIT_AERIAL, 'Aéreo'],
        [TRAIT_ASGARD, 'Asgard'],
        [TRAIT_TACTIC, 'Táctica'],
        [TRAIT_SPY, 'Espía'],
        [TRAIT_SPELL, 'Hechizo'],
        [TRAIT_VEHICLE, 'Vehículo'],
        [TRAIT_TECH, 'Tecnología'],
        [TRAIT_TITLE, 'Título'],
        [TRAIT_DROID, 'Androide'],
        [TRAIT_GOBLIN, 'Duende'],
        [TRAIT_GIANT, 'Gigante'],
        [TRAIT_ICE, 'Hielo'],
        [TRAIT_INVOCATION, 'Invocación'],
        [TRAIT_METAL, 'Metal'],
        [TRAIT_MYSTIC, 'Místico'],
        [TRAIT_PERSONA, 'Individuo'],
        [TRAIT_PREPARATION, 'Planificación'],
        [TRAIT_OLYMPUS, 'Olimpo'],
        [TRAIT_STONE, 'Piedra'],
        [TRAIT_WOOD, 'Madera'],
    ]);

    translations.forEach((label, trait) => {
        assert.equal(translateTrait(trait), label);
    });
});

test('preserves labels for unknown traits', () => {
    assert.equal(translateTrait('custom trait'), 'custom trait');
});
