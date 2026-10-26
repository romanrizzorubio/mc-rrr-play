import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ALTEREGO_ACTION,
    ABILITY_ALTEREGO_RESOURCE,
    ABILITY_CONSTANT,
    ABILITY_FORCED_INTERRUPT,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_HERO_INTERRUPT,
    CALC_ATTACK,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_SUPPORT,
    CARD_TYPE_UPGRADE,
    DIALOG_DISCARD_HAND,
    DIALOG_SELECT_TARGET,
    EFFECT_ADD_KEYWORD,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DRAW_CARD,
    EFFECT_DO_IF_HAS_PAID,
    EFFECT_DISCARD_GAME,
    EFFECT_MODIFY_ATTACK,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_HIT_POINTS,
    EFFECT_MODIFY_RECOVERY_VALUE,
    EFFECT_EXHAUST,
    EFFECT_READY,
    EFFECT_REMOVE_THREAT,
    EFFECT_TAKE_DAMAGE,
    LABEL_ATTACK,
    LABEL_THWART,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_ALL_CHARACTERS,
    TARGET_ENEMY,
    TARGET_EFFECT,
    TARGET_ROUND,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_YOU,
    TARGET_YOUR_HERO,
    TARGET_YOUR_SUPERHERO,
    TRAIT_AVENGER,
    TRAIT_CONDITION,
    TRAIT_GAMMA,
    TRAIT_GENIUS,
    TRAIT_LOCATION,
    TRAIT_SCIENTIST,
    TRAIT_SUPERPOWER,
    TRAIT_THWART,
    TRIGGER_PLAYER_TURN_END,
    TRIGGER_CARD_ENTER_PLAY,
    TRIGGER_SUPERHERO_FLIPS,
    TRIGGER_YOUR_ALTEREGO_GET_RECOVERY,
    TRIGGER_YOUR_HERO_GET_ATTACK,
    TRIGGER_YOUR_HERO_GET_HIT_POINTS,
    TRIGGER_YOU_BASIC_ATTACK,
} from 'mc-shared';
import {EVENTS} from 'mc-endpoints';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {FlipEffect} from '../../src/effects/flip-effect.js';
import {PutPlayEffect} from '../../src/effects/put-play-effect.js';
import {PlayTurnEffect} from '../../src/effects/play-turn-effect.js';
import {Deck} from '../../src/model/match/deck.js';
import {Match} from '../../src/model/match/match.js';
import {PlayerZone} from '../../src/model/match/player-zone.js';

const createCard = id => ({
    id,
    isEvent: false,
    name: id,
    toObj() {
        return {id, name: this.name};
    },
});

const createMatch = (name, mcSocket = {send() {}}) => new Match({
    mc: {mcSocket},
    name,
});

