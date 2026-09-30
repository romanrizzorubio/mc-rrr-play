import {ASPECT_LEADERSHIP} from '../../aspect/aspects.js';

import {
    ironmanCard,
    tonyStarkCard,
    repulsorBlast,
    supersonicPunch,
    poweredRocketPunch,
    arcReactor,
    markVArmor,
    markVHelmet,
    rocketBoots,
    tacticalDisplay,
    starkTower,
    pepperPotts,
    businessProblemsCard,
    imminentOverloadCard,
    whiplashCard,
    electricWhipAttackCard,
    electromagneticBacklashCard,
} from './cards.js';
import {precon} from './precon.js';

export const heroConfig = {
    aspect: ASPECT_LEADERSHIP,
    sides: [
        tonyStarkCard,
        ironmanCard,
    ],
    cards: [
        {card: repulsorBlast, count: 2},
        {card: supersonicPunch, count: 2},
        {card: poweredRocketPunch, count: 2},
        {card: arcReactor, count: 1},
        {card: markVArmor, count: 1},
        {card: markVHelmet, count: 1},
        {card: rocketBoots, count: 2},
        {card: tacticalDisplay, count: 2},
        {card: starkTower, count: 1},
        {card: pepperPotts, count: 1}
    ],
    precon,
    obligation: {card: businessProblemsCard, count: 1},
    nemesis: [
        {card: imminentOverloadCard, count: 1},
        {card: whiplashCard, count: 1},
        {card: electricWhipAttackCard, count: 2},
        {card: electromagneticBacklashCard, count: 1},
    ]
};
