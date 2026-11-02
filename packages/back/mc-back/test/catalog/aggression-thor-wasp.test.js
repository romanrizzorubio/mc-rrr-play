import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    ABILITY_INTERRUPT,
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    CARD_TYPE_RESOURCE,
    CALC_COUNT,
    CALC_COUNTERS,
    CLASSIFICATION_AGGRESSION,
    DIALOG_DISCARD_ORDER,
    DIALOG_PAY_COST,
    DIALOG_USE_CARD,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_PLACE_COUNTERS,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_THIS,
    TARGET_VILLAIN,
    TRAIT_AERIAL,
    TRAIT_ASGARD,
    TRAIT_AVENGER,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_CHARACTER_GET_HIT_POINTS,
    TRIGGER_YOU_END_PLAY_CARD,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {DoIfHasPaidEffect} from '../../src/effects/do-if-has-paid-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

describe('Thor and Avispa (Aggression allies)', () => {
    const createOverpayWaspFixture = async (
        name,
        resourceTypes,
        {resourceCardId} = {},
    ) => {
        const catalog = await loadCatalog();
        const hero = catalog.heroes.find(({_id}) => _id === 'wasp');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'aggression-wasp');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name,
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero({
            ...hero.config,
            cards: [],
            precon: [],
            nemesis: [],
            obligation: undefined,
        });
        const player = match.createPlayer({
            name: 'Avispa',
            superhero,
            initial: true,
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.hand.refresh = async () => {};
        player.deck = {
            cards: [],
            discardPile: [],
            async discard(card) {
                this.discardPile.push(card);
            },
            async refresh() {},
        };

        const wasp = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        wasp.refresh = async () => {};
        player.hand.addCard(wasp);

        const resourceEntry = resourceCardId &&
            catalog.aspects.find(({_id}) => _id === resourceCardId);
        const resources = resourceEntry ?
            [matchFactory.cardsFactory.createGameCardFromConfig(
                resourceEntry.card,
                {index: 1, owner: player},
            )] :
            resourceTypes.map((resource, index) =>
                matchFactory.cardsFactory.createGameCardFromConfig({
                    type: CARD_TYPE_RESOURCE,
                    params: {
                        name: `Recurso de prueba ${index + 1}`,
                        resources: [resource],
                    },
                }, {
                    index: index + 1,
                    owner: player,
                }));
        resources.forEach(resource => player.hand.addCard(resource));

        let paymentDialog;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: wasp.id}};
            }
            if (dialog.dialogType === DIALOG_PAY_COST) {
                paymentDialog = dialog;
                return {
                    paid: {
                        generators: [],
                        hand: resources.map(({id}) => ({id})),
                    },
                    resources: resourceTypes.map(resource =>
                        resource === RESOURCE_WILD &&
                        dialog.data.exclusiveResourcePreferences.includes(
                            RESOURCE_ENERGY) ?
                            RESOURCE_ENERGY :
                            resource),
                    resourceUnits: dialog.data.cards.hand.flatMap(card =>
                        card.resources.map((originalResource, resourceIndex) => ({
                            cardId: card.id,
                            originalResource,
                            resource: originalResource === RESOURCE_WILD &&
                                dialog.data.exclusiveResourcePreferences.includes(
                                    RESOURCE_ENERGY) ?
                                RESOURCE_ENERGY :
                                originalResource,
                            resourceIndex,
                            source: 'hand',
                        }))),
                };
            }
            if (dialog.dialogType === DIALOG_DISCARD_ORDER) {
                return {
                    selected: resources.map(({id}) => ({id})),
                };
            }

            throw new Error(`Unexpected dialog: ${dialog.dialogType}`);
        };

        const playEffect = new PlayCardEffect({card: wasp, match});
        await playEffect.runEffect({match, player});

        return {wasp, player, playEffect, paymentDialog};
    };

    const createThorFixture = async (
        name,
        resourceTypes,
        {putIntoPlay = false} = {},
    ) => {
        const catalog = await loadCatalog();
        const hero = catalog.heroes.find(({_id}) => _id === 'wasp');
        const definition = catalog.aspects.find(({_id}) =>
            _id === 'aggression-thor');
        const match = new Match({
            name,
            mc: {mcSocket: {send() {}}},
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.skipDiscardOrderDialog = true;
        const matchFactory = new MatchFactory(match);
        const player = match.createPlayer({
            name: 'Avispa',
            initial: true,
            superhero: matchFactory.createSuperhero({
                ...hero.config,
                cards: [],
                precon: [],
                nemesis: [],
                obligation: undefined,
            }),
        });
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        player.hand.refresh = async () => {};
        player.deck = {
            cards: [],
            discardPile: [],
            async discard(card) {
                this.discardPile.push(card);
            },
            async refresh() {},
        };
        player.superhero.selectedSide = 1;
        match.currentPlayer = player;
        match.currentTurnPlayer = player;
        match.phase = 'players';
        match.playing = true;
        match.openDialog = async () => ({});
        const rhinoConfig = structuredClone(rhino.config);
        match.scenario = await matchFactory.createScenario({
            ...rhinoConfig,
            sets: [],
            defaultSets: [],
            cards: [],
        });
        await match.scenario.initScenario([], false);

        const thor = matchFactory.cardsFactory.createGameCardFromConfig(
            definition.card,
            {owner: player},
        );
        if (!putIntoPlay) {
            player.hand.addCard(thor);
        }

        const resources = resourceTypes.map((resource, index) =>
            matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_RESOURCE,
                params: {
                    name: `Recurso de prueba ${index + 1}`,
                    resources: [resource],
                },
            }, {
                index: index + 1,
                owner: player,
            }));
        resources.forEach(resource => player.hand.addCard(resource));
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                const offeredThor = dialog.data.cards.find(({id}) => id === thor.id);
                if (!offeredThor) {
                    throw new Error('Thor was not offered for its play response.');
                }

                return {selected: {id: offeredThor.id}};
            }
            if (dialog.dialogType === DIALOG_PAY_COST) {
                return {
                    paid: {
                        generators: [],
                        hand: resources.map(({id}) => ({id})),
                    },
                    resources: resourceTypes,
                };
            }

            throw new Error(`Unexpected dialog: ${dialog.dialogType}`);
        };

        let playEffect;
        if (putIntoPlay) {
            await new PutPlayEffect({
                card: thor,
                controller: player,
                match,
            }).runEffect({match, player});
        } else {
            playEffect = new PlayCardEffect({card: thor, match});
            await playEffect.runEffect({match, player});
        }

        return {definition, match, matchFactory, player, thor, playEffect};
    };

    test('registers both shared allies in Wasp’s Aggression precon with their printed data', async () => {
        const catalog = await loadCatalog();
        const waspHero = catalog.heroes.find(({_id}) => _id === 'wasp');
        const thor = catalog.aspects.find(({_id}) => _id === 'aggression-thor');
        const wasp = catalog.aspects.find(({_id}) => _id === 'aggression-wasp');
        const aggression = waspHero.config.precon.find(({aspect}) =>
            aspect === CLASSIFICATION_AGGRESSION);

        assert.ok(aggression);
        assert.deepEqual(
            aggression.cardRefs.filter(({id}) =>
                ['aggression-thor', 'aggression-wasp'].includes(id)),
            [
                {id: 'aggression-thor', count: 1},
                {id: 'aggression-wasp', count: 1},
            ],
        );

        assert.equal(thor.card.type, CARD_TYPE_ALLY);
        assert.deepEqual({
            name: thor.card.params.name,
            subtitle: thor.card.params.subtitle,
            image: thor.card.params.image,
            traits: thor.card.params.traits,
            unique: thor.card.params.unique,
            cost: thor.card.params.cost,
            hitPoints: thor.card.params.hitPoints,
            attack: thor.card.params.attack,
            attackConsequential: thor.card.params.attackConsequential,
            thwart: thor.card.params.thwart,
            thwartConsequential: thor.card.params.thwartConsequential,
            resources: thor.card.params.resources,
            classification: thor.card.params.classification,
        }, {
            name: 'Thor',
            subtitle: 'Jane Foster',
            image: 'aspect/aggression/allies/13011.png',
            traits: [TRAIT_ASGARD, TRAIT_AVENGER],
            unique: true,
            cost: 4,
            hitPoints: 4,
            attack: 2,
            attackConsequential: 1,
            thwart: 1,
            thwartConsequential: 1,
            resources: [RESOURCE_ENERGY],
            classification: CLASSIFICATION_AGGRESSION,
        });

        const thorResponse = thor.card.params.abilities[0];
        assert.equal(thorResponse.type, ABILITY_RESPONSE);
        assert.equal(thorResponse.params.trigger, TRIGGER_YOU_END_PLAY_CARD);
        assert.deepEqual(thorResponse.params.condition, {
            'effect.card.name': 'Thor',
        });
        assert.equal(thorResponse.params.effect.type, EFFECT_DO_IF);
        assert.deepEqual(thorResponse.params.effect.params.condition, {
            'triggeredEffect.resourcesPaid': RESOURCE_PHYSICAL,
        });
        assert.deepEqual(
            [
                thorResponse.params.effect.params.effect.params.damage,
                thorResponse.params.effect.params.effectNot.params.damage,
            ],
            [3, 2],
        );
        assert.deepEqual(
            [
                thorResponse.params.effect.params.effect.params.target,
                thorResponse.params.effect.params.effectNot.params.target,
            ],
            [TARGET_VILLAIN, TARGET_VILLAIN],
        );
        assert.deepEqual(
            [
                thorResponse.params.effect.params.effect.type,
                thorResponse.params.effect.params.effectNot.type,
            ],
            [EFFECT_DEAL_DAMAGE, EFFECT_DEAL_DAMAGE],
        );

        assert.equal(wasp.card.type, CARD_TYPE_ALLY);
        assert.deepEqual({
            name: wasp.card.params.name,
            subtitle: wasp.card.params.subtitle,
            image: wasp.card.params.image,
            traits: wasp.card.params.traits,
            unique: wasp.card.params.unique,
            cost: wasp.card.params.cost,
            allowOverpay: wasp.card.params.allowOverpay,
            hitPoints: wasp.card.params.hitPoints,
            attack: wasp.card.params.attack,
            attackConsequential: wasp.card.params.attackConsequential,
            thwart: wasp.card.params.thwart,
            thwartConsequential: wasp.card.params.thwartConsequential,
            resources: wasp.card.params.resources,
            classification: wasp.card.params.classification,
        }, {
            name: 'Avispa',
            subtitle: 'Janet Van Dyne',
            image: 'aspect/aggression/allies/13012.png',
            traits: [TRAIT_AERIAL, TRAIT_AVENGER],
            unique: true,
            cost: 0,
            allowOverpay: true,
            hitPoints: 0,
            attack: 3,
            attackConsequential: 1,
            thwart: 1,
            thwartConsequential: 1,
            resources: [RESOURCE_MENTAL],
            classification: CLASSIFICATION_AGGRESSION,
        });

        const [healthAbility, pymAbility] = wasp.card.params.abilities;
        assert.equal(healthAbility.type, ABILITY_CONSTANT);
        assert.equal(healthAbility.params.trigger, TRIGGER_CHARACTER_GET_HIT_POINTS);
        assert.equal(healthAbility.params.effect.type, EFFECT_MODIFY_HIT_POINTS);
        assert.deepEqual(healthAbility.params.effect.params, {
            target: TARGET_THIS,
            paramsCalc: {
                target: 'effect.ability.card',
                formula: CALC_COUNTERS,
            },
        });
        assert.equal(pymAbility.type, ABILITY_INTERRUPT);
        assert.equal(pymAbility.params.trigger, TRIGGER_CARD_ENTER_PLAY);
        assert.equal(pymAbility.params.workInHand, true);
        assert.deepEqual(pymAbility.params.condition, {
            'playCardEffect.resourcesOverpaid': '>0',
            'playCardEffect.resourcesPaid': RESOURCE_ENERGY,
        });
        assert.deepEqual(pymAbility.params.effect, {
            type: EFFECT_DO_IF_HAS_PAID,
            params: {
                resources: [RESOURCE_ENERGY],
                effect: {
                    type: EFFECT_PLACE_COUNTERS,
                    params: {
                        target: TARGET_THIS,
                        maxCounters: 3,
                        paramsCalc: {
                            target: 'playCardEffect.resourcesPaid',
                            formula: CALC_COUNT,
                            conditions: RESOURCE_ENERGY,
                        },
                    },
                },
            },
        });

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'aggression-thor-wasp-compile',
        });
        const matchFactory = new MatchFactory(match);
        [thor, wasp].forEach(({card}) => {
            const gameCard = matchFactory.cardsFactory.createGameCardFromConfig(card);
            gameCard.abilities.forEach(ability => {
                assert.equal(typeof ability.effect.canRun, 'function');
            });
        });
    });

    test('keeps wild conversion non-exclusive when payment bonuses prefer different resources', () => {
        const cardAbilities = [RESOURCE_ENERGY, RESOURCE_PHYSICAL].map(resource => ({
            trigger: TRIGGER_CARD_ENTER_PLAY,
            effect: new DoIfHasPaidEffect({
                match: {},
                resources: [resource],
            }),
        }));
        const effect = new PlayCardEffect({
            card: {
                currentSide: {abilities: cardAbilities},
            },
            match: {},
        });

        assert.deepEqual(
            effect.getPaymentResourcePreferences(),
            [RESOURCE_ENERGY, RESOURCE_PHYSICAL],
        );
        assert.deepEqual(effect.getExclusivePaymentResourcePreferences(), []);
    });

    test('Thor deals 3 damage when a physical resource paid for him, otherwise 2', async () => {
        for (const [name, resourceTypes, expectedDamage] of [
            [
                'aggression-thor-physical-payment',
                [RESOURCE_PHYSICAL, RESOURCE_MENTAL, RESOURCE_ENERGY, RESOURCE_MENTAL],
                3,
            ],
            [
                'aggression-thor-no-physical-payment',
                [RESOURCE_MENTAL, RESOURCE_ENERGY, RESOURCE_MENTAL, RESOURCE_ENERGY],
                2,
            ],
        ]) {
            const {match, thor, playEffect} = await createThorFixture(name, resourceTypes);
            const villain = match.villain;

            assert.equal(playEffect.played, true);
            assert.equal(thor.isInPlay, true);
            assert.equal(villain.damage, expectedDamage);
        }
    });

    test('Thor does not respond when he is put into play instead of played', async () => {
        const {match, thor} = await createThorFixture(
            'aggression-thor-put-into-play',
            [],
            {putIntoPlay: true},
        );

        assert.equal(thor.isInPlay, true);
        assert.equal(match.villain.damage, 0);
    });

    test('Wasp gains hit points from only paid energy icons and caps Pym counters at three', async () => {
        for (const [name, resourceTypes, expectedCounters] of [
            [
                'aggression-wasp-energy-overpay',
                [RESOURCE_ENERGY, RESOURCE_PHYSICAL, RESOURCE_MENTAL],
                1,
            ],
            [
                'aggression-wasp-no-energy-overpay',
                [RESOURCE_PHYSICAL, RESOURCE_MENTAL],
                0,
            ],
            [
                'aggression-wasp-capped-energy-overpay',
                Array(4).fill(RESOURCE_ENERGY),
                3,
            ],
            [
                'aggression-wasp-wild-converts-to-energy',
                [RESOURCE_WILD],
                1,
            ],
            [
                'aggression-wasp-converts-all-wilds-even-after-energy',
                [
                    RESOURCE_ENERGY,
                    RESOURCE_PHYSICAL,
                    RESOURCE_WILD,
                    RESOURCE_WILD,
                ],
                3,
            ],
        ]) {
            const {
                wasp,
                playEffect,
                player,
                paymentDialog,
            } = await createOverpayWaspFixture(
                name,
                resourceTypes,
            );

            assert.equal(playEffect.played, true);
            assert.equal(wasp.counters ?? 0, expectedCounters);
            assert.equal(await wasp.getHitPoints({player}), expectedCounters);
            assert.equal(wasp.isInPlay, expectedCounters > 0);
            assert.deepEqual(paymentDialog.data.resourcePreferences, [RESOURCE_ENERGY]);
            assert.deepEqual(
                paymentDialog.data.exclusiveResourcePreferences,
                [RESOURCE_ENERGY],
            );
            if (resourceTypes.includes(RESOURCE_WILD)) {
                assert.deepEqual(
                    playEffect.resourcesPaid,
                    resourceTypes.map(resource =>
                        resource === RESOURCE_WILD ?
                            RESOURCE_ENERGY :
                            resource),
                );
            }
        }
    });

    test('Power of Aggression only contributes its printed icon to Wasp overpayment', async () => {
        const {
            wasp,
            playEffect,
            paymentDialog,
        } = await createOverpayWaspFixture(
            'aggression-wasp-power-overpayment',
            [RESOURCE_WILD, RESOURCE_WILD],
            {resourceCardId: 'aggression-the-power-of-aggression'},
        );

        assert.deepEqual(
            paymentDialog.data.cards.hand[0].resources,
            [RESOURCE_WILD, RESOURCE_WILD],
        );
        assert.deepEqual(
            paymentDialog.data.cards.hand[0].costOnlyResourceIndexes,
            [1],
        );
        assert.deepEqual(playEffect.resourcesPaid, [RESOURCE_ENERGY]);
        assert.equal(playEffect.resourcesOverpaid, 1);
        assert.equal(wasp.counters, 1);
    });
});
