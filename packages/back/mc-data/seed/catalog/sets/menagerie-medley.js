import {
    ABILITY_BOOST,
    ABILITY_CONSTANT,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_MINION,
    DAMAGE_TYPE_INDIRECT,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF,
    EFFECT_ENGAGE,
    EFFECT_MODIFY_ATTACK,
    EFFECT_TAKE_DAMAGE,
    TARGET_ALL_CHARACTERS_YOU_CONTROL,
    TARGET_EFFECT,
    TARGET_YOU,
    TRAIT_CREATURE,
    TRAIT_ELITE,
    TRAIT_GHOST,
    TRAIT_ROBOT,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

const SET = 'menagerie-medley';

const psionicGhost = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Fantasma psiónico',
        set: SET,
        image: 'sets/menagerie-medley/16135.png',
        traits: [TRAIT_GHOST],
        boost: 0,
        attack: 2,
        scheme: 2,
        hitPoints: 4,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_DO_IF,
                        params: {
                            condition: {
                                'player.isConfused': true,
                            },
                            effect: {
                                type: EFFECT_TAKE_DAMAGE,
                                params: {
                                    damage: 1,
                                    target: TARGET_YOU,
                                },
                            },
                            effectNot: {
                                type: EFFECT_CONFUSE,
                                params: {
                                    target: TARGET_YOU,
                                },
                            },
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_ENGAGE,
                    params: {
                        cardSource: 'card',
                        target: TARGET_YOU,
                    },
                },
            },
        },
    },
};

const roboticServant = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Siervo robótico',
        set: SET,
        image: 'sets/menagerie-medley/16136.png',
        traits: [TRAIT_ROBOT],
        boost: 0,
        attack: 1,
        scheme: 1,
        hitPoints: 3,
        keywords: {
            guard: true,
            patrol: true,
        },
    },
};

const spaceShark = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Tiburón espacial',
        set: SET,
        image: 'sets/menagerie-medley/16137.png',
        traits: [TRAIT_CREATURE, TRAIT_ELITE],
        boost: 0,
        attack: 3,
        scheme: 1,
        hitPoints: 7,
        keywords: {
            quickStrike: true,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_THIS_ATTACK,
                    effect: {
                        type: EFFECT_MODIFY_ATTACK,
                        params: {
                            target: TARGET_EFFECT,
                            modify: {
                                damageType: DAMAGE_TYPE_INDIRECT,
                            },
                        },
                    },
                },
            },
        ],
        boostAbility: {
            type: ABILITY_BOOST,
            params: {
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        damage: 1,
                        target: TARGET_ALL_CHARACTERS_YOU_CONTROL,
                    },
                },
            },
        },
    },
};

export default {
    _id: SET,
    config: {
        name: 'Bestiario galáctico',
        standard: false,
        cards: [
            {count: 4, card: psionicGhost},
            {count: 3, card: roboticServant},
            {count: 2, card: spaceShark},
        ],
    },
};
