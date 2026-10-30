import {PLACE_IN_PLAY} from 'mc-shared';
import {
    getCharactersFor,
    getSchemesFor,
} from '../../utils/match-zone-utils.js';

export const inPlayPlaces = {
    [PLACE_IN_PLAY]: ({match, player, title}) =>
        match.searchCards({name: title}, player)
            .concat(
                getSchemesFor(match, player),
                getCharactersFor(match, player)
            ),
};
