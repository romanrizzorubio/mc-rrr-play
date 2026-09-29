import {mockingBird, nickFury} from "../../aspect/basic/allies.js";
import {emergency, firstAid, haymaker} from "../../aspect/basic/events.js";
import {energy, genius, strength} from "../../aspect/basic/resources.js";
import {avengersMansion, helicarrier} from "../../aspect/basic/supports.js";
import {tenacity} from "../../aspect/basic/upgrades.js";
import {daredevil, jessicaJones} from "../../aspect/justice/allies.js";
import {forJustice, greatResponsability} from "../../aspect/justice/events.js";
import {powerOfJustice} from "../../aspect/justice/resources.js";
import {interrogationRoom, surveillanceTeam} from "../../aspect/justice/supports.js";
import {heroicIntuition} from "../../aspect/justice/upgrades.js";

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
    {count: 1, card: daredevil},
    {count: 1, card: jessicaJones},
    {count: 2, card: forJustice},
    {count: 2, card: greatResponsability},
    {count: 2, card: powerOfJustice},
    {count: 2, card: interrogationRoom},
    {count: 2, card: surveillanceTeam},
    {count: 2, card: heroicIntuition},
];
