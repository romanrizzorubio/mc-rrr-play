import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    TARGET_ALL_CHARACTERS,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALL_FRIENDLY_CHARACTERS,
    TARGET_SOURCE,
    TARGET_UPGRADE_ATTACHED_TO_YOUR_SUPERHERO,
    TARGET_UPGRADE_YOU_CONTROL,
    TRAIT_AVENGER,
    TRAIT_CAPTIVE,
    TRAIT_WEAPON,
} from 'mc-shared';
import {basicTargets} from '../../src/targets/basic.js';
import {groupTargets} from '../../src/targets/groups.js';
import {playerControlledTargets} from '../../src/targets/player-controlled.js';

describe('Conditional target resolution', () => {
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

test('source targets apply configured conditions', () => {
    const captive = {
        isAlly: true,
        traits: [TRAIT_CAPTIVE],
    };
    const otherCard = {
        isAlly: false,
        traits: [],
    };

    assert.deepEqual(
        basicTargets[TARGET_SOURCE]({
            condition: {
                isAlly: true,
                traits: TRAIT_CAPTIVE,
            },
            params: {
                cards: [otherCard, captive],
            },
            source: 'cards',
        }),
        [captive]
    );
});

test('named event targets use in-play names while other effects can reference identity sides', () => {
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
    const captainInHero = {
        mainName: 'Capitán América',
        name: 'Capitán América',
        currentSide: captainHeroSide,
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
    const alterEgoMatch = {
        enemies: [enemyCaptain],
        friends: [captainInAlterEgo, captainAlly, otherCharacter],
    };
    const heroMatch = {
        enemies: [],
        friends: [captainInHero, captainAlly],
    };

    assert.deepEqual(
        groupTargets[TARGET_ALL_CHARACTERS]({
            match: alterEgoMatch,
            condition: {name: 'Capitán América'},
        }),
        [enemyCaptain, captainHeroSide, captainAlly]
    );
    assert.deepEqual(
        groupTargets[TARGET_ALL_FRIENDLY_CHARACTERS]({
            match: alterEgoMatch,
            condition: {name: 'Capitán América'},
        }),
        [captainHeroSide, captainAlly]
    );
    assert.deepEqual(
        groupTargets[TARGET_ALL_CHARACTERS]({
            match: alterEgoMatch,
            condition: {name: 'Capitán América'},
            playCardEffect: {},
        }),
        [enemyCaptain, captainAlly]
    );
    assert.deepEqual(
        groupTargets[TARGET_ALL_FRIENDLY_CHARACTERS]({
            match: alterEgoMatch,
            condition: {name: 'Capitán América'},
            playCardEffect: {},
        }),
        [captainAlly]
    );
    assert.deepEqual(
        groupTargets[TARGET_ALL_CHARACTERS]({
            match: heroMatch,
            condition: {name: 'Capitán América'},
            playCardEffect: {},
        }),
        [captainHeroSide, captainAlly]
    );
    assert.deepEqual(
        groupTargets[TARGET_ALL_FRIENDLY_CHARACTERS]({
            match: heroMatch,
            condition: {name: 'Capitán América'},
            playCardEffect: {},
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

test('your superhero upgrade targets include unlinked and both identity-side upgrades only', () => {
    const hero = {id: 'hero'};
    const alterEgo = {id: 'alter-ego'};
    const ally = {id: 'ally'};
    const unlinkedWeapon = {
        id: 'unlinked-weapon',
        traits: [TRAIT_WEAPON],
    };
    const heroWeapon = {
        attachedTo: hero,
        id: 'hero-weapon',
        traits: [TRAIT_WEAPON],
    };
    const alterEgoWeapon = {
        attachedTo: alterEgo,
        id: 'alter-ego-weapon',
        traits: [TRAIT_WEAPON],
    };
    const allyWeapon = {
        attachedTo: ally,
        id: 'ally-weapon',
        traits: [TRAIT_WEAPON],
    };
    const player = {
        isHero: false,
        superhero: {
            currentSide: alterEgo,
            sides: [alterEgo, hero],
        },
        upgrades: [
            unlinkedWeapon,
            heroWeapon,
            alterEgoWeapon,
            allyWeapon,
        ],
    };

    assert.deepEqual(
        playerControlledTargets[TARGET_UPGRADE_ATTACHED_TO_YOUR_SUPERHERO]({
            player,
            condition: {traits: TRAIT_WEAPON},
        }),
        [unlinkedWeapon, heroWeapon, alterEgoWeapon]
    );
});
});