describe('Hulk card tests', () => {
    test('Hulk identities, fixed card, and precon references match the supplied cards', async () => {
        const {aspects, heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');

        assert.ok(hulk);
        assert.equal(hulk.config.obligation.count, 1);
        assert.equal(hulk.config.obligation.card.params.name, 'Demonios interiores');
        assert.equal(hulk.config.obligation.card.params.boost, 3);
        assert.deepEqual(
            hulk.config.nemesis.map(({card}) => card.params.name),
            ['Abominación', 'Destrucción total', 'Duelo de titanes']
        );
        assert.equal(hulk.config.cards.length, 9);
        const [
            crushingBlow,
            hulkSmash,
            suborbitalLeap,
            thunderclap,
            unstoppableForce,
            limitlessStrength,
            bannerLaboratory,
            unleashedFury,
            immovableObject,
        ] =
            hulk.config.cards;
        assert.equal(crushingBlow.count, 2);
        assert.equal(crushingBlow.card.type, CARD_TYPE_EVENT);
        assert.equal(crushingBlow.card.params.name, 'Golpe aplastante');
        assert.equal(crushingBlow.card.params.set, 'Hulk');
        assert.equal(crushingBlow.card.params.image, 'heroes/hulk/10002.png');
        assert.equal(crushingBlow.card.params.cost, 1);
        assert.deepEqual(crushingBlow.card.params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(
            crushingBlow.card.params.resourceType,
            RESOURCE_PHYSICAL
        );
        assert.equal(
            Object.hasOwn(crushingBlow.card.params, 'requirement'),
            false
        );
        assert.equal(
            crushingBlow.card.params.abilities[0].type,
            ABILITY_HERO_ACTION
        );
        assert.deepEqual(
            crushingBlow.card.params.abilities[0].params.labels,
            [LABEL_ATTACK]
        );
        assert.deepEqual(
            crushingBlow.card.params.abilities[0].params.effect,
            {
                type: EFFECT_DEAL_DAMAGE,
                params: {
                    target: TARGET_ENEMY,
                    paramsCalc: {
                        target: 'player.superhero.currentSide',
                        formula: CALC_ATTACK,
                    },
                },
            }
        );

        assert.equal(hulkSmash.count, 2);
        assert.equal(hulkSmash.card.type, CARD_TYPE_EVENT);
        assert.equal(hulkSmash.card.params.name, 'Hulk aplasta');
        assert.equal(hulkSmash.card.params.set, 'Hulk');
        assert.equal(hulkSmash.card.params.image, 'heroes/hulk/10003.png');
        assert.deepEqual(hulkSmash.card.params.traits, [TRAIT_SUPERPOWER]);
        assert.equal(hulkSmash.card.params.cost, 3);
        assert.deepEqual(hulkSmash.card.params.resources, [RESOURCE_PHYSICAL]);
        const [hulkSmashAbility] = hulkSmash.card.params.abilities;
        assert.equal(hulkSmashAbility.type, ABILITY_HERO_INTERRUPT);
        assert.equal(
            hulkSmashAbility.params.trigger,
            TRIGGER_YOU_BASIC_ATTACK
        );
        assert.deepEqual(hulkSmashAbility.params.effect, {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_MODIFY_ATTACK_VALUE,
                        params: {
                            target: TARGET_EFFECT,
                            count: 10,
                        },
                    },
                    {
                        type: EFFECT_DO_IF_HAS_PAID,
                        params: {
                            resources: [RESOURCE_PHYSICAL],
                            exclusive: true,
                            effect: {
                                type: EFFECT_MODIFY_ATTACK,
                                params: {
                                    target: TARGET_EFFECT,
                                    modify: {
                                        keywords: {overkill: true},
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        });

        assert.equal(suborbitalLeap.count, 2);
        assert.equal(suborbitalLeap.card.type, CARD_TYPE_EVENT);
        assert.equal(suborbitalLeap.card.params.name, 'Salto suborbital');
        assert.equal(suborbitalLeap.card.params.set, 'Hulk');
        assert.equal(suborbitalLeap.card.params.image, 'heroes/hulk/10004.png');
        assert.deepEqual(suborbitalLeap.card.params.traits, [
            TRAIT_SUPERPOWER,
            TRAIT_THWART,
        ]);
        assert.equal(suborbitalLeap.card.params.cost, 3);
        assert.deepEqual(suborbitalLeap.card.params.resources, [RESOURCE_PHYSICAL]);
        const [suborbitalLeapAbility] = suborbitalLeap.card.params.abilities;
        assert.equal(suborbitalLeapAbility.type, ABILITY_HERO_ACTION);
        assert.deepEqual(suborbitalLeapAbility.params.labels, [LABEL_THWART]);
        assert.deepEqual(suborbitalLeapAbility.params.effect, {
            type: EFFECT_DO_IF_HAS_PAID,
            params: {
                target: TARGET_SCHEME,
                resources: [RESOURCE_PHYSICAL],
                exclusive: true,
                effect: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {
                        target: TARGET_SCHEME,
                        threat: 5,
                    },
                },
                effectNot: {
                    type: EFFECT_REMOVE_THREAT,
                    params: {
                        target: TARGET_SCHEME,
                        threat: 3,
                    },
                },
            },
        });

        assert.equal(thunderclap.count, 2);
        assert.equal(thunderclap.card.type, CARD_TYPE_EVENT);
        assert.equal(thunderclap.card.params.name, 'Palmada atronadora');
        assert.equal(thunderclap.card.params.set, 'Hulk');
        assert.equal(thunderclap.card.params.image, 'heroes/hulk/10005.png');
        assert.deepEqual(thunderclap.card.params.traits, [TRAIT_SUPERPOWER]);
        assert.equal(thunderclap.card.params.cost, 3);
        assert.deepEqual(thunderclap.card.params.resources, [RESOURCE_PHYSICAL]);
        const [thunderclapAbility] = thunderclap.card.params.abilities;
        assert.equal(thunderclapAbility.type, ABILITY_HERO_ACTION);
        assert.deepEqual(thunderclapAbility.params.effect, {
            type: EFFECT_DEAL_DAMAGE,
            params: {
                target: TARGET_ENEMY,
                damage: 3,
                selectCount: 3,
                selectUpTo: true,
                multipleTarget: true,
            },
        });

        assert.equal(unstoppableForce.count, 2);
        assert.equal(unstoppableForce.card.type, CARD_TYPE_EVENT);
        assert.equal(unstoppableForce.card.params.name, 'Fuerza imparable');
        assert.equal(unstoppableForce.card.params.set, 'Hulk');
        assert.equal(
            unstoppableForce.card.params.image,
            'heroes/hulk/10006.png'
        );
        assert.equal(unstoppableForce.card.params.cost, 2);
        assert.deepEqual(
            unstoppableForce.card.params.resources,
            [RESOURCE_PHYSICAL]
        );
        const [unstoppableForceAbility] =
            unstoppableForce.card.params.abilities;
        assert.equal(unstoppableForceAbility.type, ABILITY_HERO_ACTION);
        assert.deepEqual(unstoppableForceAbility.params.effect, {
            type: EFFECT_CHAINED,
            params: {
                effects: [
                    {
                        type: EFFECT_READY,
                        params: {
                            target: TARGET_YOUR_HERO,
                        },
                    },
                    {
                        type: EFFECT_DO_IF_HAS_PAID,
                        params: {
                            resources: [RESOURCE_PHYSICAL],
                            exclusive: true,
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
            },
        });

        assert.equal(limitlessStrength.count, 2);
        assert.equal(limitlessStrength.card.type, CARD_TYPE_RESOURCE);
        assert.equal(limitlessStrength.card.params.name, 'Fuerza ilimitada');
        assert.equal(limitlessStrength.card.params.set, 'Hulk');
        assert.equal(
            limitlessStrength.card.params.image,
            'heroes/hulk/10007.png'
        );
        assert.deepEqual(limitlessStrength.card.params.resources, [
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
        ]);
        assert.deepEqual(limitlessStrength.card.params.spendCondition, {
            'owner.isHero': true,
        });
        assert.equal(bannerLaboratory.count, 1);
        assert.equal(bannerLaboratory.card.type, CARD_TYPE_SUPPORT);
        assert.equal(bannerLaboratory.card.params.name, 'Laboratorio de Banner');
        assert.equal(bannerLaboratory.card.params.set, 'Hulk');
        assert.equal(bannerLaboratory.card.params.image, 'heroes/hulk/10008.png');
        assert.equal(bannerLaboratory.card.params.unique, true);
        assert.deepEqual(bannerLaboratory.card.params.traits, [TRAIT_LOCATION]);
        assert.equal(bannerLaboratory.card.params.cost, 2);
        assert.deepEqual(bannerLaboratory.card.params.resources, [RESOURCE_MENTAL]);
        const [bannerRecovery, bannerResource] =
            bannerLaboratory.card.params.abilities;
        assert.equal(bannerRecovery.type, ABILITY_CONSTANT);
        assert.equal(
            bannerRecovery.params.trigger,
            TRIGGER_YOUR_ALTEREGO_GET_RECOVERY
        );
        assert.deepEqual(bannerRecovery.params.condition, {
            'effect.selectedTarget.name': 'Bruce Banner',
        });
        assert.deepEqual(bannerRecovery.params.effect, {
            type: EFFECT_MODIFY_RECOVERY_VALUE,
            params: {
                target: TARGET_EFFECT,
                count: 2,
            },
        });
        assert.equal(bannerResource.type, ABILITY_ALTEREGO_RESOURCE);
        assert.equal(bannerResource.params.resource, RESOURCE_MENTAL);
        assert.deepEqual(bannerResource.params.arrow, {
            type: EFFECT_EXHAUST,
            params: {
                target: TARGET_THIS,
            },
        });
        assert.equal(unleashedFury.count, 1);
        assert.equal(unleashedFury.card.type, CARD_TYPE_UPGRADE);
        assert.equal(unleashedFury.card.params.name, 'Furia desatada');
        assert.equal(unleashedFury.card.params.set, 'Hulk');
        assert.equal(unleashedFury.card.params.image, 'heroes/hulk/10009.png');
        assert.deepEqual(unleashedFury.card.params.traits, [
            TRAIT_CONDITION,
            TRAIT_GAMMA,
        ]);
        assert.equal(unleashedFury.card.params.cost, 1);
        assert.deepEqual(unleashedFury.card.params.resources, [RESOURCE_PHYSICAL]);
        assert.deepEqual(unleashedFury.card.params.paramsToPlay, {isHero: true});
        const [furyAttackBonus, furyForcedResponse] =
            unleashedFury.card.params.abilities;
        assert.equal(furyAttackBonus.type, ABILITY_CONSTANT);
        assert.equal(
            furyAttackBonus.params.trigger,
            TRIGGER_YOUR_HERO_GET_ATTACK
        );
        assert.deepEqual(furyAttackBonus.params.condition, {
            'effect.selectedTarget.name': 'Hulk',
        });
        assert.deepEqual(furyAttackBonus.params.effect, {
            type: EFFECT_MODIFY_ATTACK_VALUE,
            params: {
                target: TARGET_EFFECT,
                count: 1,
            },
        });
        assert.equal(furyForcedResponse.type, ABILITY_FORCED_RESPONSE);
        assert.equal(
            furyForcedResponse.params.trigger,
            TRIGGER_SUPERHERO_FLIPS
        );
        assert.equal(
            Object.hasOwn(furyForcedResponse.params, 'condition'),
            false
        );
        assert.deepEqual(furyForcedResponse.params.effect, {
            type: EFFECT_DISCARD_GAME,
            params: {
                target: TARGET_THIS,
            },
        });

        assert.equal(immovableObject.count, 1);
        assert.equal(immovableObject.card.type, CARD_TYPE_UPGRADE);
        assert.equal(immovableObject.card.params.name, 'Objeto inamovible');
        assert.equal(immovableObject.card.params.set, 'Hulk');
        assert.equal(immovableObject.card.params.image, 'heroes/hulk/10010.png');
        assert.deepEqual(immovableObject.card.params.traits, [TRAIT_CONDITION]);
        assert.equal(immovableObject.card.params.cost, 3);
        assert.deepEqual(
            immovableObject.card.params.resources,
            [RESOURCE_PHYSICAL]
        );
        const [immovableHitPoints, immovableRetaliate] =
            immovableObject.card.params.abilities;
        assert.equal(immovableHitPoints.type, ABILITY_CONSTANT);
        assert.equal(
            immovableHitPoints.params.trigger,
            TRIGGER_YOUR_HERO_GET_HIT_POINTS
        );
        assert.deepEqual(immovableHitPoints.params.effect, {
            type: EFFECT_MODIFY_HIT_POINTS,
            params: {
                target: TARGET_YOUR_SUPERHERO,
                count: 4,
            },
        });
        assert.equal(immovableRetaliate.type, ABILITY_CONSTANT);
        assert.equal(immovableRetaliate.params.trigger, TRIGGER_CARD_ENTER_PLAY);
        assert.deepEqual(immovableRetaliate.params.effect, {
            type: EFFECT_ADD_KEYWORD,
            params: {
                target: TARGET_ALL_CHARACTERS,
                condition: {name: 'Hulk'},
                keyword: {retaliate: 1},
            },
        });

        const [bruceBanner, hulkSide] = hulk.config.sides;
        assert.equal(bruceBanner.type, CARD_TYPE_ALTEREGO);
        assert.equal(bruceBanner.params.name, 'Bruce Banner');
        assert.equal(bruceBanner.params.set, 'Hulk');
        assert.equal(bruceBanner.params.image, 'heroes/hulk/10001b.png');
        assert.equal(bruceBanner.params.unique, true);
        assert.deepEqual(bruceBanner.params.traits, [
            TRAIT_GENIUS,
            TRAIT_SCIENTIST,
        ]);
        assert.equal(bruceBanner.params.recovery, 4);
        assert.equal(bruceBanner.params.handSize, 5);
        assert.equal(bruceBanner.params.hitPoints, 18);

        assert.equal(hulkSide.type, CARD_TYPE_HERO);
        assert.equal(hulkSide.params.name, 'Hulk');
        assert.equal(hulkSide.params.set, 'Hulk');
        assert.equal(hulkSide.params.image, 'heroes/hulk/10001a.png');
        assert.equal(hulkSide.params.unique, true);
        assert.deepEqual(hulkSide.params.traits, [TRAIT_AVENGER, TRAIT_GAMMA]);
        assert.equal(hulkSide.params.thwart, 0);
        assert.equal(hulkSide.params.attack, 3);
        assert.equal(hulkSide.params.defense, 3);
        assert.equal(hulkSide.params.handSize, 4);
        assert.equal(hulkSide.params.hitPoints, 18);

        const references = hulk.config.precon.flatMap(({
            aspect,
            classification,
            cardRefs,
        }) => cardRefs.map(({id, count}) => ({
            category: aspect || classification,
            id,
            count,
        })));
        assert.deepEqual(references, [
            {category: 'basic', id: 'basic-energy', count: 1},
            {category: 'basic', id: 'basic-strength', count: 1},
            {category: 'basic', id: 'basic-genius', count: 1},
            {category: 'basic', id: 'basic-al-rescate', count: 3},
            {category: 'basic', id: 'basic-avengers-mansion', count: 1},
            {category: 'basic', id: 'basic-helicarrier', count: 1},
            {
                category: 'aggression',
                id: 'aggression-the-power-of-aggression',
                count: 2,
            },
            {
                category: 'aggression',
                id: 'aggression-patada-doble-voladora',
                count: 3,
            },
            {category: 'aggression', id: 'aggression-cara-a-cara', count: 3},
            {category: 'aggression', id: 'aggression-pagaras-por-eso', count: 3},
            {category: 'aggression', id: 'aggression-vigor', count: 1},
            {category: 'aggression', id: 'aggression-el-vigia', count: 1},
            {category: 'aggression', id: 'aggression-hulka', count: 1},
            {category: 'aggression', id: 'aggression-destreza-marcial', count: 3},
        ]);

        const aspectsById = new Map(aspects.map(card => [card._id, card]));
        references.forEach(({category, id}) => {
            const cardRecord = aspectsById.get(id);
            if (category === 'basic') {
                assert.equal(cardRecord?.classification, 'basic');
                assert.equal(Object.hasOwn(cardRecord, 'aspect'), false);
            } else {
                assert.equal(cardRecord?.aspect, category);
            }
            assert.equal(cardRecord?.card.params.set, category);
        });

        const rescueCard = aspectsById.get('basic-al-rescate')?.card;
        assert.ok(rescueCard);
        assert.equal(rescueCard.type, CARD_TYPE_EVENT);
        assert.equal(rescueCard.params.name, '¡Al rescate!');
        assert.equal(rescueCard.params.image, 'aspect/basic/events/10019.png');
        assert.deepEqual(rescueCard.params.traits, [TRAIT_THWART]);
        assert.equal(rescueCard.params.cost, 2);
        assert.deepEqual(rescueCard.params.resources, [RESOURCE_PHYSICAL]);
        const rescueAbilityConfig = rescueCard.params.abilities[0];
        assert.equal(rescueAbilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(rescueAbilityConfig.params.labels, [LABEL_THWART]);
        assert.deepEqual(rescueAbilityConfig.params.effect, {
            type: EFFECT_REMOVE_THREAT,
            params: {
                target: TARGET_SCHEME,
                threat: 2,
            },
        });

        const rescueGameCard = new MatchFactory({triggerCards: {}})
            .cardsFactory.createGameCardFromConfig(rescueCard, {owner: {}});
        const [rescueAbility] = rescueGameCard.abilities;
        assert.equal(typeof rescueAbility.effect.canRun, 'function');
        assert.equal(rescueAbility.effect.effectType, EFFECT_REMOVE_THREAT);
        assert.equal(rescueAbility.effect.target, TARGET_SCHEME);
        assert.equal(rescueAbility.effect.threat, 2);
    });

    test('Objeto inamovible grants Hulk 4 hit points and Retaliate 1 in play', async () => {
        const {heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');
        const match = createMatch('hulk-immovable-object');
        const superhero = new MatchFactory(match).createSuperhero(hulk.config);
        superhero.selectedSide = 1;
        match.scenario = {
            villain: {
                isVillain: true,
                name: 'Test Villain',
            },
            gameZone: {
                currentScheme: null,
                cards: [],
            },
        };
        const player = match.createPlayer({name: 'Hulk', superhero});
        player.gameZone = new PlayerZone({owner: player});
        player.gameZone.refresh = async () => {};
        superhero.refresh = async () => {};
        superhero.sides.forEach(side => {
            side.refresh = async () => {};
        });

        const upgrade = superhero.cards.find(({name}) =>
            name === 'Objeto inamovible');
        assert.ok(upgrade);
        upgrade.owner = player;

        await new PutPlayEffect({
            card: upgrade,
            controller: player,
            match,
        }).runEffect({player});

        assert.equal(await player.getHitPoints(), 22);
        assert.equal(superhero.retaliate, 1);
        assert.equal(typeof upgrade.abilities[0].effect.canRun, 'function');
        assert.equal(typeof upgrade.abilities[1].effect.canRun, 'function');
    });

    test('Laboratorio de Banner generates a mental resource and improves Bruce Banner recovery', async () => {
        const {heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');
        const match = createMatch('hulk-banner-laboratory');
        const superhero = new MatchFactory(match).createSuperhero(hulk.config);
        superhero.selectedSide = 0;
        const player = match.createPlayer({name: 'Hulk', superhero});
        const laboratory = superhero.cards.find(({name}) =>
            name === 'Laboratorio de Banner');
        assert.ok(laboratory);
        laboratory.owner = player;
        laboratory.controller = player;

        const [recoveryAbility, resourceAbility] = laboratory.abilities;
        assert.equal(typeof recoveryAbility.effect.canRun, 'function');
        assert.equal(resourceAbility.getGeneratedResources({player})[0], RESOURCE_MENTAL);
        assert.equal(
            await laboratory.hasResourceGenerators({owner: player}, RESOURCE_MENTAL),
            true
        );

        await resourceAbility.payArrow({player, card: laboratory});
        assert.equal(laboratory.exhausted, true);
        assert.equal(
            await laboratory.hasResourceGenerators({owner: player}, RESOURCE_MENTAL),
            false
        );

        await laboratory.initTriggers({player});
        assert.equal(await superhero.getRecoveryValue({player}), 6);
        laboratory.endTriggers();
        assert.equal(await superhero.getRecoveryValue({player}), 4);

        superhero.selectedSide = 1;
        assert.equal(
            await laboratory.hasResourceGenerators({owner: player}, RESOURCE_MENTAL),
            false
        );
    });

    test('Furia desatada is hero-only, increases Hulk ATQ, and discards after a flip', async () => {
        const {heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');
        const match = createMatch('hulk-unleashed-fury');
        const superhero = new MatchFactory(match).createSuperhero(hulk.config);
        superhero.selectedSide = 0;
        match.scenario = {gameZone: {cards: []}};
        const player = match.createPlayer({name: 'Hulk', superhero});
        player.deck = new Deck({owner: player, isPlayerDeck: true});
        player.deck.cards = [createCard('remaining-card')];
        player.gameZone = new PlayerZone({owner: player});
        match.openDialog = async ({data}) => ({selected: data.cards[0]});

        const fury = superhero.cards.find(({name}) => name === 'Furia desatada');
        assert.ok(fury);
        fury.owner = player;
        fury.controller = player;

        assert.equal(await fury.canPlay({player}), false);
        superhero.selectedSide = 1;
        assert.equal(await fury.canPlay({player}), true);

        player.gameZone.addToGameZone(fury);
        await fury.initTriggers({player});
        const [attackBonus, forcedResponse] = fury.abilities;
        assert.equal(attackBonus.effect.effectType, EFFECT_MODIFY_ATTACK_VALUE);
        assert.equal(typeof attackBonus.effect.canRun, 'function');
        assert.equal(forcedResponse.trigger, TRIGGER_SUPERHERO_FLIPS);
        assert.equal(forcedResponse.effect.effectType, EFFECT_DISCARD_GAME);
        assert.equal(typeof forcedResponse.effect.canRun, 'function');
        assert.equal(await superhero.getAttackValue({player}), 4);

        const flipToAlterEgo = new FlipEffect({
            match,
            selectedFormTarget: superhero.sides[0],
            selectedTarget: superhero,
        });
        await flipToAlterEgo.execute({own: true, player});

        assert.equal(superhero.name, 'Bruce Banner');
        assert.equal(player.gameZone.cards.includes(fury), false);
        assert.ok(player.deck.discardPile.includes(fury));
    });

    test('Fuerza ilimitada restricts spending, not discarding its printed resources', async () => {
        const {heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');
        const match = createMatch('hulk-limitless-strength');
        const superhero = new MatchFactory(match).createSuperhero(hulk.config);
        superhero.selectedSide = 1;
        const player = match.createPlayer({name: 'Hulk', superhero});
        const resourceCard = superhero.cards.find(({name}) =>
            name === 'Fuerza ilimitada');
        assert.ok(resourceCard);
        player.hand.addCard(resourceCard);
        assert.deepEqual(resourceCard.card.getPrintedResources(), [
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
        ]);

        const cardToPay = {owner: player};
        assert.equal(player.isHero, true);
        assert.deepEqual(
            resourceCard.card.getResources(cardToPay),
            [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL, RESOURCE_PHYSICAL]
        );
        assert.deepEqual(
            player.hand.getCardsToPay(cardToPay, RESOURCE_PHYSICAL),
            [resourceCard]
        );
        assert.deepEqual(
            player.hand.getCardsToPay(cardToPay),
            [resourceCard]
        );

        superhero.selectedSide = 0;
        assert.equal(Boolean(player.isHero), false);
        assert.deepEqual(
            player.hand.getCardsToPay(cardToPay, RESOURCE_PHYSICAL),
            []
        );
        assert.deepEqual(
            player.hand.getCardsToPay(cardToPay),
            []
        );

        let discardDialog;
        player.openDialog = async options => {
            discardDialog = options;

            return {
                paid: {
                    hand: [{id: resourceCard.id}],
                },
                resources: [
                    RESOURCE_PHYSICAL,
                    RESOURCE_PHYSICAL,
                    RESOURCE_PHYSICAL,
                ],
            };
        };
        const discardPayment = await player.discardResources([
            [RESOURCE_PHYSICAL],
            [RESOURCE_PHYSICAL],
            [RESOURCE_PHYSICAL],
        ]);

        assert.equal(discardDialog.data.resourcePaymentMode, 'discard');
        assert.deepEqual(
            discardDialog.data.cards.hand.find(({id}) => id === resourceCard.id)
                .resources,
            [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL, RESOURCE_PHYSICAL]
        );
        assert.deepEqual(discardPayment.hand, [resourceCard]);
    });

    test('Golpe aplastante compiles as an attack and calculates Hulk ATQ at runtime', async () => {
        const {heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');
        const match = createMatch('hulk-crushing-blow');
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(hulk.config);
        superhero.selectedSide = 1;
        const player = match.createPlayer({name: 'Hulk', superhero});
        assert.equal(superhero.cards.length, 15);
        const gameCard = superhero.cards.find(({name}) =>
            name === 'Golpe aplastante');
        assert.ok(gameCard);
        const [ability] = gameCard.abilities;

        assert.equal(ability.isAttack, true);
        assert.equal(ability.effect.effectType, EFFECT_DEAL_DAMAGE);
        assert.equal(ability.effect.isAttack, true);
        assert.equal(ability.effect.target, TARGET_ENEMY);
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(gameCard.resourceType, RESOURCE_PHYSICAL);
        assert.deepEqual(gameCard.requirement, []);

        const resolvedParams = await ability.effect.resolveParams({
            ability,
            card: gameCard,
            match,
            player,
        });

        assert.equal(resolvedParams.damage, 3);
    });

    test('Hulk aplasta adds ATQ and grants Brutalidad only for an all-physical payment', async () => {
        const {heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');
        const match = createMatch('hulk-smash');
        const matchFactory = new MatchFactory(match);
        const superhero = matchFactory.createSuperhero(hulk.config);
        superhero.selectedSide = 1;
        const player = match.createPlayer({name: 'Hulk', superhero});
        const gameCard = superhero.cards.find(({name}) =>
            name === 'Hulk aplasta');
        assert.ok(gameCard);
        const [ability] = gameCard.abilities;

        assert.equal(ability.trigger, TRIGGER_YOU_BASIC_ATTACK);
        assert.equal(ability.effect.effectType, EFFECT_CHAINED);
        assert.equal(typeof ability.effect.canRun, 'function');

        const resolveAttack = async resourcesPaid => {
            const attack = {
                keywords: {},
                modifyAttack: 0,
            };
            await ability.effect.runEffect({
                effect: attack,
                match,
                player,
                playCardEffect: {resourcesPaid},
            });

            return attack;
        };

        const allPhysicalAttack = await resolveAttack([
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
        ]);
        assert.equal(allPhysicalAttack.modifyAttack, 10);
        assert.equal(allPhysicalAttack.keywords.overkill, true);

        const mixedPaymentAttack = await resolveAttack([
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
            RESOURCE_MENTAL,
        ]);
        assert.equal(mixedPaymentAttack.modifyAttack, 10);
        assert.equal(mixedPaymentAttack.keywords.overkill, undefined);

        const zeroPaymentAttack = await resolveAttack([]);
        assert.equal(zeroPaymentAttack.modifyAttack, 10);
        assert.equal(zeroPaymentAttack.keywords.overkill, undefined);
    });

    test('Salto suborbital removes 5 threat only for an all-physical payment', async () => {
        const {heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');

        const resolveLeap = async resourcesPaid => {
            const match = createMatch(`hulk-suborbital-leap-${resourcesPaid.join('-')}`);
            const superhero = new MatchFactory(match).createSuperhero(hulk.config);
            superhero.selectedSide = 1;
            const player = match.createPlayer({name: 'Hulk', superhero});
            const scheme = {
                isSideScheme: false,
                threat: 10,
                canRemoveThreat() {
                    return true;
                },
                removeThreat(threat) {
                    this.threat -= threat;
                },
                refresh() {},
            };
            match.scenario = {
                schemes: [scheme],
                sideSchemes: [],
            };

            const gameCard = superhero.cards.find(({name}) =>
                name === 'Salto suborbital');
            assert.ok(gameCard);
            assert.equal(superhero.cards.length, 15);
            gameCard.owner = player;
            const [ability] = gameCard.abilities;
            assert.equal(ability.isThwart, true);
            assert.equal(ability.effect.effectType, EFFECT_DO_IF_HAS_PAID);
            assert.equal(typeof ability.effect.canRun, 'function');

            const playCardEffect = {resourcesPaid};
            const prepared = await ability.prepareToResolve({
                card: gameCard,
                player,
                playCardEffect,
            });
            assert.equal(prepared.canRun, true);

            await ability.resolveAbility({
                card: gameCard,
                player,
                playCardEffect,
                ...prepared,
            });

            return scheme.threat;
        };

        assert.equal(await resolveLeap([
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
        ]), 5);
        assert.equal(await resolveLeap([
            RESOURCE_PHYSICAL,
            RESOURCE_PHYSICAL,
            RESOURCE_MENTAL,
        ]), 7);
    });

    test('Fuerza imparable prepares Hulk and draws only for an all-physical payment', async () => {
        const {heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');

        const resolveForce = async (resourcesPaid, matchName) => {
            const match = createMatch(`hulk-unstoppable-force-${matchName}`);
            const superhero = new MatchFactory(match).createSuperhero(hulk.config);
            superhero.selectedSide = 1;
            const player = match.createPlayer({name: 'Hulk', superhero});
            player.gameZone = new PlayerZone({owner: player});
            player.gameZone.refresh = async () => {};
            superhero.refresh = async () => {};
            superhero.sides.forEach(side => {
                side.refresh = async () => {};
            });
            superhero.exhaust();
            player.deck = new Deck({owner: player, isPlayerDeck: true});
            player.deck.cards = [
                {
                    ...createCard('drawn-card'),
                    card: {isResource: true},
                },
                {
                    ...createCard('remaining-card'),
                    card: {isResource: true},
                },
            ];

            const gameCard = superhero.cards.find(({name}) =>
                name === 'Fuerza imparable');
            assert.ok(gameCard);
            assert.equal(superhero.cards.length, 15);
            gameCard.owner = player;
            const [ability] = gameCard.abilities;
            assert.equal(ability.effect.effectType, EFFECT_CHAINED);
            assert.equal(typeof ability.effect.canRun, 'function');

            const playCardEffect = {resourcesPaid};
            const prepared = await ability.prepareToResolve({
                card: gameCard,
                player,
                playCardEffect,
            });
            assert.equal(prepared.canRun, true);

            await ability.resolveAbility({
                card: gameCard,
                player,
                playCardEffect,
                ...prepared,
            });

            return {
                exhausted: superhero.exhausted,
                handSize: player.hand.cards.length,
            };
        };

        assert.deepEqual(
            await resolveForce(
                [RESOURCE_PHYSICAL, RESOURCE_PHYSICAL],
                'physical-payment'
            ),
            {exhausted: false, handSize: 1}
        );
        assert.deepEqual(
            await resolveForce(
                [RESOURCE_PHYSICAL, RESOURCE_MENTAL],
                'mixed-payment'
            ),
            {exhausted: false, handSize: 0}
        );
        assert.deepEqual(
            await resolveForce([], 'no-payment'),
            {exhausted: false, handSize: 0}
        );
    });

    test('Palmada atronadora deals 3 damage to up to 3 distinct enemies', async () => {
        const {heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');
        const match = createMatch('hulk-thunderclap');
        const superhero = new MatchFactory(match).createSuperhero(hulk.config);
        superhero.selectedSide = 1;
        const player = match.createPlayer({name: 'Hulk', superhero});
        const gameCard = superhero.cards.find(({name}) =>
            name === 'Palmada atronadora');
        assert.ok(gameCard);
        const [ability] = gameCard.abilities;
        const {effect} = ability;
        const enemies = ['enemy-one', 'enemy-two', 'enemy-three', 'enemy-four']
            .map(id => ({
                id,
                damage: 0,
                toObj() {
                    return {id, name: id};
                },
            }));

        assert.equal(effect.effectType, EFFECT_DEAL_DAMAGE);
        assert.equal(effect.baseDamage, 3);
        assert.equal(effect.selectCount, 3);
        assert.equal(effect.selectUpTo, true);
        assert.equal(
            effect.validTarget.isMultipleTarget({target: TARGET_ENEMY}),
            true
        );
        assert.equal(typeof effect.canRun, 'function');

        effect.validTarget.getValidTarget = () => enemies;
        effect.validTarget.openDialog = async ({dialogType, data}) => {
            assert.equal(dialogType, DIALOG_SELECT_TARGET);
            assert.equal(data.count, 3);
            assert.equal(data.minCount, 0);
            assert.equal(data.upTo, true);
            assert.equal(data.multiSelect, true);

            return {
                selected: [{id: 'enemy-one'}, {id: 'enemy-three'}],
            };
        };

        assert.equal(await effect.canRun({player}), true);
        await effect.prepare({player});
        const selectedTargets = effect.selectedTarget;
        assert.deepEqual(selectedTargets, [enemies[0], enemies[2]]);
        assert.equal(effect.damage, 3);

        const damageCalls = [];
        effect.match = {
            effectsFactory: {
                createEffect({type, selectedTarget, damage}) {
                    assert.equal(type, EFFECT_TAKE_DAMAGE);

                    return {
                        takenDamage: damage,
                        defeated: false,
                        async runEffect() {
                            selectedTarget.forEach(target => {
                                damageCalls.push({target, damage});
                                target.damage += damage;
                            });
                        },
                    };
                },
            },
        };
        effect.selectedTarget = selectedTargets;
        await effect.execute({player});

        assert.deepEqual(damageCalls, [
            {target: enemies[0], damage: 3},
            {target: enemies[2], damage: 3},
        ]);
        assert.deepEqual(enemies.map(({damage}) => damage), [3, 0, 3, 0]);
    });

    test('Hulk abilities compile and Bruce Banner draws then discards one card once per round', async () => {
        const {heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');
        const match = createMatch('hulk-experimental-research');
        const superhero = new MatchFactory(match).createSuperhero(hulk.config);

        const [alterEgoSide, heroSide] = superhero.sides;
        assert.equal(superhero.obligations.length, 1);
        assert.equal(superhero.obligations[0].name, 'Demonios interiores');
        assert.deepEqual(
            superhero.nemesis.map(({name}) => name),
            [
                'Abominación',
                'Destrucción total',
                'Duelo de titanes',
                'Duelo de titanes',
                'Duelo de titanes',
            ]
        );
        const research = alterEgoSide.abilities.find(({name}) =>
            name === 'Investigación experimental');
        const enraged = heroSide.abilities.find(({name}) =>
            name === 'Enfurecido');
        assert.ok(research);
        assert.ok(enraged);
        const [researchConfig] = hulk.config.sides[0].params.abilities;
        const [enragedConfig] = hulk.config.sides[1].params.abilities;
        assert.equal(researchConfig.type, ABILITY_ALTEREGO_ACTION);
        assert.equal(researchConfig.params.limit.target, TARGET_ROUND);
        assert.equal(researchConfig.params.effect.type, EFFECT_CHAINED);
        assert.equal(typeof research.effect.canRun, 'function');
        assert.equal(enragedConfig.type, ABILITY_FORCED_INTERRUPT);
        assert.equal(enragedConfig.params.trigger, TRIGGER_PLAYER_TURN_END);
        assert.equal(typeof enraged.effect.canRun, 'function');

        superhero.selectedSide = 0;
        const player = match.createPlayer({name: 'Bruce Banner', superhero});
        const keptCard = createCard('kept-card');
        const drawnCard = createCard('drawn-card');
        const discarded = [];
        let draws = 0;
        player.hand.cards = [keptCard];
        player.hand.refresh = async () => {};
        player.deck = {
            async draw(count) {
                draws += count;

                return [drawnCard];
            },
            async discard(card) {
                discarded.push(card);
            },
            async refresh() {},
        };
        match.openDialog = async ({dialogType, title, data}) => {
            assert.equal(dialogType, DIALOG_DISCARD_HAND);
            assert.equal(title, 'Elige 1 carta de tu mano para descartar');
            assert.equal(data.count, 1);

            return {selected: [{id: drawnCard.id}]};
        };

        await research.resolveAbility({match, player});
        await research.resolveAbility({match, player});

        assert.equal(draws, 1);
        assert.deepEqual(discarded, [drawnCard]);
        assert.deepEqual(player.hand.cards, [keptCard]);
    });

    test('Hulk discards his hand at his turn end, but not on administrative turn closure', async () => {
        const {heroes} = await loadCatalog();
        const hulk = heroes.find(({_id}) => _id === 'hulk');

        const runTurnEnd = async (name, response) => {
            const listeners = new Map();
            const mcSocket = {
                listen(_matchName, endpoint, callback) {
                    listeners.set(endpoint, callback);
                },
                send() {},
            };
            const match = createMatch(name, mcSocket);
            match.refresh = async () => {};
            match.turnStartProcessed = true;
            match.skipDiscardOrderDialog = true;
            match.openDialog = async ({data}) => ({
                selected: data.cards[0],
            });
            const superhero = new MatchFactory(match).createSuperhero(hulk.config);
            superhero.selectedSide = 1;
            const player = match.createPlayer({name: 'Hulk', superhero});
            const cards = [createCard(`${name}-one`), createCard(`${name}-two`)];
            const discarded = [];
            player.hand.cards = cards.slice();
            player.hand.refresh = async () => {};
            player.deck = {
                async discard(card) {
                    discarded.push(card);
                },
                async refresh() {},
            };
            await superhero.initTriggers();

            const turnEnd = new PlayTurnEffect({match});
            const turnEndPromise = turnEnd.execute({player});
            const dispatchEnd = listeners.get(EVENTS.TURN.END);
            assert.equal(typeof dispatchEnd, 'function');
            dispatchEnd(response);
            await turnEndPromise;

            return {cards, discarded, player};
        };

        const normalEnd = await runTurnEnd('hulk-normal-turn-end', {});
        assert.deepEqual(normalEnd.discarded, normalEnd.cards);
        assert.deepEqual(normalEnd.player.hand.cards, []);

        for (const response of [{gameOver: true}, {reset: true}]) {
            const administrativeEnd = await runTurnEnd(
                `hulk-administrative-end-${Object.keys(response)[0]}`,
                response
            );
            assert.deepEqual(administrativeEnd.discarded, []);
            assert.deepEqual(administrativeEnd.player.hand.cards, administrativeEnd.cards);
        }
    });
});
