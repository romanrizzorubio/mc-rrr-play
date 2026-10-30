import {
    TARGET_ALL_SCHEMES,
    TARGET_CONDITION_CARD,
    TARGET_MAIN_SCHEME,
    TARGET_SCHEME,
    TARGET_SIDE_SCHEME,
    TARGET_UNUSED_MAIN_SCHEME,
    TARGET_ATTACKED,
    TARGET_ATTACKER,
    TARGET_ENEMY_HIGHEST_PRINTED_HP,
} from 'mc-shared';
import {getAttackedTargets} from '../utils/target-utils.js';
import {filterTargetsByCondition} from '../utils/target-condition-utils.js';
import {
    getEnemiesFor,
    getMainSchemeFor,
    getSchemesFor,
    getSideSchemesFor,
} from '../utils/match-zone-utils.js';

export const encounterTargets = {
    [TARGET_ATTACKED]: getAttackedTargets,
    [TARGET_ATTACKER]: ({attack}) => attack?.character ? [attack.character] : [],
    [TARGET_ALL_SCHEMES]: ({match, player, condition}) =>
        filterTargetsByCondition(getSchemesFor(match, player), condition),
    [TARGET_ENEMY_HIGHEST_PRINTED_HP]: ({effect, match, params, player}) => {
        const enemies = getEnemiesFor(match, player).filter(enemy =>
            enemy && (!effect?.validTarget || effect.validTarget.filter(enemy, params)));
        if (!enemies.length) {
            return [];
        }

        const highestHP = Math.max(...enemies.map(enemy =>
            enemy.currentSide.card.hitPoints));

        return enemies.filter(enemy =>
            enemy.currentSide.card.hitPoints === highestHP);
    },
    [TARGET_CONDITION_CARD]: ({match, condition, player}) =>
        match.searchCards(condition, player),
    [TARGET_MAIN_SCHEME]: ({match, player}) => {
        const mainScheme = getMainSchemeFor(match, player);
        return mainScheme ? [mainScheme] : [];
    },
    [TARGET_UNUSED_MAIN_SCHEME]: ({match}) => {
        const {scenario} = match;
        const usedMainSchemes = scenario?.usedMainSchemes ?? new Set();

        return (scenario?.allMainSchemes ?? []).filter(mainScheme =>
            !usedMainSchemes.has(mainScheme));
    },
    [TARGET_SCHEME]: ({match, player, condition}) =>
        filterTargetsByCondition(getSchemesFor(match, player), condition),
    [TARGET_SIDE_SCHEME]: ({match, player, condition}) =>
        filterTargetsByCondition(getSideSchemesFor(match, player), condition),
};
