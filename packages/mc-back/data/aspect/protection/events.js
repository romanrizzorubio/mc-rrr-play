import {ASPECT_PROTECTION} from "../aspects.js";
import {CARD_TYPE_EVENT} from "../../../src/model/printed/event-card.js";
import {TRAIT_ATTACK} from "../../../src/constants/traits.js";
import {RESOURCE_MENTAL, RESOURCE_PHYSICAL} from "../../../src/constants/resources.js";
import {ABILITY_RESPONSE} from "../../../src/abilities/response/response-ability.js";
import {ABILITY_HERO_INTERRUPT} from "../../../src/abilities/interrupt/hero-interrupt-ability.js";
import {TRIGGER_VILLAIN_ATTACKS_YOU} from "../../../src/triggers/villain-attacks-you-trigger.js";
import {TRIGGER_TREACHERY_REVEAL} from "../../../src/triggers/treachery-reveal-trigger.js";
import {EFFECT_DEAL_DAMAGE} from "../../../src/effects/deal-damage-effect.js";
import {EFFECT_CANCEL_ENCOUNTER} from "../../../src/effects/cancel-encounter-effect.js";
import {EFFECT_ENEMY_ATTACK} from "../../../src/effects/enemy-attack-effect.js";
import {EFFECT_CHAINED} from "../../../src/effects/chained-effect.js";
import {TARGET_EFFECT, TARGET_ENEMY, TARGET_PLAYER, TARGET_VILLAIN} from "../../../src/constants/targets.js";
import {CALC_ATTACK} from "../../../src/constants/calc.js";
import {LABEL_ATTACK} from "../../../src/constants/labels.js";

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
