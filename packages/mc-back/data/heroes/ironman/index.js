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
    pepperPotts
} from "./cards.js";
import {ASPECT_LEADERSHIP} from "../../aspect/aspects.js";
import {precon} from "./precon.js";

export const heroConfig = {
    hero: ironmanCard,
    alterego: tonyStarkCard,
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
    obligation: null,
    nemesis: []
}
