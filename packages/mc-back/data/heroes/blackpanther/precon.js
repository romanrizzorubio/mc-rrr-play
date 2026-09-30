import {mockingBird} from '../../aspect/basic/allies.js';
import {emergency, firstAid, haymaker} from '../../aspect/basic/events.js';
import {energy, genius, strength} from '../../aspect/basic/resources.js';
import {avengersMansion, helicarrier} from '../../aspect/basic/supports.js';
import {blackWidow, lukeCage} from '../../aspect/protection/allies.js';
import {counterPunch, getBehindMe} from '../../aspect/protection/events.js';
import {powerOfProtection} from '../../aspect/protection/resources.js';
import {medicalTeam} from '../../aspect/protection/supports.js';
import {armoredVest, indomitable} from '../../aspect/protection/upgrades.js';


export const precon = [
    // Protection
    {card: blackWidow, count: 1}, // Única (Natasha Romanoff)
    {card: lukeCage, count: 1},  // Única
    {card: counterPunch, count: 2},
    {card: getBehindMe, count: 2},
    {card: powerOfProtection, count: 2},
    {card: medicalTeam, count: 2},
    {card: armoredVest, count: 2},
    {card: indomitable, count: 2},

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
