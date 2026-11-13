import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_CONSTANT,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_RESPONSE,
    ABILITY_OPTION,
    ABILITY_RESPONSE,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    DECK_POSITION_TOP,
    EFFECT_CHAINED,
    EFFECT_CHOOSE_ABILITY,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DO_IF,
    EFFECT_DISCARD_GAME,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_HEAL,
    EFFECT_LASTING,
    EFFECT_MAY,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MODIFY_TRAITS,
    EFFECT_MODIFY_THWART_VALUE,
    EFFECT_MOVE_COUNTERS,
    EFFECT_MOVE_TO_DECK,
    EFFECT_PLACE_COUNTERS,
    EFFECT_READY,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_REMOVE_CARD,
    EFFECT_REMOVE_COUNTER,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_SURGE,
    EFFECT_TOUGH,
    LABEL_ATTACK,
    PLACE_DISCARD_PILE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_CHARACTERS,
    TARGET_ALL_UPGRADES_YOU_CONTROL,
    TARGET_ALTEREGO,
    TARGET_ALTEREGO_SIDE,
    TARGET_ANY_PLAYER,
    TARGET_CARD,
    TARGET_ENCOUNTER_DECK,
    TARGET_EFFECT,
    TARGET_ENEMY,
    TARGET_ROUND,
    TARGET_SOURCE,
    TARGET_THIS,
    TARGET_UPGRADE_YOU_CONTROL,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TIME_PHASE,
    TRAIT_AERIAL,
    TRAIT_ARMOR,
    TRAIT_CRIMINAL,
    TRAIT_GENIUS,
    TRAIT_GUARDIAN,
    TRAIT_ITEM,
    TRAIT_OUTLAW,
    TRAIT_SKILL,
    TRAIT_TACTIC,
    TRAIT_TECH,
    TRAIT_WEAPON,
    TRIGGER_CHARACTER_GET_ATTACK,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_CONDITION_GET_TRAITS,
    TRIGGER_INSTANT,
    TRIGGER_PLAYER_TURN_END,
    TRIGGER_THIS_SPEND,
    TRIGGER_YOU_DEALT_EXCESS_DAMAGE,
    TRIGGER_YOU_DEAL_DAMAGE,
    TRIGGER_YOU_BASIC_THWART,
    TRIGGER_YOUR_HERO_GET_THWART,
} from 'mc-shared';

const set = 'Mapache Cohete';
const heroName = 'Mapache Cohete';

const deadAlreadyAbility = {
    type: ABILITY_HERO_RESPONSE,
    params: {
        name: '¡Estás muerto!',
        trigger: TRIGGER_YOU_DEALT_EXCESS_DAMAGE,
        effect: {
            type: EFFECT_DRAW_CARD,
            params: {
                target: TARGET_YOU,
                count: 1,
            },
        },
    },
};

const rocketAlterEgo = {
    type: CARD_TYPE_ALTEREGO,
    params: {
        name: heroName,
        set,
        image: 'heroes/rocket-racoon/16029b.png',
        traits: [TRAIT_GENIUS, TRAIT_OUTLAW],
        unique: true,
        classification: CLASSIFICATION_HERO,
        recovery: 3,
        handSize: 6,
        hitPoints: 9,
        abilities: [
            {
                type: ABILITY_ALTEREGO_ACTION,
                params: {
                    name: 'Mañoso',
                    limit: {
                        count: 1,
                        target: TARGET_ROUND,
                    },
                    arrow: {
                        type: EFFECT_DISCARD_GAME,
                        params: {
                            target: TARGET_UPGRADE_YOU_CONTROL,
                            condition: {
                                traits: TRAIT_TECH,
                            },
                        },
                    },
                    effect: {
                        type: EFFECT_DRAW_CARD,
                        params: {
                            target: TARGET_YOU,
                            count: 2,
                        },
                    },
                },
            },
        ],
    },
};

