import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_RESOURCE,
    ABILITY_OPTION,
} from "../../../src/constants/abilities.js";
import {
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_UPGRADE,
    CARD_TYPE_TREACHERY,
} from "../../../src/constants/back-cards.js";
import {CARD_TYPE_OBLIGATION} from "../../../src/model/printed/obligation-card.js";
import {CARD_TYPE_SIDE_SCHEME_SCENARIO} from "../../../src/model/printed/side-scheme-scenario-card.js";
import {CARD_TYPE_MINION} from "../../../src/model/printed/minion-card.js";
import {
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_HAND_SIZE,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_READY,
    EFFECT_REMOVE_THREAT,
    EFFECT_SELECT_FROM_TOP_DECK,
    EFFECT_SPEND,
    EFFECT_TAKE_DAMAGE,
    EFFECT_ADD_TRAIT,
    EFFECT_LASTING,
    EFFECT_GENERATE_RESOURCES_FROM_DISCARD_TOP,
    EFFECT_SEARCH_DISCARD_RETURN_TO_HAND,
    EFFECT_REMOVE_THREAT_ALL_SCHEMES,
    EFFECT_FLIP,
    EFFECT_MAY,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_REMOVE_CARD,
    EFFECT_DISCARD_GAME,
    EFFECT_PLACE_THREAT,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_DO_IF,
} from "../../../src/factory/effects-factory.js";
import {
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD
} from "../../../src/constants/resources.js";
import {
    TARGET_ALL_ENEMIES,
    TARGET_ANY_PLAYER,
    TARGET_ATTACKED,
    TARGET_BY_NAME,
    TARGET_ENEMY,
    TARGET_HERO,
    TARGET_THIS,
    TARGET_YOUR_SUPERHERO,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_CARD,
    TARGET_UPGRADE_YOU_CONTROL,
    TARGET_ATTACK_UNDEFENDED,
    TARGET_ALL_PLAYERS,
} from "../../../src/constants/targets.js";
import {
    TRAIT_AERIAL,
    TRAIT_ARMOR,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_DROID,
    TRAIT_GENIUS,
    TRAIT_INDIVIDUAL,
    TRAIT_ITEM,
    TRAIT_LOCATION,
    TRAIT_SHIELD,
    TRAIT_SOLDIER,
    TRAIT_SUPERPOWER,
    TRAIT_TECH,
    TRAIT_CONDITION,
    TRAIT_CRIMINAL,
} from "../../../src/constants/traits.js";
import {LABEL_ATTACK, LABEL_THWART} from "../../../src/constants/labels.js";
import {
    TRIGGER_YOUR_HERO_GET_HAND_SIZE,
    TRIGGER_YOUR_HERO_GET_HIT_POINTS,
} from "../../../src/factory/triggers-factory.js";
import {CALC_RESOURCES, CALC_TRAITS_COUNT} from "../../../src/constants/calc.js";
import {TIME_PHASE, TIME_ROUND} from "../../../src/constants/times.js";
import {EFFECT_DO_IF_HAS_TRAITS} from "../../../src/effects/do-if-has-traits-effect.js";
import {ABILITY_WHEN_REVEALED} from "../../../src/abilities/when/when-revealed-ability.js";

const ironmanCard = {
    name: 'Iron Man',
    type: CARD_TYPE_HERO,
    traits: [TRAIT_AVENGER],
    img: 'heroes/iron-man/01029a.png',
    params: {
        handSize: 1,
        hitPoints: 9,
        thwart: 2,
        attack: 1,
        defense: 1
    },
    abilities: [
        {
            type: ABILITY_CONSTANT,
            trigger: TRIGGER_YOUR_HERO_GET_HAND_SIZE,
            effect: {
                type: EFFECT_MODIFY_HAND_SIZE,
                target: TARGET_HERO,
                paramsCalc: {
                    formula: CALC_TRAITS_COUNT,
                    target: 'player.gameZone.cards',
                    trait: TRAIT_TECH,
                    max: 6
                }
            }
        }
    ]
};

const tonyStarkCard = {
    name: 'Tony Stark',
    type: CARD_TYPE_ALTEREGO,
    traits: [TRAIT_GENIUS],
    img: 'heroes/iron-man/01029b.png',
    params: {
        handSize: 6,
        hitPoints: 9,
        recovery: 3
    },
    abilities: [
        {
            name: 'Visión de futuro',
            type: ABILITY_ALTEREGO_ACTION,
            limit: {count: 1, time: TIME_ROUND},
            effect: {
                type: EFFECT_SELECT_FROM_TOP_DECK,
                count: 3,
                selectCount: 1,
                title: 'Elige 1 carta para añadir a tu mano'
            }
        }
    ]
};

