import {
    gammaSlam,
    groundStomp,
    hellcat,
    jenniferWaltersCard,
    legalPractice,
    oneTwoPunch,
    sheHulkCard,
    splitPersonality,
    superhumanLawDivision,
    focusedRage,
    superhumanStrength,
} from "./cards.js";
import {precon} from "./precon.js";

export const heroConfig = {
    sides: [
        jenniferWaltersCard,
        sheHulkCard,
    ],
    cards: [
        {count: 1, card: hellcat},
        {count: 1, card: gammaSlam},
        {count: 3, card: oneTwoPunch},
        {count: 2, card: groundStomp},
        {count: 2, card: legalPractice},
        {count: 1, card: splitPersonality},
        {count: 1, card: superhumanLawDivision},
        {count: 2, card: focusedRage},
        {count: 2, card: superhumanStrength},
    ],
    precon,
}
