import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_AGGRESSION,
    CLASSIFICATION_BASIC,
    EFFECT_TAKE_DAMAGE,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_DECK,
    TARGET_PLAYER,
    TRAIT_ATTACK,
    TRAIT_CHAMPION,
    TRAIT_LOCATION,
    TRAIT_PREPARATION,
    TRIGGER_YOU_END_PLAY_CARD,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {Attack} from '../../src/activations/attack.js';
import {GetAttackEffect} from '../../src/effects/get-attack-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PlayCardResourceCostEffect} from '../../src/effects/play-card-resource-cost-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {ResourceCost} from '../../src/model/costs/resource-cost.js';
import {Match} from '../../src/model/match/match.js';
import {CostPaymentSession} from '../../src/utils/cost-payment-session.js';

describe('Avispa precon cards', () => {
    const createFixture = async () => {
        const catalog = await loadCatalog();
        const wasp = catalog.heroes.find(({_id}) => _id === 'wasp');
        const thor = catalog.heroes.find(({_id}) => _id === 'thor');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'wasp-precon-cards',
        });
        match.scenario = {
            villain: undefined,
            gameZone: {
                currentScheme: undefined,
                cards: [],
            },
        };
        const matchFactory = new MatchFactory(match);
        const createPlayer = (name, heroConfig, initial = false) => {
            const superhero = matchFactory.createSuperhero({
                ...heroConfig,
                cards: [],
                precon: [],
                nemesis: [],
            });
            superhero.selectedSide = 1;
            const player = match.createPlayer({name, superhero, initial});
            player.initPlayer();

            return player;
        };
        const player = createPlayer('Avispa', wasp.config, true);
        const otherPlayer = createPlayer('Thor', thor.config);

        return {
            catalog,
            match,
            matchFactory,
            otherPlayer,
            player,
        };
    };

    test('calculates excess damage from a minion attack and removes it from the main scheme', async () => {
        const {catalog, match, matchFactory, player} = await createFixture();
        const entry = catalog.aspects.find(({_id}) =>
            _id === 'aggression-entrar-en-combate');
        const event = matchFactory.cardsFactory.createGameCardFromConfig(
            entry.card,
            {index: 1, owner: player},
        );
        assert.equal(event.card.type, CARD_TYPE_EVENT);
        assert.equal(event.name, 'Entrar en combate');
        assert.equal(event.cost, 3);
        assert.deepEqual(event.resources, [RESOURCE_ENERGY]);
        assert.deepEqual(event.traits, [TRAIT_ATTACK]);
        const [ability] = event.abilities;
        const [damageEffect, threatEffect] = ability.effect.effects;
        const minion = {
            damage: 0,
            hitPoints: 2,
            isAlly: false,
            isMinion: true,
            async getLife() {
                return this.hitPoints - this.damage;
            },
        };
        const mainScheme = {
            isSideScheme: false,
            threat: 10,
            canRemoveThreat() {
                return true;
            },
            removeThreat(threat) {
                this.threat = Math.max(0, this.threat - threat);
            },
            async refresh() {},
        };
        const params = {
            effects: ability.effect.effects,
            match,
            player,
        };
        const createEffect = match.effectsFactory.createEffect.bind(
            match.effectsFactory,
        );
        match.effectsFactory.createEffect = effectConfig => {
            if (effectConfig.type === EFFECT_TAKE_DAMAGE) {
                return {
                    defeated: false,
                    takenDamage: 0,
                    async runEffect() {
                        minion.damage += effectConfig.damage;
                        this.takenDamage = effectConfig.damage;
                    },
                };
            }

            return createEffect(effectConfig);
        };

        damageEffect.selectedTarget = minion;
        await damageEffect.prepare(params);
        await damageEffect.execute(params);
        assert.equal(damageEffect.activation.excessDamage, 4);
        assert.equal(damageEffect.selectedTarget, minion);
        assert.equal(minion.damage, 6);

        threatEffect.selectedTarget = mainScheme;
        await threatEffect.prepare(params);
        await threatEffect.execute(params);
        assert.equal(mainScheme.threat, 6);
    });

    test('limits Centro de entrenamiento to the chosen controller’s allies', async () => {
        const {
            catalog,
            match,
            matchFactory,
            otherPlayer,
            player,
        } = await createFixture();
        const entry = catalog.aspects.find(({_id}) =>
            _id === 'aggression-centro-de-entrenamiento');
        const training = matchFactory.cardsFactory.createGameCardFromConfig(
            entry.card,
            {index: 1, owner: player},
        );
        assert.equal(training.card.type, CARD_TYPE_SUPPORT);
        assert.equal(training.name, 'Centro de entrenamiento');
        assert.equal(training.cost, 3);
        assert.deepEqual(training.resources, [RESOURCE_MENTAL]);
        assert.deepEqual(training.traits, [TRAIT_LOCATION]);
        assert.deepEqual(training.card.maximum, {
            count: 1,
            target: TARGET_PLAYER,
        });

        const createAlly = (controller, name, index) => {
            const ally = matchFactory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_ALLY,
                params: {
                    attack: 1,
                    hitPoints: 2,
                    name,
                },
            }, {index, owner: controller});
            ally.controller = controller;
            controller.gameZone.addToGameZone(ally);

            return ally;
        };
        const ownerAlly = createAlly(player, 'Aliado de Avispa', 1);
        const chosenControllerAlly = createAlly(
            otherPlayer,
            'Aliado de Thor',
            1,
        );
        let refreshedControllerZone;
        match.mc.mcSocket.send = (_matchName, _eventName, payload) => {
            if (payload?.cards?.some(({id}) =>
                id === chosenControllerAlly.id)) {
                refreshedControllerZone = payload;
            }
        };
        const putPlayEffect = new PutPlayEffect({
            card: training,
            controller: otherPlayer,
            match,
        });
        await putPlayEffect.runEffect({match, player});

        const getAttack = async (ally, controller) => {
            const effect = new GetAttackEffect({
                match,
                selectedTarget: ally,
            });
            await effect.runEffect({match, player: controller});

            return effect.attack;
        };

        assert.equal(await getAttack(ownerAlly, player), 1);
        assert.equal(await getAttack(chosenControllerAlly, otherPlayer), 2);
        assert.equal(
            refreshedControllerZone.cards.find(({id}) =>
                id === chosenControllerAlly.id).attack,
            2,
        );
    });

    test('uses the physical-payment bonus and doubles its wild resource for Basic cards', async () => {
        const {catalog, matchFactory, player} = await createFixture();
        const surpriseEntry = catalog.aspects.find(({_id}) =>
            _id === 'aggression-ataque-sorpresa');
        const surprise = matchFactory.cardsFactory.createGameCardFromConfig(
            surpriseEntry.card,
            {index: 1, owner: player},
        );
        assert.equal(surprise.name, 'Ataque sorpresa');
        assert.equal(surprise.cost, 1);
        assert.deepEqual(surprise.resources, [RESOURCE_PHYSICAL]);
        const [response] = surprise.abilities;
        const conditionParams = {
            playCardEffect: {resourcesPaid: [RESOURCE_PHYSICAL]},
        };

        assert.equal(response.effect.checkCondition(conditionParams), true);
        assert.equal(
            response.effect.getEffectProperty('baseDamage', conditionParams),
            4,
        );
        assert.equal(response.effect.checkCondition({
            playCardEffect: {resourcesPaid: [RESOURCE_MENTAL]},
        }), false);
        assert.equal(
            response.effect.getEffectProperty('baseDamage', {
                playCardEffect: {resourcesPaid: [RESOURCE_MENTAL]},
            }),
            3,
        );

        const resourceEntry = catalog.aspects.find(({_id}) =>
            _id === 'basic-el-poder-de-todos-unidos');
        const resource = matchFactory.cardsFactory.createGameCardFromConfig(
            resourceEntry.card,
            {index: 1, owner: player},
        );

        assert.equal(resource.card.type, CARD_TYPE_RESOURCE);
        assert.deepEqual(resource.card.maximum, {
            count: 2,
            target: TARGET_DECK,
        });
        assert.deepEqual(
            resource.card.getResources({
                card: {classification: CLASSIFICATION_BASIC},
            }),
            [RESOURCE_WILD, RESOURCE_WILD],
        );
        assert.deepEqual(
            resource.card.getResources({
                card: {classification: CLASSIFICATION_AGGRESSION},
            }),
            [RESOURCE_WILD],
        );
        assert.deepEqual(resource.card.getPrintedResources(), [RESOURCE_WILD]);
    });

    test('restricts each Power card bonus resource to a card cost', async () => {
        const {catalog, matchFactory, player} = await createFixture();
        const powerCards = [
            ['aggression-the-power-of-aggression', {set: 'aggression'}],
            ['justice-the-power-of-justice', {set: 'justice'}],
            ['protection-el-poder-de-la-proteccion', {
                classification: 'protection',
            }],
            ['leadership-el-poder-del-liderazgo', {set: 'leadership'}],
            ['basic-el-poder-de-todos-unidos', {
                classification: CLASSIFICATION_BASIC,
            }],
        ];

        powerCards.forEach(([id, paymentCard], index) => {
            const entry = catalog.aspects.find(({_id}) => _id === id);
            const resource = matchFactory.cardsFactory.createGameCardFromConfig(
                entry.card,
                {index: index + 1, owner: player},
            );
            const cardToPay = {card: paymentCard};

            assert.deepEqual(
                resource.card.getResources(cardToPay),
                [RESOURCE_WILD, RESOURCE_WILD],
                id,
            );
            assert.deepEqual(
                resource.card.getCostOnlyResourceIndexes(cardToPay),
                [1],
                id,
            );
            assert.deepEqual(
                resource.card.getCostOnlyResourceIndexes({
                    card: {classification: 'other'},
                }),
                [],
                id,
            );
        });
    });

    test('does not count a Power card bonus resource as overpayment', async () => {
        const {catalog, match, matchFactory, player} = await createFixture();
        const entry = catalog.aspects.find(({_id}) =>
            _id === 'basic-el-poder-de-todos-unidos');
        const powerResource = matchFactory.cardsFactory.createGameCardFromConfig(
            entry.card,
            {index: 1, owner: player},
        );
        const extraResource = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso físico',
                resources: [RESOURCE_PHYSICAL],
            },
        }, {index: 2, owner: player});
        const cardToPay = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_EVENT,
            params: {
                allowOverpay: true,
                classification: CLASSIFICATION_BASIC,
                cost: 1,
                name: 'Carta con sobrepago',
            },
        }, {owner: player});
        const resourceCost = new ResourceCost({
            amount: 1,
            allowOverpay: true,
            card: cardToPay,
            match,
        });
        const playCardEffect = {
            resourcesOverpaid: 0,
            resourcesPaid: [],
        };
        const paymentEffect = new PlayCardResourceCostEffect({
            match,
            playCardEffect,
            resourceCost,
        });
        const session = new CostPaymentSession();
        const resourceUnits = [
            [powerResource, 0, RESOURCE_WILD],
            [powerResource, 1, RESOURCE_WILD],
            [extraResource, 0, RESOURCE_PHYSICAL],
        ].map(([card, resourceIndex, resource]) => ({
            cardId: card.id,
            originalResource: resource,
            resource,
            resourceIndex,
            source: 'hand',
        }));

        session.stagePayment(paymentEffect, {
            cardToPay,
            generators: [],
            hand: [powerResource, extraResource],
            resourceUnits,
            resources: [
                RESOURCE_WILD,
                RESOURCE_WILD,
                RESOURCE_PHYSICAL,
            ],
        }, {card: cardToPay});

        const payment = session.getPayment(paymentEffect);

        assert.deepEqual(payment.resources, [
            RESOURCE_WILD,
            RESOURCE_PHYSICAL,
        ]);
        assert.equal(
            payment.resources.length -
                resourceCost.getRequiredResources().length -
                resourceCost.requirement.length,
            1,
        );
        assert.deepEqual(
            session.getRemainingResources().get(powerResource.id),
            [RESOURCE_WILD],
        );
    });

    test('keeps excess damage reusable when Brutality routes it', async () => {
        const {
            catalog,
            match,
            matchFactory,
            player,
        } = await createFixture();
        const entry = catalog.aspects.find(({_id}) =>
            _id === 'aggression-entrar-en-combate');
        const event = matchFactory.cardsFactory.createGameCardFromConfig(
            entry.card,
            {index: 1, owner: player},
        );
        const threatEffect = event.abilities[0].effect.effects[1];
        const minion = {
            damage: 0,
            hitPoints: 2,
            isAlly: false,
            isMinion: true,
            async getLife() {
                return this.hitPoints - this.damage;
            },
        };
        const villain = {isVillain: true};
        const damageEffect = {
            attacked: minion,
            damage: 6,
            selectedTarget: minion,
            getEffectProperty(property) {
                return this[property];
            },
            setEffectProperty(property, value) {
                this[property] = value;
            },
        };
        const attack = new Attack({effect: damageEffect});
        attack.getController = () => villain;

        await attack.applyOverkill({match, player}, damageEffect);

        assert.deepEqual(damageEffect.selectedTarget, [minion, villain]);
        assert.deepEqual(damageEffect.damage, [6, 4]);
        assert.equal(attack.excessDamage, 4);
        assert.equal(await threatEffect.calculate({
            effects: [{activation: attack}],
            match,
            player,
        }), 4);
        assert.equal(await threatEffect.calculate({
            effects: [{activation: attack}],
            match,
            player,
        }), 4);

        const attackWithoutController = new Attack({
            effect: {
                attacked: minion,
                damage: 6,
                selectedTarget: minion,
                getEffectProperty(property) {
                    return this[property];
                },
                setEffectProperty(property, value) {
                    this[property] = value;
                },
            },
        });
        attackWithoutController.getController = () => undefined;
        await attackWithoutController.applyOverkill(
            {match, player},
            attackWithoutController.effect,
        );

        assert.equal(attackWithoutController.excessDamage, 4);
    });

    test('labels Spiderman’s attack and thwart choices', async () => {
        const {catalog, matchFactory, player} = await createFixture();
        const entry = catalog.aspects.find(({_id}) =>
            _id === 'basic-spiderman-miles-morales');
        const ally = matchFactory.cardsFactory.createGameCardFromConfig(
            entry.card,
            {index: 1, owner: player},
        );
        player.hand.addCard(ally);
        const response = ally.abilities.find(({trigger}) =>
            trigger === TRIGGER_YOU_END_PLAY_CARD);

        assert.deepEqual(
            response.effect.options.map(option => option.getTitle()),
            ['ATQ +2', 'INT +2'],
        );
    });

    test('only triggers Ironheart and Spiderman responses when played from hand', async () => {
        const {catalog, match, matchFactory, player} = await createFixture();
        const deckCard = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Carta para robar',
                resources: [RESOURCE_MENTAL],
            },
        }, {owner: player});
        player.deck.addToDeck([deckCard]);

        for (const id of [
            'basic-ironheart',
            'basic-spiderman-miles-morales',
        ]) {
            const entry = catalog.aspects.find(card => card._id === id);
            const ally = matchFactory.cardsFactory.createGameCardFromConfig(
                entry.card,
                {index: 1, owner: player},
            );
            assert.equal(ally.card.type, CARD_TYPE_ALLY);
            assert.equal(ally.card.classification, CLASSIFICATION_BASIC);
            assert.deepEqual(ally.traits, [TRAIT_CHAMPION]);
            assert.equal(
                ally.cost,
                id === 'basic-ironheart' ? 2 : 3,
            );
            assert.deepEqual(
                [ally.attack, ally.thwart, ally.hitPoints],
                id === 'basic-ironheart' ? [1, 1, 2] : [2, 1, 3],
            );
            player.hand.addCard(ally);
            const playEffect = new PlayCardEffect({card: ally, match});

            await playEffect.prepare({match, player});
            assert.equal(playEffect.playedFromHand, true);
            await playEffect.doPlay({match, player});
            assert.equal(playEffect.playedFromHand, true);
            const response = ally.abilities.find(({trigger}) =>
                trigger === TRIGGER_YOU_END_PLAY_CARD);
            const responseParams = {
                card: ally,
                effect: playEffect,
                match,
                player,
            };
            assert.ok(response);
            assert.equal(
                await response.canTrigger(responseParams),
                true,
                `${id} ability`,
            );

            const notFromHand = matchFactory.cardsFactory.createGameCardFromConfig(
                entry.card,
                {index: 2, owner: player},
            );
            const playFromElsewhere = new PlayCardEffect({
                card: notFromHand,
                match,
            });
            await playFromElsewhere.prepare({match, player});
            assert.equal(playFromElsewhere.playedFromHand, false);
            assert.equal(await response.canTrigger({
                card: ally,
                effect: playFromElsewhere,
                match,
                player,
            }), false, `${id} ability`);
        }
    });

    test('Al acecho discards itself and still deals its response damage', async () => {
        const {catalog, match, matchFactory, player} = await createFixture();
        const entry = catalog.aspects.find(({_id}) =>
            _id === 'aggression-al-acecho');
        const upgrade = matchFactory.cardsFactory.createGameCardFromConfig(
            entry.card,
            {index: 1, owner: player},
        );
        assert.equal(upgrade.card.type, CARD_TYPE_UPGRADE);
        assert.equal(upgrade.name, 'Al acecho');
        assert.equal(upgrade.cost, 1);
        assert.deepEqual(upgrade.resources, [RESOURCE_ENERGY]);
        assert.deepEqual(upgrade.traits, [TRAIT_PREPARATION]);
        assert.deepEqual(upgrade.card.maximum, {
            count: 1,
            target: TARGET_PLAYER,
        });
        player.addToGameZone(upgrade);

        const deckResource = matchFactory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {
                name: 'Recurso para mantener el mazo',
                resources: [RESOURCE_MENTAL],
            },
        }, {owner: player});
        player.deck.addToDeck([deckResource]);

        const minion = {
            damage: 0,
            hitPoints: 5,
            id: 'minion-test',
            isAlly: false,
            isCard: true,
            isEnemy: true,
            isInPlay: true,
            isMinion: true,
            canBeAttacked() {
                return true;
            },
            async getLife() {
                return this.hitPoints - this.damage;
            },
        };
        const createEffect = match.effectsFactory.createEffect.bind(
            match.effectsFactory,
        );
        match.effectsFactory.createEffect = effectConfig => {
            if (effectConfig.type === EFFECT_TAKE_DAMAGE) {
                return {
                    defeated: false,
                    takenDamage: 0,
                    async runEffect() {
                        minion.damage += effectConfig.damage;
                        this.takenDamage = effectConfig.damage;
                    },
                };
            }

            return createEffect(effectConfig);
        };

        const [ability] = upgrade.abilities;
        await ability.resolveAbility({
            card: upgrade,
            match,
            player,
            preselectedTarget: true,
            selectedTarget: minion,
            triggeredCard: minion,
        });

        assert.equal(ability.resolved, true);
        assert.equal(player.gameZone.cards.includes(upgrade), false);
        assert.equal(player.deck.discardPile.includes(upgrade), true);
        assert.equal(minion.damage, 3);
    });
});
