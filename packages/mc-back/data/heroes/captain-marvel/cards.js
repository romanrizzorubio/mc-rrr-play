import {
    TRAIT_AERIAL, TRAIT_ARMOR, TRAIT_ATTACK,
    TRAIT_AVENGER, TRAIT_ELITE, TRAIT_KREE,
    TRAIT_LOCATION, TRAIT_SHIELD,
    TRAIT_SOLDIER, TRAIT_SPY,
    TRAIT_SUPERPOWER, TRAIT_TECH, TRAIT_THWART
} from "../../../src/constants/traits.js";
import {CLASSIFICATION_HERO} from "../../../src/constants/classifications.js";
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL, RESOURCE_WILD} from "../../../src/constants/resources.js";
import {TIME_ROUND} from "../../../src/constants/times.js";
import {
    TARGET_ACTIVATION,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ANY_PLAYER,
    TARGET_CARD, TARGET_CONDITION_CARD, TARGET_EFFECT, TARGET_ENEMY,
    TARGET_HERO, TARGET_MAIN_SCHEME,
    TARGET_SCHEME, TARGET_THIS, TARGET_VILLAIN, TARGET_YOU, TARGET_YOUR_SUPERHERO
} from "../../../src/constants/targets.js";
import {LABEL_ATTACK, LABEL_DEFENSE, LABEL_THWART} from "../../../src/constants/labels.js";
import {
    CALC_COUNT, CALC_MULTIPLY_2,
} from "../../../src/constants/calc.js";
import {EFFECT_DRAW_CARD} from "../../../src/effects/draw-effect.js";
import {EFFECT_CHAINED} from "../../../src/effects/chained-effect.js";
import {EFFECT_REMOVE_THREAT} from "../../../src/effects/remove-threat-effect.js";
import {EFFECT_DO_IF_HAS_TRAITS} from "../../../src/effects/do-if-has-traits-effect.js";
import {EFFECT_SPEND} from "../../../src/effects/spend-effect.js";
import {EFFECT_HEAL} from "../../../src/effects/heal-effect.js";
import {EFFECT_PLACE_COUNTER} from "../../../src/effects/place-counters-effect.js";
import {ABILITY_HERO_ACTION} from "../../../src/abilities/actions/hero-action-ability.js";
import {EFFECT_DISCARD_GAME} from "../../../src/effects/discard-from-game-effect.js";
import {EFFECT_DEAL_DAMAGE} from "../../../src/effects/deal-damage-effect.js";
import {EFFECT_PREVENT_DAMAGE} from "../../../src/effects/prevent-damage-effect.js";
import {ABILITY_ACTION} from "../../../src/abilities/actions/action-ability.js";
import {CARD_TYPE_HERO} from "../../../src/model/printed/hero-card.js";
import {CARD_TYPE_ALTEREGO} from "../../../src/model/printed/alterego-card.js";
import {CARD_TYPE_ALLY} from "../../../src/model/printed/ally-card.js";
import {ABILITY_RESPONSE} from "../../../src/abilities/response/response-ability.js";
import {EFFECT_SURGE} from "../../../src/effects/surge-effect.js";
import {EFFECT_DISCARD_CONDITION_HAND} from "../../../src/effects/discard-condition-hand-effect.js";
import {ABILITY_WHEN_REVEALED} from "../../../src/abilities/when/when-revealed-ability.js";
import {CARD_TYPE_TREACHERY} from "../../../src/model/printed/treachery-card.js";
import {EFFECT_CONFUSE} from "../../../src/effects/confuse-effect.js";
import {CARD_TYPE_EVENT} from "../../../src/model/printed/event-card.js";
import {EFFECT_PLACE_THREAT} from "../../../src/effects/place-threat-effect.js";
import {EFFECT_DO_IF} from "../../../src/effects/do-if-effect.js";
import {EFFECT_DO_IF_HAS_PAID} from "../../../src/effects/do-if-has-paid-effect.js";
import {CARD_TYPE_RESOURCE} from "../../../src/model/printed/resource-card.js";
import {ABILITY_BOOST} from "../../../src/abilities/misc/boost-ability.js";
import {CARD_TYPE_SUPPORT} from "../../../src/model/printed/support-card.js";
import {EFFECT_EXHAUST} from "../../../src/effects/exhaust-effect.js";
import {ABILITY_FORCED_RESPONSE} from "../../../src/abilities/response/forced-response-ability.js";
import {EFFECT_SELECT_DISCARD_CARD} from "../../../src/effects/select-discard-card-effect.js";
import {CARD_TYPE_MINION} from "../../../src/model/printed/minion-card.js";
import {CARD_TYPE_UPGRADE} from "../../../src/model/printed/upgrade-card.js";
import {ABILITY_CONSTANT} from "../../../src/abilities/misc/constant-ability.js";
import {CARD_TYPE_SIDE_SCHEME_SCENARIO} from "../../../src/model/printed/side-scheme-scenario-card.js";
import {EFFECT_MODIFY_DEFENSE_VALUE} from "../../../src/effects/modify-defense-value-effect.js";
import {EFFECT_STUN} from "../../../src/effects/stun-effect.js";
import {ABILITY_OPTION} from "../../../src/abilities/misc/option-ability.js";
import {EFFECT_MODIFY_TRAITS} from "../../../src/effects/modify-traits-effect.js";
import {ABILITY_HERO_INTERRUPT} from "../../../src/abilities/interrupt/hero-interrupt-ability.js";
import {EFFECT_REMOVE_CARD} from "../../../src/effects/remove-card-effect.js";
import {EFFECT_CHOOSE_ABILITY} from "../../../src/effects/choose-ability-effect.js";
import {EFFECT_SPEND_X} from "../../../src/effects/spend-x-effect.js";
import {EFFECT_FLIP} from "../../../src/effects/flip-effect.js";
import {EFFECT_MAY} from "../../../src/effects/may-effect.js";
import {CARD_TYPE_OBLIGATION} from "../../../src/model/printed/obligation-card.js";
import {TRIGGER_CONDITION_GET_DEFENSE} from "../../../src/triggers/condition-get-defense-trigger.js";
import {TRIGGER_CONDITION_GET_TRAITS} from "../../../src/triggers/condition-get-traits-trigger.js";
import {TRIGGER_THIS_ATTACK} from "../../../src/triggers/this-attack-trigger.js";
import {TRIGGER_THIS_ENTER_PLAY} from "../../../src/triggers/this-enter-play-trigger.js";
import {TRIGGER_YOU_WOULD_TAKE_DAMAGE} from "../../../src/triggers/you-would-take-damage-trigger.js";
import {TRIGGER_INSTANT} from "../../../src/triggers/instant-trigger.js";

