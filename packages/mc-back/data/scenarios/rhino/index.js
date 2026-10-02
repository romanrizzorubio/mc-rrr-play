import {MOD_BOMB_SCARE} from '../../sets/bomb-scare/index.js';
import {MOD_STANDARD} from '../../sets/standard/index.js';

import {
    armoredRhinoSuit,
    breakinTakin,
    charge,
    crowdControl,
    enhancedIvoryHorn,
    hardToKeepDown,
    hydraMercenary,
    imTough,
    rhino1Card,
    rhino2Card,
    rhino3Card,
    sandMan,
    shocker,
    stampede,
    theBreakInA,
    theBreakInB,
} from './cards.js';

export const MOD_RHINO = 'rhino';

export const scenarioConfig = {
    name: MOD_RHINO,
    villains: [rhino1Card, rhino2Card, rhino3Card],
    mainSchemes: [[theBreakInA, theBreakInB]],
    sets: [MOD_STANDARD],
    defaultSets: [MOD_BOMB_SCARE],
    cards: [
        {count: 1, card: armoredRhinoSuit},
        {count: 2, card: charge},
        {count: 1, card: enhancedIvoryHorn},
        {count: 200, card: hydraMercenary},
        {count: 1, card: sandMan},
        {count: 1, card: shocker},
        {count: 2, card: hardToKeepDown},
        {count: 2, card: imTough},
        {count: 3, card: stampede},
        {count: 1, card: breakinTakin},
        {count: 1, card: crowdControl}
    ],
};