const rocketHero = {
    type: CARD_TYPE_HERO,
    params: {
        name: heroName,
        set,
        image: 'heroes/rocket-racoon/16029a.png',
        traits: [TRAIT_GUARDIAN],
        unique: true,
        classification: CLASSIFICATION_HERO,
        thwart: 2,
        attack: 1,
        defense: 1,
        handSize: 5,
        hitPoints: 9,
        abilities: [deadAlreadyAbility],
    },
};

const haveAPlan = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Tengo un plan',
        set,
        image: 'heroes/rocket-racoon/16030.png',
        traits: [TRAIT_TACTIC],
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_RESPONSE,
                params: {
                    trigger: TRIGGER_YOU_BASIC_THWART,
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            target: TARGET_YOUR_HERO,
                            effects: [
                                {
                                    type: EFFECT_READY,
                                    params: {
                                        target: TARGET_YOUR_HERO,
                                    },
                                },
                                {
                                    type: EFFECT_LASTING,
                                    params: {
                                        target: TARGET_YOUR_HERO,
                                        until: TIME_PHASE,
                                        effect: {
                                            type: EFFECT_MODIFY_THWART_VALUE,
                                            params: {
                                                target: TARGET_YOUR_HERO,
                                                count: 1,
                                            },
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

const reload = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Recarga',
        set,
        image: 'heroes/rocket-racoon/16031.png',
        traits: [TRAIT_SKILL],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    effect: {
                        type: EFFECT_READY,
                        params: {
                            target: TARGET_ALL_UPGRADES_YOU_CONTROL,
                            condition: {
                                traits: TRAIT_TECH,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const badMouth = {
    type: CARD_TYPE_EVENT,
    params: {
        name: 'Mala baba',
        set,
        image: 'heroes/rocket-racoon/16032.png',
        cost: 2,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    effect: {
                        type: EFFECT_LASTING,
                        params: {
                            until: TRIGGER_PLAYER_TURN_END,
                            triggerType: TRIGGER_YOU_DEAL_DAMAGE,
                            triggerParams: {
                                target: TARGET_ENEMY,
                            },
                            effect: {
                                type: EFFECT_HEAL,
                                params: {
                                    target: TARGET_ALL_CHARACTERS,
                                    condition: {
                                        name: heroName,
                                        isHero: true,
                                    },
                                    damage: 2,
                                },
                            },
                        },
                    },
                },
            },
        ],
    },
};

const reuseParts = {
    type: CARD_TYPE_RESOURCE,
    params: {
        name: 'Reutilizar piezas',
        set,
        image: 'heroes/rocket-racoon/16033.png',
        resources: [RESOURCE_MENTAL, RESOURCE_WILD],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_RESPONSE,
                params: {
                    trigger: TRIGGER_THIS_SPEND,
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_SEARCH_CARDS,
                                    params: {
                                        locations: [PLACE_DISCARD_PILE],
                                        filter: {
                                            isUpgrade: true,
                                            traits: TRAIT_TECH,
                                        },
                                        title: 'Elige una Mejora Tecnología de tu pila de descartes',
                                    },
                                },
                                {
                                    type: EFFECT_MOVE_TO_DECK,
                                    params: {
                                        target: TARGET_SOURCE,
                                        source: 'selectedCards',
                                        position: DECK_POSITION_TOP,
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

const auxiliaryBattery = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Batería auxiliar',
        set,
        image: 'heroes/rocket-racoon/16034.png',
        traits: [TRAIT_ITEM, TRAIT_TECH],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            target: TARGET_THIS,
                            counters: 2,
                        },
                    },
                },
            },
            {
                type: ABILITY_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_EXHAUST,
                        params: {
                            target: TARGET_THIS,
                        },
                    },
                    effect: {
                        type: EFFECT_MOVE_COUNTERS,
                        params: {
                            fromTarget: TARGET_THIS,
                            target: TARGET_UPGRADE_YOU_CONTROL,
                            condition: {
                                traits: TRAIT_TECH,
                            },
                            counters: 1,
                        },
                    },
                },
            },
        ],
    },
};

