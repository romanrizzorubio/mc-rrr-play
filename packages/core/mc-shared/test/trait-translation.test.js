import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    TRAIT_AERIAL,
    TRAIT_ARROW,
    TRAIT_ASGARD,
    TRAIT_ARMOR,
    TRAIT_ARTIFACT,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_BUSINESSMAN,
    TRAIT_CAPTIVE,
    TRAIT_CONDITION,
    TRAIT_DEFENDER,
    TRAIT_DEFENSE,
    TRAIT_DROID,
    TRAIT_ELITE,
    TRAIT_GENIUS,
    TRAIT_GOBLIN,
    TRAIT_GIANT,
    TRAIT_HEROFORHIRE,
    TRAIT_ICE,
    TRAIT_INVOCATION,
    TRAIT_ITEM,
    TRAIT_LOCATION,
    TRAIT_METAL,
    TRAIT_MYSTIC,
    TRAIT_MUTATED,
    TRAIT_OLYMPUS,
    TRAIT_PERSONA,
    TRAIT_PREPARATION,
    TRAIT_SCIENTIST,
    TRAIT_SKILL,
    TRAIT_STONE,
    TRAIT_SUPERPOWER,
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

describe('trait translations', () => {
    test('translates supported traits to Spanish labels', () => {
        const translations = new Map([
            [TRAIT_THWART, 'Intervención'],
            [TRAIT_ATTACK, 'Ataque'],
            [TRAIT_ARMOR, 'Armadura'],
            [TRAIT_ARTIFACT, 'Artefacto'],
            [TRAIT_AVENGER, 'Vengador'],
            [TRAIT_BUSINESSMAN, 'Empresario'],
            [TRAIT_CAPTIVE, 'Cautivo'],
            [TRAIT_CONDITION, 'Alteración'],
            [TRAIT_DEFENDER, 'Defensor'],
            [TRAIT_DEFENSE, 'Defensa'],
            [TRAIT_ELITE, 'Élite'],
            [TRAIT_GENIUS, 'Genio'],
            [TRAIT_LOCATION, 'Lugar'],
            [TRAIT_SKILL, 'Habilidad'],
            [TRAIT_AERIAL, 'Aéreo'],
            [TRAIT_ARROW, 'Flecha'],
            [TRAIT_ASGARD, 'Asgard'],
            [TRAIT_TACTIC, 'Táctica'],
            [TRAIT_SPY, 'Espía'],
            [TRAIT_SPELL, 'Hechizo'],
            [TRAIT_VEHICLE, 'Vehículo'],
            [TRAIT_TECH, 'Tecnología'],
            [TRAIT_TITLE, 'Título'],
            [TRAIT_DROID, 'Androide'],
            [TRAIT_GOBLIN, 'Duende'],
            [TRAIT_HEROFORHIRE, 'Héroe de alquiler'],
            [TRAIT_GIANT, 'Gigante'],
            [TRAIT_ICE, 'Hielo'],
            [TRAIT_INVOCATION, 'Invocación'],
            [TRAIT_ITEM, 'Objeto'],
            [TRAIT_METAL, 'Metal'],
            [TRAIT_MYSTIC, 'Místico'],
            [TRAIT_PERSONA, 'Individuo'],
            [TRAIT_PREPARATION, 'Planificación'],
            [TRAIT_SCIENTIST, 'Científico'],
            [TRAIT_SUPERPOWER, 'Superpoder'],
            [TRAIT_OLYMPUS, 'Olimpo'],
            [TRAIT_STONE, 'Piedra'],
            [TRAIT_MUTATED, 'Mutado'],
            [TRAIT_WOOD, 'Madera'],
        ]);

        translations.forEach((label, trait) => {
            assert.equal(translateTrait(trait), label);
        });
    });

    test('preserves labels for unknown traits', () => {
        assert.equal(translateTrait('custom trait'), 'custom trait');
    });
});
