import {
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    CARD_TYPE_ATTACHMENT,
    EFFECT_DISCARD_GAME,
    EFFECT_SELECT_DISCARD_CARD,
    EFFECT_MODIFY_ATTACK,
    EFFECT_SPEND,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_EFFECT,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_VILLAIN,
    TRAIT_EXPERIMENTAL,
    TRAIT_WEAPON,
    TRIGGER_VILLAIN_ATTACKS,
    TRIGGER_THIS_ATTACK,
} from 'mc-shared';

const discardThis = () => ({
    type: EFFECT_DISCARD_GAME,
    params: {
        target: TARGET_THIS,
    },
});

const spendAndDiscard = resources => ({
    arrow: {
        type: EFFECT_SPEND,
        params: {
            resources,
        },
    },
    effect: discardThis(),
});

const rangedVillainAttack = {
    type: ABILITY_CONSTANT,
    params: {
        trigger: TRIGGER_VILLAIN_ATTACKS,
        effect: {
            type: EFFECT_MODIFY_ATTACK,
            params: {
                target: TARGET_EFFECT,
                modify: {
                    keywords: {
                        ranged: true,
                    },
                },
            },
        },
    },
};

const experimentalWeaponTraits = [TRAIT_EXPERIMENTAL, TRAIT_WEAPON];

export default {
    _id: 'experimental-weapons',
    config: {
        name: 'Armas experimentales',
        standard: false,
        cards: [
            {
                count: 1,
                card: {
                    type: CARD_TYPE_ATTACHMENT,
                    params: {
                        name: 'Fusil láser',
                        set: 'experimental-weapons',
                        image: 'sets/experimental-weapons/04072.png',
                        traits: experimentalWeaponTraits,
                        boost: 2,
                        attack: 1,
                        attach: TARGET_VILLAIN,
                        abilities: [
                            rangedVillainAttack,
                            {
                                type: ABILITY_HERO_ACTION,
                                params: spendAndDiscard([
                                    RESOURCE_ENERGY,
                                    RESOURCE_PHYSICAL,
                                ]),
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
                        name: 'Escudo de energía',
                        set: 'experimental-weapons',
                        image: 'sets/experimental-weapons/04073.png',
                        traits: experimentalWeaponTraits,
                        boost: 2,
                        attach: TARGET_VILLAIN,
                        keywords: {
                            retaliate: 1,
                        },
                        abilities: [
                            {
                                type: ABILITY_HERO_ACTION,
                                params: spendAndDiscard([
                                    RESOURCE_ENERGY,
                                    RESOURCE_MENTAL,
                                ]),
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
                        name: 'Servopuños',
                        set: 'experimental-weapons',
                        image: 'sets/experimental-weapons/04074.png',
                        traits: experimentalWeaponTraits,
                        boost: 2,
                        attach: TARGET_VILLAIN,
                        abilities: [
                            {
                                type: ABILITY_FORCED_RESPONSE,
                                params: {
                                    trigger: TRIGGER_THIS_ATTACK,
                                    condition: {
                                        'effect.takenDamage': '>0',
                                        'effect.selectedTarget.isSuperhero': true,
                                    },
                                    effect: {
                                        type: EFFECT_SELECT_DISCARD_CARD,
                                        params: {
                                            count: 1,
                                            target: TARGET_YOU,
                                        },
                                    },
                                },
                            },
                            {
                                type: ABILITY_HERO_ACTION,
                                params: spendAndDiscard([
                                    RESOURCE_MENTAL,
                                    RESOURCE_PHYSICAL,
                                ]),
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
                        name: 'Exoarmadura',
                        set: 'experimental-weapons',
                        image: 'sets/experimental-weapons/04075.png',
                        traits: experimentalWeaponTraits,
                        boost: 2,
                        attack: 1,
                        scheme: 1,
                        attach: TARGET_VILLAIN,
                        abilities: [
                            {
                                type: ABILITY_HERO_ACTION,
                                params: spendAndDiscard([
                                    RESOURCE_ENERGY,
                                    RESOURCE_MENTAL,
                                    RESOURCE_PHYSICAL,
                                ]),
                            },
                        ],
                    },
                },
            },
        ],
    },
};
