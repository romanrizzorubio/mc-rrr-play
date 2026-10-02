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
    legalWorkCard,
    personalChallengeCard,
    titaniaCard,
    geneticUpgradeCard,
    titaniasFuryCard,
} from './cards.js';
import {precon} from './precon.js';

export const heroConfig = {
    sides: [
        jenniferWaltersCard,
        sheHulkCard,
    ],
    cards: [
        {count: 1, card: hellcat},
        {count: 10, card: gammaSlam},
        {count: 3, card: oneTwoPunch},
        {count: 2, card: groundStomp},
        {count: 2, card: legalPractice},
        {count: 10, card: splitPersonality},
        {count: 1, card: superhumanLawDivision},
        {count: 2, card: focusedRage},
        {count: 2, card: superhumanStrength},
    ],
    precon,
    obligation: {card: legalWorkCard, count: 1},
    nemesis: [
        {card: personalChallengeCard, count: 1},
        {card: titaniaCard, count: 1},
        {card: geneticUpgradeCard, count: 1},
        {card: titaniasFuryCard, count: 2},
    ],
};
