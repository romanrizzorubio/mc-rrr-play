import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_RESPONSE,
    ABILITY_RESPONSE,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    CHARACTER_VILLAIN,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_JUSTICE,
    DIALOG_PAY_COST,
    EFFECT_CHAINED,
    EFFECT_COUNT_BOOST_ICONS,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DISCARD_FROM_DECK,
    EFFECT_DO_IF,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_ENEMY_SCHEME,
    EFFECT_DRAW_CARD,
    EFFECT_REMOVE_THREAT,
    EFFECT_READY,
    EFFECT_SELECT_DISCARD_CARD,
    LABEL_ATTACK,
    LABEL_THWART,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ENEMY,
    TARGET_MAIN_SCHEME,
    TARGET_ROUND,
    TARGET_SCHEME,
    TARGET_VILLAIN,
    TRAIT_AVENGER,
    TRAIT_MYSTIC,
    TRAIT_SPELL,
    TRIGGER_THIS_THWARTS,
    TRIGGER_YOU_ANY_THWART,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {RemoveThreatEffect} from '../../src/effects/remove-threat-effect.js';
import {PlayCardEffect} from '../../src/effects/play-card-effect.js';
import {PlayCardResourceCostEffect} from '../../src/effects/play-card-resource-cost-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Deck} from '../../src/model/match/deck.js';
import {Hand} from '../../src/model/match/hand.js';
import {PlayerCard} from '../../src/model/printed/player-card.js';
import {CostPaymentSession} from '../../src/utils/cost-payment-session.js';

const NEW_PRECON_CARDS = [
    'basic-meditacion-espiritual',
    'justice-veloz',
    'justice-wiccan',
    'justice-crisis-resuelta',
    'justice-multitarea',
    'justice-castigo-inmediato',
    'justice-cambiar-la-situacion',
];

