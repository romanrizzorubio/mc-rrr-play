import {
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_TREACHERY,
    CHARACTER_VILLAIN,
    EFFECT_CHAINED,
    EFFECT_CONFUSE,
    EFFECT_DISCARD_GAME,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_MODIFY_ATTACK,
    EFFECT_PLACE_THREAT,
    EFFECT_SPEND,
    EFFECT_STUN,
    EFFECT_SURGE,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TARGET_MAIN_SCHEME,
    TARGET_THIS,
    TARGET_VILLAIN,
    TARGET_YOUR_HERO,
    TARGET_YOU,
    TRAIT_WEAPON,
    TRIGGER_VILLAIN_ATTACKS,
} from 'mc-shared';

const discardThis = {
    type: EFFECT_DISCARD_GAME,
    params: {
        target: TARGET_THIS,
    },
};

const spendAndDiscard = () => ({
    arrow: {
        type: EFFECT_SPEND,
        params: {
            resources: [RESOURCE_MENTAL, RESOURCE_PHYSICAL],
        },
    },
    effect: discardThis,
});

const villainAttackGainsKeyword = keyword => ({
    type: ABILITY_CONSTANT,
    params: {
        trigger: TRIGGER_VILLAIN_ATTACKS,
        effect: {
            type: EFFECT_MODIFY_ATTACK,
            params: {
                target: TARGET_EFFECT,
                modify: {
                    keywords: {
                        [keyword]: true,
                    },
                },
            },
        },
    },
});

const weaponMaster = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Maestro de armas',
        set: 'weapon-master',
        image: 'sets/weapon-master/04150.png',
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_ENEMY_SCHEME,
                                    params: {
                                        enemyType: CHARACTER_VILLAIN,
                                        target: TARGET_MAIN_SCHEME,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'match.villain.attached.*.traits': TRAIT_WEAPON,
                                        },
                                        effect: {
                                            type: EFFECT_SURGE,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            {
                type: ABILITY_WHEN_REVEALED_HERO,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_ENEMY_ATTACK,
                                    params: {
                                        enemyType: CHARACTER_VILLAIN,
                                        target: TARGET_YOU,
                                    },
                                },
                                {
                                    type: EFFECT_DO_IF,
                                    params: {
                                        condition: {
                                            'match.villain.attached.*.traits': TRAIT_WEAPON,
                                        },
                                        effect: {
                                            type: EFFECT_SURGE,
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        ],
    },
};

export default {
    _id: 'weapon-master',
    config: {
        name: 'Maestro de armas',
        standard: false,
        cards: [
            {
                count: 1,
                card: {
                    type: CARD_TYPE_ATTACHMENT,
                    params: {
                        name: 'Cuchillo de combate',
                        set: 'weapon-master',
                        image: 'sets/weapon-master/04148.png',
                        traits: [TRAIT_WEAPON],
                        boost: 1,
                        attack: 1,
                        attach: TARGET_VILLAIN,
                        abilities: [
                            villainAttackGainsKeyword('piercing'),
                            {
                                type: ABILITY_HERO_ACTION,
                                params: spendAndDiscard(),
                            },
                        ],
                    },
                },
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_ATTACHMENT,
                    params: {
                        name: 'Arma corta de Hydra',
                        set: 'weapon-master',
                        image: 'sets/weapon-master/04149.png',
                        traits: [TRAIT_WEAPON],
                        boost: 2,
                        attack: 1,
                        attach: TARGET_VILLAIN,
                        abilities: [
                            villainAttackGainsKeyword('ranged'),
                            {
                                type: ABILITY_HERO_ACTION,
                                params: spendAndDiscard(),
                            },
                        ],
                    },
                },
            },
            {
                count: 2,
                card: weaponMaster,
            },
            {
                count: 1,
                card: {
                    type: CARD_TYPE_TREACHERY,
                    params: {
                        name: 'Granada de conmoción',
                        set: 'weapon-master',
                        image: 'sets/weapon-master/04151.png',
                        boost: 1,
                        abilities: [
                            {
                                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                                params: {
                                    effect: {
                                        type: EFFECT_DO_IF,
                                        params: {
                                            condition: {
                                                'player.isConfused': true,
                                            },
                                            effect: {
                                                type: EFFECT_CHAINED,
                                                params: {
                                                    effects: [
                                                        {
                                                            type: EFFECT_CONFUSE,
                                                            params: {
                                                                target: TARGET_YOU,
                                                            },
                                                        },
                                                        {
                                                            type: EFFECT_PLACE_THREAT,
                                                            params: {
                                                                target: TARGET_MAIN_SCHEME,
                                                                threat: 2,
                                                            },
                                                        },
                                                    ],
                                                },
                                            },
                                            effectNot: {
                                                type: EFFECT_CHAINED,
                                                params: {
                                                    effects: [
                                                        {
                                                            type: EFFECT_CONFUSE,
                                                            params: {
                                                                target: TARGET_YOU,
                                                            },
                                                        },
                                                        {
                                                            type: EFFECT_PLACE_THREAT,
                                                            params: {
                                                                target: TARGET_MAIN_SCHEME,
                                                                threat: 1,
                                                            },
                                                        },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_WHEN_REVEALED_HERO,
                                params: {
                                    effect: {
                                        type: EFFECT_DO_IF,
                                        params: {
                                            condition: {
                                                'player.isStunned': true,
                                            },
                                            effect: {
                                                type: EFFECT_CHAINED,
                                                params: {
                                                    effects: [
                                                        {
                                                            type: EFFECT_STUN,
                                                            params: {
                                                                target: TARGET_YOUR_HERO,
                                                            },
                                                        },
                                                        {
                                                            type: EFFECT_DEAL_DAMAGE,
                                                            params: {
                                                                target: TARGET_YOUR_HERO,
                                                                damage: 2,
                                                            },
                                                        },
                                                    ],
                                                },
                                            },
                                            effectNot: {
                                                type: EFFECT_CHAINED,
                                                params: {
                                                    effects: [
                                                        {
                                                            type: EFFECT_STUN,
                                                            params: {
                                                                target: TARGET_YOUR_HERO,
                                                            },
                                                        },
                                                        {
                                                            type: EFFECT_DEAL_DAMAGE,
                                                            params: {
                                                                target: TARGET_YOUR_HERO,
                                                                damage: 1,
                                                            },
                                                        },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        ],
    },
};
