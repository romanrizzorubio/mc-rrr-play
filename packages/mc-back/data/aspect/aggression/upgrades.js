import {ABILITY_CONSTANT} from '../../../src/constants/abilities.js';
import {RESOURCE_PHYSICAL} from '../../../src/constants/resources.js';
import {
    TARGET_EFFECT,
} from '../../../src/constants/targets.js';
import {TRAIT_SKILL} from '../../../src/constants/traits.js';
import {TRIGGER_YOUR_HERO_GET_ATTACK} from '../../../src/constants/triggers.js';
import {EFFECT_MODIFY_ATTACK_VALUE} from '../../../src/constants/effects.js';
import {CARD_TYPE_UPGRADE} from '../../../src/model/printed/upgrade-card.js';
import {ASPECT_AGGRESSION} from '../aspects.js';

const set = ASPECT_AGGRESSION;
export const combatTraining = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Entrenamiento de combate',
        set,
        image: 'aspect/aggression/upgrades/a57-copy-2.webp',
        traits: [TRAIT_SKILL],
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        maximum: {
            count: 1,
        },
        abilities: [{
            type: ABILITY_CONSTANT,
            params: {
                hideDialog: true,
                trigger: TRIGGER_YOUR_HERO_GET_ATTACK,
                effect: {
                    type: EFFECT_MODIFY_ATTACK_VALUE,
                    params: {
                        target: TARGET_EFFECT,
                        count: 1,
                    }
                },
            }
        }],
    }
};
