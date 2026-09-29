import {
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_HERO,
} from "../../../src/constants/back-cards.js";
import {CARD_TYPE_UPGRADE} from "../../../src/model/printed/upgrade-card.js";
import {CARD_TYPE_ALLY} from "../../../src/model/printed/ally-card.js";
import {CARD_TYPE_EVENT} from "../../../src/model/printed/event-card.js";
import {CARD_TYPE_RESOURCE} from "../../../src/model/printed/resource-card.js";
import {CARD_TYPE_SUPPORT} from "../../../src/model/printed/support-card.js";
import {
    TRAIT_AVENGER,
    TRAIT_GENIUS,
    TRAIT_INDIVIDUAL,
    TRAIT_WAKANDA,
    TRAIT_KING,
    TRAIT_BLACK_PANTHER,
    TRAIT_TACTIC,
    TRAIT_LOCATION,
    TRAIT_WEAPON,
    TRAIT_SKILL,
    TRAIT_ARMOR,
} from "../../../src/constants/traits.js";
import {
    RESOURCE_PHYSICAL,
    RESOURCE_MENTAL,
    RESOURCE_ENERGY,
    RESOURCE_WILD,
} from "../../../src/constants/resources.js";
import {ABILITY_ALTEREGO_ACTION} from "../../../src/abilities/actions/alterego-action-ability.js";
import {ABILITY_HERO_ACTION} from "../../../src/abilities/actions/hero-action-ability.js";
import {ABILITY_RESPONSE} from "../../../src/abilities/response/response-ability.js";
import {ABILITY_SPECIAL} from "../../../src/abilities/misc/special-ability.js";
import {TRIGGER_THIS_ENTER_PLAY} from "../../../src/triggers/this-enter-play-trigger.js";
import {EFFECT_SEARCH_CARDS} from "../../../src/effects/search-cards-effect.js";
import {EFFECT_MOVE_TO_HAND} from "../../../src/effects/move-to-hand-effect.js";
import {EFFECT_MOVE_TO_DECK} from "../../../src/effects/move-to-deck-effect.js";
import {EFFECT_SHUFFLE_DECK} from "../../../src/effects/shuffle-deck-effect.js";
import {EFFECT_CHAINED} from "../../../src/effects/chained-effect.js";
import {EFFECT_SELECT_AND_ORDER_CARDS} from "../../../src/effects/select-and-order-cards-effect.js";
import {EFFECT_RESOLVE_SELECTED_SPECIAL_ABILITIES} from "../../../src/effects/resolve-selected-special-abilities-effect.js";
import {EFFECT_DRAW_CARD} from "../../../src/effects/draw-effect.js";
import {EFFECT_EXHAUST} from "../../../src/effects/exhaust-effect.js";
import {EFFECT_DEAL_DAMAGE} from "../../../src/effects/deal-damage-effect.js";
import {EFFECT_REMOVE_THREAT} from "../../../src/effects/remove-threat-effect.js";
import {EFFECT_MOVE_DAMAGE} from "../../../src/effects/move-damage-effect.js";
import {PLACE_DECK, PLACE_DISCARD_PILE, PLACE_IN_PLAY} from "../../../src/constants/places.js";
import {
    LABEL_ATTACK,
    LABEL_THWART,
} from "../../../src/constants/labels.js";
import {
    TARGET_YOU,
    TARGET_ANY_PLAYER,
    TARGET_VILLAIN,
    TARGET_ALL_ENGAGED_MINIONS,
    TARGET_SELECT_ENEMY,
    TARGET_SCHEME,
} from "../../../src/constants/targets.js";

const blackPantherCard = {
    name: 'Pantera Negra',
    type: CARD_TYPE_HERO,
    traits: [TRAIT_AVENGER, TRAIT_WAKANDA],
    img: 'heroes/black-panther/01040a.png',
    params: {
        handSize: 5,
        hitPoints: 11,
        thwart: 2,
        attack: 2,
        defense: 2
    },
    keywords: {
        retaliate: 1
    },
    abilities: []
};

