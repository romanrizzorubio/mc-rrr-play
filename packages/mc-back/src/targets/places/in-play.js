import {PLACE_IN_PLAY} from 'mc-shared';

export const inPlayPlaces = {
    [PLACE_IN_PLAY]: ({match, title}) => match.searchCards({name: title})
        .concat(match.schemes, match.characters),
};
