import {ABILITY_CONSTANT} from '../../../src/constants/abilities.js';
import {RESOURCE_PHYSICAL} from '../../../src/constants/resources.js';
import {TARGET_ALLY, TARGET_ATTACHED} from '../../../src/constants/targets.js';
import {TRAIT_CONDITION} from '../../../src/constants/traits.js';
import {EFFECT_CHAINED, EFFECT_MODIFY_ATTACK_VALUE, EFFECT_MODIFY_THWART_VALUE} from '../../../src/constants/effects.js';
import {CARD_TYPE_UPGRADE} from '../../../src/model/printed/upgrade-card.js';
import {ASPECT_LEADERSHIP} from '../aspects.js';

const set = ASPECT_LEADERSHIP;

export const inspiration = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Inspiración',
        set,
        image: 'aspect/leadership/upgrades/01074.png',
        traits: [TRAIT_CONDITION],
        cost: 1,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        attach: TARGET_ALLY,
        maxAttach: 1,
        maximum: {
            count: 3,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'Inspiración',
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_ATTACHED,
                            effects: [
                                {
                                    type: EFFECT_MODIFY_THWART_VALUE,
                                    params: {
                                        count: 1,
                                    }
                                },
                                {
                                    type: EFFECT_MODIFY_ATTACK_VALUE,
                                    params: {
                                        count: 1,
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

export const upgrades = [
    inspiration
];