const warMachine = {
    name: 'Máquina de Guerra',
    subtitle: 'James Rhodes',
    type: CARD_TYPE_ALLY,
    unique: true,
    traits: [TRAIT_SHIELD, TRAIT_SOLDIER],
    cost: 4,
    resources: [RESOURCE_WILD],
    img: 'heroes/iron-man/01030.png',
    params: {
        thwart: 1,
        thwartConsequential: 1,
        attack: 2,
        attackConsequential: 1,
        hitPoints: 4
    },
    abilities: [
        {
            type: ABILITY_ACTION,
            arrow: {
                cost: {
                    type: EFFECT_CHAINED,
                    matchAll: true,
                    effects: [
                        {type: EFFECT_EXHAUST},
                        {
                            type: EFFECT_TAKE_DAMAGE,
                            damage: 2,
                            target: TARGET_THIS
                        }
                    ]
                }
            },
            effect: {
                type: EFFECT_DEAL_DAMAGE,
                damage: 1,
                target: TARGET_ALL_ENEMIES
            }
        }
    ]
};

const repulsorBlast = {
    name: 'Rayo repulsor',
    type: CARD_TYPE_EVENT,
    traits: [TRAIT_ATTACK, TRAIT_SUPERPOWER],
    cost: 1,
    resources: [RESOURCE_PHYSICAL],
    img: 'heroes/iron-man/01031.png',
    abilities: [
        {
            type: ABILITY_HERO_ACTION,
            label: LABEL_ATTACK,
            effect: {
                type: EFFECT_CHAINED,
                matchAll: true,
                effects: [
                    {
                        type: EFFECT_DISCARD_FROM_DECK,
                        count: 5,
                        target: TARGET_YOUR_SUPERHERO
                    },
                    {
                        type: EFFECT_DEAL_DAMAGE,
                        damage: 1,
                        target: TARGET_ATTACKED,
                        paramsCalc: {
                            formula: CALC_RESOURCES,
                            resourceType: RESOURCE_ENERGY,
                            strict: true,
                            target: 'effects.0.cards',
                            multiply: 2,
                            plus: 1
                        }
                    }
                ]
            }
        }
    ]
};

const supersonicPunch = {
    name: 'Puñetazo supersónico',
    type: CARD_TYPE_EVENT,
    traits: [TRAIT_ATTACK],
    cost: 2,
    resources: [RESOURCE_ENERGY],
    img: 'heroes/iron-man/01032.png',
    abilities: [
        {
            type: ABILITY_HERO_ACTION,
            label: LABEL_ATTACK,
            effect: {
                type: EFFECT_DEAL_DAMAGE,
                damage: 4,
                target: TARGET_ATTACKED,
                paramsCalc: {
                    formula: CALC_TRAITS_COUNT,
                    trait: TRAIT_AERIAL,
                    target: TARGET_HERO,
                    multiply: 4,
                    plus: 4
                }
            }
        }
    ]
};

const pepperPotts = {
    name: 'Pepper Potts',
    type: CARD_TYPE_SUPPORT,
    unique: true,
    traits: [TRAIT_INDIVIDUAL],
    cost: 3,
    resources: [RESOURCE_PHYSICAL],
    img: 'heroes/iron-man/01033.png',
    abilities: [
        {
            type: ABILITY_RESOURCE,
            arrow: {
                cost: {type: EFFECT_EXHAUST}
            },
            effect: {
                type: EFFECT_GENERATE_RESOURCES_FROM_DISCARD_TOP,
                selectedTarget: TARGET_THIS
            },
        }
    ]
};

const starkTower = {
    name: 'Torre Stark',
    type: CARD_TYPE_SUPPORT,
    unique: true,
    traits: [TRAIT_LOCATION],
    cost: 2,
    resources: [RESOURCE_MENTAL],
    img: 'heroes/iron-man/01034.png',
    abilities: [
        {
            type: ABILITY_ALTEREGO_ACTION,
            arrow: {
                cost: {type: EFFECT_EXHAUST}
            },
            effect: {
                type: EFFECT_SEARCH_DISCARD_RETURN_TO_HAND,
                selectedTarget: TARGET_ANY_PLAYER,
                condition: {
                    type: CARD_TYPE_UPGRADE,
                    trait: TRAIT_TECH
                }
            },
        }
    ]
};

