import {
    TARGET_ALL_ALLIES_YOU_CONTROL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ALLY,
    TARGET_ALL_ENGAGED_MINIONS,
    TARGET_ALL_UPGRADES_YOU_CONTROL,
    TARGET_ANY_CHARACTER_YOU_CONTROL,
    TARGET_SUPPORT_YOU_CONTROL,
    TARGET_UPGRADE_ATTACHED_TO_YOUR_SUPERHERO,
    TARGET_UPGRADE_YOU_CONTROL,
} from 'mc-shared';
import {checkCondition} from '../engine/utils.js';
import {getPlayersFor} from '../utils/match-zone-utils.js';
import {filterTargetsByCondition} from '../utils/target-condition-utils.js';

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

export const playerControlledTargets = {
    [TARGET_ALL_ALLIES_YOU_CONTROL]: ({ability, player, condition}) => {
        const controller = ability?.card?.controller;

        // The trigger's player can differ from the controller of a persistent card.
        return filterTargetsByCondition(
            (controller?.isPlayer ? controller : player).allies, condition);
    },
    [TARGET_ALL_CHARACTERS_YOU_CONTROL]: ({player, condition}) => {
        return filterTargetsByCondition(player.friends, condition);
    },
    [TARGET_ALLY]: params =>
        playerControlledTargets[TARGET_ALL_ALLIES_YOU_CONTROL](params),
    [TARGET_ALL_ENGAGED_MINIONS]: ({
        match,
        player,
        params,
        targetPlayer,
        condition,
    }) => {
        const selectedTargetPlayer = params?.targetPlayer ?? targetPlayer;
        const selectedPlayer = selectedTargetPlayer?.isPlayer &&
            getPlayersFor(match, player).includes(selectedTargetPlayer) ?
            selectedTargetPlayer :
            player;

        return filterTargetsByCondition(selectedPlayer.minions, condition);
    },
    [TARGET_ALL_UPGRADES_YOU_CONTROL]: ({player, condition}) =>
        filterTargetsByCondition(player.upgrades, condition),
    [TARGET_ANY_CHARACTER_YOU_CONTROL]: ({condition, player}) =>
        filterTargetsByCondition(player.friends, condition),
    [TARGET_SUPPORT_YOU_CONTROL]: ({player, condition}) =>
        filterTargetsByCondition(player.supports, condition),
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
