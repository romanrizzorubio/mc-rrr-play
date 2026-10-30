import {
    PLACE_ASIDE_MATCH,
    PLACE_ENCOUNTER_DECK_CARDS,
    PLACE_ENCOUNTER_DISCARD,
    PLACE_SCENARIO_ZONE,
} from 'mc-shared';
import {getScenarioZone} from '../../utils/match-zone-utils.js';

export const scenarioPlaces = {
    [PLACE_ASIDE_MATCH]: ({match}) => match.scenario.apart,
    [PLACE_ENCOUNTER_DECK_CARDS]: ({match}) => match.scenario.deck.cards,
    [PLACE_ENCOUNTER_DISCARD]: ({match}) => match.scenario.deck.discardPile,
    [PLACE_SCENARIO_ZONE]: ({match, player}) => {
        const zone = getScenarioZone(match, player);
        return zone ?
            zone.cards.concat(zone.schemes, zone.currentVillain)
                .filter(Boolean) :
            [];
    },
};
