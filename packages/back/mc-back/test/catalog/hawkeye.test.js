import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_CONSTANT,
    ABILITY_RESOURCE,
    ABILITY_FORCED_RESPONSE,
    ABILITY_HERO_ACTION,
    ABILITY_INTERRUPT,
    CALC_IF,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    CARD_TYPE_MAIN_SCHEME_B_CARD,
    CARD_TYPE_UPGRADE,
    EFFECT_CONFUSE,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_EXHAUST,
    EFFECT_MODIFY_ATTACK,
    EFFECT_PREVENT_DAMAGE,
    EFFECT_READY,
    EFFECT_REMOVE_THREAT,
    EFFECT_RETURN_HAND,
    EFFECT_SEARCH_CARDS,
    EFFECT_SIMULTANEOUS,
    EFFECT_STUN,
    EFFECT_SPEND,
    EFFECT_TUCK_UNDER,
    EFFECT_TAKE_DAMAGE,
    LABEL_ATTACK,
    LABEL_THWART,
    PLACE_DECK,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ANY_PLAYER,
    TARGET_ENEMY,
    TARGET_ANY_CHARACTER_YOU_CONTROL,
    TARGET_SOURCE,
    TARGET_SCHEME,
    TARGET_THIS,
    TARGET_UPGRADE_YOU_CONTROL,
    TARGET_VILLAIN,
    TRAIT_ARROW,
    TRAIT_ATTACK,
    TRAIT_AVENGER,
    TRAIT_ITEM,
    TRAIT_SHIELD,
    TRAIT_SKILL,
    TRAIT_THWART,
    TRAIT_WEAPON,
    TARGET_EFFECT,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_THIS_ATTACK,
    TRIGGER_YOU_ATTACK,
    TRIGGER_YOUR_HERO_GET_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {ResourceAbility} from '../../src/abilities/resource/resource-ability.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';

