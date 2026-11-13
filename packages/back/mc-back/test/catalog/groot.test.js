import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    ABILITY_ALTEREGO_ACTION,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_HERO_ACTION,
    CARD_TYPE_ALLY,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_SUPPORT,
    CALC_COUNTERS,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_HERO,
    CLASSIFICATION_PROTECTION,
    DIALOG_LIST,
    DIALOG_PAY_COST,
    DIALOG_SELECT_TARGET,
    EFFECT_CHAINED,
    EFFECT_DO_IF,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_EXHAUST,
    EFFECT_PLACE_COUNTERS,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_REMOVE_THREAT,
    EFFECT_REMOVE_COUNTER,
    EFFECT_SIMULTANEOUS,
    EFFECT_TOUGH,
    LABEL_ATTACK,
    LABEL_THWART,
    PRIORITY_FORCED_INTERRUPT,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ROUND,
    TARGET_ENEMY,
    TARGET_FRIENDLY_CHARACTER,
    TARGET_PARENT,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_SUPERHERO,
    TRAIT_ATTACK,
    TRAIT_GUARDIAN,
    TRAIT_LOCATION,
    TRAIT_OUTLAW,
    TRAIT_SUPERPOWER,
    TRAIT_THWART,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {MoveDamageEffect} from '../../src/effects/move-damage-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {Match} from '../../src/model/match/match.js';

