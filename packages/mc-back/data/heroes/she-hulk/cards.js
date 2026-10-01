import {
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_HERO,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_MINION,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_UPGRADE,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    CARD_TYPE_SUPPORT,
} from '../../../src/constants/card-types.js';
import {
    TRAIT_ATTACK,
    TRAIT_ATTORNEY,
    TRAIT_AVENGER,
    TRAIT_ELITE,
    TRAIT_GAMMA,
    TRAIT_LOCATION,
    TRAIT_SKILL,
    TRAIT_SUPERPOWER,
    TRAIT_CONDITION,
    TRAIT_BRUTE,
} from '../../../src/constants/traits.js';
import {CLASSIFICATION_HERO} from '../../../src/constants/classifications.js';
import {
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
} from '../../../src/constants/resources.js';
import {TIME_ROUND} from '../../../src/constants/times.js';
import {
    TARGET_BY_TITLE,
    TARGET_CARD,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_ALL_ENEMIES,
    TARGET_PLAYER,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_YOUR_SUPERHERO,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_MAIN_SCHEME,
    TARGET_ATTACHED,
    TARGET_VILLAIN,
    TARGET_HERO,
    TARGET_ATTACKED,
    TARGET_MINION_HIGHEST_HP,
} from '../../../src/constants/targets.js';
import {LABEL_ATTACK, LABEL_THWART} from '../../../src/constants/labels.js';
import {
    CALC_COUNT,
    CALC_DAMAGE,
    CALC_ALL,
} from '../../../src/constants/calc.js';
import {
    EFFECT_DRAW_CARD,
    EFFECT_CHAINED,
    EFFECT_REMOVE_THREAT,
    EFFECT_PLACE_THREAT,
    EFFECT_ENEMY_ATTACK,
    EFFECT_HEAL,
    EFFECT_DEAL_BOOST,
    EFFECT_SPEND,
    EFFECT_DEAL_DAMAGE,
    EFFECT_EXHAUST,
    EFFECT_SELECT_DISCARD_TO_CARD,
    EFFECT_STUN,
    EFFECT_REMOVE_CARD,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_FLIP,
    EFFECT_MAY,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DISCARD_GAME,
    EFFECT_ADD_ACCELERATION_TOKEN,
    EFFECT_PREVENT_PLACE_THREAT,
    EFFECT_RETURN_HAND,
    EFFECT_READY,
    EFFECT_FILL_HAND,
    EFFECT_SURGE,
    EFFECT_TAKE_DAMAGE,
} from '../../../src/constants/effects.js';
import {
    ABILITY_HERO_ACTION,
    ABILITY_ACTION,
    ABILITY_FORCED_RESPONSE,
    ABILITY_CONSTANT,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_ALTEREGO_INTERRUPT,
    ABILITY_WHEN_REVEALED,
    ABILITY_OPTION,
    ABILITY_HERO_RESPONSE,
} from '../../../src/constants/abilities.js';
import {
    TRIGGER_WOULD_PLACE_THREAT,
    TRIGGER_YOUR_HERO_GET_ATTACK,
    TRIGGER_YOU_ANY_ATTACK,
    TRIGGER_THIS_FLIP,
    TRIGGER_INSTANT,
    TRIGGER_YOU_BASIC_ATTACK,
} from '../../../src/constants/triggers.js';

const set = 'Hulka';
export const sheHulkCard = {
    type: CARD_TYPE_HERO,
    params: {
        name: 'Hulka',
        set,
        image: 'heroes/she-hulk/01019a.png',
        traits: [TRAIT_AVENGER, TRAIT_GAMMA],
        unique: true,
        classification: CLASSIFICATION_HERO,
        thwart: 1,
        attack: 3,
        defense: 2,
        handSize: 4,
        hitPoints: 15,
        abilities: [{
            type: ABILITY_HERO_RESPONSE,
            params: {
                name: '\"¡Deberías hacer pesas!\"',
                trigger: TRIGGER_THIS_FLIP,
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        damage: 2,
                        target: TARGET_ENEMY,
                    }
                }
            }
        }],
    }
};
export const jenniferWaltersCard = {
    type: CARD_TYPE_ALTEREGO,
    params: {
        name: 'Jennifer Walters',
        set,
        image: 'heroes/she-hulk/01019b.png',
        traits: [TRAIT_ATTORNEY, TRAIT_GAMMA],
        unique: true,
        classification: CLASSIFICATION_HERO,
        recovery: 5,
        handSize: 6,
        hitPoints: 15,
        abilities: [{
            type: ABILITY_ALTEREGO_INTERRUPT,
            params: {
                name: '¡Protesto!',
                limit: {count: 1, time: TIME_ROUND},
                trigger: TRIGGER_WOULD_PLACE_THREAT,
                effect: {
                    type: EFFECT_PREVENT_PLACE_THREAT,
                    params: {
                        target: TARGET_EFFECT,
                        threat: 1,
                    }
                }
            }
        }],
    }
};