const arcReactor = {
    name: 'Reactor ARK',
    type: CARD_TYPE_UPGRADE,
    unique: true,
    traits: [TRAIT_ITEM, TRAIT_TECH],
    cost: 2,
    resources: [RESOURCE_ENERGY],
    img: 'heroes/iron-man/01035.png',
    abilities: [
        {
            type: ABILITY_HERO_ACTION,
            arrow: {
                cost: {type: EFFECT_EXHAUST}
            },
            effect: {
                type: EFFECT_READY,
                target: TARGET_BY_NAME,
                name: 'Iron Man'
            },
        }
    ]
};

const markVArmor = {
    name: 'Armadura Mark V',
    type: CARD_TYPE_UPGRADE,
    unique: true,
    traits: [TRAIT_ARMOR, TRAIT_TECH],
    cost: 3,
    resources: [RESOURCE_MENTAL],
    img: 'heroes/iron-man/01036.png',
    abilities: [
        {
            type: ABILITY_CONSTANT,
            trigger: TRIGGER_YOUR_HERO_GET_HIT_POINTS,
            effect: {
                type: EFFECT_MODIFY_HIT_POINTS,
                count: 6,
                target: TARGET_YOUR_SUPERHERO
            }
        }
    ]
};

const markVHelmet = {
    name: 'Casco Mark V',
    type: CARD_TYPE_UPGRADE,
    unique: true,
    traits: [TRAIT_ARMOR, TRAIT_TECH],
    cost: 1,
    resources: [RESOURCE_PHYSICAL],
    img: 'heroes/iron-man/01037.png',
    abilities: [
        {
            type: ABILITY_HERO_ACTION,
            label: LABEL_THWART,
            arrow: {
                cost: {type: EFFECT_EXHAUST}
            },
            effect: {
                type: EFFECT_DO_IF_HAS_TRAITS,
                traits: [TRAIT_AERIAL],
                target: TARGET_HERO,
                effect: {
                    type: EFFECT_REMOVE_THREAT_ALL_SCHEMES,
                    threat: 1
                },
                elseEffect: {
                    type: EFFECT_REMOVE_THREAT,
                    threat: 1,
                    selectedTarget: TARGET_SCHEME
                }
            },
        }
    ]
};

const poweredGauntlets = {
    name: 'Guanteletes potenciados',
    type: CARD_TYPE_UPGRADE,
    traits: [TRAIT_ARMOR, TRAIT_TECH],
    cost: 2,
    resources: [RESOURCE_ENERGY],
    img: 'heroes/iron-man/01038.png',
    abilities: [
        {
            type: ABILITY_HERO_ACTION,
            label: LABEL_ATTACK,
            arrow: {
                cost: {type: EFFECT_EXHAUST}
            },
            effect: {
                type: EFFECT_DO_IF_HAS_TRAITS,
                traits: [TRAIT_AERIAL],
                target: TARGET_HERO,
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    damage: 2,
                    target: TARGET_ATTACKED
                },
                elseEffect: {
                    type: EFFECT_DEAL_DAMAGE,
                    damage: 1,
                    target: TARGET_ATTACKED
                }
            },
        }
    ]
};

const rocketBoots = {
    name: 'Botas propulsoras',
    type: CARD_TYPE_UPGRADE,
    traits: [TRAIT_ARMOR, TRAIT_TECH],
    cost: 1,
    resources: [RESOURCE_MENTAL],
    img: 'heroes/iron-man/01039.png',
    abilities: [
        {
            type: ABILITY_CONSTANT,
            trigger: TRIGGER_YOUR_HERO_GET_HIT_POINTS,
            effect: {
                type: EFFECT_MODIFY_HIT_POINTS,
                count: 1,
                target: TARGET_YOUR_SUPERHERO
            }
        },
        {
            type: ABILITY_HERO_ACTION,
            arrow: {
                cost: {
                    type: EFFECT_CHAINED,
                    matchAll: true,
                    effects: [
                        {type: EFFECT_EXHAUST},
                        {
                            type: EFFECT_SPEND,
                            resources: [RESOURCE_MENTAL]
                        }
                    ]
                }
            },
            effect: {
                type: EFFECT_LASTING,
                until: TIME_PHASE,
                effect: {
                    type: EFFECT_ADD_TRAIT,
                    trait: TRAIT_AERIAL,
                    target: TARGET_HERO
                }
            },
        }
    ]
};

