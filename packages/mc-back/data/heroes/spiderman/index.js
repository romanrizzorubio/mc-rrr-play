import {
    auntMay,
    backflip,
    blackCat,
    enhancedSpiderSense,
    evictionNotice,
    highwayRobbery,
    peterParkerCard,
    spidermanCard,
    spiderTracer,
    sweepingSwoop,
    swingingWebKick,
    theVulturePlans,
    vulture,
    webbedUp,
    webShooter
} from './cards.js';
import {precon} from './precon.js';

export const heroConfig = {
    sides: [
        peterParkerCard,
        spidermanCard,
    ],
    cards: [
        {count: 1, card: blackCat},
        {count: 2, card: backflip},
        {count: 2, card: enhancedSpiderSense},
        {count: 3, card: swingingWebKick},
        {count: 1, card: auntMay},
        {count: 2, card: spiderTracer},
        {count: 2, card: webShooter},
        {count: 2, card: webbedUp}
    ],
    precon,
    obligation: {count: 1, card: evictionNotice},
    nemesis: [
        {count: 1, card: highwayRobbery},
        {count: 1, card: vulture},
        {count: 2, card: sweepingSwoop},
        {count: 1, card: theVulturePlans}
    ]
};
