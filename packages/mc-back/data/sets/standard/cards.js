import {
    TARGET_ALL_ENGAGED_MINIONS,
    TARGET_EFFECT,
    TARGET_ENCOUNTER_DECK,
    TARGET_MAIN_SCHEME, TARGET_OUTSIDE_NEMESIS, TARGET_SCENARIO,
    TARGET_SUPPORT_YOU_CONTROL,
    TARGET_UPGRADE_YOU_CONTROL,
    TARGET_VILLAIN,
    TARGET_YOU
} from "../../../src/constants/targets.js";
import {CHARACTER_VILLAIN} from "../../../src/constants/characters.js";
import {PLACE_OUTSIDE_NEMESIS} from "../../../src/constants/places.js";
import {CARD_TYPE_TREACHERY} from "../../../src/model/printed/treachery-card.js";
import {EFFECT_SURGE} from "../../../src/effects/surge-effect.js";
import {EFFECT_SEARCH_CARD_REVEAL} from "../../../src/effects/search-card-reveal-effect.js";
import {EFFECT_INCLUDE_ASIDE_CARDS} from "../../../src/effects/include-aside-cards-effect.js";
import {EFFECT_DO_IF} from "../../../src/effects/do-if-effect.js";
import {ABILITY_WHEN_REVEALED} from "../../../src/abilities/when/when-revealed-ability.js";
import {EFFECT_ENEMY_SCHEME} from "../../../src/effects/enemy-scheme-effect.js";
import {EFFECT_CHAINED} from "../../../src/effects/chained-effect.js";
import {ABILITY_WHEN_REVEALED_ALTEREGO} from "../../../src/abilities/when/when-revealed-alterego-ability.js";
import {ABILITY_WHEN_REVEALED_HERO} from "../../../src/abilities/when/when-revealed-hero-ability.js";
import {EFFECT_ENEMY_ATTACK} from "../../../src/effects/enemy-attack-effect.js";
import {EFFECT_SEVERAL_ATTACKS} from "../../../src/effects/several-attacks-effect.js";
import {EFFECT_DISCARD_GAME} from "../../../src/effects/discard-from-game-effect.js";

const set = 'standard';
export const advance = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Advance',
        set,
        image: 'sets/standard/standard1.webp',
        boost: 0,
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_ENEMY_SCHEME,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        target: TARGET_MAIN_SCHEME,
                    }
                }
            }
        }],
    }
};
export const assault = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Assault',
        set,
        image: 'sets/standard/standard3.webp',
        boost: 0,
        abilities: [{
            type: ABILITY_WHEN_REVEALED_ALTEREGO,
            params: {
                effect: {
                    type: EFFECT_SURGE,
                }
            }
        }, {
            type: ABILITY_WHEN_REVEALED_HERO,
            params: {
                effect: {
                    type: EFFECT_ENEMY_ATTACK,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        target: TARGET_YOU,
                    }
                }
            }
        }],
    }
};
export const caughtOffGuard = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Caught Off Guard',
        set,
        image: 'sets/standard/standard5.webp',
        boost: 1,
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_DISCARD_GAME,
                    params: {
                        target: [TARGET_SUPPORT_YOU_CONTROL, TARGET_UPGRADE_YOU_CONTROL],
                    }
                },
                ifNot: {
                    type: EFFECT_SURGE,
                }
            }
        }],
    }
};
export const gangUp = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Gang-Up',
        set,
        image: 'sets/standard/standard6.webp',
        boost: 1,
        abilities: [{
            type: ABILITY_WHEN_REVEALED_ALTEREGO,
            params: {
                effect: {
                    type: EFFECT_SURGE,
                }
            }
        }, {
            type: ABILITY_WHEN_REVEALED_HERO,
            params: {
                effect: {
                    type: EFFECT_SEVERAL_ATTACKS,
                    params: {
                        enemiesType: [TARGET_VILLAIN, TARGET_ALL_ENGAGED_MINIONS],
                        target: TARGET_YOU,
                    }
                }
            }
        }],
    }
};
export const shadowOfThePast = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Shadow of the Past',
        set,
        image: 'sets/standard/standard7.webp',
        boost: 2,
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_YOU,
                        effects: [{
                            type: EFFECT_SEARCH_CARD_REVEAL,
                            params: {
                                condition: {
                                    isMinion: true,
                                    isNemesis: true,
                                },
                                places: [PLACE_OUTSIDE_NEMESIS],
                                revealAll: true,
                                target: TARGET_YOU,
                            }
                        }, {
                            type: EFFECT_SEARCH_CARD_REVEAL,
                            params: {
                                condition: {
                                    isSideScheme: true,
                                },
                                places: [PLACE_OUTSIDE_NEMESIS],
                                revealAll: true,
                                target: TARGET_YOU,
                            }
                        }, {
                            type: EFFECT_INCLUDE_ASIDE_CARDS,
                            params: {
                                from: TARGET_OUTSIDE_NEMESIS,
                                target: TARGET_ENCOUNTER_DECK,
                                ownerTarget: TARGET_SCENARIO,
                            }
                        }, {
                            type: EFFECT_DO_IF,
                            params: {
                                condition: {
                                    'effects.0.hasEnterGame': false,
                                },
                                target: TARGET_EFFECT,
                                effect: {
                                    type: EFFECT_SURGE,
                                },
                            }
                        }]
                    }
                }
            }
        }],
    }
};