const tChallaCard = {
    name: "T'Challa",
    type: CARD_TYPE_ALTEREGO,
    traits: [TRAIT_GENIUS, TRAIT_INDIVIDUAL, TRAIT_WAKANDA, TRAIT_KING],
    img: 'heroes/black-panther/01040b.png',
    params: {
        handSize: 6,
        hitPoints: 11,
        recovery: 4
    },
    abilities: [
        {
            name: 'Previsión',
            type: ABILITY_ALTEREGO_ACTION,
            description: 'Acción de Alter ego (preparación): busca en tu mazo una Mejora PANTERA NEGRA y añádela a tu mano. Baraja tu mazo.',
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_SEARCH_CARDS,
                                params: {
                                    locations: [PLACE_DECK],
                                    filter: {
                                        type: CARD_TYPE_UPGRADE,
                                        traits: [TRAIT_BLACK_PANTHER],
                                    },
                                    title: 'Busca una Mejora PANTERA NEGRA',
                                }
                            },
                            {
                                type: EFFECT_MOVE_TO_HAND,
                            },
                            {
                                type: EFFECT_SHUFFLE_DECK,
                            }
                        ]
                    }
                }
            }
        }
    ]
};

const shuriCard = {
    name: 'Shuri',
    type: CARD_TYPE_ALLY,
    traits: [TRAIT_GENIUS, TRAIT_WAKANDA],
    img: 'heroes/black-panther/01041.png',
    params: {
        cost: 2,
        hitPoints: 3,
        thwart: 1,
        thwartConsequencial: 1,
        attack: 1,
        attackConsequencial: 1
    },
    resources: [RESOURCE_PHYSICAL],
    abilities: [
        {
            type: ABILITY_RESPONSE,
            trigger: TRIGGER_THIS_ENTER_PLAY,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_SEARCH_CARDS,
                                params: {
                                    locations: [PLACE_DECK],
                                    filter: {
                                        type: CARD_TYPE_UPGRADE,
                                    },
                                    title: 'Busca una Mejora',
                                }
                            },
                            {
                                type: EFFECT_MOVE_TO_HAND,
                            },
                            {
                                type: EFFECT_SHUFFLE_DECK,
                            }
                        ]
                    }
                }
            }
        }
    ]
};

const sabiduriaAncestralCard = {
    name: 'Sabiduría ancestral',
    type: CARD_TYPE_EVENT,
    img: 'heroes/black-panther/01042.png',
    params: {
        cost: 1,
    },
    resources: [RESOURCE_MENTAL],
    abilities: [
        {
            type: ABILITY_ALTEREGO_ACTION,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_SEARCH_CARDS,
                                params: {
                                    locations: [PLACE_DISCARD_PILE],
                                    count: 3,
                                    title: 'Elige hasta 3 cartas de tu pila de descartes',
                                }
                            },
                            {
                                type: EFFECT_MOVE_TO_DECK,
                            },
                            {
                                type: EFFECT_SHUFFLE_DECK,
                            }
                        ]
                    }
                }
            }
        }
    ]
};

const wakandaPorSiemprePhysicalCard = {
    name: '¡Wakanda por siempre!',
    type: CARD_TYPE_EVENT,
    traits: [TRAIT_TACTIC],
    img: 'heroes/black-panther/01043a.png',
    params: {
        cost: 1,
    },
    resources: [RESOURCE_PHYSICAL],
    abilities: [
        {
            name: '¡Wakanda por siempre!',
            type: ABILITY_HERO_ACTION,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_SELECT_AND_ORDER_CARDS,
                                params: {
                                    locations: [PLACE_IN_PLAY],
                                    filter: {
                                        traits: [TRAIT_BLACK_PANTHER],
                                        type: CARD_TYPE_UPGRADE,
                                    },
                                    title: 'Elige el orden de las capacidades Especiales',
                                }
                            },
                            {
                                type: EFFECT_RESOLVE_SELECTED_SPECIAL_ABILITIES,
                            }
                        ]
                    }
                }
            }
        }
    ]
};

const wakandaPorSiempreEnergyCard = {
    ...wakandaPorSiemprePhysicalCard,
    img: 'heroes/black-panther/01043a.png',
    resources: [RESOURCE_ENERGY],
};

const wakandaPorSiempreMentalCard = {
    ...wakandaPorSiemprePhysicalCard,
    img: 'heroes/black-panther/01043a.png',
    resources: [RESOURCE_MENTAL],
};

const wakandaPorSiempreWildCard = {
    ...wakandaPorSiemprePhysicalCard,
    img: 'heroes/black-panther/01043a.png',
    resources: [RESOURCE_WILD],
};

