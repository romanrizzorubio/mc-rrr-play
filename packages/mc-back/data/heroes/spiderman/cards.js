import {
    TRAIT_AERIAL, TRAIT_ATTACK,
    TRAIT_CONDITION,
    TRAIT_AVENGER, TRAIT_CRIMINAL,
    TRAIT_DEFENSE,
    TRAIT_GENIUS,
    TRAIT_HEROFORHIRE, TRAIT_INDIVIDUAL, TRAIT_ITEM,
    TRAIT_SKILL,
    TRAIT_SUPERPOWER, TRAIT_TECH
} from "../../../src/constants/traits.js";
import {CLASSIFICATION_HERO} from "../../../src/constants/classifications.js";
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL, RESOURCE_WILD} from "../../../src/constants/resources.js";
import {CHARACTER_ENEMY, CHARACTER_MINION, CHARACTER_PLAYER} from "../../../src/constants/characters.js";
import {TIME_ROUND} from "../../../src/constants/times.js";
import {
    TARGET_ACTIVATION,
    TARGET_ALL_CARDS,
    TARGET_ALL_PLAYERS,
    TARGET_ALTEREGO, TARGET_ALTEREGO_SIDE, TARGET_ANY,
    TARGET_ATTACKED, TARGET_CARD, TARGET_EFFECT, TARGET_ENEMY,
    TARGET_HERO,
    TARGET_MAIN_SCHEME, TARGET_PLAYER,
    TARGET_SCHEME, TARGET_SOURCE, TARGET_YOU, TARGET_YOUR_SUPERHERO
} from "../../../src/constants/targets.js";
import {LABEL_ATTACK, LABEL_DEFENSE} from "../../../src/constants/labels.js";
import {CALC_DIFFERENT_RESOURCE_TYPE} from "../../../src/constants/calc.js";
import {CARD_TYPE_HERO} from "../../../src/model/printed/hero-card.js";
import {ABILITY_INTERRUPT} from "../../../src/abilities/interrupt/interrupt-ability.js";
import {EFFECT_DRAW_CARD} from "../../../src/effects/draw-effect.js";
import {CARD_TYPE_ALTEREGO} from "../../../src/model/printed/alterego-card.js";
import {ABILITY_RESOURCE} from "../../../src/abilities/resource/resource-ability.js";
import {CARD_TYPE_ALLY} from "../../../src/model/printed/ally-card.js";
import {ABILITY_FORCED_RESPONSE} from "../../../src/abilities/response/forced-response-ability.js";
import {EFFECT_DISCARD_DRAW} from "../../../src/effects/discard-draw-effect.js";
import {CARD_TYPE_EVENT} from "../../../src/model/printed/event-card.js";
import {EFFECT_PREVENT_DAMAGE} from "../../../src/effects/prevent-damage-effect.js";
import {ABILITY_HERO_INTERRUPT} from "../../../src/abilities/interrupt/hero-interrupt-ability.js";
import {EFFECT_CANCEL_ENCOUNTER} from "../../../src/effects/cancel-encounter-effect.js";
import {CARD_TYPE_TREACHERY} from "../../../src/model/printed/treachery-card.js";
import {ABILITY_HERO_ACTION} from "../../../src/abilities/actions/hero-action-ability.js";
import {EFFECT_DEAL_DAMAGE} from "../../../src/effects/deal-damage-effect.js";
import {CARD_TYPE_SUPPORT} from "../../../src/model/printed/support-card.js";
import {ABILITY_ALTEREGO_ACTION} from "../../../src/abilities/actions/alterego-action-ability.js";
import {EFFECT_EXHAUST} from "../../../src/effects/exhaust-effect.js";
import {EFFECT_HEAL} from "../../../src/effects/heal-effect.js";
import {EFFECT_DISCARD_RANDOM} from "../../../src/effects/discard-random-effect.js";
import {EFFECT_PLACE_THREAT} from "../../../src/effects/place-threat-effect.js";
import {ABILITY_WHEN_REVEALED} from "../../../src/abilities/when/when-revealed-ability.js";
import {EFFECT_CHAINED} from "../../../src/effects/chained-effect.js";
import {ABILITY_BOOST} from "../../../src/abilities/misc/boost-ability.js";
import {EFFECT_DELAYED} from "../../../src/effects/delayed-effect.js";
import {EFFECT_DO_IF_TAKE_DAMAGE} from "../../../src/effects/do-if-take-character-damage-effect.js";
import {EFFECT_STUN} from "../../../src/effects/stun-effect.js";
import {EFFECT_REMOVE_THREAT} from "../../../src/effects/remove-threat-effect.js";
import {ABILITY_FORCED_INTERRUPT} from "../../../src/abilities/interrupt/forced-interrupt-ability.js";
import {EFFECT_FACEDOWN} from "../../../src/effects/facedown-effect.js";
import {EFFECT_RANDOM_CARD} from "../../../src/effects/random-card-effect.js";
import {CARD_TYPE_UPGRADE} from "../../../src/model/printed/upgrade-card.js";
import {ABILITY_HERO_RESOURCE} from "../../../src/abilities/resource/hero-resource-ability.js";
import {EFFECT_REMOVE_USE} from "../../../src/effects/remove-counters-effect.js";
import {EFFECT_CANCEL_ATTACK} from "../../../src/effects/cancel-attack-effect.js";
import {EFFECT_DISCARD_GAME} from "../../../src/effects/discard-from-game-effect.js";
import {EFFECT_SURGE} from "../../../src/effects/surge-effect.js";
import {EFFECT_RETURN_FACEDOWN} from "../../../src/effects/return-facedown-effect.js";
import {ABILITY_WHEN_DEFEATED} from "../../../src/abilities/when/when-defeated-ability.js";
import {CARD_TYPE_OBLIGATION} from "../../../src/model/printed/obligation-card.js";
import {EFFECT_MAY} from "../../../src/effects/may-effect.js";
import {EFFECT_FLIP} from "../../../src/effects/flip-effect.js";
import {ABILITY_CONSTANT} from "../../../src/abilities/misc/constant-ability.js";
import {ABILITY_OPTION} from "../../../src/abilities/misc/option-ability.js";
import {EFFECT_DO_IF_CARD_GAME} from "../../../src/effects/do-if-card-game-effect.js";
import {EFFECT_REMOVE_CARD} from "../../../src/effects/remove-card-effect.js";
import {EFFECT_CHOOSE_ABILITY} from "../../../src/effects/choose-ability-effect.js";
import {CARD_TYPE_SIDE_SCHEME_SCENARIO} from "../../../src/model/printed/side-scheme-scenario-card.js";
import {CARD_TYPE_MINION} from "../../../src/model/printed/minion-card.js";
import {TRIGGER_ATTACHED_DEFEAT} from "../../../src/triggers/attached-defeat-trigger.js";
import {TRIGGER_ATTACHED_WOULD_ATTACK} from "../../../src/triggers/attached-would-attack-trigger.js";
import {TRIGGER_THIS_END_PLAY_CARD} from "../../../src/triggers/this-end-play-card-trigger.js";
import {TRIGGER_VILLAIN_ATTACKS_YOU} from "../../../src/triggers/villain-attacks-you-trigger.js";
import {TRIGGER_YOU_WOULD_TAKE_DAMAGE} from "../../../src/triggers/you-would-take-damage-trigger.js";
import {TRIGGER_INSTANT} from "../../../src/triggers/instant-trigger.js";
import {TRIGGER_TREACHERY_REVEAL} from "../../../src/triggers/treachery-reveal-trigger.js";

