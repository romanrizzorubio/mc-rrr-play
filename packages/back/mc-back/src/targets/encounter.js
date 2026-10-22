import {
    TARGET_ALL_SCHEMES,
    TARGET_CONDITION_CARD,
    TARGET_MAIN_SCHEME,
    TARGET_SCHEME,
    TARGET_SIDE_SCHEME,
    TARGET_ATTACKED,
    TARGET_ATTACKER,
    TARGET_ENEMY_HIGHEST_PRINTED_HP,
} from 'mc-shared';
import {getAttackedTargets} from '../utils/target-utils.js';

export const encounterTargets = {
    [TARGET_ATTACKED]: getAttackedTargets,
    [TARGET_ATTACKER]: ({attack}) => attack?.character ? [attack.character] : [],
    [TARGET_ALL_SCHEMES]: ({match}) => match.schemes,
    [TARGET_ENEMY_HIGHEST_PRINTED_HP]: ({effect, match, params}) => {
        const enemies = [match.villain, ...match.minions].filter(enemy =>
            enemy && (!effect?.validTarget || effect.validTarget.filter(enemy, params)));
        if (!enemies.length) {
            return [];
        }

        const highestHP = Math.max(...enemies.map(enemy =>
            enemy.currentSide.card.hitPoints));

        return enemies.filter(enemy =>
            enemy.currentSide.card.hitPoints === highestHP);
    },
    [TARGET_CONDITION_CARD]: ({match, condition}) => match.searchCards(condition),
    [TARGET_MAIN_SCHEME]: ({match}) => [match.mainScheme],
    [TARGET_SCHEME]: ({match}) => match.schemes,
    [TARGET_SIDE_SCHEME]: ({match}) => match.sideSchemes,
};
