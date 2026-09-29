import {mockingBird, nickFury} from "../../aspect/basic/allies.js";
import {emergency, firstAid, haymaker} from "../../aspect/basic/events.js";
import {energy, genius, strength} from "../../aspect/basic/resources.js";
import {avengersMansion, helicarrier} from "../../aspect/basic/supports.js";
import {tenacity} from "../../aspect/basic/upgrades.js";
import {hulk, tigra} from "../../aspect/aggression/allies.js";
import {chaseThemDown, relentlessAssault, uppercut} from "../../aspect/aggression/events.js";
import {powerOfAggression} from "../../aspect/aggression/resources.js";
import {tacTeam} from "../../aspect/aggression/supports.js";
import {combatTraining} from "../../aspect/aggression/upgrades.js";

export const precon = [
    {count: 1, card: mockingBird},
    {count: 1, card: nickFury},
    {count: 1, card: emergency},
    {count: 1, card: firstAid},
    {count: 1, card: haymaker},
    {count: 1, card: energy},
    {count: 1, card: genius},
    {count: 1, card: strength},
    {count: 1, card: avengersMansion},
    {count: 1, card: helicarrier},
    {count: 1, card: tenacity},
    {count: 1, card: hulk},
    {count: 1, card: tigra},
    {count: 2, card: chaseThemDown},
    {count: 2, card: relentlessAssault},
    {count: 2, card: uppercut},
    {count: 2, card: powerOfAggression},
    {count: 2, card: tacTeam},
    {count: 2, card: combatTraining},
];
