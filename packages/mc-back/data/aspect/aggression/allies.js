import {ABILITY_FORCED_RESPONSE,ABILITY_RESPONSE} from '../../../src/constants/abilities.js';
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL, RESOURCE_WILD} from '../../../src/constants/resources.js';
import {TARGET_ALL_CHARACTERS, TARGET_ENEMY, TARGET_THIS} from '../../../src/constants/targets.js';
import {TRAIT_AVENGER, TRAIT_GAMMA} from '../../../src/constants/traits.js';
import {TRIGGER_THIS_ATTACK, TRIGGER_THIS_DEFEAT_MINION} from '../../../src/constants/triggers.js';
import {EFFECT_CHAINED, EFFECT_DEAL_DAMAGE, EFFECT_DISCARD_FROM_DECK, EFFECT_DISCARD_GAME, EFFECT_DO_IF, EFFECT_HEAL} from '../../../src/constants/effects.js';
import {CARD_TYPE_ALLY} from '../../../src/model/printed/ally-card.js';
import {ASPECT_AGGRESSION} from '../aspects.js';

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
