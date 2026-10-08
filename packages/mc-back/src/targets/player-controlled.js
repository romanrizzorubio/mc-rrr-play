import {
    TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALLY,
    TARGET_ALL_ENGAGED_MINIONS,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_SUPPORT_YOU_CONTROL,
    TARGET_UPGRADE_YOU_CONTROL,
} from 'mc-shared';
import {checkCondition} from '../engine/utils.js';

export const playerControlledTargets = {
    [TARGET_ALL_ALLIES_YOU_CONTROL]: ({player}) => player.allies,
    [TARGET_ALL_CHARACTERS_YOU_CONTROL]: ({player, condition}) => {
        const characters = player.friends;

        return condition ?
            characters.filter(character => checkCondition(character, condition)) :
            characters;
    },
    [TARGET_ALLY]: ({player}) => player.allies,
    [TARGET_ALL_ENGAGED_MINIONS]: ({player}) => player.minions,
    [TARGET_FRIENDLY_CHARACTER]: ({player}) => player.friends,
    [TARGET_SUPPORT_YOU_CONTROL]: ({player}) => player.supports,
    [TARGET_UPGRADE_YOU_CONTROL]: ({player, condition}) => {
        const upgrades = player.upgrades;

        return condition ?
            upgrades.filter(upgrade => checkCondition(upgrade, condition)) :
            upgrades;
    },
};
