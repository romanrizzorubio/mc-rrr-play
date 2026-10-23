import {
    TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALLY,
    TARGET_ALL_ENGAGED_MINIONS,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_SUPPORT_YOU_CONTROL,
    TARGET_UPGRADE_ATTACHED_TO_YOUR_SUPERHERO,
    TARGET_UPGRADE_YOU_CONTROL,
} from 'mc-shared';
import {checkCondition} from '../engine/utils.js';

const isLinkedToYourSuperhero = (upgrade, superhero) => {
    const {attachedTo} = upgrade;

    if (!attachedTo) {
        return true;
    }

    const attachedSide = attachedTo.currentSide ?? attachedTo;

    return attachedTo === superhero ||
        attachedSide === superhero.currentSide ||
        superhero.sides?.includes(attachedSide) ||
        attachedTo.parent === superhero;
};

const filterByCondition = (characters, condition) =>
    condition ?
        characters.filter(character => checkCondition(character, condition)) :
        characters;

export const playerControlledTargets = {
    [TARGET_ALL_ALLIES_YOU_CONTROL]: ({ability, player}) => {
        const controller = ability?.card?.controller;

        // The trigger's player can differ from the controller of a persistent card.
        return (controller?.isPlayer ? controller : player).allies;
    },
    [TARGET_ALL_CHARACTERS_YOU_CONTROL]: ({player, condition}) => {
        return filterByCondition(player.friends, condition);
    },
    [TARGET_ALLY]: ({player}) => player.allies,
    [TARGET_ALL_ENGAGED_MINIONS]: ({player}) => player.minions,
    [TARGET_FRIENDLY_CHARACTER]: ({condition, player}) =>
        filterByCondition(player.friends, condition),
    [TARGET_SUPPORT_YOU_CONTROL]: ({player}) => player.supports,
    [TARGET_UPGRADE_ATTACHED_TO_YOUR_SUPERHERO]: ({condition, player}) => {
        const superhero = player?.superhero;
        if (!superhero) {
            return [];
        }

        return player.upgrades.filter(upgrade => {
            return isLinkedToYourSuperhero(upgrade, superhero) &&
                (!condition || checkCondition(upgrade, condition));
        });
    },
    [TARGET_UPGRADE_YOU_CONTROL]: ({player, condition}) => {
        const upgrades = player.upgrades;

        return condition ?
            upgrades.filter(upgrade => checkCondition(upgrade, condition)) :
            upgrades;
    },
};