const cyberneticSkeleton = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Esqueleto cibernético',
        set,
        image: 'heroes/rocket-racoon/16035.png',
        traits: [TRAIT_TECH],
        cost: 2,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CHARACTER_GET_HIT_POINTS,
                    effect: {
                        type: EFFECT_MODIFY_HIT_POINTS,
                        params: {
                            target: TARGET_YOUR_SUPERHERO,
                            count: 3,
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CHARACTER_GET_ATTACK,
                    condition: {
                        'effect.selectedTarget.name': heroName,
                        'effect.selectedTarget.isHero': true,
                    },
                    effect: {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 1,
                        },
                    },
                },
            },
        ],
    },
};

const particleCannon = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Cañón de partículas',
        set,
        image: 'heroes/rocket-racoon/16036.png',
        traits: [TRAIT_TECH, TRAIT_WEAPON],
        cost: 3,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        keywords: {
            restricted: true,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            target: TARGET_THIS,
                            counters: 2,
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_ATTACK],
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_THIS,
                                    },
                                },
                                {
                                    type: EFFECT_REMOVE_COUNTER,
                                    params: {
                                        target: TARGET_THIS,
                                        count: 1,
                                    },
                                },
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 4,
                            keywords: {
                                ranged: true,
                                overkill: true,
                            },
                        },
                    },
                },
            },
        ],
    },
};

const rocketLauncher = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Lanzacohetes',
        set,
        image: 'heroes/rocket-racoon/16037.png',
        traits: [TRAIT_TECH, TRAIT_WEAPON],
        cost: 3,
        resources: [RESOURCE_PHYSICAL],
        classification: CLASSIFICATION_HERO,
        keywords: {
            restricted: true,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            target: TARGET_THIS,
                            counters: 2,
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_THIS,
                                    },
                                },
                                {
                                    type: EFFECT_REMOVE_COUNTER,
                                    params: {
                                        target: TARGET_THIS,
                                        count: 1,
                                    },
                                },
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            target: TARGET_ANY_PLAYER,
                            effects: [
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_VILLAIN,
                                        damage: 2,
                                    },
                                },
                                {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_SOURCE,
                                        source: 'targetPlayer.minions',
                                        multipleTarget: true,
                                        damage: 2,
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

const rocketPistol = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Pistola de Cohete',
        set,
        image: 'heroes/rocket-racoon/16038.png',
        traits: [TRAIT_TECH, TRAIT_WEAPON],
        cost: 1,
        resources: [RESOURCE_ENERGY],
        classification: CLASSIFICATION_HERO,
        keywords: {
            restricted: true,
        },
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CARD_ENTER_PLAY,
                    effect: {
                        type: EFFECT_PLACE_COUNTERS,
                        params: {
                            target: TARGET_THIS,
                            counters: 3,
                        },
                    },
                },
            },
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    labels: [LABEL_ATTACK],
                    arrow: {
                        type: EFFECT_SIMULTANEOUS,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_EXHAUST,
                                    params: {
                                        target: TARGET_THIS,
                                    },
                                },
                                {
                                    type: EFFECT_REMOVE_COUNTER,
                                    params: {
                                        target: TARGET_THIS,
                                        count: 1,
                                    },
                                },
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 2,
                        },
                    },
                },
            },
        ],
    },
};

