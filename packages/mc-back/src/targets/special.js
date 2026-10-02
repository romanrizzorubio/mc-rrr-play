import {TARGET_BY_TITLE} from 'mc-shared';

export const specialTargets = {
    [TARGET_BY_TITLE]: ({ability, match}) => {
        const byTitle = (card) => card.name === ability.effect.title;

        const targets = [];

        Object.values(match.triggerCards).forEach(card => {
            if (byTitle(card)) {
                const target = card.parent || card;
                if (!targets.includes(target)) {
                    targets.push(target);
                }
            }
        });

        return targets;
    },
};