export const hellcat = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Gata Infernal',
        subtitle: 'Patsy Walker',
        set,
        image: 'heroes/she-hulk/01020.png',
        traits: [TRAIT_AVENGER],
        unique: true,
        cost: 3,
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        thwart: 2,
        attack: 1,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 3,
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                name: 'Devolver a la mano',
                effect: {
                    type: EFFECT_RETURN_HAND,
                    params: {
                        target: TARGET_THIS,
                    }
                }
            }
        }],
    }
};

export const gammaSlam = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Apisonadora gamma',
        set,
        image: 'heroes/she-hulk/01021.png',
        traits: [TRAIT_ATTACK, TRAIT_SUPERPOWER],
        cost: 4,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_HERO_ACTION,
            params: {
                labels: [LABEL_ATTACK],
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_ENEMY,
                        paramsCalc: {
                            target: 'player.hero',
                            formula: CALC_DAMAGE,
                            max: 15,
                        }
                    }
                }
            }
        }],
    }
};

export const oneTwoPunch = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Sucesión de puñetazos',
        set,
        image: 'heroes/she-hulk/01024.png',
        traits: [TRAIT_SKILL],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_HERO_RESPONSE,
            params: {
                trigger: TRIGGER_YOU_BASIC_ATTACK,
                effect: {
                    type: EFFECT_READY,
                    params: {
                        target: TARGET_BY_TITLE,
                        title: 'Hulka',
                    }
                }
            }
        }],
    }
};

export const groundStomp = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Pisotón',
        set,
        image: 'heroes/she-hulk/01022.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 2,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_HERO_ACTION,
            params: {
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        damage: 1,
                        target: TARGET_ALL_ENEMIES,
                    }
                }
            }
        }],
    }
};

export const legalPractice = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Proceso judicial',
        set,
        image: 'heroes/she-hulk/01023.png',
        traits: [TRAIT_SKILL],
        cost: 0,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_ALTEREGO_ACTION,
            params: {
                labels: [LABEL_THWART],
                arrow: {
                    type: EFFECT_SELECT_DISCARD_TO_CARD,
                    params: {
                        target: TARGET_PLAYER,
                        count: 5,
                    }
                },
                effect: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {
                        target: TARGET_SCHEME,
                        paramsCalc: {
                            target: 'effect.ability.arrow.cost.cards',
                            formula: CALC_COUNT,
                        }
                    }
                }
            }
        }],
    }
};

export const splitPersonality = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Doble personalidad',
        set,
        image: 'heroes/she-hulk/01025.png',
        cost: 3,
        resources: [RESOURCE_ENERGY],
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                name: 'Doble personalidad',
                effect: [{
                    type: EFFECT_FLIP,
                    params: {
                        target: TARGET_YOUR_SUPERHERO,
                    }
                }, {
                    type: EFFECT_FILL_HAND,
                }]
            }
        }],
    }
};

export const superhumanLawDivision = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'División de Derecho Superhumano',
        set,
        image: 'heroes/she-hulk/01026.png',
        traits: [TRAIT_LOCATION],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_ALTEREGO_ACTION,
            params: {
                arrow: {
                    type: EFFECT_CHAINED,
                    params: {
                        matchAll: true,
                        effects: [{
                            type: EFFECT_EXHAUST,
                            params: {
                                target: TARGET_CARD,
                            }
                        }, {
                            type: EFFECT_SPEND,
                            params: {
                                resources: [RESOURCE_WILD],
                            }
                        }]
                    }
                },
                effect: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {
                        threat: 2,
                        target: TARGET_SCHEME,
                    }
                }
            }
        }],
    }
};