describe('Bruja Escarlata - cartas añadidas al precon', () => {
    test('catalog data and compiled abilities match the printed cards', async () => {
        const catalog = await loadCatalog();
        const records = new Map(catalog.aspects.map(record => [
            record._id,
            record,
        ]));
        const cards = new Map(NEW_PRECON_CARDS.map(id => {
            const record = records.get(id);
            assert.ok(record, `Missing catalog card: ${id}`);

            return [id, record.card];
        }));
        const matchFactory = new MatchFactory({triggerCards: {}});

        assert.equal(records.get('justice-veloz').aspect, CLASSIFICATION_JUSTICE);
        assert.equal(records.get('justice-wiccan').aspect, CLASSIFICATION_JUSTICE);
        assert.equal(
            records.get('basic-meditacion-espiritual').classification,
            CLASSIFICATION_BASIC
        );

        const veloz = cards.get('justice-veloz');
        assert.equal(veloz.type, CARD_TYPE_ALLY);
        assert.deepEqual(veloz.params.traits, [TRAIT_AVENGER]);
        assert.equal(veloz.params.cost, 4);
        assert.equal(veloz.params.hitPoints, 4);
        assert.equal(veloz.params.attack, 1);
        assert.equal(veloz.params.thwart, 2);
        assert.deepEqual(veloz.params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(veloz.params.abilities[0].type, ABILITY_RESPONSE);
        assert.equal(
            veloz.params.abilities[0].params.trigger,
            TRIGGER_THIS_THWARTS
        );
        assert.deepEqual(veloz.params.abilities[0].params.limit, {
            count: 1,
            target: TARGET_ROUND,
        });
        assert.equal(
            veloz.params.abilities[0].params.effect.type,
            EFFECT_READY
        );

        const wiccan = cards.get('justice-wiccan');
        assert.equal(wiccan.type, CARD_TYPE_ALLY);
        assert.deepEqual(wiccan.params.traits, [TRAIT_AVENGER]);
        assert.equal(wiccan.params.cost, 2);
        assert.equal(wiccan.params.hitPoints, 3);
        assert.equal(wiccan.params.attack, 1);
        assert.equal(wiccan.params.thwart, 1);
        assert.deepEqual(wiccan.params.resources, [RESOURCE_MENTAL]);
        assert.equal(
            wiccan.params.abilities[0].params.effect.type,
            EFFECT_CHAINED
        );
        assert.equal(wiccan.params.abilities[0].params.trigger, TRIGGER_THIS_THWARTS);
        assert.deepEqual(
            wiccan.params.abilities[0].params.effect.params.effects.map(
                ({type}) => type
            ),
            [
                EFFECT_DISCARD_FROM_DECK,
                EFFECT_COUNT_BOOST_ICONS,
                EFFECT_DO_IF,
            ]
        );
        assert.equal(
            wiccan.params.abilities[0].params.effect.params.effects[1]
                .params.card,
            'effects.0.cards.0'
        );

        const crisisResuelta = cards.get('justice-crisis-resuelta');
        assert.equal(
            crisisResuelta.params.abilities[0].type,
            ABILITY_HERO_ACTION
        );
        assert.deepEqual(crisisResuelta.params.abilities[0].params.labels, [
            LABEL_THWART,
        ]);
        const crisisEffect = crisisResuelta.params.abilities[0].params.effect;
        assert.equal(crisisResuelta.type, CARD_TYPE_EVENT);
        assert.equal(crisisResuelta.params.cost, 3);
        assert.deepEqual(crisisResuelta.params.resources, [RESOURCE_MENTAL]);
        assert.equal(crisisEffect.type, EFFECT_DO_IF_HAS_PAID);
        assert.deepEqual(crisisEffect.params.resources, [RESOURCE_MENTAL]);
        assert.equal(crisisEffect.params.effect.params.ignoreCrisis, true);
        assert.equal(
            crisisEffect.params.effectNot.params.ignoreCrisis,
            undefined
        );
        assert.equal(
            crisisEffect.params.effect.params.target,
            TARGET_MAIN_SCHEME
        );
        assert.equal(crisisEffect.params.effect.params.threat, 6);

        const multitarea = cards.get('justice-multitarea');
        const multitareaAbility = multitarea.params.abilities[0];
        const multitareaChain = multitareaAbility.params.effect;
        const multitareaEffects = multitareaChain.params.effects;
        assert.equal(multitareaAbility.type, ABILITY_HERO_ACTION);
        assert.equal(multitareaChain.type, EFFECT_CHAINED);
        assert.deepEqual(multitareaAbility.params.labels, [LABEL_THWART]);
        assert.equal(multitarea.params.cost, 1);
        assert.deepEqual(multitarea.params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(multitareaEffects[0].type, EFFECT_REMOVE_THREAT);
        assert.equal(multitareaEffects[0].params.target, TARGET_SCHEME);
        assert.equal(multitareaEffects[1].type, EFFECT_DO_IF_HAS_PAID);
        assert.deepEqual(multitareaEffects[1].params.resources, [RESOURCE_MENTAL]);
        assert.deepEqual(multitareaEffects[1].params.effect.params.condition, {
            exclude: 'effects.0.selectedTarget',
        });
        assert.equal(
            multitareaEffects[1].params.effect.params.target,
            TARGET_SCHEME
        );

        const castigo = cards.get('justice-castigo-inmediato');
        assert.equal(castigo.params.abilities[0].type, ABILITY_HERO_ACTION);
        assert.deepEqual(castigo.params.abilities[0].params.labels, [
            LABEL_ATTACK,
        ]);
        assert.equal(
            castigo.params.abilities[0].params.effect.type,
            EFFECT_CHAINED
        );
        const castigoEffects = castigo.params.abilities[0]
            .params.effect.params.effects;
        assert.equal(castigo.params.cost, 1);
        assert.deepEqual(castigo.params.resources, [RESOURCE_MENTAL]);
        assert.equal(castigoEffects[0].type, EFFECT_ENEMY_SCHEME);
        assert.equal(castigoEffects[0].params.enemyType, CHARACTER_VILLAIN);
        assert.equal(castigoEffects[1].type, EFFECT_DEAL_DAMAGE);
        assert.equal(castigoEffects[1].params.target, TARGET_VILLAIN);
        assert.equal(castigoEffects[1].params.damage, 4);

        const cambiar = cards.get('justice-cambiar-la-situacion');
        const cambiarAbility = cambiar.params.abilities[0];
        assert.equal(cambiar.params.cost, 0);
        assert.deepEqual(cambiar.params.resources, [RESOURCE_ENERGY]);
        assert.equal(cambiarAbility.type, ABILITY_HERO_RESPONSE);
        assert.deepEqual(cambiarAbility.params.labels, [LABEL_ATTACK]);
        assert.equal(cambiarAbility.params.trigger, TRIGGER_YOU_ANY_THWART);
        assert.deepEqual(cambiarAbility.params.condition, {
            'effect.character.isHero': true,
            'effect.selectedTarget.threat': 0,
        });
        assert.equal(
            cambiarAbility.params.effect.params.target,
            TARGET_ENEMY
        );
        assert.equal(cambiarAbility.params.effect.params.damage, 3);

        const meditacion = cards.get('basic-meditacion-espiritual');
        assert.equal(meditacion.params.cost, 0);
        assert.deepEqual(meditacion.params.resources, [RESOURCE_MENTAL]);
        assert.deepEqual(meditacion.params.traits, [TRAIT_SPELL]);
        assert.deepEqual(meditacion.params.paramsToPlay, {
            'superhero.traits': TRAIT_MYSTIC,
        });
        assert.deepEqual(
            meditacion.params.abilities[0].params.effect.params.effects.map(
                ({type}) => type
            ),
            [EFFECT_DRAW_CARD, EFFECT_SELECT_DISCARD_CARD]
        );

        for (const id of NEW_PRECON_CARDS) {
            const card = matchFactory.cardsFactory
                .createGameCardFromConfig(cards.get(id));

            assert.ok(card.abilities.length > 0, id);
            for (const ability of card.abilities) {
                assert.equal(typeof ability.effect?.canRun, 'function', id);
            }
        }

        const meditationCard = new PlayerCard(meditacion.params);
        meditationCard.match = {isUniqueCard: () => false};
        const player = {superhero: {traits: []}};
        assert.equal(meditationCard.canPlay({player}), false);
        player.superhero.traits.push(TRAIT_MYSTIC);
        assert.equal(meditationCard.canPlay({player}), true);
    });

    test('generic target exclusions resolve multiple wildcard paths and missing values', () => {
        const createScheme = id => ({
            id,
            threat: 4,
            canRemoveThreat() {
                return this.threat > 0;
            },
        });
        const firstScheme = createScheme('first-scheme');
        const secondScheme = createScheme('second-scheme');
        const remainingScheme = createScheme('remaining-scheme');
        const match = {
            schemes: [firstScheme, secondScheme, remainingScheme],
        };
        const effect = new RemoveThreatEffect({
            condition: {
                exclude: [
                    'effects.0.attacks.*.selectedTarget',
                    'effects.0.attacks.*.defender.owner',
                ],
            },
            match,
            target: TARGET_SCHEME,
            threat: 1,
        });

        assert.deepEqual(effect.getValidTarget({
            effects: [{
                attacks: [
                    {selectedTarget: {id: firstScheme.id}},
                    {defender: {owner: {id: secondScheme.id}}},
                ],
            }],
            match,
            player: {},
        }), [remainingScheme]);
        assert.deepEqual(effect.getValidTarget({
            effects: [{attacks: []}],
            match,
            player: {},
        }), [firstScheme, secondScheme, remainingScheme]);
        assert.throws(() => new RemoveThreatEffect({
            condition: {exclude: ['']},
            target: TARGET_SCHEME,
            threat: 1,
        }), /exclude must be a path or a list of paths/);
    });

    test('Crisis resuelta is playable through Crisis and requires mental payment', async () => {
        const catalog = await loadCatalog();
        const cardConfig = catalog.aspects.find(({_id}) =>
            _id === 'justice-crisis-resuelta').card;
        const match = {
            currentRound: 1,
            dialogs: [],
            hasCrisis: true,
            isUniqueCard() {
                return false;
            },
            limits: {},
            async openDialog(dialog) {
                this.dialogs.push(dialog);
                return undefined;
            },
            players: [],
            schemes: [],
            triggerCards: {},
        };
        const mainScheme = {
            abilities: [],
            id: 'main-scheme',
            isCard: true,
            isMainScheme: true,
            isScheme: true,
            name: 'Plan principal',
            threat: 10,
            canRemoveThreat({ignoreCrisis = false} = {}) {
                return this.threat > 0 &&
                    (ignoreCrisis || !match.hasCrisis);
            },
            canThwart(_player, {ignoreCrisis = false} = {}) {
                return this.canRemoveThreat({ignoreCrisis});
            },
            toObj() {
                return {id: this.id, name: this.name};
            },
            toTargetObj() {
                return this.toObj();
            },
        };
        match.mainScheme = mainScheme;
        match.schemes.push(mainScheme);
        const matchFactory = new MatchFactory(match);
        const player = {
            id: 'player',
            isHero: true,
            isPlayer: true,
            match,
            canThwart() {
                return true;
            },
        };
        player.hand = new Hand(player);
        player.hand.refresh = async () => {};
        player.getCardsToPay = async () => ({
            generators: [],
            hand: [],
        });
        match.players.push(player);
        const card = matchFactory.cardsFactory.createGameCardFromConfig(
            cardConfig,
            {owner: player}
        );
        player.hand.addCard(card);

        const ability = card.abilities[0];
        const playabilityEffect = new PlayCardEffect({
            ability,
            card,
            match,
        });
        assert.deepEqual(await ability.effect.getRequiredPaymentResources({
            ability,
            card,
            match,
            player,
        }), [RESOURCE_MENTAL]);
        assert.equal(await ability.effect.canRun({
            ability,
            card,
            match,
            playCardEffect: playabilityEffect,
            player,
        }), true);
        assert.equal(await ability.canRun({
            card,
            match,
            playCardEffect: playabilityEffect,
            player,
        }), true);
        assert.equal(await card.canPlay({
            abilityType: ABILITY_ACTION,
            checkOnly: true,
            checkPlayRestrictions: true,
            playCardEffect: playabilityEffect,
            player,
        }), true);
        const playableHand = await player.hand.toObjWithPlayability();
        const playableCard = playableHand.find(({id}) => id === card.id);
        assert.equal(playableCard.playable, true);
        assert.deepEqual(playableCard.playableTargetIds, [mainScheme.id]);

        const playTargets = await player.hand.getPlayTargets(card);
        assert.deepEqual(playTargets.playableTargetIds, [mainScheme.id]);

        const cancelledPlay = new PlayCardEffect({
            abilityType: ABILITY_ACTION,
            card,
            match,
        });
        assert.equal(await cancelledPlay.canRun({player}), true);
        await cancelledPlay.runEffect({card, player});

        assert.deepEqual(match.dialogs.map(({dialogType}) => dialogType), [
            DIALOG_PAY_COST,
        ]);
        assert.deepEqual(match.dialogs[0].data.requirement, [RESOURCE_MENTAL]);
        assert.equal(cancelledPlay.paymentCancelled, true);
        assert.deepEqual(cancelledPlay.resourcesPaid, []);
        assert.equal(player.hand.cards.includes(card), true);

        const playCardEffect = new PlayCardEffect({
            ability,
            card,
            match,
        });
        playCardEffect.getCost = async () => card.cost;
        const crisisCost = await playCardEffect.getResourceCost({
            match,
            player,
        });
        assert.deepEqual(crisisCost.requirement, [RESOURCE_MENTAL]);

        const paymentEffect = new PlayCardResourceCostEffect({
            match,
            playCardEffect,
            resourceCost: crisisCost,
        });
        const mentalPaymentCard = {
            id: 'mental-payment-card',
            resources: [
                RESOURCE_MENTAL,
                RESOURCE_PHYSICAL,
                RESOURCE_PHYSICAL,
            ],
        };
        const paymentSession = new CostPaymentSession();
        paymentSession.stagePayment(paymentEffect, {
            generators: [],
            hand: [mentalPaymentCard],
            resources: [
                RESOURCE_MENTAL,
                RESOURCE_PHYSICAL,
                RESOURCE_PHYSICAL,
            ],
        }, {card});
        assert.deepEqual(
            paymentSession.getPayment(paymentEffect).resources,
            [RESOURCE_MENTAL, RESOURCE_PHYSICAL, RESOURCE_PHYSICAL]
        );

        const invalidPaymentSession = new CostPaymentSession();
        assert.throws(() => invalidPaymentSession.stagePayment(
            paymentEffect,
            {
                generators: [],
                hand: [{
                    id: 'physical-payment-card',
                    resources: [
                        RESOURCE_PHYSICAL,
                        RESOURCE_PHYSICAL,
                        RESOURCE_PHYSICAL,
                    ],
                }],
                resources: [
                    RESOURCE_PHYSICAL,
                    RESOURCE_PHYSICAL,
                    RESOURCE_PHYSICAL,
                ],
            },
            {card}
        ), /El pago no satisface los requisitos de recursos/);

        match.hasCrisis = false;
        const normalCost = await playCardEffect.getResourceCost({
            match,
            player,
        });
        assert.deepEqual(normalCost.requirement, []);
    });

    test('Wiccan counts the discarded encounter card and damages an enemy by that count', async () => {
        const catalog = await loadCatalog();
        const wiccanConfig = catalog.aspects.find(({_id}) =>
            _id === 'justice-wiccan').card;
        const enemy = {
            damage: 0,
            hitPoints: 20,
            id: 'enemy',
            isCharacter: true,
            isEnemy: true,
            name: 'Enemigo de prueba',
            async getLife() {
                return this.hitPoints - this.damage;
            },
            async placeDamage(amount) {
                this.damage += amount;
            },
            async refresh() {},
            toObj() {
                return {id: this.id, name: this.name};
            },
            toTargetObj() {
                return this.toObj();
            },
        };
        const scenario = {};
        const encounterDeck = new Deck({
            isScenarioDeck: true,
            owner: scenario,
        });
        const encounterCard = {
            boost: 2,
            id: 'encounter-1',
            name: 'Carta de Encuentro',
            toObj() {
                return {
                    boost: this.boost,
                    id: this.id,
                    name: this.name,
                };
            },
        };
        const nextEncounterCard = {
            boost: 0,
            id: 'encounter-2',
            name: 'Siguiente carta de Encuentro',
            toObj() {
                return {
                    boost: this.boost,
                    id: this.id,
                    name: this.name,
                };
            },
        };
        encounterDeck.cards = [encounterCard, nextEncounterCard];
        encounterDeck.refresh = async () => {};
        scenario.deck = encounterDeck;
        const dialogs = [];
        const match = {
            enemies: [enemy],
            triggerCards: {},
            scenario,
            async openDialog(dialog) {
                dialogs.push(dialog);
            },
        };
        scenario.match = match;
        const matchFactory = new MatchFactory(match);
        const wiccan = matchFactory.cardsFactory
            .createGameCardFromConfig(wiccanConfig);
        const wiccanAbility = wiccan.abilities.find(({effect}) =>
            effect.effectType === EFFECT_CHAINED);
        const player = {
            hand: {cards: []},
            id: 'player',
            isPlayer: true,
        };

        assert.ok(wiccanAbility);
        await wiccanAbility.effect.runEffect({
            card: wiccan,
            match,
            player,
        });

        assert.deepEqual(encounterDeck.cards, [nextEncounterCard]);
        assert.deepEqual(encounterDeck.discardPile, [encounterCard]);
        assert.equal(enemy.damage, 2);
        assert.equal(dialogs.length, 1);
    });

    test('Multitarea selects a scheme different from the first one when paid mentally', async () => {
        const catalog = await loadCatalog();
        const multitareaConfig = catalog.aspects.find(({_id}) =>
            _id === 'justice-multitarea').card;
        const createScheme = id => ({
            id,
            isCard: true,
            isScheme: true,
            isSideScheme: true,
            name: id,
            threat: 5,
            canRemoveThreat() {
                return this.threat > 0;
            },
            canThwart(player) {
                return this.threat > 0 && player.canThwart();
            },
            removeThreat(amount) {
                this.threat = Math.max(0, this.threat - amount);
            },
            refresh() {},
            toObj() {
                return {
                    id: this.id,
                    name: this.name,
                    threat: this.threat,
                };
            },
            toTargetObj() {
                return this.toObj();
            },
        });
        const firstScheme = createScheme('first-scheme');
        const secondScheme = createScheme('second-scheme');
        const match = {
            currentRound: 1,
            limits: {},
            players: [],
            schemes: [firstScheme, secondScheme],
            triggerCards: {},
        };
        const matchFactory = new MatchFactory(match);
        const card = matchFactory.cardsFactory
            .createGameCardFromConfig(multitareaConfig);
        const chain = card.abilities[0].effect;
        const [firstRemoval, paymentGate] = chain.effects;
        const secondRemoval = paymentGate.effect;
        const player = {
            id: 'player',
            isPlayer: true,
            canThwart() {
                return true;
            },
        };
        chain.selectedTarget = null;
        firstRemoval.selectedTarget = firstScheme;
        const params = chain.getEffectParams({
            match,
            player,
            playCardEffect: {
                resourcesPaid: [RESOURCE_MENTAL],
            },
        });

        assert.equal(paymentGate.checkCondition(params), true);
        await firstRemoval.execute(params);
        assert.deepEqual(secondRemoval.getValidTarget(params), [secondScheme]);
        secondRemoval.selectedTarget = secondScheme;
        await secondRemoval.execute(params);

        assert.equal(firstScheme.threat, 3);
        assert.equal(secondScheme.threat, 3);
    });
});