const businessProblemsCard = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Problemas de negocios',
        img: 'heroes/iron-man/01170.png',
        traits: [TRAIT_CONDITION],
        boost: 2,
        giveToOwner: true,
        triggerInstant: true,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_INSTANT,
                    name: 'Convertirte en Tony Stark',
                    effect: {
                        type: EFFECT_MAY,
                        params: {
                            effect: {
                                type: EFFECT_FLIP,
                                params: {
                                    target: TARGET_YOUR_SUPERHERO,
                                    formTarget: TARGET_ALTEREGO_SIDE,
                                }
                            },
                        }
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_INSTANT,
                    name: 'Resolver la obligación',
                    effect: {
                        type: EFFECT_CHOOSE_ABILITY,
                        params: {
                            options: [
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Agotar a Tony Stark para retirar la Obligación',
                                        effect: {
                                            type: EFFECT_REMOVE_CARD,
                                            params: {
                                                target: TARGET_CARD,
                                            }
                                        },
                                        arrow: {
                                            type: EFFECT_EXHAUST,
                                            params: {
                                                target: TARGET_ALTEREGO,
                                            }
                                        },
                                    }
                                },
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Agotar todas las Mejoras que controles para descartar la Obligación',
                                        effect: {
                                            type: EFFECT_CHAINED,
                                            params: {
                                                effects: [
                                                    {
                                                        type: EFFECT_EXHAUST,
                                                        params: {
                                                            filter: {
                                                                type: CARD_TYPE_UPGRADE,
                                                                control: TARGET_YOU,
                                                            },
                                                            matchAll: true,
                                                        }
                                                    },
                                                    {
                                                        type: EFFECT_DISCARD_GAME,
                                                        params: {
                                                            target: TARGET_CARD,
                                                        },
                                                    }
                                                ]
                                            }
                                        },
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        ]
    }
};

const imminentOverloadCard = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Sobrecarga inminente',
        img: 'heroes/iron-man/01171.png',
        boost: 3,
        startingThreat: 3,
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

const whiplashCard = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Latigazo',
        unique: true,
        img: 'heroes/iron-man/01172.png',
        traits: [TRAIT_CRIMINAL],
        boost: 2,
        hitPoints: 4,
        attack: 3,
        scheme: 2,
        keywords: {
            retaliate: 1,
        }
    }
};

const electricWhipAttackCard = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Azote de electrolátigo',
        img: 'heroes/iron-man/01173.png',
        traits: [],
        boost: 0,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    name: 'Azote de electrolátigo',
                    effect: {
                        type: EFFECT_CHOOSE_ABILITY,
                        params: {
                            options: [
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Recibir daño por cada Mejora controlada',
                                        effect: {
                                            type: EFFECT_DEAL_DAMAGE,
                                            params: {
                                                target: TARGET_HERO,
                                                damage: 0,
                                                paramsCalc: {
                                                    formula: CALC_COUNT,
                                                    target: 'cards',
                                                    filter: {
                                                        type: CARD_TYPE_UPGRADE,
                                                        control: TARGET_YOU,
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Elegir y descartar una Mejora controlada',
                                        effect: {
                                            type: EFFECT_SELECT_DISCARD_CARD,
                                            params: {
                                                filter: {
                                                    type: CARD_TYPE_UPGRADE,
                                                    control: TARGET_YOU,
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        ],
        boostEffect: {
            type: EFFECT_DO_IF,
            params: {
                condition: {
                    target: TARGET_ATTACK_UNDEFENDED,
                },
                effect: {
                    type: EFFECT_SELECT_DISCARD_CARD,
                    params: {
                        filter: {
                            type: CARD_TYPE_UPGRADE,
                            control: TARGET_YOU,
                        }
                    }
                }
            }
        }
    }
};

const electromagneticBacklashCard = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Descarga electromagnética',
        img: 'heroes/iron-man/01174.png',
        traits: [],
        boost: 2,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    name: 'Descarga electromagnética',
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_ALL_PLAYERS,
                            effects: [
                                {
                                    type: EFFECT_DISCARD_FROM_DECK,
                                    params: {
                                        count: 5,
                                    }
                                },
                                {
                                    type: EFFECT_TAKE_DAMAGE,
                                    params: {
                                        damage: 0,
                                        paramsCalc: {
                                            formula: CALC_RESOURCES,
                                            resourceType: RESOURCE_ENERGY,
                                            target: 'effects.0.cards',
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        ]
    }
};

export {
    ironmanCard,
    tonyStarkCard,
    warMachine,
    repulsorBlast,
    supersonicPunch,
    pepperPotts,
    starkTower,
    arcReactor,
    markVArmor,
    markVHelmet,
    poweredGauntlets,
    rocketBoots,
    businessProblemsCard,
    imminentOverloadCard,
    whiplashCard,
    electricWhipAttackCard,
    electromagneticBacklashCard,
};