const set = 'Spiderman';
export const spidermanCard = {
    type: CARD_TYPE_HERO,
    params: {
        name: 'Spiderman',
        set,
        image: 'heroes/spiderman/peter0b.webp',
        traits: [TRAIT_AVENGER],
        unique: true,
        classification: CLASSIFICATION_HERO,
        thwart: 1,
        attack: 2,
        defense: 3,
        handSize: 5,
        hitPoints: 10,
        abilities: [{
            type: ABILITY_INTERRUPT,
            params: {
                name: 'Sentido arácnido',
                trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
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
export const peterParkerCard = {
    type: CARD_TYPE_ALTEREGO,
    params: {
        name: 'Peter Parker',
        set,
        image: 'heroes/spiderman/peter0a.webp',
        traits: [TRAIT_GENIUS],
        unique: true,
        classification: CLASSIFICATION_HERO,
        recovery: 3,
        handSize: 6,
        hitPoints: 10,
        abilities: [{
            type: ABILITY_RESOURCE,
            params: {
                name: 'Científico',
                limit: {count: 1, time: TIME_ROUND},
                resource: RESOURCE_MENTAL
            }
        }],
    }
};
export const blackCat = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Black Cat',
        set,
        image: 'heroes/spiderman/peter1.webp',
        traits: [TRAIT_HEROFORHIRE],
        unique: true,
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        subtitle: 'Felicia Hardy',
        thwart: 1,
        attack: 1,
        thwartConsequencial: 1,
        attackConsequencial: 0,
        hitPoints: 2,
        abilities: [{
            type: ABILITY_FORCED_RESPONSE,
            params: {
                trigger: TRIGGER_THIS_END_PLAY_CARD,
                effect: {
                    type: EFFECT_DISCARD_DRAW,
                    params: {
                        count: 2,
                        condition: {
                            'card.resources': RESOURCE_MENTAL
                        }
                    }
                }
            }
        }],
    }
};
export const backflip = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Backflip',
        set,
        image: 'heroes/spiderman/peter2.webp',
        traits: [TRAIT_DEFENSE, TRAIT_SKILL],
        cost: 0,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_INTERRUPT,
            params: {
                trigger: TRIGGER_YOU_WOULD_TAKE_DAMAGE,
                labels: [LABEL_DEFENSE],
                condition: {
                    isAttack: true
                },
                effect: {
                    type: EFFECT_PREVENT_DAMAGE,
                    target: TARGET_YOU,
                    params: {}
                }
            }
        }],
    }
};
export const enhancedSpiderSense = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Enhanced Spider-Sense',
        set,
        image: 'heroes/spiderman/peter4.webp',
        traits: [TRAIT_SUPERPOWER],
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_HERO_INTERRUPT,
            params: {
                trigger: TRIGGER_TREACHERY_REVEAL,
                effect: {
                    type: EFFECT_CANCEL_ENCOUNTER,
                    params: {
                        target: TARGET_EFFECT,
                        revealer: CHARACTER_PLAYER,
                        type: CARD_TYPE_TREACHERY,
                        full: false,
                    }
                }
            }
        }],
    }
};
export const swingingWebKick = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Swinging Web Kick',
        set,
        image: 'heroes/spiderman/peter6.webp',
        traits: [TRAIT_AERIAL, TRAIT_ATTACK, TRAIT_SUPERPOWER],
        cost: 3,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_HERO_ACTION,
            params: {
                labels: [LABEL_ATTACK],
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        damage: 8,
                        target: TARGET_ENEMY,
                    }
                }
            }
        }],
    }
};
export const auntMay = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Aunt May',
        set,
        image: 'heroes/spiderman/peter9.webp',
        traits: [TRAIT_INDIVIDUAL],
        unique: true,
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [{
            type: ABILITY_ALTEREGO_ACTION,
            params: {
                arrow: {
                    type: EFFECT_EXHAUST,
                    params: {
                        target: TARGET_CARD,
                    }
                },
                effect: {
                    type: EFFECT_HEAL,
                    params: {
                        damage: 4,
                        target: TARGET_YOUR_SUPERHERO,
                    }
                },
            }
        }],
    }
};
export const spiderTracer = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Spider-Tracer',
        set,
        image: 'heroes/spiderman/peter10.webp',
        traits: [TRAIT_ITEM, TRAIT_TECH],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        attach: CHARACTER_MINION,
        abilities: [{
            type: ABILITY_FORCED_INTERRUPT,
            params: {
                trigger: TRIGGER_ATTACHED_DEFEAT,
                target: TARGET_ATTACHED,
                effect: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {
                        threat: 3,
                        target: TARGET_SCHEME,
                    }
                },
            }
        }],
    }
};
export const webShooter = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Web-Shooter',
        set,
        image: 'heroes/spiderman/peter12.webp',
        traits: [TRAIT_ITEM, TRAIT_TECH],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        keywords: {uses: 3},
        abilities: [{
            type: ABILITY_HERO_RESOURCE,
            params: {
                resource: RESOURCE_WILD,
                target: TARGET_ANY,
                arrow: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_CARD,
                        matchAll: true,
                        effects: [{
                            type: EFFECT_EXHAUST,
                            params: {
                                target: TARGET_CARD,
                            }
                        }, {
                            type: EFFECT_REMOVE_USE,
                            params: {
                                target: TARGET_CARD,
                                count: 1
                            }
                        }]
                    }
                }
            }
        }],
    }
};
export const webbedUp = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Webbed Up',
        set,
        image: 'heroes/spiderman/peter14.webp',
        traits: [TRAIT_CONDITION],
        cost: 4,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        attach: CHARACTER_ENEMY,
        maxAttach: 1,
        paramsToPlay: {'superhero.isHero': true},
        abilities: [{
            type: ABILITY_FORCED_INTERRUPT,
            params: {
                trigger: TRIGGER_ATTACHED_WOULD_ATTACK,
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_ATTACHED,
                        effects: [{
                            type: EFFECT_CANCEL_ATTACK,
                            params: {
                                target: TARGET_EFFECT,
                            }
                        }, {
                            type: EFFECT_STUN,
                            params: {
                                target: TARGET_ATTACHED
                            }
                        }, {
                            type: EFFECT_DISCARD_GAME,
                            params: {
                                target: TARGET_CARD,
                            }
                        }]
                    }
                },
            }
        }],
    }
};
export const evictionNotice = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Eviction Notice',
        set,
        image: 'heroes/spiderman/petern0.webp',
        boost: 2,
        giveToOwner: true,
        triggerInstant: true,
        abilities: [{
            type: ABILITY_CONSTANT,
            params: {
                trigger: TRIGGER_INSTANT,
                name: 'Convertirte en Peter Parker',
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
                                name: 'Agotar a Peter Parker para retirar la Obligación',
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
                                name: 'Descartar carta aleatoria y Oleada para descartar la Obligación',
                                effect: {
                                    type: EFFECT_CHAINED,
                                    params: {
                                        effects: [{
                                            type: EFFECT_DISCARD_RANDOM,
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
export const highwayRobbery = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Highway Robbery',
        set,
        image: 'heroes/spiderman/petern1.webp',
        boost: 3,
        icons: {acceleration: 1},
        startingThreat: [3, true],
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_ALL_PLAYERS,
                        effects: [{
                            type: EFFECT_RANDOM_CARD,
                            params: {
                                target: TARGET_PLAYER,
                            }
                        }, {
                            type: EFFECT_FACEDOWN,
                            params: {
                                target: TARGET_CARD,
                                cardsTarget: TARGET_SOURCE,
                                source: 'effects.0.cards',
                            }
                        }]
                    }
                },
            }
        }, {
            type: ABILITY_WHEN_DEFEATED,
            params: {
                effect: {
                    type: EFFECT_RETURN_FACEDOWN,
                    params: {
                        target: TARGET_CARD,
                        faceDownTarget: TARGET_ALL_CARDS,
                    }
                },
            }
        }],
    }
};
export const vulture = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Vulture',
        set,
        image: 'heroes/spiderman/petern2.webp',
        boost: 2,
        hitPoints: 4,
        attack: 3,
        scheme: 1,
        unique: true,
        traits: [TRAIT_CRIMINAL],
        keywords: {quickStrike: true},
        nemesis: true,
    }
};
export const sweepingSwoop = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Sweeping Swoop',
        set,
        image: 'heroes/spiderman/petern3.webp',
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [{
                            type: EFFECT_STUN,
                            params: {
                                target: TARGET_HERO
                            }
                        }, {
                            type: EFFECT_DO_IF_CARD_GAME,
                            params: {
                                condition: {
                                    name: 'Vulture'
                                },
                                effect: {
                                    type: EFFECT_SURGE,
                                }
                            }
                        }]
                    }
                },
            }
        }],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_DELAYED,
                    params: {
                        target: TARGET_ACTIVATION,
                        effect: {
                            type: EFFECT_DO_IF_TAKE_DAMAGE,
                            params: {
                                source: 'effect',
                                condition: {
                                    isFriendly: true
                                },
                                effect: {
                                    type: EFFECT_STUN,
                                    params: {
                                        target: TARGET_ATTACKED
                                    }
                                }
                            }
                        },
                    }
                }
            }
        }
    }
};
export const theVulturePlans = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'The Vulture\'s Plans',
        set,
        image: 'heroes/spiderman/petern5.webp',
        boost: 2,
        abilities: [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [{
                            type: EFFECT_DISCARD_RANDOM,
                            params: {
                                target: TARGET_ALL_PLAYERS,
                            }
                        }, {
                            type: EFFECT_PLACE_THREAT,
                            params: {
                                target: TARGET_MAIN_SCHEME,
                                paramsCalc: {
                                    target: 'effects.0.cards',
                                    formula: CALC_DIFFERENT_RESOURCE_TYPE,
                                },
                            }
                        }]
                    }
                },
            }
        }],
    }
};