const aeroBoots = {
    type: CARD_TYPE_UPGRADE,
    params: {
        name: 'Aerobotas',
        set,
        image: 'heroes/rocket-racoon/16039.png',
        traits: [TRAIT_ARMOR, TRAIT_TECH],
        cost: 1,
        resources: [RESOURCE_MENTAL],
        classification: CLASSIFICATION_HERO,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_YOUR_HERO_GET_THWART,
                    condition: {
                        'effect.selectedTarget.name': heroName,
                        'effect.selectedTarget.isHero': true,
                    },
                    effect: {
                        type: EFFECT_MODIFY_THWART_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 1,
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    trigger: TRIGGER_CONDITION_GET_TRAITS,
                    triggerParams: {
                        conditionTrigger: {
                            name: heroName,
                            isHero: true,
                        },
                        conditionSource: 'effect.selectedTarget',
                    },
                    effect: {
                        type: EFFECT_MODIFY_TRAITS,
                        params: {
                            target: TARGET_EFFECT,
                            traits: [TRAIT_AERIAL],
                        },
                    },
                },
            },
        ],
    },
};

const halfWorldCrisis = {
    type: CARD_TYPE_OBLIGATION,
    params: {
        name: 'Crisis en Medio Mundo',
        set,
        image: 'heroes/rocket-racoon/16053.png',
        boost: 2,
        giveToOwner: true,
        triggerInstant: true,
        abilities: [
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'Adoptar la identidad de alter ego',
                    trigger: TRIGGER_INSTANT,
                    effect: {
                        type: EFFECT_MAY,
                        params: {
                            effect: {
                                type: EFFECT_FLIP,
                                params: {
                                    target: TARGET_YOUR_SUPERHERO,
                                    formTarget: TARGET_ALTEREGO_SIDE,
                                },
                            },
                        },
                    },
                },
            },
            {
                type: ABILITY_CONSTANT,
                params: {
                    name: 'Resolver Crisis en Medio Mundo',
                    trigger: TRIGGER_INSTANT,
                    effect: {
                        type: EFFECT_CHOOSE_ABILITY,
                        params: {
                            options: [
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Agota tu Alter ego para retirar Crisis en Medio Mundo del juego',
                                        arrow: {
                                            type: EFFECT_EXHAUST,
                                            params: {
                                                target: TARGET_ALTEREGO,
                                            },
                                        },
                                        effect: {
                                            type: EFFECT_REMOVE_CARD,
                                            params: {
                                                target: TARGET_CARD,
                                            },
                                        },
                                    },
                                },
                                {
                                    type: ABILITY_OPTION,
                                    params: {
                                        name: 'Descarta la Mejora con el coste más alto que controles y descarta Crisis en Medio Mundo',
                                        effect: {
                                            type: EFFECT_CHAINED,
                                            params: {
                                                effects: [
                                                    {
                                                        type: EFFECT_DISCARD_GAME,
                                                        params: {
                                                            target: TARGET_UPGRADE_YOU_CONTROL,
                                                            condition: {
                                                                cost: {
                                                                    operator: 'max',
                                                                    defaultValue: 0,
                                                                },
                                                            },
                                                            selectCount: 1,
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_DO_IF,
                                                        params: {
                                                            condition: {
                                                                'effects.0.cards.length': 0,
                                                            },
                                                            effect: {
                                                                type: EFFECT_SURGE,
                                                                params: {},
                                                            },
                                                        },
                                                    },
                                                    {
                                                        type: EFFECT_DISCARD_GAME,
                                                        params: {
                                                            target: TARGET_CARD,
                                                        },
                                                    },
                                                ],
                                            },
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

const personalVengeance = {
    type: CARD_TYPE_SIDE_SCHEME_SCENARIO,
    params: {
        name: 'Venganza personal',
        set,
        image: 'heroes/rocket-racoon/16054.png',
        startingThreat: [2, true],
        icons: {amplification: 1},
        boost: 2,
    },
};

const blackjackOHare = {
    type: CARD_TYPE_MINION,
    params: {
        name: 'Blackjack O\'Hare',
        set,
        image: 'heroes/rocket-racoon/16055.png',
        unique: true,
        nemesis: true,
        traits: [TRAIT_CRIMINAL],
        attack: 1,
        scheme: 1,
        hitPoints: 3,
        keywords: {
            quickStrike: true,
            villainous: true,
        },
        boost: 3,
    },
};

const blackjackBazooka = {
    type: CARD_TYPE_ATTACHMENT,
    params: {
        name: 'Bazuca de Blackjack',
        set,
        image: 'heroes/rocket-racoon/16056.png',
        traits: [TRAIT_TECH, TRAIT_WEAPON],
        boost: 2,
        attach: {
            target: TARGET_ENEMY,
            condition: {name: 'Blackjack O\'Hare'},
            fallbackTarget: TARGET_VILLAIN,
        },
        abilities: [
            {
                type: ABILITY_HERO_ACTION,
                params: {
                    arrow: {
                        type: EFFECT_SPEND,
                        params: {
                            resources: [
                                RESOURCE_MENTAL,
                                RESOURCE_MENTAL,
                                RESOURCE_MENTAL,
                            ],
                        },
                    },
                    effect: {
                        type: EFFECT_DISCARD_GAME,
                        params: {
                            target: TARGET_THIS,
                        },
                    },
                },
            },
        ],
    },
};

const planetaryInvasion = {
    type: CARD_TYPE_TREACHERY,
    params: {
        name: 'Invasión planetaria',
        set,
        image: 'heroes/rocket-racoon/16057.png',
        boost: 1,
        abilities: [
            {
                type: ABILITY_WHEN_REVEALED,
                params: {
                    effect: {
                        type: EFFECT_CHAINED,
                        params: {
                            effects: [
                                {
                                    type: EFFECT_DISCARD_UNTIL,
                                    params: {
                                        target: TARGET_ENCOUNTER_DECK,
                                        condition: {isMinion: true},
                                    },
                                },
                                {
                                    type: EFFECT_REVEAL_ENCOUNTER,
                                    params: {
                                        card: 'selectedCard',
                                        thenEffect: {
                                            type: EFFECT_TOUGH,
                                            params: {
                                                target: TARGET_SOURCE,
                                                source: 'selectedCard',
                                            },
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
    _id: 'rocket-racoon',
    order: 18,
    name: heroName,
    folder: 'rocket-racoon',
    config: {
        sides: [rocketAlterEgo, rocketHero],
        cards: [
            {count: 2, card: haveAPlan},
            {count: 2, card: reload},
            {count: 1, card: badMouth},
            {count: 2, card: reuseParts},
            {count: 2, card: auxiliaryBattery},
            {count: 1, card: cyberneticSkeleton},
            {count: 1, card: particleCannon},
            {count: 1, card: rocketLauncher},
            {count: 2, card: rocketPistol},
            {count: 1, card: aeroBoots},
        ],
        precon: [
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-flora-y-fauna', count: 1},
                    {id: 'basic-energy', count: 1},
                    {id: 'basic-strength', count: 1},
                    {id: 'basic-genius', count: 1},
                    {id: 'basic-groot', count: 1},
                    {id: 'basic-botas-impulsoras', count: 3},
                ],
            },
            {
                aspect: CLASSIFICATION_AGGRESSION,
                cardRefs: [
                    {id: 'aggression-a-por-ellos', count: 2},
                    {id: 'aggression-entrar-en-combate', count: 3},
                    {id: 'aggression-asalto-implacable', count: 2},
                    {id: 'aggression-bicho', count: 1},
                    {id: 'aggression-buscando-problemas', count: 3},
                    {id: 'aggression-ensanamiento', count: 3},
                    {id: 'aggression-pistolon', count: 3},
                ],
            },
        ],
        obligation: {
            count: 1,
            card: halfWorldCrisis,
        },
        nemesis: [
            {count: 1, card: personalVengeance},
            {count: 1, card: blackjackOHare},
            {count: 1, card: blackjackBazooka},
            {count: 2, card: planetaryInvasion},
        ],
    },
};
