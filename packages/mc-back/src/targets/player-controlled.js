import {
    TARGET_ALLY,
    TARGET_ALL_ENGAGED_MINIONS,
    TARGET_SUPPORT_YOU_CONTROL,
    TARGET_UPGRADE_YOU_CONTROL,
} from 'mc-shared';

export const playerControlledTargets = {
    [TARGET_ALLY]: ({player}) => player.allies,
    [TARGET_ALL_ENGAGED_MINIONS]: ({player}) => player.minions,
    [TARGET_SUPPORT_YOU_CONTROL]: ({player}) => player.supports,
    [TARGET_UPGRADE_YOU_CONTROL]: ({player}) => player.upgrades,
};
