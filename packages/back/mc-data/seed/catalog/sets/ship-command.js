import {
    ABILITY_CONSTANT,
    ABILITY_FIRST_PLAYER_ACTION,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_RESOURCE,
    ABILITY_WHEN_REVEALED,
    ABILITY_WHEN_REVEALED_ALTEREGO,
    ABILITY_WHEN_REVEALED_HERO,
    CARD_TYPE_ENVIRONMENT,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CHARACTER_VILLAIN,
    EFFECT_CHOOSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_GAME,
    EFFECT_DISCARD_RANDOM,
    EFFECT_ENEMY_ATTACK,
    EFFECT_ENEMY_SCHEME,
    EFFECT_EXHAUST,
    EFFECT_REMOVE_THREAT,
    EFFECT_SET_CONTROLLER,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_STUN,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_SUPERHEROES,
    TARGET_CONDITION_CARD,
    TARGET_INITIAL_PLAYER,
    TARGET_INITIAL_PLAYER_SUPERHERO,
    TARGET_MAIN_SCHEME,
    TARGET_THIS,
    TRAIT_AERIAL,
    TRAIT_VEHICLE,
    TRIGGER_INITIAL_PLAYER_CHANGED,
    TRIGGER_PHASE_ENDS,
} from 'mc-shared';

const SET = 'ship-command';
const MILANO_CONDITION = {
    'card.name': 'Milano',
};

const exhaustMilano = title => ({
    type: EFFECT_EXHAUST,
    params: {
        ...(title ? {title} : {}),
        target: TARGET_CONDITION_CARD,
        condition: MILANO_CONDITION,
    },
});

const discardHostileShip = {
    type: EFFECT_DISCARD_GAME,
    params: {
        target: TARGET_THIS,
    },
};

const milanoCard = {
    type: CARD_TYPE_SUPPORT,
    params: {
        name: 'Milano',
        set: SET,
        image: 'sets/ship-command/16142.png',
        cost: 0,
        unique: true,
        traits: [TRAIT_AERIAL, TRAIT_VEHICLE],
        keywords: {permanent: true, setup: true},
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_INITIAL_PLAYER_CHANGED,
                    effect: {
                        type: EFFECT_SET_CONTROLLER,
                        params: {
                            target: TARGET_THIS,
                            controller: 'match.initialPlayer',
                        },
                    },
                },
            },
            {
                type: ABILITY_RESOURCE,
                params: {
                    resource: RESOURCE_WILD,
                    canGenerateForOtherPlayers: true,
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {target: TARGET_THIS},
                    },
                },
            },
        ],
    },
};

const hostileShip = {
    type: CARD_TYPE_ENVIRONMENT,
    params: {
        name: 'Nave hostil',
        set: SET,
        image: 'sets/ship-command/16143.png',
        traits: [TRAIT_AERIAL, TRAIT_VEHICLE],
        boost: 2,
        keywords: {surge: true},
        abilities: [
            {
                type: ABILITY_FORCED_INTERRUPT,
                params: {
                    trigger: TRIGGER_PHASE_ENDS,
                    condition: {'match.phase': 'villain'},
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            damage: 1,
                            target: TARGET_ALL_SUPERHEROES,
                        },
                    },
                },
            },
            {
                type: ABILITY_FIRST_PLAYER_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                exhaustMilano(),
                                {
                                    type: EFFECT_SPEND,
                                    params: {
                                        resources: [RESOURCE_ANY, RESOURCE_ANY],
                                    },
                                },
                            ],
                        },
                    },
                    effect: discardHostileShip,
                },
            },
        ],
    },
};

