import {inPlayPlaces} from './in-play.js';
import {playerPlaces} from './player.js';
import {scenarioPlaces} from './scenario.js';

export const placesMap = {
    ...inPlayPlaces,
    ...playerPlaces,
    ...scenarioPlaces,
};

export const getCardsAtLocation = (location, params) => {
    if (!Object.hasOwn(placesMap, location)) {
        throw new Error(`Ubicación no compatible con TARGET_BY_TITLE: ${location}.`);
    }

    return placesMap[location](params);
};
