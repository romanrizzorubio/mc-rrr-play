import {ABILITY_INTERRUPT} from '../../../src/constants/abilities.js';
import {RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_PHYSICAL} from '../../../src/constants/resources.js';
import {TARGET_CARD, TARGET_EFFECT} from '../../../src/constants/targets.js';
import {TRAIT_DEFENDER, TRAIT_SHIELD, TRAIT_SPY} from '../../../src/constants/traits.js';
import {TRIGGER_TREACHERY_REVEAL} from '../../../src/constants/triggers.js';
import {EFFECT_CANCEL_ENCOUNTER, EFFECT_CHAINED, EFFECT_EXHAUST, EFFECT_REVEAL_ENCOUNTER, EFFECT_SPEND} from '../../../src/constants/effects.js';
import {CARD_TYPE_ALLY} from '../../../src/model/printed/ally-card.js';
import {ASPECT_PROTECTION} from '../aspects.js';

const set = ASPECT_PROTECTION;

export const blackWidow = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Viuda Negra',
        subtitle: 'Natasha Romanoff',
        set,
        image: 'aspect/protection/allies/01075.png',
        traits: [TRAIT_SHIELD, TRAIT_SPY],
        unique: true,
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        thwart: 2,
        attack: 1,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 2,
        abilities: [
            {
                type: ABILITY_INTERRUPT,
                params: {
                    trigger: TRIGGER_TREACHERY_REVEAL,
                    arrow: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_CARD,
                                    }
                                },
                                {
                                    type: EFFECT_SPEND,
                                    params: {
                                        resources: [RESOURCE_MENTAL],
                                    }
                                }
                            ]
                        }
                    },
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_CANCEL_ENCOUNTER,
                                    params: {
                                        target: TARGET_EFFECT,
                                        full: true,
                                    }
                                },
                                {
                                    type: EFFECT_REVEAL_ENCOUNTER,
                                }
                            ]
                        }
                    }
                }
            }
        ]
    }
};

export const lukeCage = {
    type: CARD_TYPE_ALLY,
    params: {
        name: 'Luke Cage',
        set,
        image: 'aspect/protection/allies/01076.png',
        traits: [TRAIT_DEFENDER],
        unique: true,
        cost: 4,
        resources: [RESOURCE_ENERGY],
        classification: set,
        thwart: 1,
        attack: 2,
        thwartConsequencial: 1,
        attackConsequencial: 1,
        hitPoints: 5,
        keywords: {toughness: true},
    }
};

export const allies = [
    blackWidow,
    lukeCage,
];
