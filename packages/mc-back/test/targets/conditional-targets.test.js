import assert from 'node:assert/strict';
import test from 'node:test';

import {
    TARGET_ALL_CHARACTERS,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_UPGRADE_YOU_CONTROL,
    TRAIT_AVENGER,
} from 'mc-shared';
import {groupTargets} from '../../src/targets/groups.js';
import {playerControlledTargets} from '../../src/targets/player-controlled.js';

test('character targets apply trait conditions', () => {
    const avenger = {
        id: 'avenger',
        traits: [TRAIT_AVENGER],
    };
    const nonAvenger = {
        id: 'non-avenger',
        traits: [],
    };
    const match = {
        enemies: [avenger],
        friends: [nonAvenger],
    };
    const player = {
        friends: [avenger, nonAvenger],
    };

    assert.deepEqual(
        groupTargets[TARGET_ALL_CHARACTERS]({
            match,
            condition: {traits: TRAIT_AVENGER},
        }),
        [avenger]
    );
    assert.deepEqual(
        playerControlledTargets[TARGET_ALL_CHARACTERS_YOU_CONTROL]({
            player,
            condition: {traits: TRAIT_AVENGER},
        }),
        [avenger]
    );
});

test('named character conditions match names and superhero identities in the intended scope', () => {
    const captainHeroSide = {
        name: 'Capitán América',
    };
    const steveRogersSide = {
        name: 'Steve Rogers',
    };
    const captainInAlterEgo = {
        mainName: 'Capitán América',
        name: 'Steve Rogers',
        sides: [steveRogersSide, captainHeroSide],
    };
    const captainAlly = {
        name: 'Capitán América',
    };
    const otherCharacter = {
        mainName: 'Ms. Marvel',
        name: 'Ms. Marvel',
    };
    const enemyCaptain = {
        name: 'Capitán América',
    };
    const match = {
        enemies: [enemyCaptain],
        friends: [captainInAlterEgo, captainAlly, otherCharacter],
    };

    assert.deepEqual(
        groupTargets[TARGET_ALL_CHARACTERS]({
            match,
            condition: {name: 'Capitán América'},
        }),
        [enemyCaptain, captainHeroSide, captainAlly]
    );
    assert.deepEqual(
        groupTargets[TARGET_ALL_FRIENDLY_CHARACTERS]({
            match,
            condition: {name: 'Capitán América'},
        }),
        [captainHeroSide, captainAlly]
    );
});

test('player upgrade targets apply name conditions', () => {
    const captainShield = {
        name: 'Escudo del Capitán América',
    };
    const otherUpgrade = {
        name: 'Otra mejora',
    };

    assert.deepEqual(
        playerControlledTargets[TARGET_UPGRADE_YOU_CONTROL]({
            player: {
                upgrades: [captainShield, otherUpgrade],
            },
            condition: {name: 'Escudo del Capitán América'},
        }),
        [captainShield]
    );
});