const vibraniumCard = {
    name: 'Vibránium',
    type: CARD_TYPE_RESOURCE,
    img: 'heroes/black-panther/01044.png',
    resources: {
        [RESOURCE_WILD]: 2
    },
    abilities: []
};

const goldenCityCard = {
    name: 'La Ciudad Dorada',
    unique: true,
    type: CARD_TYPE_SUPPORT,
    traits: [TRAIT_LOCATION, TRAIT_WAKANDA],
    img: 'heroes/black-panther/01045.png',
    params: {
        cost: 2,
    },
    resources: [RESOURCE_ENERGY],
    abilities: [
        {
            type: ABILITY_ALTEREGO_ACTION,
            arrow: {
                cost: {type: EFFECT_EXHAUST}
            },
            params: {
                effect: {
                    type: EFFECT_DRAW_CARD,
                    count: 2,
                    target: TARGET_YOU,
                }
            }
        }
    ]
};

const energyDaggersCard = {
    name: 'Dagas de energía',
    type: CARD_TYPE_UPGRADE,
    traits: [TRAIT_BLACK_PANTHER, TRAIT_WEAPON],
    img: 'heroes/black-panther/01046.png',
    params: {
        cost: 2,
    },
    resources: [RESOURCE_MENTAL],
    abilities: [
        {
            type: ABILITY_SPECIAL,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    target: TARGET_ANY_PLAYER,
                    effects: [
                        {
                            type: EFFECT_DEAL_DAMAGE,
                            target: TARGET_VILLAIN,
                            damage: 1,
                            paramsLastStep: {
                                damage: 2
                            }
                        },
                        {
                            type: EFFECT_DEAL_DAMAGE,
                            target: TARGET_ALL_ENGAGED_MINIONS,
                            damage: 1,
                            paramsLastStep: {
                                damage: 2
                            }
                        }
                    ]
                }
            }
        }
    ]
};

const pantherClawsCard = {
    name: 'Garras de pantera',
    type: CARD_TYPE_UPGRADE,
    traits: [TRAIT_BLACK_PANTHER, TRAIT_WEAPON],
    img: 'heroes/black-panther/01047.png',
    params: {
        cost: 2,
    },
    resources: [RESOURCE_ENERGY],
    abilities: [
        {
            type: ABILITY_SPECIAL,
            labels: [LABEL_ATTACK],
            params: {
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    target: TARGET_SELECT_ENEMY,
                    damage: 2,
                    paramsLastStep: {
                        damage: 4
                    }
                }
            }
        }
    ]
};

const tacticalGeniusCard = {
    name: 'Ingenio táctico',
    type: CARD_TYPE_UPGRADE,
    traits: [TRAIT_BLACK_PANTHER, TRAIT_SKILL],
    img: 'heroes/black-panther/01048.png',
    params: {
        cost: 2,
    },
    resources: [RESOURCE_PHYSICAL],
    abilities: [
        {
            type: ABILITY_SPECIAL,
            labels: [LABEL_THWART],
            params: {
                effect: {
                    type: EFFECT_REMOVE_THREAT,
                    target: TARGET_SCHEME,
                    threat: 1,
                    paramsLastStep: {
                        threat: 2
                    }
                }
            }
        }
    ]
};

const vibraniumSuitCard = {
    name: 'Traje de vibránium',
    type: CARD_TYPE_UPGRADE,
    traits: [TRAIT_BLACK_PANTHER, TRAIT_ARMOR],
    img: 'heroes/black-panther/01049.png',
    params: {
        cost: 2,
    },
    resources: [RESOURCE_MENTAL],
    abilities: [
        {
            type: ABILITY_SPECIAL,
            labels: [LABEL_ATTACK],
            params: {
                effect: {
                    type: EFFECT_MOVE_DAMAGE,
                    fromTarget: TARGET_YOU,
                    target: TARGET_SELECT_ENEMY,
                    damage: 1,
                    paramsLastStep: {
                        damage: 2
                    }
                }
            }
        }
    ]
};

export {
    blackPantherCard,
    tChallaCard,
    shuriCard,
    sabiduriaAncestralCard,
    wakandaPorSiemprePhysicalCard,
    wakandaPorSiempreEnergyCard,
    wakandaPorSiempreMentalCard,
    wakandaPorSiempreWildCard,
    vibraniumCard,
    goldenCityCard,
    energyDaggersCard,
    pantherClawsCard,
    tacticalGeniusCard,
    vibraniumSuitCard,
};
