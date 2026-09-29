import {
    TARGET_ALL_HEROES_ALLIES,
    TARGET_CARD,
    TARGET_MAIN_SCHEME,
    TARGET_YOU
} from "../../../src/constants/targets.js";
import {TRAIT_HYDRA} from "../../../src/constants/traits.js";
import {CALC_THREAT} from "../../../src/constants/calc.js";
import {CARD_TYPE_SIDE_SCHEME_SCENARIO} from "../../../src/model/printed/side-scheme-scenario-card.js";
import {EFFECT_SURGE} from "../../../src/effects/surge-effect.js";
import {EFFECT_CONFUSE} from "../../../src/effects/confuse-effect.js";
import {ABILITY_WHEN_REVEALED} from "../../../src/abilities/when/when-revealed-ability.js";
import {EFFECT_PLACE_THREAT} from "../../../src/effects/place-threat-effect.js";
import {CARD_TYPE_TREACHERY} from "../../../src/model/printed/treachery-card.js";
import {CARD_TYPE_MINION} from "../../../src/model/printed/minion-card.js";
import {EFFECT_ASSIGN_DAMAGE} from "../../../src/effects/assign-damage-effect.js";
import {EFFECT_DO_IF_CARD_GAME} from "../../../src/effects/do-if-card-game-effect.js";
import {EFFECT_CHOOSE} from "../../../src/effects/choose-effect.js";
import {EFFECT_TAKE_DAMAGE} from "../../../src/effects/take-damage-effect.js";

const set = 'bomb-scare';
export const bombScare = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Bomb Scare',
        set,
        image: 'sets/bomb-scare/bomb1.webp',
        boost: 2,
        icons: { acceleration: 1 },
        startingThreat: 2,
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_PLACE_THREAT,
                    params: {
                        threat: [1, true],
                        target: TARGET_CARD
                    }
                }
            }
        }],
    }
};
export const hydraBomber = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Hydra Bomber',
        set,
        image: 'sets/bomb-scare/bomb2.webp',
        traits: [TRAIT_HYDRA],
        boost: 1,
        scheme: 1,
        attack: 1,
        hitPoints: 2,
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_CHOOSE,
                    params: {
                        options: [{
                            type: EFFECT_TAKE_DAMAGE,
                            params: {
                                damage: 2,
                                target: TARGET_YOU,
                            }
                        }, {
                            type: EFFECT_PLACE_THREAT,
                            params: {
                                threat: 1,
                                target: TARGET_MAIN_SCHEME,
                            }
                        }]
                    }
                }
            }
        }],
    }
};
export const explosion = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Explosion',
        set,
        image: 'sets/bomb-scare/bomb4.webp',
        boost: 2,
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_DO_IF_CARD_GAME,
                    params: {
                        condition: {
                            name: 'Bomb Scare',
                        },
                        effect: {
                            type: EFFECT_ASSIGN_DAMAGE,
                            params: {
                                target: TARGET_ALL_HEROES_ALLIES,
                                paramsCalc: {
                                    target: 'cardCondition',
                                    formula: CALC_THREAT,
                                },
                            },
                        },
                        effectNot: {
                            type: EFFECT_SURGE,
                        }
                    }
                }
            }
        }],
    }
};
export const falseAlarm = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'False Alarm',
        set,
        image: 'sets/bomb-scare/bomb5.webp',
        boost: 1,
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_CONFUSE,
                    params: {
                        target: TARGET_YOU,
                    },
                },
                ifNot: {
                    type: EFFECT_SURGE,
                }
            }
        }],
    }
};
