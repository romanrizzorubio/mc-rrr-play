import {ABILITY_FORCED_RESPONSE,ABILITY_RESPONSE} from '../../../src/constants/abilities.js';
import {RESOURCE_MENTAL, RESOURCE_PHYSICAL} from '../../../src/constants/resources.js';
import {TARGET_CARD, TARGET_ENEMY, TARGET_ROUND, TARGET_SCHEME, TARGET_YOU} from '../../../src/constants/targets.js';
import {TRAIT_SHIELD, TRAIT_SPY} from '../../../src/constants/traits.js';
import {TRIGGER_THIS_ENTER_PLAY} from '../../../src/constants/triggers.js';
import {EFFECT_CHAINED, EFFECT_CHOOSE, EFFECT_DEAL_DAMAGE, EFFECT_DELAYED, EFFECT_DISCARD_GAME, EFFECT_DRAW_CARD, EFFECT_REMOVE_THREAT, EFFECT_STUN} from '../../../src/constants/effects.js';
import {CARD_TYPE_ALLY} from '../../../src/model/printed/ally-card.js';
import {ASPECT_BASIC} from '../aspects.js';

const set = ASPECT_BASIC;
export const mockingBird = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Mockingbird',
        set,
        image: 'aspect/basic/allies/b83-copy-2.webp',
        traits: [TRAIT_SHIELD, TRAIT_SPY],
        unique: true,
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        subtitle: 'Bobbi Morse',
        thwart: 1,
        attack: 1,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 3,
        abilities: [{
            type: ABILITY_RESPONSE,
            params: {
                trigger: TRIGGER_THIS_ENTER_PLAY,
                effect: {
                    type: EFFECT_STUN,
                    params: {
                        target: TARGET_ENEMY,
                    }
                }
            }
        }],
    }
};
export const nickFury = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Nick Fury',
        set,
        image: 'aspect/basic/allies/b84-copy-2.webp',
        traits: [TRAIT_SHIELD, TRAIT_SPY],
        unique: true,
        cost: 4,
        resources: [RESOURCE_MENTAL],
        classification: set,
        thwart: 2,
        attack: 2,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 3,
        abilities: [{
            type: ABILITY_FORCED_RESPONSE,
            params: {
                trigger: TRIGGER_THIS_ENTER_PLAY,
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_YOU,
                        effects: [{
                            type: EFFECT_CHOOSE,
                            params: {
                                target: TARGET_YOU,
                                options: [{
                                    type: EFFECT_REMOVE_THREAT,
                                    params: {
                                        title: 'Quita 2 de Amenaza de un Plan',
                                        target: TARGET_SCHEME,
                                    }
                                }, {
                                    type: EFFECT_DRAW_CARD,
                                    params: {
                                        title: 'Roba 3 cartas',
                                        target: TARGET_YOU,
                                        count: 3,
                                    }
                                }, {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        title: 'Inflige 4 de Daño a un enemigo',
                                        target: TARGET_ENEMY,
                                        damage: 4,
                                    }
                                }]
                            }
                        }, {
                            type: EFFECT_DELAYED,
                            params: {
                                target: TARGET_ROUND,
                                effect: {
                                    type: EFFECT_DISCARD_GAME,
                                    params: {
                                        target: TARGET_CARD,
                                    }
                                },
                            }
                        }]
                    }
                }
            }
        }],
    }
};
