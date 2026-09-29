import {
    TRAIT_AERIAL, TRAIT_ARMOR, TRAIT_ATTACK, TRAIT_ATTORNEY,
    TRAIT_AVENGER, TRAIT_ELITE, TRAIT_GAMMA, TRAIT_KREE,
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
    TARGET_CARD, TARGET_CONDITION_CARD, TARGET_EFFECT, TARGET_ENEMY, TARGET_ALL_ENEMIES,
    TARGET_HERO, TARGET_BY_NAME, TARGET_MAIN_SCHEME,
    TARGET_SCHEME, TARGET_THIS, TARGET_VILLAIN, TARGET_YOU, TARGET_YOUR_SUPERHERO
} from "../../../src/constants/targets.js";
import {LABEL_ATTACK, LABEL_DEFENSE, LABEL_THWART} from "../../../src/constants/labels.js";
import {
    CALC_COUNT, CALC_DAMAGE, CALC_MULTIPLY_2,
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
import {ABILITY_ALTEREGO_ACTION} from "../../../src/abilities/actions/alterego-action-ability.js";
import {ABILITY_HERO_INTERRUPT} from "../../../src/abilities/interrupt/hero-interrupt-ability.js";
import {EFFECT_REMOVE_CARD} from "../../../src/effects/remove-card-effect.js";
import {EFFECT_MODIFY_ATTACK_VALUE} from "../../../src/effects/modify-attack-value-effect.js";
import {EFFECT_CHOOSE_ABILITY} from "../../../src/effects/choose-ability-effect.js";
import {EFFECT_SPEND_X} from "../../../src/effects/spend-x-effect.js";
import {EFFECT_FLIP} from "../../../src/effects/flip-effect.js";
import {EFFECT_MAY} from "../../../src/effects/may-effect.js";
import {CARD_TYPE_OBLIGATION} from "../../../src/model/printed/obligation-card.js";
import {TRIGGER_CONDITION_GET_DEFENSE} from "../../../src/triggers/condition-get-defense-trigger.js";
import {TRIGGER_CONDITION_GET_TRAITS} from "../../../src/triggers/condition-get-traits-trigger.js";
import {TRIGGER_THIS_FLIP} from "../../../src/triggers/this-flip-trigger.js";
import {TRIGGER_THIS_ATTACK} from "../../../src/triggers/this-attack-trigger.js";
import {TRIGGER_THIS_ENTER_PLAY} from "../../../src/triggers/this-enter-play-trigger.js";
import {TRIGGER_YOU_WOULD_TAKE_DAMAGE} from "../../../src/triggers/you-would-take-damage-trigger.js";
import {TRIGGER_INSTANT} from "../../../src/triggers/instant-trigger.js";
import {ABILITY_INTERRUPT} from "../../../src/abilities/interrupt/interrupt-ability.js";
import {EFFECT_PREVENT_PLACE_THREAT} from "../../../src/effects/prevent-place-threat-effect.js";
import {EFFECT_RETURN_HAND} from "../../../src/effects/return-hand-effect.js";
import {TRIGGER_PLACE_THREAT} from "../../../src/triggers/place-threat-trigger.js";
import {TRIGGER_YOUR_HERO_GET_ATTACK} from "../../../src/triggers/your-hero-get-attack-trigger.js";
import {TRIGGER_YOU_ANY_ATTACK} from "../../../src/triggers/you-any-attack-trigger.js";
import {ABILITY_HERO_RESPONSE} from "../../../src/abilities/responses/hero-response-ability.js";
import {TRIGGER_YOU_ATTACK} from "../../../src/triggers/you-attack-trigger.js";
import {EFFECT_READY} from "../../../src/effects/ready-effect.js";
import {EFFECT_FILL_HAND} from "../../../src/effects/fill-hand-effect.js";

const set = 'Hulka';
export const sheHulkCard = {
    type: CARD_TYPE_HERO,
    params: {
        name: 'Hulka',
        set,
        image: 'heroes/she-hulk/01019a.webp',
        traits: [TRAIT_AVENGER, TRAIT_GAMMA],
        unique: true,
        classification: CLASSIFICATION_HERO,
        thwart: 1,
        attack: 3,
        defense: 2,
        handSize: 4,
        hitPoints: 15,
        abilities: [{
            type: ABILITY_RESPONSE,
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
        image: 'heroes/she-hulk/01019b.webp',
        traits: [TRAIT_ATTORNEY, TRAIT_GAMMA],
        unique: true,
        classification: CLASSIFICATION_HERO,
        recovery: 5,
        handSize: 6,
        hitPoints: 15,
        abilities: [{
            type: ABILITY_INTERRUPT,
            params: {
                name: '¡Protesto!',
                limit: {count: 1, time: TIME_ROUND},
                trigger: TRIGGER_PLACE_THREAT,
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
        image: 'heroes/she-hulk/01020.webp',
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
                trigger: TRIGGER_YOU_ATTACK,
                effect: {
                    type: EFFECT_READY,
                    params: {
                        target: TARGET_BY_NAME,
                        name: 'Hulka',
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
                arrow: {
                    type: EFFECT_SELECT_DISCARD_CARD,
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
                            target: 'effect.ability.arrow.cards',
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
                    type: EFFECT_REMOVE_CARD,
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
