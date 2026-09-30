import {mockingBird} from '../../aspect/basic/allies.js';
import {emergency, firstAid, haymaker} from '../../aspect/basic/events.js';
import {energy, genius, strength} from '../../aspect/basic/resources.js';
import {avengersMansion, helicarrier} from '../../aspect/basic/supports.js';
import {mariaHill, vision, hawkeye} from '../../aspect/leadership/allies.js';
import {makeTheCall, leadFromTheFront, getReady} from '../../aspect/leadership/events.js';
import {powerOfLeadership} from '../../aspect/leadership/resources.js';
import {theTriskelion} from '../../aspect/leadership/supports.js';
import {inspiration} from '../../aspect/leadership/upgrades.js';

export const precon = [
    // Leadership
    {card: mariaHill, count: 1},
    {card: vision, count: 1},
    {card: hawkeye, count: 1},
    {card: makeTheCall, count: 2},
    {card: leadFromTheFront, count: 2},
    {card: powerOfLeadership, count: 2},
    {card: theTriskelion, count: 1},
    {card: inspiration, count: 2},
    {card: getReady, count: 2},

    // Basic
    {card: avengersMansion, count: 1},
    {card: helicarrier, count: 1},
    {card: haymaker, count: 1},
    {card: emergency, count: 1},
    {card: firstAid, count: 1},
    {card: energy, count: 1},
    {card: genius, count: 1},
    {card: strength, count: 1},
    {card: mockingBird, count: 1}
];
