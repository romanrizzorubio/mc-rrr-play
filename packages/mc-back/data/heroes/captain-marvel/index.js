import {
    alphaFlightStation,
    captainMarvelCard,
    captainMarvelsHelmet,
    carolDanversCard, cosmicFlight,
    crisisInterdiction,
    energyAbsorption, energyChannel, familyEmergency, kreeManipulator,
    photonicBlast,
    spiderWoman, thePsycheMagnitron, yonRogg, yonRoggsTreason,
} from './cards.js';
import {precon} from './precon.js';

export const heroConfig = {
    sides: [
        carolDanversCard,
        captainMarvelCard,
    ],
    cards: [
        {count: 1, card: spiderWoman},
        {count: 3, card: crisisInterdiction},
        {count: 3, card: photonicBlast},
        {count: 2, card: energyAbsorption},
        {count: 1, card: alphaFlightStation},
        {count: 1, card: captainMarvelsHelmet},
        {count: 2, card: cosmicFlight},
        {count: 2, card: energyChannel},
    ],
    precon,
    obligation: {count: 1, card: familyEmergency},
    nemesis: [
        {count: 1, card: thePsycheMagnitron},
        {count: 1, card: yonRogg},
        {count: 2, card: kreeManipulator},
        {count: 1, card: yonRoggsTreason},
    ]
};
