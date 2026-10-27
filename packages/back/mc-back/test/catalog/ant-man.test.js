import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ALTEREGO_RESPONSE,
    ABILITY_ACTION,
    ABILITY_CONSTANT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_RESPONSE,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ALLY,
    CARD_TYPE_ATTACHMENT,
    CARD_TYPE_EVENT,
    CARD_TYPE_MINION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CALC_COUNT,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    CLASSIFICATION_LEADERSHIP,
    DIALOG_REVEAL_CARDS,
    DIALOG_SELECT_TARGET,
    EFFECT_ADD_KEYWORD,
    EFFECT_ADD_TRAIT,
    EFFECT_BLANK_TEXT,
    EFFECT_CHAINED,
    EFFECT_CONFUSE,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF,
    EFFECT_DISCARD_UNTIL,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_FLIP,
    EFFECT_FOR_EACH,
    EFFECT_GET_ENCOUNTER_CARD,
    EFFECT_HEAL,
    EFFECT_LASTING,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_READY,
    EFFECT_REMOVE_COUNTER,
    EFFECT_REVEAL_ENCOUNTER,
    EFFECT_REMOVE_THREAT,
    EFFECT_SIMULTANEOUS,
    EFFECT_SPEND,
    EFFECT_STUN,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_ENCOUNTER_DISCARD,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_MINIONS,
    TARGET_DECK,
    TARGET_ENEMY,
    TARGET_ENCOUNTER_DECK,
    TARGET_EFFECT,
    TARGET_HERO_SIDE,
    TARGET_SCHEME,
    TARGET_SIDE,
    TARGET_THIS,
    TARGET_TRIGGERED_CARD,
    TARGET_VILLAIN,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_AERIAL,
    TRAIT_ARMOR,
    TRAIT_ANTS,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_CIVILIAN,
    TRAIT_CONDITION,
    TRAIT_GIANT,
    TRAIT_ITEM,
    TRAIT_SUPERPOWER,
    TRAIT_TACTIC,
    TRAIT_TECH,
    TRAIT_THWART,
    TRAIT_TINY,
    TRIGGER_ATTACHED_ACTIVATES,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_THIS_FLIP,
    TRIGGER_THIS_GET_ATTACK,
    TRIGGER_THIS_SPEND,
    TRIGGER_PLAYER_TURN_END,
    TRIGGER_YOUR_SUPERHERO_FLIPS,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {HeroActionAbility} from '../../src/abilities/actions/hero-action-ability.js';
import {AlteregoResponseAbility} from '../../src/abilities/response/alterego-response-ability.js';
import {HeroResponseAbility} from '../../src/abilities/response/hero-response-ability.js';
import {FlipEffect} from '../../src/effects/flip-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {SpendEffect} from '../../src/effects/spend-effect.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {TriggersFactory} from '../../src/factory/triggers/triggers-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Hand} from '../../src/model/match/hand.js';
import {CostPaymentSession} from '../../src/utils/cost-payment-session.js';

const createAntMan = async () => {
    const catalog = await loadCatalog();
    const hero = catalog.heroes.find(({_id}) => _id === 'ant-man');
    const match = {
        currentRound: 1,
        dialogs: [],
        inPlayCards: [],
        lasting: [],
        limits: {},
        players: [],
        scenario: {},
        triggerCards: {},
        async openDialog(dialog) {
            this.dialogs.push(dialog);

            return {selected: dialog.data.cards[1]};
        },
    };
    const cardsFactory = new CardsFactory({match});
    match.effectsFactory = cardsFactory.abilitiesFactory.effectsFactory;

    return {
        cardsFactory,
        catalog,
        hero,
        match,
        superhero: cardsFactory.createCardSides(
            cardsFactory.createSides(hero.config.sides)
        ),
    };
};

