import {ABILITY_HERO_ACTION,ABILITY_FORCED_INTERRUPT,ABILITY_WHEN_REVEALED,ABILITY_WHEN_REVEALED_ALTEREGO,ABILITY_WHEN_REVEALED_HERO} from '../../../src/constants/abilities.js';
import {CHARACTER_VILLAIN} from '../../../src/constants/characters.js';
import {PLACE_ENCOUNTER_DISCARD} from '../../../src/constants/places.js';
import {RESOURCE_PHYSICAL} from '../../../src/constants/resources.js';
import {
    TARGET_ALL_HEROES, TARGET_ALL_PLAYERS, TARGET_ATTACHED,
    TARGET_ATTACKED,
    TARGET_CARD, TARGET_EFFECT, TARGET_ENCOUNTER_DECK_CARDS, TARGET_SOURCE,
    TARGET_VILLAIN, TARGET_YOU
} from '../../../src/constants/targets.js';
import {
    TRAIT_ARMOR,
    TRAIT_BRUTE,
    TRAIT_CRIMINAL,
    TRAIT_ELITE,
    TRAIT_HYDRA,
    TRAIT_WEAPON
} from '../../../src/constants/traits.js';
import {TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE, TRIGGER_VILLAIN_ATTACKS} from '../../../src/constants/triggers.js';
import {
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DELAYED,
    EFFECT_DISCARD_GAME,
    EFFECT_DO_IF_CARD_GAME,
    EFFECT_DO_IF_TAKE_DAMAGE,
    EFFECT_ENEMY_ATTACK,
    EFFECT_HEAL,
    EFFECT_MODIFY_ATTACK,
    EFFECT_PLACE_THREAT,
    EFFECT_PREVENT_PLACE_DAMAGE,
    EFFECT_SEARCH_CARD_REVEAL,
    EFFECT_SPEND,
    EFFECT_STUN,
    EFFECT_SURGE,
    EFFECT_TOUGH
} from '../../../src/constants/effects.js';
import {CARD_TYPE_ATTACHMENT} from '../../../src/model/printed/attachment-card.js';
import {CARD_TYPE_MAIN_SCHEME_A_CARD} from '../../../src/model/printed/main-scheme-a-card.js';
import {CARD_TYPE_MAIN_SCHEME_B_CARD} from '../../../src/model/printed/main-scheme-b-card.js';
import {CARD_TYPE_MINION} from '../../../src/model/printed/minion-card.js';
import {CARD_TYPE_SIDE_SCHEME_SCENARIO} from '../../../src/model/printed/side-scheme-scenario-card.js';
import {CARD_TYPE_TREACHERY} from '../../../src/model/printed/treachery-card.js';
import {CARD_TYPE_VILLAIN} from '../../../src/model/printed/villain-card.js';

