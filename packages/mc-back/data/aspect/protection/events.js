import {ABILITY_HERO_INTERRUPT,ABILITY_RESPONSE} from '../../../src/constants/abilities.js';
import {CALC_ATTACK} from '../../../src/constants/calc.js';
import {LABEL_ATTACK} from '../../../src/constants/labels.js';
import {RESOURCE_MENTAL, RESOURCE_PHYSICAL} from '../../../src/constants/resources.js';
import {TARGET_EFFECT, TARGET_ENEMY, TARGET_PLAYER, TARGET_VILLAIN} from '../../../src/constants/targets.js';
import {TRAIT_ATTACK} from '../../../src/constants/traits.js';
import {TRIGGER_TREACHERY_REVEAL, TRIGGER_VILLAIN_ATTACKS_YOU} from '../../../src/constants/triggers.js';
import {EFFECT_CANCEL_ENCOUNTER, EFFECT_CHAINED, EFFECT_DEAL_DAMAGE, EFFECT_ENEMY_ATTACK} from '../../../src/constants/effects.js';
import {CARD_TYPE_EVENT} from '../../../src/model/printed/event-card.js';
import {ASPECT_PROTECTION} from '../aspects.js';

const set = ASPECT_PROTECTION;

export const counterPunch = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Contragolpe',
        set,
        image: 'aspect/protection/events/01077.png',
        traits: [TRAIT_ATTACK],
        cost: 0,
        resources: [RESOURCE_PHYSICAL],
        classification: set,
        abilities: [{
            type: ABILITY_RESPONSE,
            params: {
                name: 'Contragolpe',
                labels: [LABEL_ATTACK],
                trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
                condition: {
                    'activation.isDefended': true,
                    'activation.defender.isHero': true,
                },
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_ENEMY,
                        paramsCalc: {
                            target: 'player.hero',
                            formula: CALC_ATTACK,
                        }
                    }
                }
            }
        }],
    }
};

export const getBehindMe = {
    type: CARD_TYPE_EVENT,
    params: {
        name: '¡Poneos detrás de mí!',
        set,
        image: 'aspect/protection/events/01078.png',
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: set,
        abilities: [{
            type: ABILITY_HERO_INTERRUPT,
            params: {
                name: '¡Poneos detrás de mí!',
                trigger: TRIGGER_TREACHERY_REVEAL,
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [
                            {
                                type: EFFECT_CANCEL_ENCOUNTER,
                                params: {
                                    target: TARGET_EFFECT,
                                }
                            },
                            {
                                type: EFFECT_ENEMY_ATTACK,
                                params: {
                                    character: TARGET_VILLAIN,
                                    target: TARGET_PLAYER,
                                }
                            }
                        ]
                    }
                }
            }
        }],
    }
};

export const events = [
    counterPunch,
    getBehindMe,
];
