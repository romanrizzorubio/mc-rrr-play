import assert from 'node:assert/strict';
import {test} from 'node:test';

import {getAttackedTargets} from '../../src/utils/target-utils.js';

test('TARGET_ATTACKED returns the defender who actually took the attack', () => {
    const ally = {name: 'Ally'};
    const player = {name: 'Player'};
    const attack = {
        effect: {
            attacked: ally,
            selectedTarget: player,
        },
    };

    assert.deepEqual(
        getAttackedTargets({attack, match: {}}),
        [ally]
    );
});

test('TARGET_ATTACKED resolves an undefended player attack to their current character', () => {
    const hero = {name: 'Hero'};
    const player = {
        isPlayer: true,
        superhero: {
            currentSide: hero,
        },
    };
    const attack = {
        effect: {
            attacked: player,
            selectedTarget: player,
        },
    };

    assert.deepEqual(
        getAttackedTargets({attack, match: {}}),
        [hero]
    );
});

test('TARGET_ATTACKED follows the active villain after a stage transition', () => {
    const previousStage = {
        isInPlay: false,
        isVillain: true,
        name: 'Klaw',
    };
    const currentStage = {
        isInPlay: true,
        isVillain: true,
        name: 'Klaw',
    };
    const attack = {
        effect: {
            selectedTarget: previousStage,
        },
    };

    assert.deepEqual(
        getAttackedTargets({
            attack,
            match: {villain: currentStage},
        }),
        [currentStage]
    );
});