const set = 'Captain Marvel';
export const captainMarvelCard = {
    type: CARD_TYPE_HERO,
    params: {
        name: 'Capitana Marvel',
        set,
        image: 'heroes/captain-marvel/carol0b.webp',
        traits: [TRAIT_AVENGER, TRAIT_SOLDIER],
        unique: true,
        classification: CLASSIFICATION_HERO,
        thwart: 2,
        attack: 2,
        defense: 1,
        handSize: 5,
        hitPoints: 12,
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                name: 'Redirigir energía',
                limit: {count: 1, time: TIME_ROUND},
                arrow: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [{
                            type: EFFECT_SPEND,
                            params: {
                                resources: [RESOURCE_ENERGY]
                            }
                        }, {
                            type: EFFECT_HEAL,
                            params: {
                                damage: 1,
                                target: TARGET_YOU,
                            }
                        }]
                    }
                },
                effect: {
                    type: EFFECT_DRAW_CARD,
                    params: {
                        target: TARGET_YOU
                    }
                }
            }
        }],
    }
};
export const carolDanversCard = {
    type: CARD_TYPE_ALTEREGO,
    params: {
        name: 'Carol Danvers',
        set,
        image: 'heroes/captain-marvel/carol0a.webp',
        traits: [TRAIT_SHIELD, TRAIT_SOLDIER],
        unique: true,
        classification: CLASSIFICATION_HERO,
        recovery: 4,
        handSize: 6,
        hitPoints: 12,
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                name: 'Comandante',
                limit: {count: 1, time: TIME_ROUND},
                effect: {
                    type: EFFECT_DRAW_CARD,
                    params: {
                        target: TARGET_ANY_PLAYER,
                    }
                }
            }
        }],
    }
};
export const spiderWoman = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Spider Woman',
        set,
        image: 'heroes/captain-marvel/carol1.webp',
        traits: [TRAIT_AVENGER, TRAIT_SPY],
        unique: true,
        cost: 3,
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        subtitle: 'Jessica Drew',
        thwart: 2,
        attack: 2,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 2,
        abilities: [{
            type: ABILITY_RESPONSE,
            params: {
                trigger: TRIGGER_THIS_ENTER_PLAY,
                effect: {
                    type: EFFECT_CONFUSE,
                    params: {
                        target: TARGET_VILLAIN,
                    }
                }
            }
        }],
    }
};
export const crisisInterdiction = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Evitar una crisis',
        set,
        image: 'heroes/captain-marvel/carol2.webp',
        traits: [TRAIT_THWART],
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_HERO_ACTION,
            params: {
                labels: [LABEL_THWART],
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_SCHEME,
                        effects: [{
                            type: EFFECT_REMOVE_THREAT,
                            params: {
                                threat: 2,
                                target: TARGET_SCHEME,
                            }
                        }, {
                            type: EFFECT_DO_IF_HAS_TRAITS,
                            params: {
                                target: TARGET_HERO,
                                traits: [TRAIT_AERIAL],
                                effect: {
                                    type: EFFECT_REMOVE_THREAT,
                                    params: {
                                        threat: 2,
                                        target: TARGET_SCHEME,
                                        excludeTarget: 'effects.0.selectedTarget',
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
export const photonicBlast = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Rayo fotónico',
        set,
        image: 'heroes/captain-marvel/carol5.webp',
        traits: [TRAIT_ATTACK, TRAIT_SUPERPOWER],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_HERO_ACTION,
            params: {
                labels: [LABEL_ATTACK],
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_ENEMY,
                        effects: [{
                            type: EFFECT_DEAL_DAMAGE,
                            params: {
                                damage: 5,
                                target: TARGET_ENEMY,
                            }
                        }, {
                            type: EFFECT_DO_IF_HAS_PAID,
                            params: {
                                resources: [RESOURCE_ENERGY],
                                effect: {
                                    type: EFFECT_DRAW_CARD,
                                    params: {
                                        target: TARGET_YOU,
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
export const energyAbsorption = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'Absorción de Energía',
        set,
        image: 'heroes/captain-marvel/carol8.webp',
        resources: [RESOURCE_ENERGY, RESOURCE_ENERGY, RESOURCE_ENERGY],
        classification: set,
    }
};
export const alphaFlightStation = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Base orbital de Alpha Flight',
        set,
        image: 'heroes/captain-marvel/carol10.webp',
        traits: [TRAIT_LOCATION, TRAIT_SHIELD],
        unique: true,
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                arrow: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [{
                            type: EFFECT_EXHAUST,
                            params: {
                                target: TARGET_CARD,
                                title: 'Agotar la Base',
                            }
                        }, {
                            type: EFFECT_SELECT_DISCARD_CARD,
                            params: {
                                target: TARGET_YOU,
                                title: 'Descartar una carta',
                            }
                        }]
                    }
                },
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [{
                            type: EFFECT_DRAW_CARD,
                            params: {
                                target: TARGET_YOU,
                            }
                        }, {
                            type: EFFECT_DO_IF,
                            params: {
                                target: TARGET_CARD,
                                condition: {
                                    'player.isAlterEgo': true,
                                },
                                effect: {
                                    type: EFFECT_DRAW_CARD,
                                    params: {
                                        target: TARGET_YOU,
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
export const captainMarvelsHelmet = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Casco de la Capitana Marvel',
        set,
        image: 'heroes/captain-marvel/carol11.webp',
        traits: [TRAIT_ARMOR, TRAIT_TECH],
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        unique: true,
        abilities: [{
            type: ABILITY_CONSTANT,
            params: {
                hideDialog: true,
                trigger: TRIGGER_CONDITION_GET_DEFENSE,
                triggerParams: {
                    conditionTrigger: {
                        name: 'Capitana Marvel',
                    },
                    conditionSource: 'effect.selectedTarget',
                },
                effect: {
                    type: EFFECT_MODIFY_DEFENSE_VALUE,
                    params: {
                        target: TARGET_EFFECT,
                        count: 1,
                    }
                }
            }
        }, {
            type: ABILITY_CONSTANT,
            params: {
                hideDialog: true,
                trigger: TRIGGER_CONDITION_GET_DEFENSE,
                triggerParams: {
                    conditionTrigger: {
                        name: 'Capitana Marvel',
                    },
                    conditionSource: 'effect.selectedTarget',
                },
                effect: {
                    type: EFFECT_DO_IF_HAS_TRAITS,
                    params: {
                        target: TARGET_HERO,
                        traits: [TRAIT_AERIAL],
                        effect: {
                            type: EFFECT_MODIFY_DEFENSE_VALUE,
                            params: {
                                target: TARGET_EFFECT,
                                characterTarget: TARGET_HERO,
                                count: 1,
                            }
                        }
                    }
                }
            }
        }],
    }
};
export const cosmicFlight = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Vuelo cósmico',
        set,
        image: 'heroes/captain-marvel/carol12.webp',
        traits: [TRAIT_SUPERPOWER],
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_CONSTANT,
            params: {
                hideDialog: true,
                trigger: TRIGGER_CONDITION_GET_TRAITS,
                triggerParams: {
                    conditionTrigger: {
                        name: 'Capitana Marvel',
                    },
                    conditionSource: 'effect.selectedTarget',
                },
                effect: {
                    type: EFFECT_MODIFY_TRAITS,
                    params: {
                        target: TARGET_EFFECT,
                        traits: [TRAIT_AERIAL],
                    }
                }
            }
        }, {
            type: ABILITY_HERO_INTERRUPT,
            params: {
                trigger: TRIGGER_YOU_WOULD_TAKE_DAMAGE,
                labels: [LABEL_DEFENSE],
                arrow: {
                    type: EFFECT_DISCARD_GAME,
                    params: {
                        target: TARGET_CARD,
                    }
                },
                effect: {
                    type: EFFECT_PREVENT_DAMAGE,
                    target: TARGET_YOU,
                    params: {
                        damage: 3,
                    }
                }
            }
        }],
    }
};
export const energyChannel = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Canalizar energía',
        set,
        image: 'heroes/captain-marvel/carol14.webp',
        traits: [TRAIT_SUPERPOWER],
        cost: 0,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        maximum: {
            count: 1,
        },
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                name: 'Cargar',
                arrow: {
                    type: EFFECT_SPEND_X,
                    params: {
                        resourceType: RESOURCE_ENERGY,
                    }
                },
                effect: {
                    type: EFFECT_PLACE_COUNTER,
                    params: {
                        target: TARGET_THIS,
                        paramsCalc: {
                            target: 'effect.ability.arrow.cost.paid',
                            formula: CALC_COUNT,
                        },
                    }
                }
            }
        }, {
            type: ABILITY_HERO_ACTION,
            params: {
                name: 'Disparar',
                labels: [LABEL_ATTACK],
                arrow: {
                    type: EFFECT_DISCARD_GAME,
                    params: {
                        target: TARGET_THIS,
                        saveData: ['counters'],
                    }
                },
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_ENEMY,
                        paramsCalc: {
                            target: 'effect.ability.arrow.cost.savedData.counters',
                            formula: CALC_MULTIPLY_2,
                            max: 10,
                        },
                    }
                }
            }
        }],
    }
};
export const familyEmergency = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Family Emergency',
        set,
        image: 'heroes/captain-marvel/caroln0.webp',
        boost: 2,
        giveToOwner: true,
        triggerInstant: true,
        abilities: [{
            type: ABILITY_CONSTANT,
            params: {
                trigger: TRIGGER_INSTANT,
                name: 'Convertirte en Carol Danvers',
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
        }, {
            type: ABILITY_CONSTANT,
            params: {
                trigger: TRIGGER_INSTANT,
                name: 'Resolver la obligación',
                effect: {
                    type: EFFECT_CHOOSE_ABILITY,
                    params: {
                        options: [{
                            type: ABILITY_OPTION,
                            params: {
                                name: 'Agotar a Carol Danvers para retirar la Obligación',
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
                        }, {
                            type: ABILITY_OPTION,
                            params: {
                                name: 'Quedar aturdido y Oleada para descartar la Obligación',
                                effect: {
                                    type: EFFECT_CHAINED,
                                    params: {
                                        effects: [{
                                            type: EFFECT_STUN,
                                            params: {
                                                target: TARGET_YOU,
                                            }
                                        }, {
                                            type: EFFECT_SURGE,
                                        }, {
                                            type: EFFECT_DISCARD_GAME,
                                            params: {
                                                target: TARGET_CARD,
                                            },
                                        }]
                                    }
                                },
                            }
                        }],
                    }
                }
            }
        }],
    }
};
export const thePsycheMagnitron = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'The Psyche-Magnitron',
        set,
        image: 'heroes/captain-marvel/caroln1.webp',
        boost: 3,
        icons: {hazard: 1},
        startingThreat: 3,
        abilities:  [{
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
export const yonRogg = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Yon-Rogg',
        set,
        image: 'heroes/captain-marvel/caroln2.webp',
        boost: 2,
        hitPoints: 5,
        attack: 3,
        scheme: 2,
        unique: true,
        traits: [TRAIT_ELITE, TRAIT_KREE],
        nemesis: true,
        abilities:  [{
            type: ABILITY_FORCED_RESPONSE,
            params: {
                trigger: TRIGGER_THIS_ATTACK,
                effect: {
                    type: EFFECT_PLACE_THREAT,
                    params: {
                        threat: 1,
                        target: TARGET_CONDITION_CARD,
                        condition: {
                            name: 'The Psyche-Magnitron'
                        }
                    }
                }
            }
        }],
    }
};
export const kreeManipulator = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Kree Manipulator',
        set,
        image: 'heroes/captain-marvel/caroln3.webp',
        keywords: {surge: true},
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_PLACE_THREAT,
                    params: {
                        target: TARGET_MAIN_SCHEME,
                        threat: 1,
                    }
                },
            }
        }],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_DO_IF,
                    params: {
                        target: TARGET_ACTIVATION,
                        condition: {
                            'activation.isAttack': true,
                            'activation.character.isVillain': true,
                            'activation.isDefended': false,
                        },
                        effect: {
                            type: EFFECT_PLACE_THREAT,
                            params: {
                                target: TARGET_MAIN_SCHEME,
                                threat: 1,
                            }
                        }
                    }
                },
            }
        }
    }
};
export const yonRoggsTreason = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Yon-Rogg\'s Treason',
        set,
        image: 'heroes/captain-marvel/caroln5.webp',
        boost: 1,
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_DISCARD_CONDITION_HAND,
                    params: {
                        condition: {
                            resources: [RESOURCE_ENERGY],
                        },
                    }
                },
                ifNot: {
                    type: EFFECT_SURGE,
                }
            }
        }],
    }
};
