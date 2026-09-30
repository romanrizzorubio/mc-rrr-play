import {ABILITY_ACTION} from '../../../src/constants/abilities.js';
import {RESOURCE_ENERGY, RESOURCE_PHYSICAL} from '../../../src/constants/resources.js';
import {
    TARGET_CARD,
    TARGET_PLAYER,
} from '../../../src/constants/targets.js';
import {TRAIT_CONDITION} from '../../../src/constants/traits.js';
import {EFFECT_CHAINED, EFFECT_DISCARD_GAME, EFFECT_READY, EFFECT_SPEND} from '../../../src/constants/effects.js';
import {CARD_TYPE_UPGRADE} from '../../../src/model/printed/upgrade-card.js';
import {ASPECT_BASIC} from '../aspects.js';

const set = ASPECT_BASIC;
export const tenacity = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Tenacity',
        set,
        image: 'aspect/basic/upgrades/b93-copy-2.webp',
        traits: [TRAIT_CONDITION],
        cost: 0,
        resources: [RESOURCE_ENERGY],
        classification: set,
        abilities: [{
            type: ABILITY_ACTION,
            params: {
                arrow: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_CARD,
                        effects: [{
                            type: EFFECT_SPEND,
                            params: {
                                resources: [RESOURCE_PHYSICAL]
                            }
                        }, {
                            type: EFFECT_DISCARD_GAME,
                            params: {
                                target: TARGET_CARD,
                            }
                        }]
                    }
                },
                effect: {
                    type: EFFECT_READY,
                    params: {
                        target: TARGET_PLAYER,
                    }
                }
            }
        }],
    }
};