describe('Hombre Hormiga', () => {
    test('defines the three identities with their printed stats, traits, and responses', async () => {
        const {cardsFactory, catalog, hero} = await createAntMan();
        const [alterEgo, tinyHero, giantHero] = hero.config.sides;

        assert.deepEqual(hero.config.sides.map(({params}) => [
            params.name,
            params.image,
            params.handSize,
            params.hitPoints,
        ]), [
            ['Scott Lang', 'heroes/ant-man/12001b.png', 6, 12],
            ['Hombre Hormiga', 'heroes/ant-man/12001a.png', 5, 12],
            ['Hombre Hormiga', 'heroes/ant-man/12001c.png', 4, 12],
        ]);
        assert.deepEqual(hero.config.sides.map(({params}) => params.id), [
            'ant-man-scott-lang',
            'ant-man-tiny',
            'ant-man-giant',
        ]);
        assert.equal(alterEgo.params.recovery, 3);
        assert.deepEqual(alterEgo.params.traits, [TRAIT_CIVILIAN]);
        assert.deepEqual(tinyHero.params.traits, [TRAIT_AVENGER, TRAIT_TINY]);
        assert.deepEqual(giantHero.params.traits, [TRAIT_AVENGER, TRAIT_GIANT]);
        assert.deepEqual(
            [tinyHero.params.thwart, tinyHero.params.attack, tinyHero.params.defense],
            [2, 1, 2],
        );
        assert.deepEqual(
            [giantHero.params.thwart, giantHero.params.attack, giantHero.params.defense],
            [1, 3, 3],
        );
        assert.deepEqual(hero.config.precon, [
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-first-aid', count: 2},
                    {id: 'basic-tacticas-de-enjambre', count: 1},
                    {id: 'basic-espiritu-de-equipo', count: 3},
                ],
            },
            {
                aspect: CLASSIFICATION_LEADERSHIP,
                cardRefs: [
                    {id: 'leadership-hombre-hormiga', count: 1},
                    {id: 'leadership-hombre-gigante', count: 1},
                    {id: 'leadership-ronin', count: 1},
                    {id: 'leadership-aguijon', count: 1},
                    {id: 'leadership-pedir-ayuda', count: 3},
                    {id: 'leadership-aplomo', count: 3},
                    {id: 'leadership-guanteletes-de-energia', count: 3},
                    {id: 'leadership-traje-reforzado', count: 3},
                ],
            },
        ]);
        const firstAid = catalog.aspects.find(({_id}) => _id === 'basic-first-aid');
        assert.equal(firstAid.card.params.name, 'Primeros auxilios');
        const swarmTactics = catalog.aspects.find(({_id}) =>
            _id === 'basic-tacticas-de-enjambre');
        assert.equal(swarmTactics.card.params.name, 'Tácticas de enjambre');

        const sides = cardsFactory.createSides(hero.config.sides);
        assert.deepEqual(sides.map(({id}) => id), [
            'ant-man-scott-lang',
            'ant-man-tiny',
            'ant-man-giant',
        ]);
        const expectedAbilities = [
            [
                ABILITY_ALTEREGO_RESPONSE,
                AlteregoResponseAbility,
                'Tiempo para relajarse',
                EFFECT_HEAL,
            ],
            [
                ABILITY_HERO_RESPONSE,
                HeroResponseAbility,
                'Insecto irritante',
                EFFECT_REMOVE_THREAT,
            ],
            [
                ABILITY_HERO_RESPONSE,
                HeroResponseAbility,
                'Molestia mayúscula',
                EFFECT_DEAL_DAMAGE,
            ],
        ];

        sides.forEach((side, index) => {
            const [type, AbilityClass, name, effectType] = expectedAbilities[index];
            const response = side.abilities.find(ability => ability.name === name);

            assert.ok(response);
            assert.equal(hero.config.sides[index].params.abilities[0].type, type);
            assert.ok(response instanceof AbilityClass);
            assert.equal(response.trigger, TRIGGER_THIS_FLIP);
            assert.equal(response.effect.effectType, effectType);
            assert.equal(typeof response.effect.canRun, 'function');
        });

        assert.equal(
            sides[0].abilities.find(({name}) => name === 'Tiempo para relajarse')
                .effect.target,
            TARGET_YOUR_SUPERHERO,
        );
        assert.equal(
            sides[1].abilities.find(({name}) => name === 'Insecto irritante')
                .effect.target,
            TARGET_SCHEME,
        );
        assert.equal(
            sides[2].abilities.find(({name}) => name === 'Molestia mayúscula')
                .effect.target,
            TARGET_ENEMY,
        );
    });

    test('adds Tácticas de enjambre with Team-Up restrictions and identity change', async () => {
        const {catalog, hero, match} = await createAntMan();
        const matchFactory = new MatchFactory(match);
        const cardsFactory = matchFactory.cardsFactory;
        const superhero = matchFactory.createSuperhero({
            ...hero.config,
            cards: [],
            precon: [],
        });
        const cardEntry = catalog.aspects.find(({_id}) =>
            _id === 'basic-tacticas-de-enjambre');

        assert.ok(cardEntry);
        assert.equal(cardEntry.card.type, CARD_TYPE_EVENT);
        assert.deepEqual(cardEntry.card.params, {
            name: 'Tácticas de enjambre',
            set: CLASSIFICATION_BASIC,
            image: 'aspect/basic/events/12020.png',
            traits: [TRAIT_TACTIC],
            cost: 1,
            resources: [RESOURCE_MENTAL],
            classification: CLASSIFICATION_BASIC,
            maximum: {count: 1, target: TARGET_DECK},
            keywords: {teamUp: ['Hombre Hormiga', 'Avispa']},
            abilities: [
                {
                    type: ABILITY_HERO_ACTION,
                    params: {
                        effect: {
                            type: EFFECT_CHAINED,
                            params: {
                                effects: [
                                    {
                                        type: EFFECT_FLIP,
                                        params: {
                                            target: TARGET_YOUR_SUPERHERO,
                                            formTarget: TARGET_HERO_SIDE,
                                        },
                                    },
                                    {
                                        type: EFFECT_READY,
                                        params: {target: TARGET_YOUR_HERO},
                                    },
                                ],
                            },
                        },
                    },
                },
            ],
        });

        const player = {
            isPlayer: true,
            match,
            hand: {cards: [], async refresh() {}},
            superhero,
            canFlip: async () => true,
            get isHero() {
                return superhero.isHero;
            },
        };
        superhero.owner = player;
        superhero.endTriggers = () => {};
        superhero.initTriggers = async () => {};
        superhero.refresh = async () => {};
        superhero.sides.forEach(side => {
            side.refresh = async () => {};
        });
        superhero.selectedSide = 1;
        match.friends = [superhero];
        match.isUniqueCard = () => false;
        match.activationsFactory = {
            createActivation: () => ({
                filterTarget: () => true,
            }),
        };

        const swarmTactics = cardsFactory.createGameCardFromConfig(
            cardEntry.card,
            {owner: player},
        );
        player.hand.cards.push(swarmTactics);
        assert.equal(await swarmTactics.canPlay({
            abilityType: ABILITY_ACTION,
            player,
        }), false);

        match.enemies = [{name: 'Avispa'}];
        assert.equal(await swarmTactics.canPlay({
            abilityType: ABILITY_ACTION,
            player,
        }), false);

        match.friends.push({
            currentSide: {
                card: {
                    name: 'Nadia Van Dyne',
                    subtitle: 'Avispa',
                },
            },
        });
        assert.equal(await swarmTactics.canPlay({
            abilityType: ABILITY_ACTION,
            player,
        }), true);

        const [ability] = swarmTactics.abilities;
        assert.ok(ability instanceof HeroActionAbility);
        assert.equal(ability.effect.effectType, EFFECT_CHAINED);
        const [flipEffect, readyEffect] = ability.effect.effects;
        assert.equal(flipEffect.effectType, EFFECT_FLIP);
        assert.equal(flipEffect.formTarget, TARGET_HERO_SIDE);
        assert.equal(readyEffect.effectType, EFFECT_READY);
        assert.equal(readyEffect.target, TARGET_YOUR_HERO);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(typeof flipEffect.canRun, 'function');
        assert.equal(typeof readyEffect.canRun, 'function');

        superhero.exhaust();
        flipEffect.trigger = async () => {};
        await flipEffect.prepare({card: swarmTactics, match, player});
        assert.strictEqual(flipEffect.selectedFormTarget, superhero.sides[2]);
        await flipEffect.execute({own: true, player});
        assert.equal(superhero.currentSide.id, 'ant-man-giant');
        await readyEffect.prepare({card: swarmTactics, match, player});
        await readyEffect.execute({card: swarmTactics, match, player});
        assert.equal(superhero.exhausted, false);
    });

    test('adds Casco del Hombre Hormiga with responses for both Hero identities', async () => {
        const {cardsFactory, hero, match, superhero} = await createAntMan();
        const helmetEntry = hero.config.cards.find(
            ({card}) => card.params.name === 'Casco del Hombre Hormiga'
        );

        assert.ok(helmetEntry);
        assert.equal(helmetEntry.count, 1);
        assert.equal(helmetEntry.card.type, CARD_TYPE_UPGRADE);
        assert.deepEqual(helmetEntry.card.params, {
            name: 'Casco del Hombre Hormiga',
            set: 'Hombre Hormiga',
            image: 'heroes/ant-man/12008.png',
            traits: [TRAIT_ARMOR, TRAIT_TECH],
            unique: true,
            cost: 3,
            resources: [RESOURCE_MENTAL],
            classification: CLASSIFICATION_HERO,
            abilities: [
                {
                    type: ABILITY_HERO_RESPONSE,
                    params: {
                        trigger: TRIGGER_YOUR_SUPERHERO_FLIPS,
                        condition: {
                            'triggeredCard.currentSide.traits': TRAIT_GIANT,
                        },
                        effect: {
                            type: EFFECT_HEAL,
                            params: {
                                target: TARGET_YOUR_SUPERHERO,
                                damage: 2,
                            },
                        },
                    },
                },
                {
                    type: ABILITY_HERO_RESPONSE,
                    params: {
                        trigger: TRIGGER_YOUR_SUPERHERO_FLIPS,
                        condition: {
                            'triggeredCard.currentSide.traits': TRAIT_TINY,
                        },
                        effect: {
                            type: EFFECT_DRAW_CARD,
                            params: {
                                target: TARGET_YOU,
                                count: 1,
                            },
                        },
                    },
                },
            ],
        });

        const player = {
            isPlayer: true,
            match,
            superhero,
            get isHero() {
                return superhero.isHero;
            },
        };
        superhero.owner = player;
        superhero.refresh = async () => {};
        const helmet = cardsFactory.createGameCardFromConfig(
            helmetEntry.card,
            {owner: player},
        );
        const [giantResponse, tinyResponse] = helmet.abilities;

        assert.ok(giantResponse instanceof HeroResponseAbility);
        assert.ok(tinyResponse instanceof HeroResponseAbility);
        assert.equal(giantResponse.trigger, TRIGGER_YOUR_SUPERHERO_FLIPS);
        assert.equal(tinyResponse.trigger, TRIGGER_YOUR_SUPERHERO_FLIPS);
        assert.equal(giantResponse.effect.effectType, EFFECT_HEAL);
        assert.equal(tinyResponse.effect.effectType, EFFECT_DRAW_CARD);
        assert.equal(typeof giantResponse.effect.canRun, 'function');
        assert.equal(typeof tinyResponse.effect.canRun, 'function');

        superhero.selectedSide = 2;
        superhero.damage = 2;
        assert.equal(await giantResponse.canRun({
            card: helmet,
            match,
            player,
            triggeredCard: superhero,
        }), true);
        assert.equal(await tinyResponse.canRun({
            card: helmet,
            match,
            player,
            triggeredCard: superhero,
        }), false);
        giantResponse.effect.selectedTarget = superhero;
        await giantResponse.effect.execute({card: helmet, match, player});
        assert.equal(superhero.damage, 0);

        superhero.selectedSide = 1;
        player.hand = new Hand(player);
        player.hand.refresh = async () => {};
        player.deck = {
            async draw(count) {
                assert.equal(count, 1);
                return [{id: 'drawn-card'}];
            },
        };
        assert.equal(await giantResponse.canRun({
            card: helmet,
            match,
            player,
            triggeredCard: superhero,
        }), false);
        assert.equal(await tinyResponse.canRun({
            card: helmet,
            match,
            player,
            triggeredCard: superhero,
        }), true);
        tinyResponse.effect.selectedTarget = player;
        await tinyResponse.effect.execute({card: helmet, match, player});
        assert.equal(player.hand.cards.at(-1).id, 'drawn-card');
    });

    test('adds Fuerza de gigante with a temporary bonus after flipping to Giant', async () => {
        const {cardsFactory, hero, match, superhero} = await createAntMan();
        const strengthEntry = hero.config.cards.find(
            ({card}) => card.params.name === 'Fuerza de gigante'
        );

        assert.ok(strengthEntry);
        assert.equal(strengthEntry.count, 2);
        assert.equal(strengthEntry.card.type, CARD_TYPE_UPGRADE);
        assert.deepEqual(strengthEntry.card.params, {
            name: 'Fuerza de gigante',
            set: 'Hombre Hormiga',
            image: 'heroes/ant-man/12009.png',
            traits: [TRAIT_CONDITION, TRAIT_GIANT],
            cost: 1,
            resources: [RESOURCE_ENERGY],
            classification: CLASSIFICATION_HERO,
            abilities: [
                {
                    type: ABILITY_HERO_RESPONSE,
                    params: {
                        trigger: TRIGGER_YOUR_SUPERHERO_FLIPS,
                        condition: {
                            'triggeredCard.currentSide.traits': TRAIT_GIANT,
                        },
                        effect: {
                            type: EFFECT_LASTING,
                            params: {
                                target: TARGET_YOUR_HERO,
                                until: TRIGGER_PLAYER_TURN_END,
                                effect: {
                                    type: EFFECT_MODIFY_ATTACK_VALUE,
                                    params: {
                                        target: TARGET_YOUR_HERO,
                                        count: 1,
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        });

        const player = {
            isPlayer: true,
            match,
            superhero,
            get isHero() {
                return superhero.isHero;
            },
        };
        superhero.owner = player;
        const giantStrength = cardsFactory.createGameCardFromConfig(
            strengthEntry.card,
            {owner: player},
        );
        const [response] = giantStrength.abilities;
        const triggerParams = {
            card: giantStrength,
            match,
            player,
            triggeredCard: superhero,
        };

        assert.ok(response instanceof HeroResponseAbility);
        assert.equal(response.trigger, TRIGGER_YOUR_SUPERHERO_FLIPS);
        assert.equal(response.effect.effectType, EFFECT_LASTING);
        assert.equal(response.effect.until, TRIGGER_PLAYER_TURN_END);
        assert.equal(
            response.effect.effect.effectType,
            EFFECT_MODIFY_ATTACK_VALUE,
        );
        assert.equal(typeof response.effect.canRun, 'function');
        assert.equal(typeof response.effect.effect.canRun, 'function');

        superhero.selectedSide = 1;
        assert.equal(await response.canRun(triggerParams), false);

        superhero.selectedSide = 2;
        const giantSide = superhero.currentSide;
        giantSide.refresh = async () => {};
        assert.equal(await response.canRun(triggerParams), true);
        assert.equal(await giantSide.getAttackValue({player}), 3);

        response.effect.selectedTarget = giantSide;
        await response.effect.execute({
            ability: response,
            card: giantStrength,
            match,
            player,
        });

        assert.equal(await giantSide.getAttackValue({player}), 4);
        const [lasting] = match.lasting;
        assert.equal(lasting.until, TRIGGER_PLAYER_TURN_END);
        assert.equal(lasting.cleanups.length, 1);
        await lasting.cleanups[0].runEffect({player, lasting});
        assert.equal(await giantSide.getAttackValue({player}), 3);
    });

    test('adds Guantes de descargas with identity-specific stun and confuse actions', async () => {
        const {cardsFactory, hero, match, superhero} = await createAntMan();
        const glovesEntry = hero.config.cards.find(
            ({card}) => card.params.name === 'Guantes de descargas'
        );

        assert.ok(glovesEntry);
        assert.equal(glovesEntry.count, 1);
        assert.equal(glovesEntry.card.type, CARD_TYPE_UPGRADE);
        assert.deepEqual(glovesEntry.card.params, {
            name: 'Guantes de descargas',
            set: 'Hombre Hormiga',
            image: 'heroes/ant-man/12010.png',
            traits: [TRAIT_ITEM, TRAIT_TECH],
            cost: 1,
            resources: [RESOURCE_MENTAL],
            classification: CLASSIFICATION_HERO,
            abilities: [
                {
                    type: ABILITY_HERO_ACTION,
                    params: {
                        condition: {
                            'player.superhero.currentSide.traits': TRAIT_GIANT,
                        },
                        arrow: {
                            type: EFFECT_SIMULTANEOUS,
                            params: {
                                effects: [
                                    {
                                        type: EFFECT_EXHAUST,
                                        params: {target: TARGET_THIS},
                                    },
                                    {
                                        type: EFFECT_SPEND,
                                        params: {
                                            resources: [
                                                RESOURCE_PHYSICAL,
                                                RESOURCE_PHYSICAL,
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                        effect: {
                            type: EFFECT_STUN,
                            params: {target: TARGET_ENEMY},
                        },
                    },
                },
                {
                    type: ABILITY_HERO_ACTION,
                    params: {
                        condition: {
                            'player.superhero.currentSide.traits': TRAIT_TINY,
                        },
                        arrow: {
                            type: EFFECT_SIMULTANEOUS,
                            params: {
                                effects: [
                                    {
                                        type: EFFECT_EXHAUST,
                                        params: {target: TARGET_THIS},
                                    },
                                    {
                                        type: EFFECT_SPEND,
                                        params: {
                                            resources: [
                                                RESOURCE_ENERGY,
                                                RESOURCE_ENERGY,
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                        effect: {
                            type: EFFECT_CONFUSE,
                            params: {target: TARGET_ENEMY},
                        },
                    },
                },
            ],
        });

        const player = {
            isPlayer: true,
            match,
            superhero,
            get isHero() {
                return superhero.isHero;
            },
        };
        superhero.owner = player;
        const gloves = cardsFactory.createGameCardFromConfig(
            glovesEntry.card,
            {owner: player},
        );
        const [giantAction, tinyAction] = gloves.abilities;
        const enemy = {
            id: 'test-enemy',
            isStunned: false,
            isConfused: false,
            stun() {
                this.isStunned = true;
            },
            confuse() {
                this.isConfused = true;
            },
            refresh() {},
        };
        match.enemies = [enemy];

        assert.ok(giantAction instanceof HeroActionAbility);
        assert.ok(tinyAction instanceof HeroActionAbility);
        assert.equal(typeof giantAction.effect.canRun, 'function');
        assert.equal(typeof tinyAction.effect.canRun, 'function');
        assert.equal(giantAction.effect.effectType, EFFECT_STUN);
        assert.equal(tinyAction.effect.effectType, EFFECT_CONFUSE);
        assert.equal(giantAction.effect.target, TARGET_ENEMY);
        assert.equal(tinyAction.effect.target, TARGET_ENEMY);

        for (const [action, resources] of [
            [giantAction, [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL]],
            [tinyAction, [RESOURCE_ENERGY, RESOURCE_ENERGY]],
        ]) {
            assert.equal(action.arrow.cost.effectType, EFFECT_SIMULTANEOUS);
            assert.deepEqual(
                action.arrow.cost.effects.map(({effectType}) => effectType),
                [EFFECT_EXHAUST, EFFECT_SPEND],
            );
            assert.equal(action.arrow.cost.effects[0].target, TARGET_THIS);
            assert.deepEqual(action.arrow.cost.effects[1].resources, resources);
            assert.equal(typeof action.arrow.cost.canRun, 'function');
        }

        giantAction.effect.selectedTarget = enemy;
        superhero.selectedSide = 1;
        assert.equal(await giantAction.canRun({
            arrowPaid: true,
            card: gloves,
            match,
            player,
        }), false);
        superhero.selectedSide = 2;
        assert.equal(await giantAction.canRun({
            arrowPaid: true,
            card: gloves,
            match,
            player,
        }), true);
        await giantAction.effect.execute({card: gloves, match, player});
        assert.equal(enemy.isStunned, true);

        tinyAction.effect.selectedTarget = enemy;
        assert.equal(await tinyAction.canRun({
            arrowPaid: true,
            card: gloves,
            match,
            player,
        }), false);
        superhero.selectedSide = 1;
        assert.equal(await tinyAction.canRun({
            arrowPaid: true,
            card: gloves,
            match,
            player,
        }), true);
        await tinyAction.effect.execute({card: gloves, match, player});
        assert.equal(enemy.isConfused, true);
    });

    test('selects the Giant identity by its configured face id', async () => {
        const {hero, match} = await createAntMan();
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...hero.config,
            cards: [],
            precon: [],
        });
        const giantSide = superhero.sides[2];

        assert.equal(superhero.sides[1].id, 'ant-man-tiny');
        assert.equal(giantSide.id, 'ant-man-giant');
        assert.notEqual(superhero.sides[1].id, giantSide.id);

        match.openDialog = async dialog => ({
            selected: dialog.data.cards.find(({id}) => id === giantSide.id),
        });

        const flipEffect = new FlipEffect({
            formTarget: TARGET_SIDE,
            match,
            selectedTarget: superhero,
        });
        await flipEffect.prepare({
            card: superhero,
            match,
            player: {isPlayer: true, superhero},
        });

        assert.strictEqual(flipEffect.selectedFormTarget, giantSide);
    });

    test('adds Avispa with a response that depends on Ant-Man identity', async () => {
        const {cardsFactory, hero, match, superhero} = await createAntMan();
        const [{count, card: waspConfig}] = hero.config.cards;

        assert.equal(count, 1);
        assert.equal(waspConfig.type, CARD_TYPE_ALLY);
        assert.deepEqual(waspConfig.params, {
            name: 'Avispa',
            subtitle: 'Nadia Van Dyne',
            set: 'Hombre Hormiga',
            image: 'heroes/ant-man/12002.png',
            traits: [TRAIT_AERIAL, TRAIT_AVENGER],
            unique: true,
            cost: 3,
            resources: [RESOURCE_WILD],
            classification: CLASSIFICATION_HERO,
            attack: 2,
            attackConsequential: 1,
            thwart: 2,
            thwartConsequential: 1,
            hitPoints: 3,
            abilities: [
                {
                    type: ABILITY_HERO_RESPONSE,
                    params: {
                        trigger: TRIGGER_CARD_ENTER_PLAY,
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
                                    'player.superhero.currentSide.traits':
                                        TRAIT_GIANT,
                                },
                                effect: {
                                    type: EFFECT_DEAL_DAMAGE,
                                    params: {
                                        target: TARGET_ENEMY,
                                        damage: 2,
                                    },
                                },
                                effectNot: {
                                    type: EFFECT_REMOVE_THREAT,
                                    params: {
                                        target: TARGET_SCHEME,
                                        threat: 2,
                                    },
                                },
                            },
                        },
                    },
                },
            ],
        });

        const player = {
            isPlayer: true,
            match,
            superhero,
            get isHero() {
                return superhero.isHero;
            },
        };
        const wasp = cardsFactory.createGameCardFromConfig(waspConfig, {
            owner: player,
        });
        assert.equal(wasp.id, 'avispa--hombre_hormiga');
        const response = wasp.abilities.find(
            ability => ability.trigger === TRIGGER_CARD_ENTER_PLAY
        );

        assert.ok(response);
        assert.ok(response instanceof HeroResponseAbility);
        assert.equal(response.trigger, TRIGGER_CARD_ENTER_PLAY);
        assert.equal(response.effect.effectType, EFFECT_DO_IF);
        assert.equal(typeof response.effect.canRun, 'function');
        assert.equal(typeof response.effect.effect.canRun, 'function');
        assert.equal(typeof response.effect.effectNot.canRun, 'function');

        for (const {side, effectType, effectValue} of [
            {
                side: 1,
                effectType: EFFECT_REMOVE_THREAT,
                effectValue: 2,
            },
            {
                side: 2,
                effectType: EFFECT_DEAL_DAMAGE,
                effectValue: 2,
            },
        ]) {
            superhero.selectedSide = side;
            const params = {card: wasp, match, player};

            assert.equal(await response.canRun(params), true);
            assert.equal(
                response.effect.getEffectProperty('effectType', params),
                effectType,
            );
            assert.equal(
                response.effect.getEffectProperty(
                    effectType === EFFECT_DEAL_DAMAGE ? 'baseDamage' : 'threat',
                    params,
                ),
                effectValue,
            );
        }

        superhero.selectedSide = 0;
        assert.equal(
            await response.canRun({card: wasp, match, player}),
            false,
        );
    });

    test('adds Pisotón de gigante for Giant identity and resolves its attacks on the right targets', async () => {
        const {cardsFactory, hero, match, superhero} = await createAntMan();
        const stompEntry = hero.config.cards.find(
            ({card}) => card.params.name === 'Pisotón de gigante'
        );

        assert.ok(stompEntry);
        assert.equal(stompEntry.count, 2);
        assert.equal(stompEntry.card.type, CARD_TYPE_EVENT);
        assert.deepEqual(stompEntry.card.params.traits, [
            TRAIT_ATTACK,
            TRAIT_GIANT,
        ]);
        assert.equal(stompEntry.card.params.image, 'heroes/ant-man/12003.png');
        assert.equal(stompEntry.card.params.cost, 3);
        assert.deepEqual(stompEntry.card.params.resources, [RESOURCE_ENERGY]);
        assert.deepEqual(stompEntry.card.params.paramsToPlay, {
            isHero: true,
            'superhero.currentSide.traits': TRAIT_GIANT,
        });

        const [abilityConfig] = stompEntry.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(abilityConfig.params.labels, [LABEL_ATTACK]);
        assert.deepEqual(abilityConfig.params.effect, {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ALL_MINIONS,
                            damage: 1,
                        },
                    },
                    {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_ENEMY,
                            damage: 8,
                        },
                    },
                ],
            },
        });

        const player = {
            isPlayer: true,
            match,
            hand: {cards: []},
            superhero,
            canAttack: () => true,
            get isHero() {
                return superhero.isHero;
            },
        };
        const stomp = cardsFactory.createGameCardFromConfig(
            stompEntry.card,
            {owner: player},
        );
        player.hand.cards.push(stomp);
        match.isUniqueCard = () => false;
        match.activationsFactory = {
            createActivation: () => ({
                filterTarget: () => true,
            }),
        };
        const minions = [{id: 'minion-1'}, {id: 'minion-2'}];
        const villain = {id: 'villain'};
        match.minions = minions;
        match.enemies = [villain, ...minions];

        for (const {side, playable} of [
            {side: 0, playable: false},
            {side: 1, playable: false},
            {side: 2, playable: true},
        ]) {
            superhero.selectedSide = side;
            assert.equal(
                await stomp.canPlay({
                    abilityType: ABILITY_ACTION,
                    player,
                }),
                playable,
            );
        }

        const [ability] = stomp.abilities;
        assert.ok(ability instanceof HeroActionAbility);
        assert.equal(ability.isAttack, true);
        assert.equal(ability.effect.effectType, EFFECT_CHAINED);
        const [minionDamage, enemyDamage] = ability.effect.effects;
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(typeof minionDamage.canRun, 'function');
        assert.equal(typeof enemyDamage.canRun, 'function');
        assert.equal(minionDamage.baseDamage, 1);
        assert.equal(minionDamage.isAttack, true);
        assert.equal(
            minionDamage.validTarget.isMultipleTarget({
                target: TARGET_ALL_MINIONS,
            }),
            true,
        );
        assert.equal(minionDamage.isRequiredForAbilityAvailability, false);
        assert.equal(enemyDamage.baseDamage, 8);
        assert.equal(enemyDamage.isAttack, true);

        superhero.selectedSide = 2;
        assert.deepEqual(
            minionDamage.getValidTarget({match, player}),
            minions,
        );
        assert.deepEqual(
            enemyDamage.getValidTarget({match, player}),
            match.enemies,
        );

        match.minions = [];
        assert.equal(await ability.canRun({player}), true);

        match.minions = [];
        assert.equal(await ability.canRun({player}), true);
    });

    test('adds Mente colmena for the Tiny Hero identity and counts only controlled Army of Ants supports', async () => {
        const {cardsFactory, hero, match, superhero} = await createAntMan();
        const hiveMindEntry = hero.config.cards.find(
            ({card}) => card.params.name === 'Mente colmena'
        );

        assert.ok(hiveMindEntry);
        assert.equal(hiveMindEntry.count, 1);
        assert.equal(hiveMindEntry.card.type, CARD_TYPE_EVENT);
        assert.deepEqual(hiveMindEntry.card.params, {
            name: 'Mente colmena',
            set: 'Hombre Hormiga',
            image: 'heroes/ant-man/12004.png',
            traits: [TRAIT_THWART, TRAIT_TINY],
            cost: 2,
            resources: [RESOURCE_PHYSICAL],
            classification: CLASSIFICATION_HERO,
            paramsToPlay: {
                isHero: true,
                'superhero.currentSide.traits': TRAIT_TINY,
            },
            abilities: [
                {
                    type: ABILITY_HERO_ACTION,
                    params: {
                        labels: [LABEL_THWART],
                        effect: {
                            type: EFFECT_REMOVE_THREAT,
                            params: {
                                target: TARGET_SCHEME,
                                paramsCalc: {
                                    target: 'player.gameZone.inPlayCards',
                                    formula: CALC_COUNT,
                                    conditions: {
                                        name: 'Ejército de hormigas',
                                        isSupport: true,
                                    },
                                    plus: 2,
                                },
                            },
                        },
                    },
                },
            ],
        });

        const scheme = {
            isSideScheme: false,
            threat: 8,
            canRemoveThreat: () => true,
            removeThreat(amount) {
                this.threat -= amount;
            },
            refresh() {},
        };
        const player = {
            isPlayer: true,
            match,
            hand: {cards: []},
            superhero,
            gameZone: {inPlayCards: []},
            canThwart: () => true,
            get isHero() {
                return superhero.isHero;
            },
        };
        superhero.owner = player;
        const hiveMind = cardsFactory.createGameCardFromConfig(
            hiveMindEntry.card,
            {owner: player},
        );
        player.hand.cards.push(hiveMind);
        match.schemes = [scheme];
        match.mainScheme = scheme;
        match.isUniqueCard = () => false;
        match.activationsFactory = {
            createActivation: () => ({
                filterTarget: () => true,
            }),
        };

        for (const {side, playable} of [
            {side: 0, playable: false},
            {side: 1, playable: true},
            {side: 2, playable: false},
        ]) {
            superhero.selectedSide = side;
            assert.equal(
                await hiveMind.canPlay({
                    abilityType: ABILITY_ACTION,
                    player,
                }),
                playable,
            );
        }

        superhero.selectedSide = 1;
        const [ability] = hiveMind.abilities;
        assert.ok(ability instanceof HeroActionAbility);
        assert.equal(ability.isThwart, true);
        assert.equal(ability.effect.effectType, EFFECT_REMOVE_THREAT);
        assert.equal(ability.effect.target, TARGET_SCHEME);
        assert.equal(typeof ability.effect.canRun, 'function');

        const armyEntry = hero.config.cards.find(
            ({card}) => card.params.name === 'Ejército de hormigas'
        );
        const controlledArmies = Array.from({length: 2}, () =>
            cardsFactory.createGameCardFromConfig(armyEntry.card, {
                owner: player,
            })
        );
        const otherSupport = {
            isSupport: true,
            name: 'Otro apoyo',
        };
        const otherPlayerArmy = cardsFactory.createGameCardFromConfig(
            armyEntry.card,
            {owner: {isPlayer: true, match}},
        );
        player.gameZone.inPlayCards.push(...controlledArmies, otherSupport);
        match.inPlayCards.push(...controlledArmies, otherSupport, otherPlayerArmy);

        ability.effect.selectedTarget = scheme;
        const params = {card: hiveMind, match, player};
        await ability.effect.prepare(params);
        assert.equal(ability.effect.threat, 4);

        await ability.effect.execute(params);
        assert.equal(scheme.threat, 4);
    });

    test('adds Cambio de tamaño to switch between Ant-Man Hero identities and draw a card', async () => {
        const {hero, match} = await createAntMan();
        const matchFactory = new MatchFactory(match);
        const cardsFactory = matchFactory.cardsFactory;
        const superhero = matchFactory.createSuperhero({
            ...hero.config,
            cards: [],
            precon: [],
        });
        const sizeChangeEntry = hero.config.cards.find(
            ({card}) => card.params.name === 'Cambio de tamaño'
        );

        assert.ok(sizeChangeEntry);
        assert.equal(sizeChangeEntry.count, 2);
        assert.equal(sizeChangeEntry.card.type, CARD_TYPE_EVENT);
        assert.deepEqual(sizeChangeEntry.card.params, {
            name: 'Cambio de tamaño',
            set: 'Hombre Hormiga',
            image: 'heroes/ant-man/12005.png',
            traits: [TRAIT_SUPERPOWER],
            cost: 0,
            resources: [RESOURCE_PHYSICAL],
            classification: CLASSIFICATION_HERO,
            abilities: [
                {
                    type: ABILITY_HERO_ACTION,
                    params: {
                        effect: {
                            type: EFFECT_CHAINED,
                            params: {
                                effects: [
                                    {
                                        type: EFFECT_FLIP,
                                        params: {
                                            target: TARGET_YOUR_SUPERHERO,
                                            formTarget: TARGET_HERO_SIDE,
                                        },
                                    },
                                    {
                                        type: EFFECT_DRAW_CARD,
                                        params: {
                                            target: TARGET_YOU,
                                            count: 1,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            ],
        });

        const player = {
            isPlayer: true,
            match,
            hand: {
                cards: [],
                addCards(cards) {
                    this.cards.push(...cards);
                },
                async refresh() {},
            },
            deck: {
                async draw(count) {
                    assert.equal(count, 1);
                    return [{id: 'drawn-card'}];
                },
            },
            superhero,
            canFlip: async () => true,
            get isHero() {
                return superhero.isHero;
            },
        };
        superhero.owner = player;
        superhero.endTriggers = () => {};
        superhero.initTriggers = async () => {};
        superhero.refresh = async () => {};

        const sizeChange = cardsFactory.createGameCardFromConfig(
            sizeChangeEntry.card,
            {owner: player},
        );
        player.hand.cards.push(sizeChange);
        match.isUniqueCard = () => false;
        match.activationsFactory = {
            createActivation: () => ({
                filterTarget: () => true,
            }),
        };

        for (const {side, playable} of [
            {side: 0, playable: false},
            {side: 1, playable: true},
            {side: 2, playable: true},
        ]) {
            superhero.selectedSide = side;
            assert.equal(
                await sizeChange.canPlay({
                    abilityType: ABILITY_ACTION,
                    player,
                }),
                playable,
            );
        }

        superhero.selectedSide = 1;
        const [ability] = sizeChange.abilities;
        assert.ok(ability instanceof HeroActionAbility);
        assert.equal(ability.effect.effectType, EFFECT_CHAINED);
        const [flipEffect, drawEffect] = ability.effect.effects;
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(flipEffect.effectType, EFFECT_FLIP);
        assert.equal(typeof flipEffect.canRun, 'function');
        assert.equal(flipEffect.formTarget, TARGET_HERO_SIDE);
        assert.equal(drawEffect.effectType, EFFECT_DRAW_CARD);
        assert.equal(typeof drawEffect.canRun, 'function');
        assert.equal(drawEffect.target, TARGET_YOU);
        assert.equal(drawEffect.count, 1);
        assert.equal(await flipEffect.canRun({card: sizeChange, match, player}), true);

        await flipEffect.prepare({card: sizeChange, match, player});
        assert.strictEqual(flipEffect.selectedFormTarget, superhero.sides[2]);
        assert.equal(match.dialogs.length, 0);
        await flipEffect.execute({own: true, player});
        assert.equal(superhero.currentSide.id, 'ant-man-giant');

        const reverseFlipEffect = new FlipEffect({
            formTarget: TARGET_HERO_SIDE,
            match,
            target: TARGET_YOUR_SUPERHERO,
        });
        reverseFlipEffect.trigger = async () => {};
        await reverseFlipEffect.prepare({card: sizeChange, match, player});
        assert.strictEqual(reverseFlipEffect.selectedFormTarget, superhero.sides[1]);
        assert.equal(match.dialogs.length, 0);
        await reverseFlipEffect.execute({own: true, player});
        assert.equal(superhero.currentSide.id, 'ant-man-tiny');

        await drawEffect.prepare({card: sizeChange, match, player});
        await drawEffect.execute({card: sizeChange, match, player});
        assert.equal(player.hand.cards.at(-1).id, 'drawn-card');
    });

    test('adds Ejército de hormigas for the Tiny Hero identity', async () => {
        const {cardsFactory, hero, match, superhero} = await createAntMan();
        match.mc = {mcSocket: {send() {}}};
        const armyEntry = hero.config.cards.find(
            ({card}) => card.params.name === 'Ejército de hormigas'
        );

        assert.ok(armyEntry);
        assert.equal(armyEntry.count, 3);
        assert.equal(armyEntry.card.type, CARD_TYPE_SUPPORT);
        assert.deepEqual(armyEntry.card.params, {
            name: 'Ejército de hormigas',
            set: 'Hombre Hormiga',
            image: 'heroes/ant-man/12007.png',
            traits: [TRAIT_ANTS, TRAIT_TINY],
            cost: 1,
            resources: [RESOURCE_PHYSICAL],
            classification: CLASSIFICATION_HERO,
            abilities: [
                {
                    type: ABILITY_HERO_ACTION,
                    params: {
                        condition: {
                            'player.superhero.currentSide.traits': TRAIT_TINY,
                        },
                        arrow: {
                            type: EFFECT_EXHAUST,
                            params: {target: TARGET_THIS},
                        },
                        effect: {
                            type: EFFECT_DEAL_DAMAGE,
                            params: {
                                target: TARGET_ENEMY,
                                damage: 1,
                            },
                        },
                    },
                },
            ],
        });

        const player = {
            isPlayer: true,
            match,
            superhero,
            gameZone: {async refresh() {}},
            get isHero() {
                return superhero.isHero;
            },
        };
        superhero.owner = player;
        const army = cardsFactory.createGameCardFromConfig(
            armyEntry.card,
            {owner: player},
        );
        army.controller = player;
        match.inPlayCards.push(army);
        const enemy = {
            abilities: [],
            damage: 0,
            hitPoints: 5,
            id: 'enemy',
            isEnemy: true,
            isMinion: true,
            name: 'Test enemy',
            async getLife() {
                return this.hitPoints - this.damage;
            },
            async refresh() {},
            placeDamage(damage) {
                this.damage += damage;
            },
        };
        match.enemies = [enemy];

        const [ability] = army.abilities;
        assert.ok(ability instanceof HeroActionAbility);
        assert.equal(ability.effect.effectType, EFFECT_DEAL_DAMAGE);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(ability.arrow.cost.effectType, EFFECT_EXHAUST);
        assert.equal(ability.arrow.cost.target, TARGET_THIS);
        assert.equal(ability.effect.baseDamage, 1);
        assert.equal(ability.effect.target, TARGET_ENEMY);

        for (const {side, available} of [
            {side: 0, available: false},
            {side: 1, available: true},
            {side: 2, available: false},
        ]) {
            superhero.selectedSide = side;
            assert.equal(
                await ability.canRun({card: army, match, player}),
                available,
            );
        }

        superhero.selectedSide = 1;
        await ability.resolveAbility({
            card: army,
            fixedPreselectedTarget: true,
            match,
            player,
            preselectedTarget: true,
            selectedTarget: enemy,
        });

        assert.equal(ability.resolved, true);
        assert.equal(army.exhausted, true);
        assert.equal(enemy.damage, 1);
        assert.equal(await ability.canRun({card: army, match, player}), false);
    });

    test('adds Partículas Pym and heals or draws after spending it in a Hero identity', async () => {
        const {hero} = await createAntMan();
        const pymParticlesEntry = hero.config.cards.find(
            ({card}) => card.params.name === 'Partículas Pym'
        );

        assert.ok(pymParticlesEntry);
        assert.equal(pymParticlesEntry.count, 2);
        assert.equal(pymParticlesEntry.card.type, CARD_TYPE_RESOURCE);
        assert.deepEqual(pymParticlesEntry.card.params, {
            name: 'Partículas Pym',
            set: 'Hombre Hormiga',
            image: 'heroes/ant-man/12006.png',
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
                                    'player.superhero.currentSide.traits':
                                        TRAIT_GIANT,
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
        });

        for (const {side, damage, expectedDamage, expectedDraws} of [
            {side: 2, damage: 3, expectedDamage: 1, expectedDraws: 0},
            {side: 1, damage: 0, expectedDamage: 0, expectedDraws: 1},
        ]) {
            const {
                cardsFactory,
                match,
                superhero,
            } = await createAntMan();
            match.mc = {mcSocket: {send() {}}};
            superhero.selectedSide = side;
            superhero.damage = damage;
            superhero.refresh = async () => {};

            const player = {
                isPlayer: true,
                match,
                superhero,
                get isHero() {
                    return superhero.isHero;
                },
            };
            superhero.owner = player;
            player.hand = new Hand(player);
            player.hand.refresh = async () => {};
            player.deck = {
                discardPile: [],
                async discard(card) {
                    this.discardPile.push(card);
                },
                async draw(count) {
                    assert.equal(count, 1);
                    return [{id: 'drawn-card'}];
                },
                refresh() {},
            };

            const card = cardsFactory.createGameCardFromConfig(
                pymParticlesEntry.card,
                {owner: player},
            );
            player.hand.addCard(card);
            player.getCardsToPay = async () => ({
                generators: [],
                hand: [card],
            });
            const [response] = card.abilities;
            assert.ok(response instanceof HeroResponseAbility);
            assert.equal(response.trigger, TRIGGER_THIS_SPEND);
            assert.equal(response.effect.effectType, EFFECT_DO_IF);
            assert.equal(typeof response.effect.canRun, 'function');
            assert.equal(typeof response.effect.effect.canRun, 'function');
            assert.equal(typeof response.effect.effectNot.canRun, 'function');
            response.hideDialog = true;

            player.spendResources = async () => ({
                fullyPaid: true,
                generators: [],
                hand: [card],
                resources: [RESOURCE_WILD],
            });
            const spendEffect = new SpendEffect({
                match,
                resources: [RESOURCE_WILD],
                selectedTarget: player,
            });
            const costPaymentSession = new CostPaymentSession();
            await costPaymentSession.resolve(spendEffect, {
                card: {id: 'card-being-paid'},
                match,
                player,
            });

            assert.deepEqual(player.deck.discardPile, [card]);
            assert.equal(player.hand.cards.includes(card), false);
            assert.equal(superhero.damage, expectedDamage);
            assert.equal(player.hand.cards.length, expectedDraws);
            assert.equal(match.triggerCards[card.id], undefined);
            assert.deepEqual(costPaymentSession.deferredResponses, []);
        }
    });

    test('offers every other form for a voluntary identity change', async () => {
        const {match, superhero} = await createAntMan();
        const player = {
            isPlayer: true,
            superhero,
            canFlip: async () => true,
            hand: {
                async refresh() {},
            },
        };
        superhero.owner = player;
        superhero.endTriggers = () => {};
        superhero.initTriggers = async () => {};
        superhero.refresh = async () => {};

        const flipToHero = new FlipEffect({
            formTarget: TARGET_SIDE,
            match,
            selectedTarget: superhero,
        });
        flipToHero.trigger = async () => {};
        await flipToHero.prepare({card: superhero, match, player});
        const heroSides = superhero.sides.filter(side => side.isHero);
        const selectedHeroSide = heroSides[1];

        assert.equal(match.dialogs.length, 1);
        assert.equal(match.dialogs[0].dialogType, DIALOG_SELECT_TARGET);
        assert.equal(match.dialogs[0].title, 'Elige tu identidad');
        assert.deepEqual(
            match.dialogs[0].data.cards.map(({image}) => image),
            heroSides.map(({card}) => card.image),
        );
        assert.strictEqual(flipToHero.selectedFormTarget, selectedHeroSide);

        await flipToHero.execute({own: true, player});
        assert.equal(superhero.currentSide.card.image, selectedHeroSide.card.image);

        match.dialogs = [];
        const flipFromHero = new FlipEffect({
            formTarget: TARGET_SIDE,
            match,
            selectedTarget: superhero,
        });
        flipFromHero.trigger = async () => {};
        await flipFromHero.prepare({card: superhero, match, player});

        const otherForms = superhero.sides.filter(
            side => side !== superhero.currentSide
        );
        assert.equal(match.dialogs.length, 1);
        assert.equal(match.dialogs[0].title, 'Elige tu identidad');
        assert.deepEqual(
            match.dialogs[0].data.cards.map(({id}) => id),
            otherForms.map(({id}) => id),
        );
        assert.strictEqual(
            flipFromHero.selectedFormTarget,
            superhero.sides[1],
        );
        await flipFromHero.execute({own: true, player});
        assert.equal(superhero.currentSide.id, 'ant-man-tiny');
    });

    test('resolves the printed heal, threat removal, and damage responses', async () => {
        const {match, superhero} = await createAntMan();
        const player = {superhero};
        const [alterEgo, tinyHero, giantHero] = superhero.sides;

        superhero.damage = 2;
        superhero.refresh = async () => {};
        const heal = alterEgo.abilities.find(
            ({name}) => name === 'Tiempo para relajarse'
        ).effect;
        heal.selectedTarget = superhero;
        await heal.prepare({match, player});
        await heal.execute({match, player});
        assert.equal(superhero.damage, 1);

        const scheme = {
            isSideScheme: false,
            threat: 4,
            removeThreat(amount) {
                this.threat -= amount;
            },
            refresh() {},
        };
        const removeThreat = tinyHero.abilities.find(
            ({name}) => name === 'Insecto irritante'
        ).effect;
        removeThreat.selectedTarget = scheme;
        await removeThreat.prepare({match, player});
        await removeThreat.execute({match, player});
        assert.equal(scheme.threat, 3);

        const enemy = {damage: 0};
        match.effectsFactory = {
            createEffect({damage, selectedTarget}) {
                return {
                    defeated: false,
                    takenDamage: damage,
                    async runEffect() {
                        selectedTarget.damage += damage;
                    },
                };
            },
        };
        const dealDamage = giantHero.abilities.find(
            ({name}) => name === 'Molestia mayúscula'
        ).effect;
        dealDamage.selectedTarget = enemy;
        await dealDamage.prepare({match, player});
        await dealDamage.execute({match, player});
        assert.equal(enemy.damage, 1);
    });

    test("adds Ant-Man's nemesis set with its printed card rules", async () => {
        const {cardsFactory, hero} = await createAntMan();
        const [
            schemeEntry,
            minionEntry,
            attachmentEntry,
            treacheryEntry,
        ] = hero.config.nemesis;
        const schemeConfig = schemeEntry.card;
        const minionConfig = minionEntry.card;
        const attachmentConfig = attachmentEntry.card;
        const treacheryConfig = treacheryEntry.card;

        assert.deepEqual(
            [
                schemeEntry.count,
                minionEntry.count,
                attachmentEntry.count,
                treacheryEntry.count,
            ],
            [1, 1, 2, 1],
        );
        assert.equal(schemeConfig.type, CARD_TYPE_SIDE_SCHEME_SCENARIO);
        assert.deepEqual(
            [
                schemeConfig.params.name,
                schemeConfig.params.image,
                schemeConfig.params.startingThreat,
                schemeConfig.params.boost,
            ],
            ['Robo de tecnología', 'heroes/ant-man/12026.png', [2, true], 3],
        );
        assert.equal(minionConfig.type, CARD_TYPE_MINION);
        assert.deepEqual(
            [
                minionConfig.params.name,
                minionConfig.params.image,
                minionConfig.params.attack,
                minionConfig.params.scheme,
                minionConfig.params.hitPoints,
                minionConfig.params.boost,
                minionConfig.params.nemesis,
            ],
            [
                'Chaqueta Amarilla',
                'heroes/ant-man/12027.png',
                2,
                2,
                4,
                2,
                true,
            ],
        );
        assert.equal(attachmentConfig.type, CARD_TYPE_ATTACHMENT);
        assert.deepEqual(
            [
                attachmentConfig.params.name,
                attachmentConfig.params.image,
                attachmentConfig.params.attack,
                attachmentConfig.params.scheme,
                attachmentConfig.params.boost,
                attachmentConfig.params.keywords.uses,
            ],
            [
                'Aumento de tamaño',
                'heroes/ant-man/12028.png',
                2,
                2,
                1,
                3,
            ],
        );
        assert.deepEqual(attachmentConfig.params.attach, {
            target: TARGET_ENEMY,
            condition: {name: 'Chaqueta Amarilla'},
            fallbackTarget: TARGET_VILLAIN,
        });
        assert.equal(
            attachmentConfig.params.abilities[0].type,
            ABILITY_FORCED_RESPONSE,
        );
        assert.equal(
            attachmentConfig.params.abilities[0].params.trigger,
            TRIGGER_ATTACHED_ACTIVATES,
        );
        assert.deepEqual(
            attachmentConfig.params.abilities[0].params.effect,
            {
                type: EFFECT_REMOVE_COUNTER,
                params: {target: TARGET_THIS, count: 1},
            },
        );
        assert.equal(treacheryConfig.type, CARD_TYPE_TREACHERY);
        assert.deepEqual(
            [
                treacheryConfig.params.name,
                treacheryConfig.params.set,
                treacheryConfig.params.image,
                treacheryConfig.params.boost,
            ],
            [
                'El plan de Chaqueta Amarilla',
                'Hombre Hormiga',
                'heroes/ant-man/12029.png',
                1,
            ],
        );
        const [whenRevealedConfig] = treacheryConfig.params.abilities;
        assert.equal(whenRevealedConfig.type, ABILITY_WHEN_REVEALED);
        assert.equal(
            whenRevealedConfig.params.effect.type,
            EFFECT_CHAINED,
        );
        const [discardUntilConfig, revealChainConfig] =
            whenRevealedConfig.params.effect.params.effects;
        assert.deepEqual(discardUntilConfig, {
            type: EFFECT_DISCARD_UNTIL,
            params: {
                target: TARGET_ENCOUNTER_DECK,
                condition: {set: 'Hombre Hormiga'},
                showDiscardedCards: true,
            },
        });
        assert.equal(revealChainConfig.type, EFFECT_CHAINED);
        const [getEncounterCardConfig, revealEncounterConfig] =
            revealChainConfig.params.effects;
        assert.deepEqual(getEncounterCardConfig, {
            type: EFFECT_GET_ENCOUNTER_CARD,
            params: {
                from: PLACE_ENCOUNTER_DISCARD,
                cardSource: 'selectedCard',
            },
        });
        assert.deepEqual(revealEncounterConfig, {
            type: EFFECT_REVEAL_ENCOUNTER,
            params: {card: 'effects.0.card'},
        });

        const scheme = cardsFactory.createGameCardFromConfig(schemeConfig);
        const yellowJacket = cardsFactory.createGameCardFromConfig(minionConfig);
        const sizeIncrease = cardsFactory.createGameCardFromConfig(attachmentConfig);
        const plan = cardsFactory.createGameCardFromConfig(treacheryConfig);
        const [blankExistingCards, blankEnteringCards] = scheme.abilities;
        const [identityTraits, tinyAttack] = yellowJacket.abilities;
        const [whenRevealed] = plan.abilities;

        assert.deepEqual(
            schemeConfig.params.abilities.map(({type}) => type),
            [ABILITY_CONSTANT, ABILITY_CONSTANT],
        );
        assert.deepEqual(
            minionConfig.params.abilities.map(({type}) => type),
            [ABILITY_CONSTANT, ABILITY_CONSTANT],
        );
        assert.equal(blankExistingCards.trigger, TRIGGER_CARD_ENTER_PLAY);
        assert.equal(
            blankExistingCards.effect.effectType,
            EFFECT_FOR_EACH,
        );
        assert.equal(
            blankExistingCards.effect.effectDefinition.type,
            EFFECT_BLANK_TEXT,
        );
        assert.equal(blankEnteringCards.triggerParams.cardCondition.isPlayerCard, true);
        assert.deepEqual(
            blankExistingCards.effect.condition,
            {isPlayerCard: true},
        );
        assert.deepEqual(
            blankEnteringCards.effect.modifierCondition,
            {'card.traits': TRAIT_TECH},
        );
        assert.equal(
            blankEnteringCards.effect.effectType,
            EFFECT_BLANK_TEXT,
        );
        assert.equal(blankEnteringCards.effect.target, TARGET_TRIGGERED_CARD);
        assert.equal(identityTraits.effect.effectType, EFFECT_SIMULTANEOUS);
        assert.deepEqual(
            identityTraits.effect.effects.map(({effectType}) => effectType),
            [EFFECT_ADD_TRAIT, EFFECT_ADD_KEYWORD, EFFECT_ADD_TRAIT],
        );
        assert.equal(identityTraits.trigger, TRIGGER_CARD_ENTER_PLAY);
        assert.equal(tinyAttack.trigger, TRIGGER_THIS_GET_ATTACK);
        assert.equal(tinyAttack.effect.effectType, EFFECT_MODIFY_ATTACK_VALUE);
        assert.equal(tinyAttack.effect.target, TARGET_EFFECT);
        assert.equal(sizeIncrease.uses, 3);
        for (const ability of [
            ...scheme.abilities,
            ...yellowJacket.abilities,
            ...sizeIncrease.abilities,
            ...plan.abilities,
        ]) {
            assert.ok(ability.effect);
            assert.equal(typeof ability.effect.canRun, 'function');
        }
        assert.equal(whenRevealed.effect.effectType, EFFECT_CHAINED);
        const [discardUntil, revealChain] = whenRevealed.effect.effects;
        assert.equal(discardUntil.effectType, EFFECT_DISCARD_UNTIL);
        assert.deepEqual(discardUntil.condition, {set: 'Hombre Hormiga'});
        assert.equal(discardUntil.target, TARGET_ENCOUNTER_DECK);
        assert.equal(revealChain.effectType, EFFECT_CHAINED);
        assert.deepEqual(
            revealChain.effects.map(({effectType}) => effectType),
            [EFFECT_GET_ENCOUNTER_CARD, EFFECT_REVEAL_ENCOUNTER],
        );
    });

    test('El plan de Chaqueta Amarilla discards through the first Ant-Man set card', async () => {
        const {cardsFactory, hero, match} = await createAntMan();
        const treacheryConfig = hero.config.nemesis.find(({card}) =>
            card.params.name === 'El plan de Chaqueta Amarilla').card;
        const plan = cardsFactory.createGameCardFromConfig(treacheryConfig);
        const [whenRevealed] = plan.abilities;
        const [discardUntil] = whenRevealed.effect.effects;
        const dialogs = [];
        const unrelatedCard = {
            id: 'unrelated',
            set: 'Otro conjunto',
            toObj() {
                return {id: this.id};
            },
        };
        const nemesisCard = {
            id: 'nemesis',
            set: 'Hombre Hormiga',
            toObj() {
                return {id: this.id};
            },
        };
        const remainingCard = {
            id: 'remaining',
            set: 'Otro conjunto',
            toObj() {
                return {id: this.id};
            },
        };
        const deck = new Deck({owner: {match}});
        deck.cards = [unrelatedCard, nemesisCard, remainingCard];
        deck.refresh = async () => {};
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return {};
        };
        discardUntil.selectedTarget = deck;

        const params = {match};
        await discardUntil.execute(params);

        assert.strictEqual(params.selectedCard, nemesisCard);
        assert.deepEqual(deck.discardPile, [unrelatedCard, nemesisCard]);
        assert.deepEqual(deck.cards, [remainingCard]);
        assert.deepEqual(dialogs, [{
            dialogType: DIALOG_REVEAL_CARDS,
            title: 'Cartas descartadas',
            data: {
                cards: [{id: 'unrelated'}, {id: 'nemesis'}],
            },
        }]);
    });

    test('Aumento de tamaño removes a counter after its attached enemy activates', async () => {
        const {cardsFactory, hero, match, superhero} = await createAntMan();
        const yellowJacket = cardsFactory.createGameCardFromConfig(
            hero.config.nemesis[1].card
        );
        const sizeIncrease = cardsFactory.createGameCardFromConfig(
            hero.config.nemesis[2].card
        );
        const player = {isPlayer: true, isHero: true, superhero};

        yellowJacket.controller = match.scenario;
        yellowJacket.attached = [sizeIncrease];
        sizeIncrease.attachedTo = yellowJacket;
        sizeIncrease.controller = match.scenario;
        match.scenario.deck = {refresh: async () => {}};
        new PutPlayEffect({match}).initializeCardState(sizeIncrease);
        assert.equal(sizeIncrease.counters, 3);
        sizeIncrease.refresh = async () => {};
        yellowJacket.refresh = async () => {};
        let discarded = false;
        sizeIncrease.discard = async () => {
            discarded = true;
        };
        match.inPlayCards = [yellowJacket, sizeIncrease];
        const ability = sizeIncrease.abilities[0];
        const trigger = new TriggersFactory(match).createTrigger({
            type: TRIGGER_ATTACHED_ACTIVATES,
            card: sizeIncrease,
            ability,
        });
        const triggerParams = {
            card: yellowJacket,
            effect: {character: yellowJacket, resolved: true},
            match,
            player,
        };

        assert.equal(await trigger.canTrigger({
            ...triggerParams,
            effect: {character: {id: 'other-enemy'}, resolved: true},
        }), false);
        assert.equal(await trigger.canTrigger(triggerParams), true);
        for (const expectedCounters of [2, 1, 0]) {
            const activationParams = {
                ...triggerParams,
                effect: {character: yellowJacket, resolved: true},
            };
            assert.equal(await trigger.canTrigger(activationParams), true);
            await trigger.runTrigger(activationParams);
            assert.equal(sizeIncrease.counters, expectedCounters);
        }
        assert.equal(discarded, true);
    });

    test('Robo de tecnología blanks Tech player cards only while the scheme is in play', async () => {
        const {cardsFactory, hero, match, superhero} = await createAntMan();
        const schemeConfig = hero.config.nemesis[0].card;
        const technologyCard = hero.config.cards.find(({card}) =>
            card.params.name === 'Casco del Hombre Hormiga').card;
        const allyCard = hero.config.cards.find(({card}) =>
            card.params.name === 'Avispa').card;
        const scheme = cardsFactory.createGameCardFromConfig(schemeConfig);
        const techCard = cardsFactory.createGameCardFromConfig(technologyCard);
        const nonTechCard = cardsFactory.createGameCardFromConfig(allyCard);
        const futureTechCard = cardsFactory.createGameCardFromConfig(technologyCard);
        const player = {isPlayer: true, isHero: true, superhero};
        const scenario = {};

        scheme.controller = scenario;
        scheme.refresh = async () => {};
        [techCard, nonTechCard, futureTechCard].forEach(card => {
            card.refresh = async () => {};
        });
        match.scenario = scenario;
        match.inPlayCards = [scheme, techCard, nonTechCard];
        const [blankExistingCards, blankEnteringCards] = scheme.abilities;

        await blankExistingCards.resolveAbility({
            player,
            card: scheme,
            triggeredCard: scheme,
        });

        assert.equal(techCard.printedTextBlank, true);
        assert.equal(nonTechCard.printedTextBlank, false);

        nonTechCard.extraTraits.push(TRAIT_TECH);
        assert.equal(nonTechCard.printedTextBlank, true);
        nonTechCard.extraTraits.pop();
        assert.equal(nonTechCard.printedTextBlank, false);

        match.inPlayCards.push(futureTechCard);
        await blankEnteringCards.resolveAbility({
            player,
            card: scheme,
            triggeredCard: futureTechCard,
        });

        assert.equal(futureTechCard.printedTextBlank, true);
        assert.equal(match.lasting.length, 0);

        scheme.controller = undefined;
        assert.equal(scheme.isInPlay, false);
        assert.equal(techCard.printedTextBlank, false);
        assert.equal(futureTechCard.printedTextBlank, false);
        assert.equal(nonTechCard.printedTextBlank, false);
        assert.equal(match.lasting.length, 0);
    });

    test('Chaqueta Amarilla gains identity-based traits, Retaliate, and attack dynamically', async () => {
        const {cardsFactory, hero, match, superhero} = await createAntMan();
        const yellowJacketConfig = hero.config.nemesis[1].card;
        const yellowJacket = cardsFactory.createGameCardFromConfig(yellowJacketConfig);
        const player = {isPlayer: true, isHero: true, superhero};

        yellowJacket.controller = {};
        yellowJacket.engaged = player;
        yellowJacket.refresh = async () => {};
        match.inPlayCards = [yellowJacket];
        yellowJacket.initTriggers();

        const identityTraits = yellowJacket.abilities.find(
            ({trigger}) => trigger === TRIGGER_CARD_ENTER_PLAY
        );
        await identityTraits.resolveAbility({
            player,
            card: yellowJacket,
            triggeredCard: yellowJacket,
        });

        superhero.selectedSide = 1;
        assert.ok(yellowJacket.traits.includes(TRAIT_TINY));
        assert.ok(!yellowJacket.traits.includes(TRAIT_GIANT));
        assert.equal(yellowJacket.getKeyword('retaliate'), 0);
        assert.equal(await yellowJacket.getAttackValue({player}), 3);

        superhero.selectedSide = 2;
        assert.ok(yellowJacket.traits.includes(TRAIT_GIANT));
        assert.ok(!yellowJacket.traits.includes(TRAIT_TINY));
        assert.equal(yellowJacket.getKeyword('retaliate'), 1);
        assert.equal(await yellowJacket.getAttackValue({player}), 2);

        superhero.selectedSide = 0;
        assert.ok(!yellowJacket.traits.includes(TRAIT_GIANT));
        assert.ok(!yellowJacket.traits.includes(TRAIT_TINY));
        assert.equal(yellowJacket.getKeyword('retaliate'), 0);
        assert.equal(await yellowJacket.getAttackValue({player}), 2);

        yellowJacket.endTriggers();
        yellowJacket.controller = undefined;
        assert.ok(!yellowJacket.traits.includes(TRAIT_GIANT));
        assert.equal(yellowJacket.getKeyword('retaliate'), 0);
    });
});
