import {
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    CARD_TYPE_ATTACHMENT,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_SURGE,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_ENEMY_HIGHEST_PRINTED_HP,
    TARGET_THIS,
    TARGET_VILLAIN,
    TRAIT_VEHICLE,
    TRAIT_WEAPON,
    TRIGGER_VILLAIN_ATTACKS_YOU,
} from 'mc-shared';

const discardThis = {
    type: EFFECT_DISCARD_GAME,
    params: {
        target: TARGET_THIS,
    },
};

const spendAndDiscard = resources => ({
    arrow: {
        type: EFFECT_SPEND,
        params: {resources},
    },
    effect: discardThis,
});

export const goblinGlider = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Planeador duende',
        set: 'goblin-gimmicks',
        image: 'sets/goblin-gimmicks/02033.png',
        traits: [TRAIT_VEHICLE],
        boost: 3,
        attack: 1,
        maxAttach: 1,
        attach: {
            target: TARGET_ENEMY_HIGHEST_PRINTED_HP,
            ifNot: {
                type: EFFECT_SURGE,
            },
        },
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: spendAndDiscard([
                    RESOURCE_ENERGY,
                    RESOURCE_ENERGY,
                ]),
            },
        ],
    },
};

export const pumpkinBombs = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Bombas calabaza',
        set: 'goblin-gimmicks',
        image: 'sets/goblin-gimmicks/02034.png',
        traits: [TRAIT_WEAPON],
        boost: 2,
        attach: TARGET_VILLAIN,
        abilities: [
            {
                type: ABILITY_FORCED_RESPONSE,
                params: {
                    trigger: TRIGGER_VILLAIN_ATTACKS_YOU,
                    effect: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                discardThis,
                                {
                                    type: EFFECT_ASSIGN_DAMAGE,
                                    params: {
                                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                                        damage: 2,
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_ACTION,
                params: spendAndDiscard([
                    RESOURCE_PHYSICAL,
                    RESOURCE_PHYSICAL,
                ]),
            },
        ],
    },
};
