import {
    ABILITY_HERO_RESPONSE,
    CARD_TYPE_RESOURCE,
    CLASSIFICATION_HERO,
    EFFECT_DO_IF,
    EFFECT_DRAW_CARD,
    EFFECT_HEAL,
    RESOURCE_WILD,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRAIT_GIANT,
    TRAIT_TINY,
    TRIGGER_THIS_SPEND,
} from 'mc-shared';

export const pymParticles = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'Partículas Pym',
        resources: [RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_RESPONSE,
                params: {
                    trigger: TRIGGER_THIS_SPEND,
                    workInHand: true,
                    condition: {
                        'player.superhero.currentSide.traits': [
                            TRAIT_GIANT,
                            TRAIT_TINY,
                        ],
                    },
                    effect: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: {
                                'player.superhero.currentSide.traits': TRAIT_GIANT,
                            },
                            effect: {
                                type: EFFECT_HEAL,
                                params: {
                                    target: TARGET_YOUR_SUPERHERO,
                                    damage: 2,
                                },
                            },
                            effectNot: {
                                type: EFFECT_DRAW_CARD,
                                params: {
                                    target: TARGET_YOU,
                                    count: 1,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};
