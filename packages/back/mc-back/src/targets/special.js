import {TARGET_BY_TITLE} from 'mc-shared';
import {getCardsAtLocation} from './places/index.js';

export const specialTargets = {
    [TARGET_BY_TITLE]: ({match, player, targetEffect}) => {
        const {locations, title} = targetEffect;
        if (!title || !Array.isArray(locations) || !locations.length) {
            throw new Error('TARGET_BY_TITLE requiere title y locations en los parámetros del efecto.');
        }

        const targets = [];
        const cards = locations.flatMap(location =>
            getCardsAtLocation(location, {match, player, title}));

        cards.forEach(card => {
            if (card.name === title) {
                const target = card.parent || card;
                if (!targets.includes(target)) {
                    targets.push(target);
                }
            }
        });

        return targets;
    },
};