describe('Hawkeye catalog', () => {
    test('defines both identities, the supplied precon cards, and constructible abilities', async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');

        assert.ok(hawkeye);
        const [alterEgo, hero] = hawkeye.config.sides;
        assert.equal(alterEgo.params.name, 'Clint Barton');
        assert.equal(alterEgo.params.recovery, 3);
        assert.equal(alterEgo.params.handSize, 6);
        assert.equal(alterEgo.params.hitPoints, 9);
        assert.equal(hero.params.name, 'Ojo de Halcón');
        assert.equal(hero.params.thwart, 1);
        assert.equal(hero.params.attack, 2);
        assert.equal(hero.params.defense, 1);
        assert.equal(hero.params.handSize, 5);
        assert.equal(hero.params.hitPoints, 9);
        assert.equal(hawkeye.config.cards.length, 9);
        const bowEntry = hawkeye.config.cards[0];
        assert.equal(bowEntry.count, 1);
        assert.equal(bowEntry.card.type, CARD_TYPE_UPGRADE);
        assert.equal(bowEntry.card.params.name, 'Arco de Ojo de Halcón');
        assert.equal(bowEntry.card.params.cost, 0);
        assert.deepEqual(bowEntry.card.params.resources, [RESOURCE_WILD]);
        assert.deepEqual(bowEntry.card.params.traits, [TRAIT_WEAPON]);
        assert.equal(bowEntry.card.params.unique, true);
        assert.equal(bowEntry.card.params.keywords.restricted, true);
        assert.equal(
            bowEntry.card.params.abilities[0].params.trigger,
            TRIGGER_YOUR_HERO_GET_ATTACK
        );
        assert.equal(
            bowEntry.card.params.abilities[1].params.trigger,
            TRIGGER_YOU_ATTACK
        );
        assert.deepEqual(bowEntry.card.params.abilities[1].params.condition, {
            'effect.ability.card.traits': TRAIT_ARROW,
        });

        const quiverEntry = hawkeye.config.cards[1];
        assert.equal(quiverEntry.count, 1);
        assert.equal(quiverEntry.card.type, CARD_TYPE_UPGRADE);
        assert.equal(quiverEntry.card.params.name, 'Carcaj de Ojo de Halcón');
        assert.equal(quiverEntry.card.params.image, 'heroes/hawkeye/04003.png');
        assert.deepEqual(quiverEntry.card.params.traits, [TRAIT_ITEM]);
        assert.equal(quiverEntry.card.params.unique, true);
        assert.equal(quiverEntry.card.params.cost, 1);
        assert.deepEqual(quiverEntry.card.params.resources, [RESOURCE_MENTAL]);
        assert.deepEqual(quiverEntry.card.params.playTuckedCardsCondition, {
            isEvent: true,
            traits: TRAIT_ARROW,
        });
        const quiverAbility = quiverEntry.card.params.abilities[0];
        assert.equal(quiverAbility.type, ABILITY_HERO_ACTION);
        assert.equal(quiverAbility.params.arrow.type, EFFECT_EXHAUST);
        assert.deepEqual(quiverAbility.params.arrow.params, {
            target: TARGET_THIS,
        });
        assert.equal(quiverAbility.params.effect.type, EFFECT_CHAINED);
        const quiverEffects = quiverAbility.params.effect.params.effects;
        assert.equal(quiverEffects.length, 2);
        const [quiverSearch, tuckUnderQuiver] = quiverEffects;
        assert.equal(quiverSearch.type, EFFECT_SEARCH_CARDS);
        assert.deepEqual(quiverSearch.params.locations, [PLACE_DECK]);
        assert.equal(quiverSearch.params.topCount, 5);
        assert.deepEqual(quiverSearch.params.filter, {
            isEvent: true,
            traits: TRAIT_ARROW,
        });
        assert.equal(tuckUnderQuiver.type, EFFECT_TUCK_UNDER);
        assert.equal(tuckUnderQuiver.params.target, TARGET_THIS);
        assert.equal(tuckUnderQuiver.params.cards, 'selectedCards');

        const mockingbirdEntry = hawkeye.config.cards[2];
        assert.equal(mockingbirdEntry.count, 1);
        assert.equal(mockingbirdEntry.card.type, CARD_TYPE_ALLY);
        assert.equal(mockingbirdEntry.card.params.name, 'Pájaro Burlón');
        assert.equal(mockingbirdEntry.card.params.subtitle, 'Bobbi Morse');
        assert.equal(mockingbirdEntry.card.params.image, 'heroes/hawkeye/04004.png');
        assert.deepEqual(mockingbirdEntry.card.params.traits, [
            TRAIT_AVENGER,
            TRAIT_SHIELD,
        ]);
        assert.equal(mockingbirdEntry.card.params.unique, true);
        assert.equal(mockingbirdEntry.card.params.cost, 3);
        assert.deepEqual(mockingbirdEntry.card.params.resources, [RESOURCE_WILD]);
        assert.equal(mockingbirdEntry.card.params.attack, 2);
        assert.equal(mockingbirdEntry.card.params.attackConsequential, 1);
        assert.equal(mockingbirdEntry.card.params.thwart, 2);
        assert.equal(mockingbirdEntry.card.params.thwartConsequential, 1);
        assert.equal(mockingbirdEntry.card.params.hitPoints, 3);
        const mockingbirdAbility = mockingbirdEntry.card.params.abilities[0];
        assert.equal(mockingbirdAbility.type, ABILITY_INTERRUPT);
        assert.equal(
            mockingbirdAbility.params.trigger,
            TRIGGER_VILLAIN_ATTACKS_YOU
        );
        assert.equal(
            mockingbirdAbility.params.arrow.type,
            EFFECT_SIMULTANEOUS
        );
        assert.deepEqual(
            mockingbirdAbility.params.arrow.params.effects.map(({type}) => type),
            [EFFECT_SPEND, EFFECT_RETURN_HAND]
        );
        assert.deepEqual(
            mockingbirdAbility.params.arrow.params.effects[0].params.resources,
            [RESOURCE_ANY]
        );
        assert.equal(
            mockingbirdAbility.params.arrow.params.effects[1].params.target,
            TARGET_THIS
        );
        assert.equal(
            mockingbirdAbility.params.effect.type,
            EFFECT_PREVENT_DAMAGE
        );

        const sonicArrowEntry = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Flecha sónica');
        assert.ok(sonicArrowEntry);
        assert.equal(sonicArrowEntry.count, 2);
        assert.equal(sonicArrowEntry.card.type, CARD_TYPE_EVENT);
        assert.equal(sonicArrowEntry.card.params.image, 'heroes/hawkeye/04005.png');
        assert.deepEqual(sonicArrowEntry.card.params.traits, [
            TRAIT_ARROW,
            TRAIT_ATTACK,
        ]);
        assert.equal(sonicArrowEntry.card.params.cost, 2);
        assert.deepEqual(sonicArrowEntry.card.params.resources, [RESOURCE_MENTAL]);
        const sonicArrowAbilityConfig = sonicArrowEntry.card.params.abilities[0];
        assert.equal(sonicArrowAbilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(sonicArrowAbilityConfig.params.labels, [LABEL_ATTACK]);
        assert.equal(sonicArrowAbilityConfig.params.arrow.type, EFFECT_EXHAUST);
        assert.deepEqual(sonicArrowAbilityConfig.params.arrow.params, {
            target: TARGET_UPGRADE_YOU_CONTROL,
            condition: {name: 'Arco de Ojo de Halcón'},
        });
        const sonicArrowEffectConfig = sonicArrowAbilityConfig.params.effect;
        assert.equal(sonicArrowEffectConfig.type, EFFECT_SIMULTANEOUS);
        assert.equal(sonicArrowEffectConfig.params.target, TARGET_ENEMY);
        assert.deepEqual(
            sonicArrowEffectConfig.params.effects.map(({type}) => type),
            [EFFECT_DEAL_DAMAGE, EFFECT_CONFUSE]
        );
        assert.deepEqual(
            sonicArrowEffectConfig.params.effects[0].params.paramsCalc,
            {
                target: 'effect.selectedTarget.isConfused',
                formula: CALC_IF,
                ifTrue: 5,
                ifFalse: 3,
            }
        );

        const electricArrowEntry = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Flecha eléctrica');
        assert.ok(electricArrowEntry);
        assert.equal(electricArrowEntry.count, 2);
        assert.equal(electricArrowEntry.card.type, CARD_TYPE_EVENT);
        assert.equal(
            electricArrowEntry.card.params.image,
            'heroes/hawkeye/04007.png'
        );
        assert.deepEqual(electricArrowEntry.card.params.traits, [
            TRAIT_ARROW,
            TRAIT_THWART,
        ]);
        assert.equal(electricArrowEntry.card.params.cost, 2);
        assert.deepEqual(electricArrowEntry.card.params.resources, [RESOURCE_ENERGY]);
        const electricArrowAbilityConfig =
            electricArrowEntry.card.params.abilities[0];
        assert.equal(electricArrowAbilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(electricArrowAbilityConfig.params.labels, [LABEL_ATTACK]);
        assert.deepEqual(electricArrowAbilityConfig.params.arrow, {
            type: EFFECT_EXHAUST,
            params: {
                target: TARGET_UPGRADE_YOU_CONTROL,
                condition: {name: 'Arco de Ojo de Halcón'},
            },
        });
        assert.equal(
            electricArrowAbilityConfig.params.effect.type,
            EFFECT_SIMULTANEOUS
        );
        assert.equal(
            electricArrowAbilityConfig.params.effect.params.target,
            TARGET_ENEMY
        );
        assert.deepEqual(
            electricArrowAbilityConfig.params.effect.params.effects.map(({type}) =>
                type),
            [EFFECT_DEAL_DAMAGE, EFFECT_STUN]
        );
        assert.deepEqual(
            electricArrowAbilityConfig.params.effect.params.effects[0].params
                .paramsCalc,
            {
                target: 'effect.selectedTarget.isStunned',
                formula: CALC_IF,
                ifTrue: 5,
                ifFalse: 3,
            }
        );

        const cableArrowEntry = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Flecha con cable');
        assert.ok(cableArrowEntry);
        assert.equal(cableArrowEntry.count, 2);
        assert.equal(cableArrowEntry.card.type, CARD_TYPE_EVENT);
        assert.equal(cableArrowEntry.card.params.image, 'heroes/hawkeye/04008.png');
        assert.deepEqual(cableArrowEntry.card.params.traits, [
            TRAIT_ARROW,
            TRAIT_THWART,
        ]);
        assert.equal(cableArrowEntry.card.params.cost, 1);
        assert.deepEqual(cableArrowEntry.card.params.resources, [RESOURCE_PHYSICAL]);
        const cableArrowAbilityConfig = cableArrowEntry.card.params.abilities[0];
        assert.equal(cableArrowAbilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(cableArrowAbilityConfig.params.labels, [LABEL_THWART]);
        assert.deepEqual(cableArrowAbilityConfig.params.arrow, {
            type: EFFECT_EXHAUST,
            params: {
                target: TARGET_UPGRADE_YOU_CONTROL,
                condition: {name: 'Arco de Ojo de Halcón'},
            },
        });
        assert.deepEqual(cableArrowAbilityConfig.params.effect, {
            type: EFFECT_REMOVE_THREAT,
            params: {
                target: TARGET_SCHEME,
                threat: 3,
                ignoreCrisis: true,
            },
        });

        const vibraniumArrowEntry = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Flecha de vibránium');
        assert.ok(vibraniumArrowEntry);
        assert.equal(vibraniumArrowEntry.count, 2);
        assert.equal(vibraniumArrowEntry.card.type, CARD_TYPE_EVENT);
        assert.equal(
            vibraniumArrowEntry.card.params.image,
            'heroes/hawkeye/04009.png'
        );
        assert.deepEqual(vibraniumArrowEntry.card.params.traits, [
            TRAIT_ARROW,
            TRAIT_ATTACK,
        ]);
        assert.equal(vibraniumArrowEntry.card.params.cost, 2);
        assert.deepEqual(
            vibraniumArrowEntry.card.params.resources,
            [RESOURCE_ENERGY]
        );
        const vibraniumArrowAbilities =
            vibraniumArrowEntry.card.params.abilities;
        const vibraniumArrowAbilityConfig = vibraniumArrowAbilities[0];
        assert.equal(vibraniumArrowAbilityConfig.type, ABILITY_HERO_ACTION);
        assert.deepEqual(vibraniumArrowAbilityConfig.params.labels, [LABEL_ATTACK]);
        assert.deepEqual(vibraniumArrowAbilityConfig.params.arrow, {
            type: EFFECT_EXHAUST,
            params: {
                target: TARGET_UPGRADE_YOU_CONTROL,
                condition: {name: 'Arco de Ojo de Halcón'},
            },
        });
        assert.deepEqual(vibraniumArrowAbilityConfig.params.effect, {
            type: EFFECT_DEAL_DAMAGE,
            params: {
                target: TARGET_ENEMY,
                damage: 6,
                keywords: {piercing: true},
            },
        });

        const explosiveArrowEntry = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Flecha explosiva');
        assert.ok(explosiveArrowEntry);
        assert.equal(explosiveArrowEntry.count, 2);
        assert.equal(explosiveArrowEntry.card.type, CARD_TYPE_EVENT);
        assert.equal(
            explosiveArrowEntry.card.params.image,
            'heroes/hawkeye/04006.png'
        );
        assert.deepEqual(explosiveArrowEntry.card.params.traits, [TRAIT_ARROW]);
        assert.equal(explosiveArrowEntry.card.params.cost, 1);
        assert.deepEqual(
            explosiveArrowEntry.card.params.resources,
            [RESOURCE_PHYSICAL]
        );
        const explosiveArrowAbilityConfig =
            explosiveArrowEntry.card.params.abilities[0];
        assert.equal(explosiveArrowAbilityConfig.type, ABILITY_HERO_ACTION);
        assert.equal(explosiveArrowAbilityConfig.params.labels, undefined);
        assert.deepEqual(explosiveArrowAbilityConfig.params.arrow, {
            type: EFFECT_EXHAUST,
            params: {
                target: TARGET_UPGRADE_YOU_CONTROL,
                condition: {name: 'Arco de Ojo de Halcón'},
            },
        });
        assert.deepEqual(explosiveArrowAbilityConfig.params.effect, {
            type: EFFECT_SIMULTANEOUS,
            params: {
                target: TARGET_ANY_PLAYER,
                effects: [
                    {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_VILLAIN,
                            damage: 3,
                        },
                    },
                    {
                        type: EFFECT_DEAL_DAMAGE,
                        params: {
                            target: TARGET_SOURCE,
                            source: 'targetPlayer.minions',
                            multipleTarget: true,
                            damage: 3,
                        },
                    },
                ],
            },
        });

        const precon = hawkeye.config.precon.flatMap(({aspect, cardRefs}) =>
            cardRefs.map(({id, count}) => ({aspect, id, count})));
        assert.deepEqual(precon, [
            {aspect: 'leadership', id: 'leadership-liderar-en-vanguardia', count: 2},
            {aspect: 'leadership', id: 'leadership-el-poder-del-liderazgo', count: 2},
            {aspect: 'leadership', id: 'leadership-ojo-de-halcon-kate-bishop', count: 1},
            {aspect: 'leadership', id: 'leadership-caballero-negro', count: 1},
            {aspect: 'leadership', id: 'leadership-goliat', count: 1},
            {aspect: 'leadership', id: 'leadership-usagente', count: 1},
            {aspect: 'leadership', id: 'leadership-aeromoto', count: 3},
            {aspect: 'leadership', id: 'leadership-entrenamiento-en-equipo', count: 3},
            {aspect: 'leadership', id: 'leadership-listo-para-la-accion', count: 3},
            {aspect: 'basic', id: 'basic-avengers-tower', count: 1},
            {aspect: 'basic', id: 'basic-energy', count: 1},
            {aspect: 'basic', id: 'basic-strength', count: 1},
            {aspect: 'basic', id: 'basic-genius', count: 1},
            {aspect: 'basic', id: 'basic-maquina-de-guerra', count: 1},
            {aspect: 'basic', id: 'basic-los-heroes-mas-poderosos', count: 3},
        ]);
        const warMachineEntry = catalog.aspects.find(({_id}) =>
            _id === 'basic-maquina-de-guerra');
        assert.ok(warMachineEntry);
        assert.equal(warMachineEntry.aspect, 'basic');
        assert.equal(warMachineEntry.card.type, CARD_TYPE_ALLY);
        assert.equal(warMachineEntry.card.params.name, 'Máquina de Guerra');
        assert.equal(warMachineEntry.card.params.subtitle, 'James Rhodes');
        assert.equal(warMachineEntry.card.params.unique, true);
        assert.equal(
            warMachineEntry.card.params.image,
            'aspect/basic/allies/04020.png'
        );
        assert.deepEqual(warMachineEntry.card.params.traits, [
            TRAIT_AVENGER,
            TRAIT_SHIELD,
        ]);
        assert.equal(warMachineEntry.card.params.cost, 4);
        assert.deepEqual(warMachineEntry.card.params.resources, [RESOURCE_MENTAL]);
        assert.equal(warMachineEntry.card.params.hitPoints, 3);
        assert.equal(warMachineEntry.card.params.attack, 2);
        assert.equal(warMachineEntry.card.params.attackConsequential, 1);
        assert.equal(warMachineEntry.card.params.thwart, 2);
        assert.equal(warMachineEntry.card.params.thwartConsequential, 1);
        assert.deepEqual(warMachineEntry.card.params.keywords, {
            toughness: true,
        });
        const rangedAbilityConfig = warMachineEntry.card.params.abilities[0];
        assert.equal(rangedAbilityConfig.type, ABILITY_CONSTANT);
        assert.equal(rangedAbilityConfig.params.trigger, TRIGGER_THIS_ATTACK);
        assert.deepEqual(rangedAbilityConfig.params.condition, {
            'effect.ability.isBasic': true,
        });
        assert.deepEqual(rangedAbilityConfig.params.effect, {
            type: EFFECT_MODIFY_ATTACK,
            params: {
                target: TARGET_EFFECT,
                modify: {
                    keywords: {
                        ranged: true,
                    },
                },
            },
        });
        const blackKnightEntry = catalog.aspects.find(({_id}) =>
            _id === 'leadership-caballero-negro');
        assert.ok(blackKnightEntry);
        assert.equal(blackKnightEntry.aspect, 'leadership');
        assert.equal(blackKnightEntry.card.type, CARD_TYPE_ALLY);
        assert.equal(blackKnightEntry.card.params.name, 'Caballero Negro');
        assert.equal(blackKnightEntry.card.params.subtitle, 'Dane Whitman');
        assert.equal(
            blackKnightEntry.card.params.image,
            'aspect/leadership/allies/04012.png'
        );
        assert.deepEqual(blackKnightEntry.card.params.traits, [TRAIT_AVENGER]);
        assert.equal(blackKnightEntry.card.params.unique, true);
        assert.equal(blackKnightEntry.card.params.cost, 3);
        assert.deepEqual(blackKnightEntry.card.params.resources, [RESOURCE_PHYSICAL]);
        assert.equal(blackKnightEntry.card.params.hitPoints, 3);
        assert.equal(blackKnightEntry.card.params.attack, 2);
        assert.equal(blackKnightEntry.card.params.attackConsequential, 1);
        assert.equal(blackKnightEntry.card.params.thwart, 1);
        assert.equal(blackKnightEntry.card.params.thwartConsequential, 1);
        const blackKnightAbility = blackKnightEntry.card.params.abilities[0];
        assert.equal(blackKnightAbility.type, ABILITY_CONSTANT);
        assert.equal(blackKnightAbility.params.trigger, TRIGGER_THIS_ATTACK);
        assert.deepEqual(blackKnightAbility.params.condition, {
            'effect.ability.isBasic': true,
        });
        assert.deepEqual(blackKnightAbility.params.effect, {
            type: EFFECT_MODIFY_ATTACK,
            params: {
                target: TARGET_EFFECT,
                modify: {keywords: {piercing: true}},
            },
        });
        const aspectsById = new Map(catalog.aspects.map(({_id, aspect}) => [_id, aspect]));
        for (const {aspect, cardRefs} of hawkeye.config.precon) {
            for (const {id} of cardRefs) {
                assert.equal(aspectsById.get(id), aspect, `Invalid ${aspect} card reference: ${id}`);
            }
        }

        const factory = new MatchFactory({players: [], triggerCards: {}});
        const superhero = factory.createSuperhero({...hawkeye.config, precon: []});
        const alterEgoSide = superhero.sides.find(({isAlterEgo}) => isAlterEgo);
        const heroSide = superhero.sides.find(({isHero}) => isHero);
        const [bowCard, quiverCard, mockingbirdCard] = superhero.heroCards;
        assert.ok(bowCard);
        assert.ok(quiverCard);
        assert.ok(mockingbirdCard);
        const mockingbirdInterrupt = mockingbirdCard.abilities.find(({isInterrupt}) =>
            isInterrupt);
        assert.ok(mockingbirdInterrupt);
        for (const ability of bowCard.abilities) {
            assert.ok(ability.effect);
            assert.equal(typeof ability.effect.canRun, 'function');
        }
        assert.ok(quiverCard.abilities[0].effect);
        assert.equal(typeof quiverCard.abilities[0].effect.canRun, 'function');
        assert.ok(quiverCard.abilities[0].arrow?.cost);
        assert.equal(
            typeof quiverCard.abilities[0].arrow.cost.canRun,
            'function'
        );
        assert.ok(mockingbirdInterrupt.effect);
        assert.equal(typeof mockingbirdInterrupt.effect.canRun, 'function');
        assert.ok(mockingbirdInterrupt.arrow?.cost);
        assert.equal(typeof mockingbirdInterrupt.arrow.cost.canRun, 'function');
        const sonicArrow = factory.cardsFactory.createGameCardFromConfig(
            sonicArrowEntry.card,
            {owner: {}}
        );
        const [sonicArrowAbility] = sonicArrow.abilities;
        assert.ok(sonicArrowAbility.effect);
        assert.equal(typeof sonicArrowAbility.effect.canRun, 'function');
        assert.ok(sonicArrowAbility.arrow?.cost);
        assert.equal(typeof sonicArrowAbility.arrow.cost.canRun, 'function');
        const explosiveArrow = factory.cardsFactory.createGameCardFromConfig(
            explosiveArrowEntry.card,
            {owner: {}}
        );
        const [explosiveArrowAbility] = explosiveArrow.abilities;
        assert.ok(explosiveArrowAbility.effect);
        assert.equal(typeof explosiveArrowAbility.effect.canRun, 'function');
        assert.ok(explosiveArrowAbility.arrow?.cost);
        assert.equal(typeof explosiveArrowAbility.arrow.cost.canRun, 'function');
        const electricArrow = factory.cardsFactory.createGameCardFromConfig(
            electricArrowEntry.card,
            {owner: {}}
        );
        const [electricArrowAbility] = electricArrow.abilities;
        assert.ok(electricArrowAbility.effect);
        assert.equal(typeof electricArrowAbility.effect.canRun, 'function');
        assert.ok(electricArrowAbility.arrow?.cost);
        assert.equal(typeof electricArrowAbility.arrow.cost.canRun, 'function');
        const cableArrow = factory.cardsFactory.createGameCardFromConfig(
            cableArrowEntry.card,
            {owner: {}}
        );
        const [cableArrowAbility] = cableArrow.abilities;
        assert.ok(cableArrowAbility.effect);
        assert.equal(typeof cableArrowAbility.effect.canRun, 'function');
        assert.equal(cableArrowAbility.effect.ignoreCrisis, true);
        assert.ok(cableArrowAbility.arrow?.cost);
        assert.equal(typeof cableArrowAbility.arrow.cost.canRun, 'function');
        const mainScheme = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MAIN_SCHEME_B_CARD,
            params: {
                name: 'Test Main Scheme',
                value: 10,
                startingThreat: 3,
            },
        });
        mainScheme.threat = 3;
        mainScheme.match.hasCrisis = true;
        assert.equal(
            cableArrowAbility.effect.filterTarget(mainScheme, {
                player: {hasPatrol: false},
            }),
            true
        );
        const abilities = [
            alterEgoSide.abilities.find(({name}) => name === 'Arma predilecta'),
            heroSide.abilities.find(({name}) => name === 'Desefundado rápido'),
        ];
        for (const ability of abilities) {
            assert.ok(ability);
            assert.ok(ability.effect);
            assert.equal(typeof ability.effect.canRun, 'function');
            assert.ok(ability.arrow?.cost);
            assert.equal(typeof ability.arrow.cost.canRun, 'function');
        }
    });

    test('Los héroes más poderosos exhausts one Avenger and readies another', async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        const eventEntry = catalog.aspects.find(({_id}) =>
            _id === 'basic-los-heroes-mas-poderosos');
        assert.ok(hawkeye);
        assert.ok(eventEntry);

        const factory = new MatchFactory({
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
        });
        const superhero = factory.createSuperhero({...hawkeye.config, precon: []});
        const heroSide = superhero.sides.find(({isHero}) => isHero);
        superhero.selectedSide = superhero.sides.indexOf(heroSide);

        const player = {
            isHero: true,
            isPlayer: true,
            name: 'Clint',
            allies: [],
            friends: [],
            upgrades: [],
            superhero,
            async canReady() {
                return true;
            },
        };
        superhero.owner = player;

        const createCharacter = (id, traits, exhausted) => ({
            id,
            name: id,
            traits,
            abilities: [],
            exhausted,
            owner: player,
            controller: player,
            async exhaust() {
                this.exhausted = true;
            },
            async ready() {
                this.exhausted = false;
            },
            async refresh() {},
            toObj() {
                return {
                    id: this.id,
                    name: this.name,
                };
            },
        });
        const exhaustedByCost = createCharacter(
            'cost-avenger',
            [TRAIT_AVENGER],
            false
        );
        const readiedAvenger = createCharacter(
            'readied-avenger',
            [TRAIT_AVENGER],
            true
        );
        const secondReadiedAvenger = createCharacter(
            'second-readied-avenger',
            [TRAIT_AVENGER],
            true
        );
        const nonAvenger = createCharacter('non-avenger', [], true);
        player.allies.push(
            exhaustedByCost,
            readiedAvenger,
            secondReadiedAvenger,
            nonAvenger
        );
        player.friends.push(...player.allies);
        factory.match.players.push(player);
        factory.match.openDialog = async ({data}) => {
            assert.equal(ability.arrow.cost.selectedTarget, exhaustedByCost);
            assert.deepEqual(data.cards.map(({id}) => id), [
                readiedAvenger.id,
                secondReadiedAvenger.id,
            ]);

            return {
                selected: {id: readiedAvenger.id},
            };
        };

        const eventCard = factory.cardsFactory.createGameCard({
            card: factory.cardsFactory.createCard(eventEntry.card),
            owner: player,
        });
        const [ability] = eventCard.abilities;
        assert.equal(eventEntry.card.params.name, 'Los héroes más poderosos');
        assert.equal(eventEntry.card.params.image, 'aspect/basic/events/04022.png');
        assert.equal(eventEntry.card.params.cost, 0);
        assert.deepEqual(eventEntry.card.params.resources, [RESOURCE_ENERGY]);
        assert.equal(eventEntry.card.params.abilities[0].type, ABILITY_HERO_ACTION);
        assert.equal(ability.isAction, true);
        assert.equal(ability.arrow.cost.effectType, EFFECT_EXHAUST);
        assert.equal(ability.arrow.cost.target, TARGET_ANY_CHARACTER_YOU_CONTROL);
        assert.equal(ability.effect.effectType, EFFECT_READY);
        assert.equal(ability.effect.target, TARGET_ANY_CHARACTER_YOU_CONTROL);
        assert.equal(
            ability.effect.excludeTarget,
            'ability.arrow.cost.selectedTarget'
        );
        assert.equal(typeof ability.effect.canRun, 'function');
        assert.equal(typeof ability.arrow.cost.canRun, 'function');

        await ability.resolveAbility({
            card: eventCard,
            match: factory.match,
            player,
        });

        assert.equal(exhaustedByCost.exhausted, true);
        assert.equal(readiedAvenger.exhausted, false);
        assert.equal(secondReadiedAvenger.exhausted, true);
        assert.equal(nonAvenger.exhausted, true);
    });

    test('Máquina de Guerra gains Ranged for its basic attack', async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        const warMachineEntry = catalog.aspects.find(({_id}) =>
            _id === 'basic-maquina-de-guerra');
        assert.ok(hawkeye);
        assert.ok(warMachineEntry);

        const factory = new MatchFactory({
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
        });
        const superhero = factory.createSuperhero({...hawkeye.config, precon: []});
        const heroSide = superhero.sides.find(({isHero}) => isHero);
        superhero.selectedSide = superhero.sides.indexOf(heroSide);
        const player = {
            isHero: true,
            isPlayer: true,
            name: 'Clint',
            allies: [],
            upgrades: [],
            superhero,
        };
        superhero.owner = player;
        factory.match.players.push(player);

        const printedWarMachine = factory.cardsFactory.createCard(
            warMachineEntry.card
        );
        assert.equal(printedWarMachine.toughness, true);
        const warMachine = factory.cardsFactory.createGameCard({
            card: printedWarMachine,
            owner: player,
        });
        warMachine.controller = player;
        player.allies.push(warMachine);
        await warMachine.initTriggers();

        const basicAttackAbility = warMachine.abilities.find(ability =>
            ability.isBasic && ability.isAttack);
        assert.ok(basicAttackAbility);
        const rangedAbility = warMachine.abilities.find(({trigger}) =>
            trigger === TRIGGER_THIS_ATTACK);
        assert.ok(rangedAbility);
        assert.equal(typeof rangedAbility.effect.canRun, 'function');

        const attack = new DealDamageEffect({
            ability: basicAttackAbility,
            damage: 2,
            match: factory.match,
            selectedTarget: {isEnemy: true},
        });
        const params = {player};
        await attack.prepare(params);
        await attack.triggerInit(attack.getTriggersParams(params));

        assert.equal(attack.ranged, true);
    });

    test('Black Knight gains Piercing only on its basic attack', async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        const blackKnightEntry = catalog.aspects.find(({_id}) =>
            _id === 'leadership-caballero-negro');
        assert.ok(hawkeye);
        assert.ok(blackKnightEntry);

        const factory = new MatchFactory({
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
        });
        const superhero = factory.createSuperhero({...hawkeye.config, precon: []});
        const heroSide = superhero.sides.find(({isHero}) => isHero);
        superhero.selectedSide = superhero.sides.indexOf(heroSide);
        const player = {
            isHero: true,
            isPlayer: true,
            name: 'Clint',
            allies: [],
            upgrades: [],
            superhero,
        };
        superhero.owner = player;
        factory.match.players.push(player);

        const blackKnight = factory.cardsFactory.createGameCard({
            card: factory.cardsFactory.createCard(blackKnightEntry.card),
            owner: player,
        });
        blackKnight.controller = player;
        player.allies.push(blackKnight);
        await blackKnight.initTriggers();

        const basicAttackAbility = blackKnight.abilities.find(({isBasic, isAttack}) =>
            isBasic && isAttack);
        assert.ok(basicAttackAbility);
        const attackParams = {player};
        const enemy = {isEnemy: true};
        const basicAttack = new DealDamageEffect({
            ability: basicAttackAbility,
            damage: 1,
            match: factory.match,
            selectedTarget: enemy,
        });
        await basicAttack.prepare(attackParams);
        await basicAttack.triggerInit(basicAttack.getTriggersParams(attackParams));
        assert.equal(basicAttack.piercing, true);

        const nonBasicAttack = new DealDamageEffect({
            ability: {
                card: blackKnight,
                character: blackKnight,
                isAttack: true,
                isBasic: false,
            },
            damage: 1,
            match: factory.match,
            selectedTarget: enemy,
        });
        await nonBasicAttack.prepare(attackParams);
        await nonBasicAttack.triggerInit(
            nonBasicAttack.getTriggersParams(attackParams)
        );
        assert.equal(nonBasicAttack.piercing, false);
    });

    test('Tirador experto generates a wild resource only for Arrow Events', async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        assert.ok(hawkeye);

        const expertMarksmanEntry = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Tirador experto');
        assert.ok(expertMarksmanEntry);
        assert.equal(expertMarksmanEntry.count, 2);
        assert.equal(expertMarksmanEntry.card.type, CARD_TYPE_UPGRADE);
        assert.equal(expertMarksmanEntry.card.params.image, 'heroes/hawkeye/04010.png');
        assert.equal(expertMarksmanEntry.card.params.cost, 1);
        assert.deepEqual(expertMarksmanEntry.card.params.traits, [TRAIT_SKILL]);
        assert.deepEqual(expertMarksmanEntry.card.params.resources, [RESOURCE_WILD]);

        const [abilityConfig] = expertMarksmanEntry.card.params.abilities;
        assert.equal(abilityConfig.type, ABILITY_RESOURCE);
        assert.equal(abilityConfig.params.resource, RESOURCE_WILD);
        assert.deepEqual(abilityConfig.params.condition, {
            'cardToPay.isEvent': true,
            'cardToPay.traits': TRAIT_ARROW,
        });
        assert.deepEqual(abilityConfig.params.arrow, {
            type: EFFECT_EXHAUST,
            params: {target: TARGET_THIS},
        });

        const player = {
            isPlayer: true,
            gameZone: {refresh: async () => {}},
        };
        const cardsFactory = new CardsFactory({match: {triggerCards: {}}});
        const gameCard = cardsFactory.createGameCard({
            card: cardsFactory.createCard(expertMarksmanEntry.card),
            owner: player,
        });
        gameCard.controller = player;
        gameCard.refresh = async () => {};

        const [ability] = gameCard.abilities;
        assert.ok(ability instanceof ResourceAbility);
        assert.equal(ability.resource, RESOURCE_WILD);
        assert.equal(typeof ability.arrow.cost.canRun, 'function');
        ability.arrow.canPay = async () => true;

        const arrowEvent = {
            isEvent: true,
            traits: [TRAIT_ARROW],
        };
        const nonArrowEvent = {
            isEvent: true,
            traits: [],
        };
        const arrowAlly = {
            isEvent: false,
            traits: [TRAIT_ARROW],
        };

        assert.equal(
            await gameCard.hasResourceGenerators(arrowEvent, RESOURCE_WILD),
            true
        );
        assert.equal(
            await gameCard.hasResourceGenerators(arrowEvent, RESOURCE_PHYSICAL),
            true
        );
        assert.equal(
            await gameCard.hasResourceGenerators(nonArrowEvent, RESOURCE_WILD),
            false
        );
        assert.equal(
            await gameCard.hasResourceGenerators(arrowAlly, RESOURCE_WILD),
            false
        );

        await ability.payArrow({player, card: gameCard});
        assert.equal(gameCard.exhausted, true);
    });

    test('Carcaj de Ojo de Halcón tucks a matching Arrow Event selected from the top five', async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        const quiverConfig = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Carcaj de Ojo de Halcón').card;
        const entryFor = name => hawkeye.config.cards.find(({card}) =>
            card.params.name === name).card;
        let searchOptions;
        let shuffleCount = 0;
        const runtimeState = {};
        const match = {
            name: 'test-match',
            players: [],
            triggerCards: {},
            isUniqueCard: () => false,
            async openDialog({data}) {
                searchOptions = data.cards;
                const selected = data.cards.find(({name}) =>
                    name === 'Flecha sónica');

                return {selected: selected ? [selected] : []};
            },
        };
        const factory = new MatchFactory(match);
        const owner = {
            isPlayer: true,
            isHero: true,
            hand: {
                cards: [],
                async refresh() {},
            },
            deck: {
                cards: [],
                discardPile: [],
                markKnown() {},
                shuffle() {
                    assert.deepEqual(
                        runtimeState.quiver.tuckedCards,
                        [runtimeState.cards[1]]
                    );
                    assert.equal(
                        this.cards.length,
                        runtimeState.cards.length - 1
                    );
                    shuffleCount++;
                    this.cards.reverse();
                },
                async searchDeck(card) {
                    this.cards.splice(this.cards.indexOf(card), 1);
                },
                searchDiscard() {},
                async refresh() {},
            },
            gameZone: {
                cards: [],
                async refresh() {},
            },
        };
        const quiver = factory.cardsFactory.createGameCardFromConfig(
            quiverConfig,
            {owner}
        );
        const cards = [
            'Pájaro Burlón',
            'Flecha sónica',
            'Arco de Ojo de Halcón',
            'Flecha explosiva',
            'Flecha eléctrica',
            'Flecha con cable',
        ].map(name => factory.cardsFactory.createGameCardFromConfig(
            entryFor(name),
            {owner}
        ));
        runtimeState.quiver = quiver;
        runtimeState.cards = cards;
        owner.deck.cards.push(...cards);
        owner.gameZone.cards.push(quiver);
        quiver.controller = owner;
        quiver.refresh = async () => {};
        match.players.push(owner);

        await quiver.abilities[0].resolveAbility({player: owner});

        assert.equal(quiver.exhausted, true);
        assert.equal(shuffleCount, 1);
        assert.deepEqual(
            searchOptions.map(({name}) => name),
            [
                'Flecha sónica',
                'Flecha explosiva',
                'Flecha eléctrica',
            ]
        );
        assert.deepEqual(quiver.tuckedCards, [cards[1]]);
        assert.deepEqual(owner.deck.cards, [
            cards[5],
            cards[4],
            cards[3],
            cards[2],
            cards[0],
        ]);
    });

    test('Flecha sónica scales damage from the enemy confusion already present', async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        const sonicArrowEntry = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Flecha sónica');
        const factory = new MatchFactory({players: [], triggerCards: {}});
        const sonicArrow = factory.cardsFactory.createGameCardFromConfig(
            sonicArrowEntry.card,
            {owner: {}}
        );
        const [ability] = sonicArrow.abilities;
        const [damageEffect, confuseEffect] = ability.effect.effects;

        for (const {isConfused, damage} of [
            {isConfused: false, damage: 3},
            {isConfused: true, damage: 5},
        ]) {
            damageEffect.selectedTarget = {isConfused};
            const resolvedParams = await damageEffect.resolveParams({});

            assert.equal(resolvedParams.damage, damage);
        }

        const enemy = {
            isConfused: false,
            confuse() {
                this.isConfused = true;
            },
            refresh() {},
        };
        confuseEffect.selectedTarget = enemy;
        await confuseEffect.execute({});
        assert.equal(enemy.isConfused, true);
    });

    test('Flecha eléctrica stuns the enemy and scales damage from its prior stun', async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        const electricArrowEntry = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Flecha eléctrica');
        const factory = new MatchFactory({players: [], triggerCards: {}});
        const electricArrow = factory.cardsFactory.createGameCardFromConfig(
            electricArrowEntry.card,
            {owner: {}}
        );
        const [ability] = electricArrow.abilities;
        const [damageEffect, stunEffect] = ability.effect.effects;
        const enemy = {
            isStunned: false,
            stun() {
                this.isStunned = true;
            },
            refresh() {},
        };
        damageEffect.selectedTarget = enemy;
        assert.equal((await damageEffect.resolveParams({})).damage, 3);

        stunEffect.selectedTarget = enemy;
        await stunEffect.execute({});
        assert.equal(enemy.isStunned, true);

        damageEffect.selectedTarget = {isStunned: true};
        assert.equal((await damageEffect.resolveParams({})).damage, 5);
    });

    test("Flecha explosiva exhausts the Bow and damages the villain and chosen player's minions", async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        assert.ok(hawkeye);
        const explosiveArrowEntry = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Flecha explosiva');
        assert.ok(explosiveArrowEntry);

        const factory = new MatchFactory({
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
        });
        const superhero = factory.createSuperhero({...hawkeye.config, precon: []});
        const heroSide = superhero.sides.find(({isHero}) => isHero);
        superhero.selectedSide = superhero.sides.indexOf(heroSide);
        const player = {
            id: 'hawkeye-player',
            isHero: true,
            isPlayer: true,
            name: 'Clint Barton',
            upgrades: [],
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        superhero.owner = player;
        const chosenMinions = [
            {id: 'chosen-minion-1', name: 'Chosen Minion 1'},
            {id: 'chosen-minion-2', name: 'Chosen Minion 2'},
        ].map(minion => ({
            ...minion,
            abilities: [],
            isEnemy: true,
            isInPlay: true,
            isMinion: true,
            toObj() {
                return {id: this.id, name: this.name};
            },
        }));
        const unchosenMinion = {
            id: 'unchosen-minion',
            name: 'Unchosen Minion',
            abilities: [],
            isEnemy: true,
            isInPlay: true,
            isMinion: true,
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        const chosenPlayer = {
            id: 'chosen-player',
            isPlayer: true,
            name: 'Chosen Player',
            minions: chosenMinions,
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        const unchosenPlayer = {
            id: 'unchosen-player',
            isPlayer: true,
            name: 'Unchosen Player',
            minions: [unchosenMinion],
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        const villain = {
            id: 'test-villain',
            name: 'Test Villain',
            abilities: [],
            isEnemy: true,
            isInPlay: true,
            isVillain: true,
            toObj() {
                return {id: this.id, name: this.name};
            },
        };
        const match = factory.match;
        match.players.push(player, chosenPlayer, unchosenPlayer);
        match.villain = villain;
        match.openDialog = async ({data}) => ({
            selected: data.cards.find(({id}) => id === chosenPlayer.id),
        });

        const bowEntry = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Arco de Ojo de Halcón');
        assert.ok(bowEntry);
        const bow = factory.cardsFactory.createGameCardFromConfig(
            bowEntry.card,
            {owner: player}
        );
        bow.controller = player;
        player.upgrades.push(bow);

        const explosiveArrow = factory.cardsFactory.createGameCardFromConfig(
            explosiveArrowEntry.card,
            {owner: player}
        );
        const [ability] = explosiveArrow.abilities;
        const damageCalls = [];
        const createEffect = match.effectsFactory.createEffect.bind(
            match.effectsFactory
        );
        match.effectsFactory.createEffect = params => {
            if (params.type === EFFECT_TAKE_DAMAGE) {
                damageCalls.push(params);

                return {
                    takenDamage: params.damage,
                    defeated: false,
                    async runEffect() {},
                };
            }

            return createEffect(params);
        };

        await ability.resolveAbility({card: explosiveArrow, match, player});

        assert.equal(bow.exhausted, true);
        assert.equal(damageCalls.length, 2);
        assert.strictEqual(damageCalls[0].selectedTarget, villain);
        assert.equal(damageCalls[0].damage, 3);
        assert.deepEqual(damageCalls[1].selectedTarget, chosenMinions);
        assert.equal(damageCalls[1].damage, 3);
    });

    test('Mockingbird returns to hand and prevents all damage from the initiating villain attack', async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        assert.ok(hawkeye);

        const factory = new MatchFactory({
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
        });
        const superhero = factory.createSuperhero({...hawkeye.config, precon: []});
        const heroSide = superhero.sides.find(({isHero}) => isHero);
        superhero.selectedSide = superhero.sides.indexOf(heroSide);
        let resourceGenerated = false;
        const generator = {
            id: 'physical-resource-generator',
            abilities: [
                {
                    isResource: true,
                    resources: [RESOURCE_PHYSICAL],
                },
            ],
            async resolveResourceAbility() {
                resourceGenerated = true;
            },
        };
        const paidResources = [];
        const player = {
            defenders: [],
            gameZone: {
                async refresh() {},
            },
            hand: {
                cards: [],
                addCards(cards) {
                    this.cards.push(...cards);
                },
                async refresh() {},
            },
            isHero: true,
            isPlayer: true,
            name: 'Clint Barton',
            async getCardsToPay() {
                return {generators: [generator], hand: []};
            },
            async spendResources(resources) {
                paidResources.push(resources);
                return {
                    generators: [generator],
                    hand: [],
                    resources: [RESOURCE_PHYSICAL],
                };
            },
            async getLife() {
                return 10 - (this.damage || 0);
            },
            placeDamage(damage) {
                this.damage = (this.damage || 0) + damage;
            },
            async refresh() {},
        };
        player.superhero = superhero;
        superhero.owner = player;
        factory.match.players.push(player);

        const mockingbirdDefinition = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Pájaro Burlón');
        assert.ok(mockingbirdDefinition);
        const mockingbird = factory.cardsFactory.createGameCard({
            card: factory.cardsFactory.createCard(mockingbirdDefinition.card),
            owner: player,
        });
        mockingbird.controller = player;
        mockingbird.remove = async () => {
            mockingbird.controller = undefined;
        };
        mockingbird.refresh = async () => {};

        const ability = mockingbird.abilities.find(({isInterrupt}) =>
            isInterrupt);
        assert.ok(ability);
        const createAttack = () => {
            const attack = new EnemyAttackEffect({
                enemy: {
                    isEnemy: true,
                    isInPlay: true,
                    isVillain: true,
                    name: 'Villano de prueba',
                },
                match: factory.match,
                selectedTarget: player,
            });
            attack.dealBoostCards = async () => {};
            attack.showBoostCards = async () => {};
            attack.defense = async () => {};
            attack.getAttackValue = async () => 4;
            attack.resolveBoostCards = async () => 0;
            attack.canContinueActivation = () => true;
            attack.resolveDelayedEffects = async () => {};

            return attack;
        };
        const attack = createAttack();

        const takeDamageParams = [];
        const createEffect = factory.match.effectsFactory.createEffect.bind(
            factory.match.effectsFactory
        );
        factory.match.effectsFactory.createEffect = params => {
            if (params.type === EFFECT_TAKE_DAMAGE) {
                takeDamageParams.push(params);
            }

            return createEffect(params);
        };

        await ability.resolveAbility({
            effect: attack,
            match: factory.match,
            player,
        });

        assert.equal(ability.resolved, true);
        assert.deepEqual(paidResources, [[RESOURCE_ANY]]);
        assert.equal(resourceGenerated, true);
        assert.equal(mockingbird.controller, undefined);
        assert.deepEqual(player.hand.cards, [mockingbird]);
        assert.equal(typeof attack.preventDamage, 'number');
        assert.ok(attack.preventDamage >= 4);

        await attack.execute({match: factory.match, player});

        assert.equal(takeDamageParams[0].preventDamage, 4);
        assert.equal(player.damage, undefined);
        assert.equal(attack.activation.takenDamage, 0);

        const limitedAttack = createAttack();
        limitedAttack.preventDamage = 2;
        await limitedAttack.execute({match: factory.match, player});

        assert.equal(takeDamageParams[1].preventDamage, 2);
        assert.equal(player.damage, 2);
        assert.equal(limitedAttack.activation.takenDamage, 2);
    });

    test("hero and alter-ego actions ready and find Hawkeye's Bow", async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        assert.ok(hawkeye);
        const factory = new MatchFactory({
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
        });
        const superhero = factory.createSuperhero({...hawkeye.config, precon: []});
        const alterEgoSide = superhero.sides.find(({isAlterEgo}) => isAlterEgo);
        const heroSide = superhero.sides.find(({isHero}) => isHero);
        const deck = {
            cards: [],
            discardPile: [],
            markKnown() {},
            refresh() {},
            searchDeck(card) {
                this.cards.splice(this.cards.indexOf(card), 1);
            },
            searchDiscard(card) {
                this.discardPile.splice(this.discardPile.indexOf(card), 1);
            },
            shuffle() {
                this.shuffled = true;
            },
        };
        const hand = {
            cards: [],
            addCard(card) {
                this.cards.push(card);
            },
            refresh() {},
        };
        const player = {
            deck,
            hand,
            isPlayer: true,
            name: 'Clint',
            upgrades: [],
            superhero,
        };
        superhero.owner = player;
        factory.match.players.push(player);

        const bow = factory.cardsFactory.createGameCard({
            card: factory.cardsFactory.createCard(hawkeye.config.cards[0].card),
            owner: player,
        });
        bow.controller = player;
        player.upgrades.push(bow);
        bow.exhaust();

        const heroAction = heroSide.abilities.find(({name}) =>
            name === 'Desefundado rápido');
        await heroAction.effect.runEffect({
            match: factory.match,
            player,
        });
        assert.equal(bow.exhausted, false);

        deck.discardPile.push(bow);
        const alterEgoAction = alterEgoSide.abilities.find(({name}) =>
            name === 'Arma predilecta');
        const searchEffect = alterEgoAction.effect.effects[0];
        searchEffect.openDialog = async ({data}) => ({
            selected: [{id: data.cards[0].id}],
        });
        await alterEgoAction.effect.runEffect({
            match: factory.match,
            player,
        });

        assert.deepEqual(hand.cards, [bow]);
        assert.deepEqual(deck.discardPile, []);
        assert.equal(deck.shuffled, true);
    });

    test('Bow boosts the hero and grants Ranged only to attacks from Arrow cards', async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        assert.ok(hawkeye);

        const factory = new MatchFactory({
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
        });
        const superhero = factory.createSuperhero({...hawkeye.config, precon: []});
        const heroSide = superhero.sides.find(({isHero}) => isHero);
        superhero.selectedSide = superhero.sides.indexOf(heroSide);
        const player = {
            isHero: true,
            isPlayer: true,
            name: 'Clint',
            upgrades: [],
            superhero,
        };
        superhero.owner = player;
        factory.match.players.push(player);

        const bow = factory.cardsFactory.createGameCard({
            card: factory.cardsFactory.createCard(hawkeye.config.cards[0].card),
            owner: player,
        });
        bow.controller = player;
        player.upgrades.push(bow);
        await bow.initTriggers();

        const responseCard = factory.cardsFactory.createGameCard({
            card: factory.cardsFactory.createCard({
                type: CARD_TYPE_UPGRADE,
                params: {
                    name: 'Respuesta de prueba',
                    abilities: [
                        {
                            type: ABILITY_FORCED_RESPONSE,
                            params: {
                                hideDialog: true,
                                trigger: TRIGGER_YOU_ATTACK,
                                effect: {
                                    type: EFFECT_MODIFY_ATTACK,
                                    params: {
                                        target: TARGET_EFFECT,
                                        modify: {responseSeen: true},
                                    },
                                },
                            },
                        },
                    ],
                },
            }),
            owner: player,
        });
        responseCard.controller = player;
        player.upgrades.push(responseCard);
        await responseCard.initTriggers();

        assert.equal(await heroSide.getAttackValue({player}), 3);

        const createSourceCard = (type, name, traits) =>
            factory.cardsFactory.createGameCard({
                card: factory.cardsFactory.createCard({
                    type,
                    params: {
                        name,
                        traits,
                        abilities: [
                            {
                                type: ABILITY_HERO_ACTION,
                                params: {
                                    labels: [LABEL_ATTACK],
                                    effect: {
                                        type: EFFECT_DEAL_DAMAGE,
                                        params: {damage: 1},
                                    },
                                },
                            },
                        ],
                    },
                }),
                owner: player,
            });

        const applyBowToAttack = async ability => {
            const attack = new DealDamageEffect({
                ability,
                damage: 1,
                match: factory.match,
                selectedTarget: {isEnemy: true},
            });
            const params = {player};
            await attack.prepare(params);
            await attack.triggerInit(attack.getTriggersParams(params));
            return attack;
        };

        const arrowEvent = createSourceCard(
            CARD_TYPE_EVENT,
            'Evento Flecha',
            [TRAIT_ARROW]
        );
        const arrowEventAttack = await applyBowToAttack(arrowEvent.abilities[0]);
        assert.equal(arrowEventAttack.ranged, true);
        assert.equal(arrowEventAttack.responseSeen, undefined);
        await arrowEventAttack.triggerEnds(arrowEventAttack.getTriggersParams({player}));
        assert.equal(arrowEventAttack.responseSeen, true);

        const arrowUpgrade = createSourceCard(
            CARD_TYPE_UPGRADE,
            'Mejora Flecha',
            [TRAIT_ARROW]
        );
        arrowUpgrade.controller = player;
        const arrowUpgradeAttack = await applyBowToAttack(arrowUpgrade.abilities[0]);
        assert.equal(arrowUpgradeAttack.ranged, true);

        const nonArrowEvent = createSourceCard(
            CARD_TYPE_EVENT,
            'Evento sin Flecha',
            [TRAIT_WEAPON]
        );
        const nonArrowAttack = await applyBowToAttack(nonArrowEvent.abilities[0]);
        assert.equal(nonArrowAttack.ranged, false);

        const basicAttackAbility = heroSide.abilities.find(ability =>
            ability.isBasic && ability.isAttack);
        const basicAttack = await applyBowToAttack(basicAttackAbility);
        assert.equal(basicAttack.ranged, false);

        const arrowAlly = factory.cardsFactory.createGameCard({
            card: factory.cardsFactory.createCard({
                type: CARD_TYPE_ALLY,
                params: {
                    name: 'Aliado Flecha',
                    traits: [TRAIT_ARROW],
                    attack: 1,
                    thwart: 1,
                    defense: 1,
                    hitPoints: 3,
                },
            }),
            owner: player,
        });
        arrowAlly.controller = player;
        const allyAttackAbility = arrowAlly.abilities.find(ability =>
            ability.isBasic && ability.isAttack);
        const allyAttack = await applyBowToAttack(allyAttackAbility);
        assert.equal(allyAttack.ranged, false);
    });

    test('Vibranium Arrow grants Piercing to its attack', async () => {
        const catalog = await loadCatalog();
        const hawkeye = catalog.heroes.find(({_id}) => _id === 'hawkeye');
        assert.ok(hawkeye);
        const arrowEntry = hawkeye.config.cards.find(({card}) =>
            card.params.name === 'Flecha de vibránium');
        assert.ok(arrowEntry);

        const factory = new MatchFactory({
            mc: {mcSocket: {send() {}}},
            players: [],
            triggerCards: {},
        });
        const superhero = factory.createSuperhero({...hawkeye.config, precon: []});
        const heroSide = superhero.sides.find(({isHero}) => isHero);
        superhero.selectedSide = superhero.sides.indexOf(heroSide);
        const player = {
            isHero: true,
            isPlayer: true,
            name: 'Clint',
            upgrades: [],
            superhero,
        };
        superhero.owner = player;
        factory.match.players.push(player);

        const arrow = factory.cardsFactory.createGameCard({
            card: factory.cardsFactory.createCard(arrowEntry.card),
            owner: player,
        });
        const attackAbility = arrow.abilities.find(({isAttack}) => isAttack);
        assert.ok(attackAbility);
        assert.equal(typeof attackAbility.effect.canRun, 'function');
        assert.ok(attackAbility.arrow?.cost);
        assert.equal(typeof attackAbility.arrow.cost.canRun, 'function');
        attackAbility.prepareEffect({preselectedTarget: true});
        assert.equal(attackAbility.effect.isAttack, true);

        const enemy = {
            damage: 0,
            isEnemy: true,
            isInPlay: true,
            isTough: true,
            async getLife() {
                return 20 - this.damage;
            },
            placeDamage(damage) {
                this.damage += damage;
            },
            removeTough() {
                this.isTough = false;
            },
            async refresh() {},
        };
        attackAbility.effect.selectedTarget = enemy;
        await attackAbility.effect.runEffect({
            match: factory.match,
            player,
        });

        assert.equal(attackAbility.effect.piercing, true);
        assert.equal(enemy.damage, 6);
        assert.equal(enemy.isTough, false);
    });
});
