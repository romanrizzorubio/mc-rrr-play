import {advance, assault, caughtOffGuard, gangUp, shadowOfThePast} from "./cards.js";
import {exhaustion, masterPlan, underFire} from "./expert.js";

export const MOD_STANDARD = 'standard';

export const config = {
    name: MOD_STANDARD,
    standard: true,
    cards: [
        {count: 2, card: advance},
        {count: 2, card: assault},
        {count: 1, card: caughtOffGuard},
        {count: 1, card: gangUp},
        {count: 1, card: shadowOfThePast},
    ],
    expertSet: [
        {count: 1, card: exhaustion},
        {count: 1, card: masterPlan},
        {count: 1, card: underFire},
    ],
}
