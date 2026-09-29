import {
    TARGET_ALL_SIDE_SCHEMES,
    TARGET_PLAYER,
} from "../../../src/constants/targets.js";
import {CARD_TYPE_TREACHERY} from "../../../src/model/printed/treachery-card.js";
import {ABILITY_WHEN_REVEALED} from "../../../src/abilities/when/when-revealed-ability.js";
import {EFFECT_REVEAL_FIRST_ENCOUNTER} from "../../../src/effects/reveal-first-encounter-effect.js";
import {EFFECT_PLACE_THREAT} from "../../../src/effects/place-threat-effect.js";
import {EFFECT_DISCARD_REVEAL} from "../../../src/effects/discard-reveal-effect.js";
import {EFFECT_EXHAUST} from "../../../src/effects/exhaust-effect.js";

const set = 'expert';
export const exhaustion = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Exhaustion',
        set,
        image: 'sets/expert/expert1.webp',
        boost: 2,
        keywords: {surge: true},
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_EXHAUST,
                    params: {
                        target: TARGET_PLAYER,
                    }
                }
            }
        }],
    }
};
export const masterPlan = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Masterplan',
        set,
        image: 'sets/expert/expert2.webp',
        boost: 2,
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_PLACE_THREAT,
                    params: {
                        target: TARGET_ALL_SIDE_SCHEMES,
                        threat: 4,
                    },
                },
                ifNot: {
                    type: EFFECT_DISCARD_REVEAL,
                    params: {
                        condition: {
                            isSideScheme: true,
                        },
                        target: TARGET_PLAYER,
                    }
                }
            }
        }],
    }
};
export const underFire = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Under Fire',
        set,
        image: 'sets/expert/expert3.webp',
        boost: 3,
        keywords: {surge: true},
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_REVEAL_FIRST_ENCOUNTER,
                    params: {
                        target: TARGET_PLAYER,
                    }
                }
            }
        }],
    }
};