describe('Groot', () => {
    const createFixture = async name => {
        const catalog = await loadCatalog();
        const groot = catalog.heroes.find(({_id}) => _id === 'groot');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name,
        });
        const superhero = new MatchFactory(match).createSuperhero({
            ...groot.config,
            cards: [],
            precon: [],
            nemesis: [],
        });
        superhero.selectedSide = 1;
        superhero.refresh = async () => {};
        const player = match.createPlayer({
            name: 'Groot',
            superhero,
            initial: true,
        });
        player.initPlayer();
        await superhero.initTriggers({match, player});

        return {match, player, superhero};
    };
    const createWeAreGrootPlayFixture = async name => {
        const catalog = await loadCatalog();
        const groot = catalog.heroes.find(({_id}) => _id === 'groot');
        const resourceConfig = catalog.aspects.find(
            ({_id}) => _id === 'basic-genius'
        );
        const {match, player, superhero} = await createFixture(name);
        const cardsFactory = new CardsFactory({match});
        const event = cardsFactory.createGameCardFromConfig(
            groot.config.cards[4].card,
            {owner: player},
        );
        const resource = cardsFactory.createGameCardFromConfig(
            resourceConfig.card,
            {owner: player},
        );
        const ally = cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Aliado de prueba',
                hitPoints: 2,
                attack: 1,
                thwart: 1,
            },
        }, {owner: player});
        ally.controller = player;
        ally.refresh = async () => {};
        player.gameZone.addToGameZone(ally);
        player.hand.addCard(event);
        player.hand.addCard(resource);
        superhero.setTough();
        superhero.placeCounters(2);

        return {
            ability: event.abilities[0],
            ally,
            event,
            match,
            player,
            resource,
            superhero,
        };
    };

    test('defines both identities, abilities, and the specified precon references', async () => {
        const {heroes, aspects} = await loadCatalog();
        const groot = heroes.find(({_id}) => _id === 'groot');
        const [alterEgo, hero] = groot.config.sides;

        assert.deepEqual(
            groot.config.sides.map(({type, params}) => [
                type,
                params.name,
                params.image,
                params.handSize,
                params.hitPoints,
            ]),
            [
                [CARD_TYPE_ALTEREGO, 'Groot', 'heroes/groot/16001b.png', 6, 10],
                [CARD_TYPE_HERO, 'Groot', 'heroes/groot/16001a.png', 5, 10],
            ],
        );
        assert.equal(alterEgo.params.recovery, 4);
        assert.deepEqual(alterEgo.params.traits, [TRAIT_OUTLAW]);
        assert.deepEqual(hero.params.traits, [TRAIT_GUARDIAN]);
        assert.deepEqual(
            [hero.params.thwart, hero.params.attack, hero.params.defense],
            [1, 2, 3],
        );

        const growthAction = alterEgo.params.abilities[0];
        assert.equal(growthAction.type, ABILITY_ALTEREGO_ACTION);
        assert.deepEqual(growthAction.params.limit, {
            count: 1,
            target: TARGET_ROUND,
        });
        assert.deepEqual(growthAction.params.effect, {
            type: EFFECT_PLACE_COUNTERS,
            params: {
                target: TARGET_YOUR_SUPERHERO,
                counters: 2,
                maxCounters: 10,
            },
        });

        const floraColossus = hero.params.abilities[0];
        assert.equal(floraColossus.type, ABILITY_FORCED_INTERRUPT);
        assert.equal(
            floraColossus.params.trigger,
            TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
        );
        assert.deepEqual(floraColossus.params.triggerParams, {
            target: TARGET_YOUR_SUPERHERO,
        });
        const [removeCounters, preventIfCountersRemoved] =
            floraColossus.params.effect.params.effects;
        assert.equal(floraColossus.params.effect.type, EFFECT_CHAINED);
        assert.equal(removeCounters.type, EFFECT_REMOVE_COUNTER);
        assert.deepEqual(removeCounters.params.paramsCalc, {
            target: 'triggeredTargetDamage',
        });
        assert.equal(preventIfCountersRemoved.type, EFFECT_DO_IF);
        assert.deepEqual(preventIfCountersRemoved.params.condition, {
            'effects.0.removedCounters': '>0',
        });
        assert.equal(
            preventIfCountersRemoved.params.effect.type,
            EFFECT_PREVENT_DAMAGE,
        );
        assert.deepEqual(
            preventIfCountersRemoved.params.effect.params.paramsCalc,
            {target: 'effects.0.removedCounters'},
        );

        assert.deepEqual(groot.config.precon, [
            {
                classification: CLASSIFICATION_BASIC,
                cardRefs: [
                    {id: 'basic-energy', count: 1},
                    {id: 'basic-strength', count: 1},
                    {id: 'basic-genius', count: 1},
                    {id: 'basic-mapache-cohete', count: 1},
                    {id: 'basic-flora-y-fauna', count: 1},
                    {id: 'basic-concentracion-eficaz', count: 3},
                ],
            },
            {
                aspect: CLASSIFICATION_PROTECTION,
                cardRefs: [
                    {id: 'protection-defensa-desesperada', count: 3},
                    {id: 'protection-el-poder-de-la-proteccion', count: 2},
                    {id: 'protection-indomito', count: 2},
                    {id: 'protection-halcon-estelar', count: 1},
                    {id: 'protection-en-plena-forma', count: 3},
                    {id: 'protection-intrepido', count: 3},
                    {id: 'protection-dificil-de-ignorar', count: 3},
                ],
            },
        ]);
        for (const {cardRefs} of groot.config.precon) {
            for (const {id} of cardRefs) {
                assert.ok(aspects.some(({_id}) => _id === id), id);
            }
        }
        assert.equal(groot.config.cards.length, 10);
        assert.equal(groot.config.cards[0].count, 2);
        const germination = groot.config.cards[0].card;
        assert.equal(germination.type, CARD_TYPE_EVENT);
        assert.equal(germination.params.name, 'Germinación');
        assert.equal(germination.params.set, 'Groot');
        assert.equal(germination.params.image, 'heroes/groot/16002.png');
        assert.equal(germination.params.cost, 0);
        assert.deepEqual(germination.params.resources, [RESOURCE_MENTAL]);
        assert.deepEqual(germination.params.traits, [TRAIT_SUPERPOWER]);
        assert.equal(germination.params.classification, CLASSIFICATION_HERO);
        assert.deepEqual(germination.params.abilities[0], {
            type: ABILITY_ACTION,
            params: {
                effect: {
                    type: EFFECT_PLACE_COUNTERS,
                    params: {
                        target: TARGET_YOUR_SUPERHERO,
                        counters: 2,
                        maxCounters: 10,
                    },
                },
            },
        });
        assert.equal(groot.config.obligation.card.params.name, 'Marchitamiento');
        assert.deepEqual(
            groot.config.nemesis.map(({count, card}) => [
                count,
                card.params.name,
            ]),
            [
                [1, 'Infierno abrasador'],
                [1, 'Furnax'],
                [3, 'Avivar las llamas'],
            ],
        );

        const iAmGrootEntry = groot.config.cards[1];
        assert.equal(iAmGrootEntry.count, 2);
        const iAmGroot = iAmGrootEntry.card;
        assert.equal(iAmGroot.type, CARD_TYPE_EVENT);
        assert.equal(iAmGroot.params.name, 'Soy Groot');
        assert.equal(iAmGroot.params.set, 'Groot');
        assert.equal(iAmGroot.params.image, 'heroes/groot/16003.png');
        assert.equal(iAmGroot.params.cost, 3);
        assert.deepEqual(iAmGroot.params.resources, [RESOURCE_MENTAL]);
        assert.deepEqual(iAmGroot.params.traits, [
            TRAIT_SUPERPOWER,
            TRAIT_THWART,
        ]);
        assert.equal(iAmGroot.params.classification, CLASSIFICATION_HERO);
        assert.deepEqual(iAmGroot.params.abilities[0], {
            type: ABILITY_HERO_ACTION,
            params: {
                labels: [LABEL_THWART],
                effect: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {
                        target: TARGET_SCHEME,
                        paramsCalc: {
                            target: 'player.superhero',
                            formula: CALC_COUNTERS,
                        },
                    },
                },
            },
        });

        const iAmGrootAttackEntry = groot.config.cards[2];
        assert.equal(iAmGrootAttackEntry.count, 2);
        const iAmGrootAttack = iAmGrootAttackEntry.card;
        assert.equal(iAmGrootAttack.type, CARD_TYPE_EVENT);
        assert.equal(iAmGrootAttack.params.name, '¡SOY… GROOT!');
        assert.equal(iAmGrootAttack.params.set, 'Groot');
        assert.equal(iAmGrootAttack.params.image, 'heroes/groot/16004.png');
        assert.equal(iAmGrootAttack.params.cost, 2);
        assert.deepEqual(iAmGrootAttack.params.resources, [RESOURCE_PHYSICAL]);
        assert.deepEqual(iAmGrootAttack.params.traits, [
            TRAIT_ATTACK,
            TRAIT_SUPERPOWER,
        ]);
        assert.equal(
            iAmGrootAttack.params.classification,
            CLASSIFICATION_HERO,
        );
        assert.deepEqual(iAmGrootAttack.params.abilities[0], {
            type: ABILITY_HERO_ACTION,
            params: {
                labels: [LABEL_ATTACK],
                effect: {
                    type: EFFECT_DEAL_DAMAGE,
                    params: {
                        target: TARGET_ENEMY,
                        paramsCalc: {
                            target: 'player.superhero',
                            formula: CALC_COUNTERS,
                        },
                    },
                },
            },
        });

        const crushingRootsEntry = groot.config.cards[3];
        assert.equal(crushingRootsEntry.count, 3);
        const crushingRoots = crushingRootsEntry.card;
        assert.equal(crushingRoots.type, CARD_TYPE_EVENT);
        assert.equal(crushingRoots.params.name, 'Raíz aplastante');
        assert.equal(crushingRoots.params.set, 'Groot');
        assert.equal(
            crushingRoots.params.image,
            'heroes/groot/16005.png',
        );
        assert.equal(crushingRoots.params.cost, 2);
        assert.deepEqual(crushingRoots.params.resources, [RESOURCE_PHYSICAL]);
        assert.deepEqual(crushingRoots.params.traits, [
            TRAIT_ATTACK,
            TRAIT_SUPERPOWER,
        ]);
        assert.equal(crushingRoots.params.classification, CLASSIFICATION_HERO);
        assert.deepEqual(crushingRoots.params.abilities[0], {
            type: ABILITY_HERO_ACTION,
            params: {
                labels: [LABEL_ATTACK],
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        target: TARGET_ENEMY,
                        effects: [
                            {
                                type: EFFECT_DEAL_DAMAGE,
                                params: {
                                    target: TARGET_PARENT,
                                    damage: 5,
                                },
                            },
                            {
                                type: EFFECT_DO_IF,
                                params: {
                                    target: TARGET_PARENT,
                                    condition: {
                                        'effects.0.defeated': true,
                                    },
                                    effect: {
                                        type: EFFECT_PLACE_COUNTERS,
                                        params: {
                                            target: TARGET_YOUR_SUPERHERO,
                                            counters: 1,
                                            maxCounters: 10,
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        });

        const weAreGrootEntry = groot.config.cards[4];
        assert.equal(weAreGrootEntry.count, 1);
        const weAreGroot = weAreGrootEntry.card;
        assert.equal(weAreGroot.type, CARD_TYPE_EVENT);
        assert.equal(weAreGroot.params.name, 'Somos Groot');
        assert.equal(weAreGroot.params.set, 'Groot');
        assert.equal(weAreGroot.params.image, 'heroes/groot/16006.png');
        assert.equal(weAreGroot.params.cost, 1);
        assert.deepEqual(weAreGroot.params.resources, [RESOURCE_MENTAL]);
        assert.deepEqual(weAreGroot.params.traits, [TRAIT_SUPERPOWER]);
        assert.equal(weAreGroot.params.classification, CLASSIFICATION_HERO);
        assert.deepEqual(weAreGroot.params.abilities[0], {
            type: ABILITY_HERO_ACTION,
            params: {
                arrow: {
                    type: EFFECT_REMOVE_COUNTER,
                    params: {
                        target: TARGET_YOUR_SUPERHERO,
                        count: 4,
                        upTo: true,
                        dialogTitle:
                            'Elige cuántos contadores de Crecimiento quieres quitar',
                    },
                },
                effect: {
                    type: EFFECT_TOUGH,
                    params: {
                        target: TARGET_FRIENDLY_CHARACTER,
                        multipleTarget: true,
                        targetCountCalc: {
                            target:
                                'effect.ability.costs.paymentEffect.removedCounters',
                        },
                    },
                },
            },
        });

        const fertileGroundEntry = groot.config.cards[5];
        assert.equal(fertileGroundEntry.count, 1);
        const fertileGround = fertileGroundEntry.card;
        assert.equal(fertileGround.type, CARD_TYPE_SUPPORT);
        assert.equal(fertileGround.params.name, 'Terreno fértil');
        assert.equal(fertileGround.params.set, 'Groot');
        assert.equal(fertileGround.params.image, 'heroes/groot/16007.png');
        assert.deepEqual(fertileGround.params.traits, [TRAIT_LOCATION]);
        assert.equal(fertileGround.params.cost, 1);
        assert.deepEqual(fertileGround.params.resources, [RESOURCE_ENERGY]);
        assert.equal(fertileGround.params.classification, CLASSIFICATION_HERO);
        assert.deepEqual(fertileGround.params.abilities[0], {
            type: ABILITY_ALTEREGO_ACTION,
            params: {
                arrow: {
                    type: EFFECT_EXHAUST,
                    params: {
                        target: TARGET_THIS,
                    },
                },
                effect: {
                    type: EFFECT_SIMULTANEOUS,
                    params: {
                        effects: [
                            {
                                type: EFFECT_PLACE_COUNTERS,
                                params: {
                                    target: TARGET_YOUR_SUPERHERO,
                                    counters: 1,
                                    maxCounters: 10,
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
        });

        const {superhero} = await createFixture('groot-ability-construction');
        for (const side of superhero.sides) {
            for (const ability of side.abilities) {
                assert.equal(typeof ability.effect.canRun, 'function');
            }
        }

        const iAmGrootFixture = await createFixture(
            'groot-i-am-groot-ability-construction',
        );
        const iAmGrootCard = new CardsFactory({
            match: iAmGrootFixture.match,
        }).createGameCardFromConfig(iAmGroot, {
            owner: iAmGrootFixture.player,
        });
        assert.equal(
            typeof iAmGrootCard.abilities[0].effect.canRun,
            'function',
        );

        const iAmGrootAttackFixture = await createFixture(
            'groot-i-am-groot-attack-ability-construction',
        );
        const iAmGrootAttackCard = new CardsFactory({
            match: iAmGrootAttackFixture.match,
        }).createGameCardFromConfig(iAmGrootAttack, {
            owner: iAmGrootAttackFixture.player,
        });
        const [iAmGrootAttackAbility] = iAmGrootAttackCard.abilities;
        assert.equal(typeof iAmGrootAttackAbility.effect.canRun, 'function');
        assert.equal(iAmGrootAttackAbility.isAttack, true);
        assert.equal(iAmGrootAttackAbility.effect.isAttack, true);

        const weAreGrootFixture = await createFixture(
            'groot-we-are-groot-ability-construction',
        );
        const weAreGrootCard = new CardsFactory({
            match: weAreGrootFixture.match,
        }).createGameCardFromConfig(weAreGroot, {
            owner: weAreGrootFixture.player,
        });
        assert.equal(
            typeof weAreGrootCard.abilities[0].effect.canRun,
            'function',
        );

        const fertileGroundFixture = await createFixture(
            'groot-fertile-ground-ability-construction',
        );
        const fertileGroundCard = new CardsFactory({
            match: fertileGroundFixture.match,
        }).createGameCardFromConfig(fertileGround, {
            owner: fertileGroundFixture.player,
        });
        const [fertileGroundAbility] = fertileGroundCard.abilities;
        assert.equal(
            fertileGroundAbility.abilityType,
            ABILITY_ALTEREGO_ACTION,
        );
        assert.equal(fertileGroundAbility.arrow.cost.effectType, EFFECT_EXHAUST);
        assert.equal(fertileGroundAbility.arrow.cost.target, TARGET_THIS);
        assert.equal(
            fertileGroundAbility.effect.effectType,
            EFFECT_SIMULTANEOUS,
        );
        assert.deepEqual(
            fertileGroundAbility.effect.effects.map(({effectType}) => effectType),
            [EFFECT_PLACE_COUNTERS, EFFECT_DRAW_CARD],
        );
        assert.equal(typeof fertileGroundAbility.effect.canRun, 'function');
    });

    test('Somos Groot removes the chosen counters and gives Tough to that many friendly characters', async () => {
        const catalog = await loadCatalog();
        const groot = catalog.heroes.find(({_id}) => _id === 'groot');
        const {match, player, superhero} =
            await createFixture('groot-we-are-groot-resolution');
        const cardsFactory = new CardsFactory({match});
        const weAreGroot = cardsFactory.createGameCardFromConfig(
            groot.config.cards[4].card,
            {owner: player},
        );
        const allies = [1, 2].map(index => {
            const ally = cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_ALLY,
                params: {
                    name: `Aliado de prueba ${index}`,
                    hitPoints: 2,
                    attack: 1,
                    thwart: 1,
                },
            }, {index, owner: player});
            ally.controller = player;
            ally.refresh = async () => {};
            player.gameZone.addToGameZone(ally);

            return ally;
        });
        const [ability] = weAreGroot.abilities;
        assert.equal(await ability.canRun({match, player}), false);
        superhero.placeCounters(5);
        assert.equal(await ability.canRun({match, player}), true);

        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_LIST) {
                assert.deepEqual(
                    dialog.data.options.map(({id}) => id),
                    [1, 2, 3],
                );

                return {selected: {id: 2}};
            }
            if (dialog.dialogType === DIALOG_SELECT_TARGET) {
                assert.equal(dialog.data.count, 2);

                return {
                    selected: [
                        {id: superhero.id},
                        {id: allies[0].id},
                    ],
                };
            }

            throw new Error(`Unexpected dialog: ${dialog.dialogType}`);
        };

        await ability.resolveAbility({match, player});

        assert.equal(superhero.counters, 3);
        assert.equal(superhero.isTough, true);
        assert.equal(allies[0].isTough, true);
        assert.equal(allies[1].isTough, false);
        assert.equal(
            ability.costs.paymentEffect.removedCounters,
            2,
        );
        assert.deepEqual(
            dialogs.map(({dialogType}) => dialogType),
            [DIALOG_LIST, DIALOG_SELECT_TARGET],
        );
        assert.equal(await ability.canRun({match, player}), true);

        const nextDialogs = [];
        match.openDialog = async dialog => {
            nextDialogs.push(dialog);
            assert.equal(dialog.dialogType, DIALOG_LIST);
            assert.deepEqual(
                dialog.data.options.map(({id}) => id),
                [1],
            );

            return {selected: {id: 1}};
        };
        await ability.resolveAbility({match, player});

        assert.equal(superhero.counters, 2);
        assert.equal(allies[1].isTough, true);
        assert.equal(
            ability.costs.paymentEffect.removedCounters,
            1,
        );
        assert.equal(nextDialogs.length, 1);
        assert.equal(await ability.canRun({match, player}), false);
    });

    test('playing Somos Groot limits its counter cost and target count to eligible characters', async () => {
        const {
            ability,
            ally,
            event,
            match,
            player,
            resource,
            superhero,
        } = await createWeAreGrootPlayFixture(
            'groot-we-are-groot-play-limit',
        );
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_PAY_COST) {
                assert.equal(dialog.data.cost, 1);
                assert.ok(dialog.data.cards.hand.some(
                    ({id}) => id === resource.id
                ));

                return {
                    paid: {
                        generators: [],
                        hand: [{id: resource.id}],
                    },
                    resources: [RESOURCE_MENTAL],
                };
            }
            if (dialog.dialogType === DIALOG_LIST) {
                assert.equal(dialog.showCancel, true);
                assert.deepEqual(
                    dialog.data.options.map(({id}) => id),
                    [1],
                );

                return {selected: {id: 1}};
            }
            throw new Error(`Unexpected dialog: ${dialog.dialogType}`);
        };

        player.deck.discard = async card => {
            player.deck.discardPile.push(card);
        };
        const playCardEffect = new PlayCardEffect({
            ability,
            card: event,
            match,
        });
        await playCardEffect.runEffect({match, player});

        assert.equal(playCardEffect.played, true);
        assert.equal(superhero.counters, 1);
        assert.equal(superhero.isTough, true);
        assert.equal(ally.isTough, true);
        assert.equal(ability.costs.paymentEffect.removedCounters, 1);
        assert.ok(player.deck.discardPile.includes(event));
        assert.ok(player.deck.discardPile.includes(resource));
        assert.deepEqual(
            dialogs.map(({dialogType}) => dialogType),
            [DIALOG_PAY_COST, DIALOG_LIST],
        );
    });

    test('cancelling the Somos Groot counter choice cancels all payment', async () => {
        const {
            ability,
            ally,
            event,
            match,
            player,
            resource,
            superhero,
        } = await createWeAreGrootPlayFixture(
            'groot-we-are-groot-play-cancel',
        );
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_PAY_COST) {
                return {
                    paid: {
                        generators: [],
                        hand: [{id: resource.id}],
                    },
                    resources: [RESOURCE_MENTAL],
                };
            }
            if (dialog.dialogType === DIALOG_LIST) {
                assert.equal(dialog.showCancel, true);

                return undefined;
            }

            throw new Error(`Unexpected dialog: ${dialog.dialogType}`);
        };

        const playCardEffect = new PlayCardEffect({
            ability,
            card: event,
            match,
        });
        await playCardEffect.runEffect({match, player});

        assert.equal(playCardEffect.paymentCancelled, true);
        assert.equal(playCardEffect.played, false);
        assert.equal(event.isPlaying, false);
        assert.ok(player.hand.cards.includes(event));
        assert.ok(player.hand.cards.includes(resource));
        assert.ok(!player.deck.discardPile.includes(event));
        assert.ok(!player.deck.discardPile.includes(resource));
        assert.equal(superhero.counters, 2);
        assert.equal(superhero.isTough, true);
        assert.equal(ally.isTough, false);
        assert.deepEqual(
            dialogs.map(({dialogType}) => dialogType),
            [DIALOG_PAY_COST, DIALOG_LIST],
        );
    });

    test('Germinación places two Growth counters on Groot up to ten', async () => {
        const catalog = await loadCatalog();
        const groot = catalog.heroes.find(({_id}) => _id === 'groot');
        const {match, player, superhero} =
            await createFixture('groot-germinacion');
        const cardsFactory = new CardsFactory({match});
        const germinationConfig = groot.config.cards[0].card;

        const germination = cardsFactory.createGameCardFromConfig(
            germinationConfig,
            {owner: player},
        );
        const ability = germination.abilities[0];
        assert.equal(ability.abilityType, ABILITY_ACTION);
        assert.equal(typeof ability.effect.canRun, 'function');
        await ability.resolveAbility({match, player});
        assert.equal(superhero.counters, 2);

        superhero.counters = 9;
        const germinationAtCap = cardsFactory.createGameCardFromConfig(
            germinationConfig,
            {owner: player},
        );
        await germinationAtCap.abilities[0].resolveAbility({match, player});
        assert.equal(superhero.counters, 10);
    });

    test('removes no more Growth counters than damage and prevents the removed amount', async () => {
        const {match, player, superhero} =
            await createFixture('groot-growth-damage-prevention');
        superhero.placeCounters(3);

        const heroSide = superhero.sides[1];
        const ability = heroSide.abilities.find(({abilityType}) =>
            abilityType === ABILITY_FORCED_INTERRUPT);
        const [trigger] = heroSide.triggers[
            TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE
        ][PRIORITY_FORCED_INTERRUPT];
        const incomingDamage = new TakeDamageEffect({
            damage: 4,
            match,
            selectedTarget: superhero,
        });
        const damageParams = incomingDamage.getTriggersParams({match, player});
        assert.equal(await trigger.canTrigger(damageParams), true);
        const triggerParams = trigger.getAbilityParams(damageParams);

        assert.equal(triggerParams.triggeredTargetDamage, 4);
        await ability.resolveAbility(triggerParams);

        assert.equal(superhero.counters, 0);
        assert.equal(incomingDamage.preventDamage, 3);
        assert.equal(incomingDamage.takenDamage, 1);
    });

    test('Tough absorbs multi-target damage before Groot can remove Growth counters', async () => {
        const {match, player, superhero} =
            await createFixture('groot-tough-damage-prevention');
        match.scenario = {
            villain: {isInPlay: false},
            schemes: [],
            sideSchemes: [],
        };
        superhero.placeCounters(3);
        superhero.setTough();
        match.openDialog = async dialog => {
            assert.fail(`Unexpected dialog: ${dialog.dialogType}`);
        };

        const incomingDamage = new TakeDamageEffect({
            damage: [4],
            match,
            selectedTarget: [player],
        });
        await incomingDamage.runEffect({match, player});

        assert.equal(superhero.counters, 3);
        assert.equal(superhero.isTough, false);
        assert.deepEqual(incomingDamage.takenDamage, [0]);
    });

    test('Tough absorbs moved multi-target damage before Groot can remove Growth counters', async () => {
        const {match, player, superhero} =
            await createFixture('groot-tough-moved-damage-prevention');
        match.scenario = {
            villain: {isInPlay: false},
            schemes: [],
            sideSchemes: [],
        };
        superhero.placeCounters(3);
        superhero.setTough();
        match.openDialog = async dialog => {
            assert.fail(`Unexpected dialog: ${dialog.dialogType}`);
        };
        const damageSource = {
            damage: 4,
            removeDamage(damage) {
                this.damage = Math.max(0, this.damage - damage);
            },
            refresh() {},
        };
        const incomingDamage = new MoveDamageEffect({
            damage: 4,
            fromTarget: 'damageSource',
            match,
            selectedTarget: [player],
        });

        await incomingDamage.runEffect({match, player, damageSource});

        assert.equal(superhero.counters, 3);
        assert.equal(superhero.isTough, false);
        assert.equal(damageSource.damage, 4);
        assert.deepEqual(incomingDamage.takenDamage, [0]);
    });

    test('removes only as many Growth counters as the pending damage and safely handles none', async () => {
        const {match, player, superhero} =
            await createFixture('groot-growth-counter-limits');
        superhero.placeCounters(5);

        const heroSide = superhero.sides[1];
        const ability = heroSide.abilities.find(({abilityType}) =>
            abilityType === ABILITY_FORCED_INTERRUPT);
        const [trigger] = heroSide.triggers[
            TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE
        ][PRIORITY_FORCED_INTERRUPT];

        const lowDamage = new TakeDamageEffect({
            damage: 2,
            match,
            selectedTarget: superhero,
        });
        const lowDamageParams = lowDamage.getTriggersParams({match, player});
        assert.equal(await trigger.canTrigger(lowDamageParams), true);
        await ability.resolveAbility(trigger.getAbilityParams(lowDamageParams));
        assert.equal(superhero.counters, 3);
        assert.equal(lowDamage.preventDamage, 2);

        superhero.counters = 0;
        const unpreventedDamage = new TakeDamageEffect({
            damage: 2,
            match,
            selectedTarget: superhero,
        });
        const unpreventedDamageParams = unpreventedDamage.getTriggersParams({
            match,
            player,
        });
        assert.equal(await trigger.canTrigger(unpreventedDamageParams), true);
        await ability.resolveAbility(
            trigger.getAbilityParams(unpreventedDamageParams),
        );

        assert.equal(superhero.counters, 0);
        assert.equal(unpreventedDamage.preventDamage, 0);
        assert.equal(unpreventedDamage.takenDamage, 2);
    });

    test('adds two Growth counters up to ten through the Alter-Ego action', async () => {
        const {match, player, superhero} =
            await createFixture('groot-sudden-growth');
        superhero.selectedSide = 0;
        const ability = superhero.sides[0].abilities.find(({abilityType}) =>
            abilityType === ABILITY_ALTEREGO_ACTION);

        await ability.resolveAbility({match, player});

        assert.equal(superhero.counters, 2);
        assert.equal(await ability.canRun({match, player}), false);

        const capped = await createFixture('groot-sudden-growth-cap');
        capped.superhero.selectedSide = 0;
        capped.superhero.counters = 9;
        const capAbility = capped.superhero.sides[0].abilities.find(
            ({abilityType}) => abilityType === ABILITY_ALTEREGO_ACTION,
        );
        await capAbility.effect.runEffect({
            ability: capAbility,
            match: capped.match,
            player: capped.player,
        });

        assert.equal(capped.superhero.counters, 10);
    });

    test('Terreno fértil exhausts to place a Growth counter and draw one card up to ten', async () => {
        const catalog = await loadCatalog();
        const groot = catalog.heroes.find(({_id}) => _id === 'groot');
        const {match, player, superhero} =
            await createFixture('groot-fertile-ground');
        const cardsFactory = new CardsFactory({match});
        const support = cardsFactory.createGameCardFromConfig(
            groot.config.cards[5].card,
            {owner: player},
        );
        support.controller = player;
        support.refresh = async () => {};
        player.gameZone.addToGameZone(support);
        superhero.counters = 9;
        superhero.selectedSide = 1;

        const ability = support.abilities[0];
        const params = {match, player, card: support};
        assert.equal(await ability.canRun(params), false);

        superhero.selectedSide = 0;
        const firstDraw = cardsFactory.createGameCardFromConfig(
            groot.config.cards[0].card,
            {owner: player},
        );
        player.deck.addToDeck([firstDraw]);
        await ability.resolveAbility(params);

        assert.equal(superhero.counters, 10);
        assert.equal(support.exhausted, true);
        assert.deepEqual(player.hand.cards, [firstDraw]);
        assert.deepEqual(player.deck.cards, []);
        assert.equal(await ability.canRun(params), false);

        support.ready();
        const secondDraw = cardsFactory.createGameCardFromConfig(
            groot.config.cards[0].card,
            {owner: player},
        );
        player.deck.addToDeck([secondDraw]);
        await ability.resolveAbility(params);

        assert.equal(superhero.counters, 10);
        assert.deepEqual(player.hand.cards, [firstDraw, secondDraw]);
        assert.deepEqual(player.deck.cards, []);
    });

    test("Soy Groot removes threat equal to Groot's Growth counters", async () => {
        const {match, player, superhero} =
            await createFixture('groot-soy-groot-threat-removal');
        const scheme = {
            id: 'main-scheme',
            isCard: true,
            isInPlay: true,
            isMainScheme: true,
            isScheme: true,
            threat: 8,
            canRemoveThreat() {
                return this.threat > 0;
            },
            canThwart(targetPlayer) {
                return this.canRemoveThreat() && targetPlayer.isHero;
            },
            removeThreat(amount) {
                this.threat = Math.max(0, this.threat - amount);
            },
            async refresh() {},
        };
        match.scenario = {
            mainScheme: scheme,
            schemes: [scheme],
        };

        const catalog = await loadCatalog();
        const groot = catalog.heroes.find(({_id}) => _id === 'groot');
        const iAmGrootConfig = groot.config.cards[1].card;
        const iAmGrootCard = new CardsFactory({match}).createGameCardFromConfig(
            iAmGrootConfig,
            {owner: player},
        );
        const [ability] = iAmGrootCard.abilities;

        superhero.counters = 0;
        await ability.resolveAbility({match, player});
        assert.equal(scheme.threat, 8);

        superhero.counters = 3;
        await ability.resolveAbility({match, player});
        assert.equal(scheme.threat, 5);

        superhero.counters = 6;
        scheme.threat = 2;
        await ability.resolveAbility({match, player});
        assert.equal(scheme.threat, 0);
    });

    test('¡SOY… GROOT! deals damage equal to Groot’s Growth counters', async () => {
        const {match, player, superhero} =
            await createFixture('groot-soy-groot-attack');
        const catalog = await loadCatalog();
        const groot = catalog.heroes.find(({_id}) => _id === 'groot');
        const cardConfig = groot.config.cards[2].card;
        const gameCard = new CardsFactory({match}).createGameCardFromConfig(
            cardConfig,
            {owner: player},
        );
        const [ability] = gameCard.abilities;
        const enemy = {
            damage: 0,
            isEnemy: true,
            isInPlay: true,
            async getLife() {
                return 20 - this.damage;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            removeTough() {},
            async refresh() {},
        };

        superhero.counters = 4;
        ability.prepareEffect({preselectedTarget: true});
        ability.effect.selectedTarget = enemy;

        assert.ok(ability.effect instanceof DealDamageEffect);
        await ability.effect.runEffect({match, player});

        assert.equal(ability.effect.damage, 4);
        assert.equal(enemy.damage, 4);
    });

    test('Raíz aplastante places one Growth counter only when its attack defeats the enemy, up to ten', async () => {
        const {match, player, superhero} =
            await createFixture('groot-crushing-roots');
        const catalog = await loadCatalog();
        const groot = catalog.heroes.find(({_id}) => _id === 'groot');
        const cardConfig = groot.config.cards[3].card;
        const cardsFactory = new CardsFactory({match});

        const attackEnemy = hitPoints => ({
            damage: 0,
            hitPoints,
            isCharacter: true,
            isEnemy: true,
            isInPlay: true,
            isMinion: true,
            canBeAttacked() {
                return true;
            },
            async getLife() {
                return this.hitPoints - this.damage;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            async defeat() {
                this.isInPlay = false;
            },
            removeTough() {},
            async refresh() {},
        });

        const resolveAttack = async enemy => {
            const gameCard = cardsFactory.createGameCardFromConfig(
                cardConfig,
                {owner: player},
            );
            const [ability] = gameCard.abilities;
            assert.equal(Array.isArray(ability.effect), false);
            assert.equal(typeof ability.effect.canRun, 'function');
            assert.equal(typeof ability.effect.effects[0].canRun, 'function');
            assert.equal(typeof ability.effect.effects[1].canRun, 'function');
            assert.equal(
                typeof ability.effect.effects[1].effect.canRun,
                'function',
            );
            ability.prepareEffect({preselectedTarget: true});
            ability.effect.selectedTarget = enemy;

            await ability.effect.runEffect({match, player});

            return {ability, attackEffect: ability.effect.effects[0]};
        };

        const defeatedEnemy = attackEnemy(5);
        const {ability: defeatedAbility, attackEffect: defeatedAttack} =
            await resolveAttack(defeatedEnemy);
        assert.equal(defeatedAbility.isAttack, true);
        assert.equal(defeatedAttack.isAttack, true);
        assert.equal(defeatedAttack.damage, 5);
        assert.equal(defeatedAttack.defeated, true);
        assert.equal(defeatedEnemy.isInPlay, false);
        assert.equal(superhero.counters, 1);

        const survivingEnemy = attackEnemy(6);
        const {attackEffect: survivingAttack} =
            await resolveAttack(survivingEnemy);
        assert.equal(survivingAttack.damage, 5);
        assert.equal(survivingAttack.defeated, false);
        assert.equal(survivingEnemy.isInPlay, true);
        assert.equal(superhero.counters, 1);

        superhero.counters = 9;
        const cappedEnemy = attackEnemy(5);
        const {attackEffect: cappedAttack} = await resolveAttack(cappedEnemy);
        assert.equal(cappedAttack.defeated, true);
        assert.equal(superhero.counters, 10);
    });
});