const underFire = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'A cañonazos',
        set: SET,
        image: 'sets/ship-command/16144.png',
        startingThreat: 1,
        icons: {amplification: 1},
        keywords: {hinder: [3, true]},
        boost: 2,
        abilities: [
            {
                type: ABILITY_FIRST_PLAYER_ACTION,
                params: {
                    name: 'Agota la Milano para quitar 3 de amenaza de este plan',
                    arrow: exhaustMilano(),
                    effect: {
                        type: EFFECT_REMOVE_THREAT,
                        params: {
                            threat: 3,
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

const blindSpot = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Punto ciego',
        set: SET,
        image: 'sets/ship-command/16145.png',
        boost: 1,
        keywords: {peril: true},
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHOOSE,
                        params: {
                            options: [
                                {
                                    ...exhaustMilano('Agota la Milano'),
                                },
                                {
                                    type: EFFECT_SPEND,
                                    params: {
                                        title: 'Gasta recursos [p][p]',
                                        resources: [
                                            RESOURCE_PHYSICAL,
                                            RESOURCE_PHYSICAL,
                                        ],
                                    },
                                },
                                {
                                    type: EFFECT_STUN,
                                    params: {
                                        title: 'Aturde al jugador inicial',
                                        target: TARGET_INITIAL_PLAYER,
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

const hullBreach = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Brecha en el casco',
        set: SET,
        image: 'sets/ship-command/16146.png',
        boost: 2,
        keywords: {peril: true},
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHOOSE,
                        params: {
                            options: [
                                {
                                    ...exhaustMilano('Agota la Milano'),
                                },
                                {
                                    type: EFFECT_SPEND,
                                    params: {
                                        title: 'Gasta recursos [m][m]',
                                        resources: [
                                            RESOURCE_MENTAL,
                                            RESOURCE_MENTAL,
                                        ],
                                    },
                                },
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        title: 'Inflige 3 de Daño al jugador inicial',
                                        damage: 3,
                                        target: TARGET_INITIAL_PLAYER_SUPERHERO,
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

const powerLoss = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Pérdida de energía',
        set: SET,
        image: 'sets/ship-command/16147.png',
        boost: 1,
        keywords: {peril: true},
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHOOSE,
                        params: {
                            options: [
                                {
                                    ...exhaustMilano('Agota la Milano'),
                                },
                                {
                                    type: EFFECT_SPEND,
                                    params: {
                                        title: 'Gasta recursos [e][e]',
                                        resources: [
                                            RESOURCE_ENERGY,
                                            RESOURCE_ENERGY,
                                        ],
                                    },
                                },
                                {
                                    type: EFFECT_DISCARD_RANDOM,
                                    params: {
                                        title: 'Descarta una carta al azar de la mano del jugador inicial',
                                        count: 1,
                                        target: TARGET_INITIAL_PLAYER,
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

const specialDeliveryAbility = ({
    type,
    title,
    fallbackEffect,
}) => ({
    type,
    params: {
        effect: {
            type: EFFECT_CHOOSE,
            params: {
                options: [
                    exhaustMilano('Agotar la Milano'),
                    {
                        ...fallbackEffect,
                        params: {
                            ...fallbackEffect.params,
                            title,
                        },
                    },
                ],
            },
        },
    },
});

const specialDelivery = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Entrega especial',
        set: SET,
        image: 'sets/ship-command/16148.png',
        abilities: [
            specialDeliveryAbility({
                type: ABILITY_WHEN_REVEALED_ALTEREGO,
                title: 'El Villano ejecuta el Plan con +1 PLA',
                fallbackEffect: {
                    type: EFFECT_ENEMY_SCHEME,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        schemeModifier: 1,
                        target: TARGET_MAIN_SCHEME,
                    },
                },
            }),
            specialDeliveryAbility({
                type: ABILITY_WHEN_REVEALED_HERO,
                title: 'El Villano te ataca con +1 ATQ',
                fallbackEffect: {
                    type: EFFECT_ENEMY_ATTACK,
                    params: {
                        enemyType: CHARACTER_VILLAIN,
                        attackModifier: 1,
                    },
                },
            }),
        ],
    },
};

export default {
    _id: SET,
    config: {
        name: 'Nave espacial',
        standard: false,
        cards: [
            {count: 1, card: milanoCard},
            {count: 1, card: hostileShip},
            {count: 1, card: underFire},
            {count: 1, card: blindSpot},
            {count: 1, card: hullBreach},
            {count: 1, card: powerLoss},
            {count: 1, card: specialDelivery},
        ],
    },
};