const set = 'rhino';
export const rhino1Card = {
    type: CARD_TYPE_VILLAIN,
    params: {
        name: 'Rhino',
        set,
        image: 'scenarios/rhino/rhino1.webp',
        traits: [TRAIT_BRUTE, TRAIT_CRIMINAL],
        unique: true,
        stage: 1,
        scheme: 1,
        attack: 2,
        hitPoints: [14, true]
    }
};
export const rhino2Card = {
    type: CARD_TYPE_VILLAIN,
    params: {
        name: 'Rhino',
        set,
        image: 'scenarios/rhino/rhino2.webp',
        traits: [TRAIT_BRUTE, TRAIT_CRIMINAL],
        unique: true,
        stage: 2,
        scheme: 1,
        attack: 3,
        hitPoints: [15, true],
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_SEARCH_CARD_REVEAL,
                    params: {
                        condition: {
                            name: 'Breakin\' & Takin\'',
                        },
                        places: [TARGET_ENCOUNTER_DECK_CARDS, PLACE_ENCOUNTER_DISCARD]
                    }
                }
            }
        }],
    }
};
export const rhino3Card = {
    type: CARD_TYPE_VILLAIN,
    params: {
        name: 'Rhino',
        set,
        image: 'scenarios/rhino/rhino3.webp',
        traits: [TRAIT_BRUTE, TRAIT_CRIMINAL],
        unique: true,
        stage: 3,
        scheme: 1,
        attack: 4,
        hitPoints: [16, true],
        keywords: {toughness: true},
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_STUN,
                    params: {
                        target: TARGET_ALL_PLAYERS
                    }
                }
            }
        }],
    }
};
export const theBreakInA = {
    type: CARD_TYPE_MAIN_SCHEME_A_CARD,
    params: {
        name: 'The Break-In!',
        set,
        image: 'scenarios/rhino/rhino4a.webp',
        stage: 1,
        content: {
            villains: [1, 2],
            villainsExpert: [2, 3],
        },
    }
};
export const theBreakInB = {
    type: CARD_TYPE_MAIN_SCHEME_B_CARD,
    params: {
        name: 'The Break-In!',
        set,
        image: 'scenarios/rhino/rhino4b.webp',
        stage: 1,
        value: [7, true],
        //startingThreat: [3, true],
        startingThreat: 0,
        acceleration: [1, true],
        final: true
    }
};
export const armoredRhinoSuit = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Armored Rhino Suit',
        set,
        image: 'scenarios/rhino/rhino5.webp',
        traits: [TRAIT_ARMOR],
        attach: TARGET_VILLAIN,
        abilities: [{
            type: ABILITY_FORCED_INTERRUPT,
            params: {
                hideDialog: true,
                trigger: TRIGGER_ATTACHED_WOULD_DEALT_DAMAGE,
                effect: {
                    type: EFFECT_PREVENT_PLACE_DAMAGE,
                    params: {
                        target: TARGET_ATTACHED,
                        thenEffect: {
                            type: EFFECT_DO_IF_CARD_GAME,
                            params: {
                                target: TARGET_CARD,
                                condition: {
                                    damage: '>4',
                                },
                                effect: {
                                    type: EFFECT_DISCARD_GAME,
                                    params: {
                                        target: TARGET_CARD,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }],
    }
};
export const charge = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Charge',
        set,
        image: 'scenarios/rhino/rhino6.webp',
        attach: TARGET_VILLAIN,
        attack: 3,
        boost: 2,
        abilities: [{
            type: ABILITY_FORCED_INTERRUPT,
            params: {
                trigger: TRIGGER_VILLAIN_ATTACKS,
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_EFFECT,
                        effects: [{
                            type: EFFECT_MODIFY_ATTACK,
                            params: {
                                target: TARGET_EFFECT,
                                modify: {
                                    overkill: true
                                }
                            }
                        },{
                            type: EFFECT_DELAYED,
                            params: {
                                target: TARGET_EFFECT,
                                effect: {
                                    type: EFFECT_DISCARD_GAME,
                                    params: {
                                        target: TARGET_CARD
                                    }
                                }
                            }
                        }]
                    }
                },
            }
        }],
    }
};
export const enhancedIvoryHorn = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Enhanced Ivory Horn',
        set,
        image: 'scenarios/rhino/rhino8.webp',
        traits: [TRAIT_WEAPON],
        attach: TARGET_VILLAIN,
        attack: 1,
        boost: 2,
        abilities: [{
            type: ABILITY_HERO_ACTION,
            params: {
                effect: {
                    type: EFFECT_DISCARD_GAME,
                    params: {
                        target: TARGET_CARD,
                    }
                },
                arrow: {
                    type: EFFECT_SPEND,
                    params: {
                        resources: [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL, RESOURCE_PHYSICAL]
                    }
                },
            }
        }],
    }
};
export const hydraMercenary = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Hydra Mercenary',
        set,
        image: 'scenarios/rhino/rhino9.webp',
        traits: [TRAIT_HYDRA],
        boost: 1,
        scheme: 0,
        attack: 1,
        hitPoints: 3,
        keywords: {guard: true},
    }
};
export const sandMan = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Sand Man',
        set,
        image: 'scenarios/rhino/rhino11.webp',
        traits: [TRAIT_CRIMINAL, TRAIT_ELITE],
        unique: true,
        boost: 2,
        scheme: 2,
        attack: 3,
        hitPoints: 4,
        keywords: {toughness: true},
    }
};
export const shocker = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Shocker',
        set,
        image: 'scenarios/rhino/rhino12.webp',
        traits: [TRAIT_CRIMINAL],
        unique: true,
        scheme: 1,
        attack: 2,
        boost: 2,
        hitPoints: 3,
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_ALL_HEROES,
                        damage: 1,
                    }
                }
            }
        }],
    }
};
export const hardToKeepDown = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Hard to Keep Down',
        set,
        image: 'scenarios/rhino/rhino13.webp',
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_HEAL,
                    params: {
                        damage: 4,
                        target: TARGET_VILLAIN
                    }
                },
                ifNot: {
                    type: EFFECT_SURGE,
                }
            }
        }],
    }
};
export const imTough = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'I\'m Tough!',
        set,
        image: 'scenarios/rhino/rhino15.webp',
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_TOUGH,
                    params: {
                        target: TARGET_VILLAIN,
                    }
                },
                ifNot: {
                    type: EFFECT_SURGE,
                }
            }
        }],
    }
};
export const stampede = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Stampede',
        set,
        image: 'scenarios/rhino/rhino17.webp',
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
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [{
                            type: EFFECT_ENEMY_ATTACK,
                            params: {
                                enemyType: CHARACTER_VILLAIN,
                                target: TARGET_YOU,
                            }
                        },{
                            type: EFFECT_DO_IF_TAKE_DAMAGE,
                            params: {
                                source: 'effects.0',
                                target: TARGET_SOURCE,
                                effect: {
                                    type: EFFECT_STUN,
                                    params: {
                                        target: TARGET_ATTACKED,
                                    }
                                }
                            }
                        }]
                    }
                }
            }
        }],
    }
};
export const breakinTakin = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Breakin\' & Takin\'',
        set,
        image: 'scenarios/rhino/rhino20.webp',
        boost: 2,
        icons: { hazard: 1 },
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
export const crowdControl = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Crowd Control',
        set,
        image: 'scenarios/rhino/rhino21.webp',
        boost: 2,
        icons: { crisis: true },
        startingThreat: [2, true]
    }
};
