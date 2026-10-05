import {
    TARGET_ATTACKED,
    TARGET_ALL_SCHEMES,
    TARGET_CONDITION_CARD,
    TARGET_MAIN_SCHEME,
    TARGET_MINION_HIGHEST_HP,
    TARGET_MINION_HIGHEST_PRINTED_HP,
    TARGET_SCHEME,
} from 'mc-shared';

export const encounterTargets = {
    [TARGET_ATTACKED]: ({attack}) => [attack.effect.selectedTarget],
    [TARGET_ALL_SCHEMES]: ({match}) => match.schemes,
    [TARGET_CONDITION_CARD]: ({match, condition}) => match.searchCards(condition),
    [TARGET_MAIN_SCHEME]: ({match}) => [match.mainScheme],
    [TARGET_MINION_HIGHEST_HP]: ({match}) => {
        const minions = match.minions;
        if (minions.length) {
            const highestHP = Math.max(...minions.map(m => m.currentSide.hitPoints));
            return minions.filter(m => m.currentSide.hitPoints === highestHP);
        }
        return [];
    },
    [TARGET_MINION_HIGHEST_PRINTED_HP]: ({effect, match, params}) => {
        const minions = match.minions.filter(minion =>
            !effect?.validTarget || effect.validTarget.filter(minion, params));
        if (minions.length) {
            const highestHP = Math.max(...minions.map(minion =>
                minion.currentSide.card.hitPoints));
            return minions.filter(minion =>
                minion.currentSide.card.hitPoints === highestHP);
        }
        return [];
    },
    [TARGET_SCHEME]: ({match}) => match.schemes,
};