export const focusedRage = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Furia concentrada',
        set,
        image: 'heroes/she-hulk/01027.png',
        traits: [TRAIT_SKILL],
        cost: 3,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_HERO_ACTION,
            params: {
                arrow: {
                    type: EFFECT_CHAINED,
                    params: {
                        matchAll: true,
                        effects: [{
                            type: EFFECT_EXHAUST,
                            params: {
                                target: TARGET_CARD,
                            }
                        }, {
                            type: EFFECT_TAKE_DAMAGE,
                            params: {
                                damage: 1,
                                target: TARGET_YOUR_SUPERHERO,
                            }
                        }]
                    }
                },
                effect: {
                    type: EFFECT_DRAW_CARD,
                    params: {
                        count: 1,
                        target: TARGET_PLAYER,
                    }
                }
            }
        }],
    }
};

export const superhumanStrength = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Fuerza sobrehumana',
        set,
        image: 'heroes/she-hulk/01028.png',
        traits: [TRAIT_SUPERPOWER],
        cost: 2,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_CONSTANT,
            params: {
                hideDialog: true,
                trigger: TRIGGER_YOUR_HERO_GET_ATTACK,
                effect: {
                    type: EFFECT_MODIFY_ATTACK_VALUE,
                    params: {
                        target: TARGET_EFFECT,
                        count: 2,
                    }
                },
            }
        }, {
            type: ABILITY_FORCED_RESPONSE,
            params: {
                trigger: TRIGGER_YOU_ANY_ATTACK,
                arrow: {
                    type: EFFECT_DISCARD_GAME,
                    params: {
                        target: TARGET_THIS,
                    }
                },
                effect: {
                    type: EFFECT_STUN,
                    params: {
                        target: TARGET_ATTACKED,
                    }
                }
            }
        }],
    }
};

export const legalWorkCard = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Trabajo jurídico',
        image: 'heroes/she-hulk/01160.png',
        traits: [TRAIT_CONDITION],
        boost: 2,
        giveToOwner: true,
        triggerInstant: true,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_INSTANT,
                    name: 'Convertirte en Jennifer Walters',
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
                                        name: 'Agotar a Jennifer Walters para retirar la Obligación',
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
                                        name: 'Asignar 1 ficha de Aceleración al Plan principal para descartar la Obligación',
                                        effect: {
                                            type: EFFECT_CHAINED,
                                            params: {
                                                effects: [
                                                    {
                                                        type: EFFECT_ADD_ACCELERATION_TOKEN,
                                                        params: {
                                                            target: TARGET_MAIN_SCHEME,
                                                            count: 1,
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

export const personalChallengeCard = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Reto personal',
        img: 'heroes/she-hulk/01161.png',
        boost: 3,
        icons: {crisis: true},
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

export const titaniaCard = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Titania',
        unique: true,
        img: 'heroes/she-hulk/01162.png',
        traits: [TRAIT_BRUTE, TRAIT_ELITE],
        boost: 2,
        hitPoints: 6,
        attack: {
            formula: CALC_DAMAGE,
            target: 'card',
            invert: true,
        },
        scheme: 1,
    }
};

export const geneticUpgradeCard = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Mejora genética',
        img: 'heroes/she-hulk/01163.png',
        traits: [TRAIT_CONDITION],
        boost: 1,
        attach: {
            target: TARGET_MINION_HIGHEST_HP,
            ifNot: {
                type: EFFECT_SURGE,
            }
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'Mejora genética',
                    effect: {
                        type: EFFECT_MODIFY_HIT_POINTS,
                        params: {
                            target: TARGET_ATTACHED,
                            count: 3,
                        }
                    }
                }
            }
        ]
    }
};

export const titaniasFuryCard = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'La furia de Titania',
        img: 'heroes/she-hulk/01164.png',
        traits: [],
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    name: 'La furia de Titania',
                    effect: {
                        type: EFFECT_ENEMY_ATTACK,
                        params: {
                            target: TARGET_BY_TITLE,
                            name: 'Titania',
                            targetTo: TARGET_HERO,
                        }
                    },
                    ifNot: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_HEAL,
                                    params: {
                                        target: TARGET_BY_TITLE,
                                        title: 'Titania',
                                        damage: 0,
                                        paramsCalc: {
                                            formula: CALC_ALL,
                                            target: 'target',
                                        }
                                    }
                                },
                                {
                                    type: EFFECT_SURGE,
                                }
                            ]
                        }
                    }
                }
            }
        ],
        boostEffect: {
            type: EFFECT_DEAL_BOOST,
            params: {
                target: TARGET_VILLAIN,
                count: 1,
            }
        }
    }
};
