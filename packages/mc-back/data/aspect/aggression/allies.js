import {ASPECT_AGGRESSION} from "../aspects.js";
import {TRAIT_AVENGER, TRAIT_GAMMA} from "../../../src/constants/traits.js";
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL, RESOURCE_WILD} from "../../../src/constants/resources.js";
import {TARGET_ALL_CHARACTERS, TARGET_ENEMY, TARGET_THIS} from "../../../src/constants/targets.js";
import {CARD_TYPE_ALLY} from "../../../src/model/printed/ally-card.js";
import {EFFECT_HEAL} from "../../../src/effects/heal-effect.js";
import {ABILITY_RESPONSE} from "../../../src/abilities/response/response-ability.js";
import {ABILITY_FORCED_RESPONSE} from "../../../src/abilities/response/forced-response-ability.js";
import {EFFECT_CHAINED} from "../../../src/effects/chained-effect.js";
import {EFFECT_DISCARD_FROM_DECK} from "../../../src/effects/discard-from-deck-effect.js";
import {EFFECT_DO_IF} from "../../../src/effects/do-if-effect.js";
import {EFFECT_DISCARD_GAME} from "../../../src/effects/discard-from-game-effect.js";
import {EFFECT_DEAL_DAMAGE} from "../../../src/effects/deal-damage-effect.js";
import {TRIGGER_THIS_ATTACK} from "../../../src/triggers/this-attack-trigger.js";
import {TRIGGER_THIS_DEFEAT_MINION} from "../../../src/triggers/this-defeat-minion-trigger.js";

const set = ASPECT_AGGRESSION;
export const hulk = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Hulk',
        set,
        image: 'aspect/aggression/allies/a50.webp',
        traits: [TRAIT_AVENGER, TRAIT_GAMMA],
        unique: true,
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: set,
        subtitle: 'Bruce Banner',
        thwart: null,
        attack: 3,
        thwartConsequencial: null,
        attackConsequencial: 1,
        hitPoints: 5,
        abilities: [{
            type: ABILITY_FORCED_RESPONSE,
            params: {
                trigger: TRIGGER_THIS_ATTACK,
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [{
                            type: EFFECT_DISCARD_FROM_DECK,
                        }, {
                            type: EFFECT_DO_IF,
                            params: {
                                condition: {
                                    'effects.0.cards.0.resources': [RESOURCE_PHYSICAL],
                                },
                                effect: {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_ENEMY,
                                        damage: 2,
                                    }
                                }
                            }
                        }, {
                            type: EFFECT_DO_IF,
                            params: {
                                condition: {
                                    'effects.0.cards.0.resources': [RESOURCE_ENERGY],
                                },
                                effect: {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_ALL_CHARACTERS,
                                        damage: 1,
                                    }
                                }
                            }
                        }, {
                            type: EFFECT_DO_IF,
                            params: {
                                condition: {
                                    'effects.0.cards.0.resources': [RESOURCE_MENTAL],
                                },
                                effect: {
                                    type: EFFECT_DISCARD_GAME,
                                    params: {
                                        target: TARGET_THIS,
                                    }
                                }
                            }
                        }, {
                            type: EFFECT_DO_IF,
                            params: {
                                condition: {
                                    'effects.0.cards.0.resources': [RESOURCE_WILD],
                                },
                                effect: {
                                    type: EFFECT_CHAINED,
                                    params: {
                                        effects: [{
                                            type: EFFECT_DEAL_DAMAGE,
                                            params: {
                                                target: TARGET_ENEMY,
                                                damage: 2,
                                            }
                                        }, {
                                            type: EFFECT_DEAL_DAMAGE,
                                            params: {
                                                target: TARGET_ALL_CHARACTERS,
                                                damage: 1,
                                            }
                                        }, {
                                            type: EFFECT_DISCARD_GAME,
                                            params: {
                                                target: TARGET_THIS,
                                            }
                                        }],
                                    }
                                }
                            }
                        }],
                    }
                }
            }
        }],
    }
};
export const tigra = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Tigra',
        set,
        image: 'aspect/aggression/allies/a51.webp',
        traits: [TRAIT_AVENGER],
        unique: true,
        cost: 3,
        resources: [RESOURCE_MENTAL],
        classification: set,
        subtitle: 'Greer Grant Nelson',
        thwart: 1,
        attack: 2,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 3,
        abilities: [{
            type: ABILITY_RESPONSE,
            params: {
                trigger: TRIGGER_THIS_DEFEAT_MINION,
                effect: {
                    type: EFFECT_HEAL,
                    params: {
                        target: TARGET_THIS,
                        damage: 1,
                    }
                }
            }
        }],
    }
};
