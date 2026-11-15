import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    ABILITY_HERO_INTERRUPT,
    ABILITY_HERO_RESPONSE,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    CARD_TYPE_MINION,
    CARD_TYPE_OBLIGATION,
    CARD_TYPE_SIDE_SCHEME_SCENARIO,
    CARD_TYPE_TREACHERY,
    CARD_TYPE_UPGRADE,
    CLASSIFICATION_HERO,
    DIALOG_ASSIGN,
    DIALOG_USE_CARD,
    EFFECT_ADD_ADDITIONAL_DAMAGE,
    EFFECT_ASSIGN_DAMAGE,
    EFFECT_CHAINED,
    EFFECT_DO_IF,
    EFFECT_FOR_EACH,
    EFFECT_MODIFY_COST,
    EFFECT_MODIFY_DEFENSE_VALUE,
    EFFECT_MODIFY_RETALIATE_VALUE,
    EFFECT_PLACE_COUNTERS,
    EFFECT_READY,
    LABEL_ATTACK,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
    TARGET_ALL_PLAYERS,
    TARGET_DECK,
    TARGET_EFFECT,
    TARGET_PLAYER,
    TARGET_SOURCE,
    TARGET_YOU,
    TRAIT_AERIAL,
    TRAIT_ATTACK,
    TRAIT_CONDITION,
    TRAIT_GUARDIAN,
    TRAIT_LEVIATHON,
    TRAIT_SKILL,
    TRAIT_SUPERPOWER,
    TRIGGER_HERO_DEFENDED_ATTACK,
    TRIGGER_HERO_DEFENDS_ATTACK,
    TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
    TRIGGER_THIS_ACTIVATES,
    TRIGGER_VILLAIN_PHASE_START,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_YOU_BASIC_DEFENSE,
    TRIGGER_YOU_BASIC_THWART,
    TRIGGER_YOU_PLAY_CARD,
    TRIGGER_YOUR_HERO_GET_RETALIATE,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {CardsFactory} from '../../src/factory/cards/cards-factory.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {Match} from '../../src/model/match/match.js';

describe('Groot added cards', () => {
    const createGrootFixture = async name => {
        const {heroes} = await loadCatalog();
        const groot = heroes.find(({_id}) => _id === 'groot');
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

        return {groot, match, player, superhero};
    };

    const getCard = (aspects, id) => {
        const entry = aspects.find(({_id}) => _id === id);
        assert.ok(entry, `Missing aspect card ${id}`);

        return entry.card;
    };
    const resolveFlamesDamage = async (
        name,
        {burningInfernoInPlay = false, furnaxInPlay = false},
    ) => {
        const {groot, match, player, superhero} =
            await createGrootFixture(name);
        const flamesConfig = groot.config.nemesis.find(({card}) =>
            card.params.name === 'Avivar las llamas').card;
        match.scenario = {
            villain: {isInPlay: false},
            schemes: [],
            sideSchemes: burningInfernoInPlay ?
                [{name: 'Infierno abrasador'}] :
                [],
            gameZone: {inPlayCards: []},
        };
        if (furnaxInPlay) {
            player.gameZone.engage({name: 'Furnax'});
        }
        match.openDialog = async () => ({});
        const flames = new CardsFactory({match}).createGameCardFromConfig(
            flamesConfig,
            {owner: player},
        );

        await flames.abilities[0].resolveAbility({
            card: flames,
            match,
            player,
        });

        return superhero.damage;
    };

    test('registers Groot upgrades, the expanded precon, obligation, and nemesis set', async () => {
        const {heroes} = await loadCatalog();
        const groot = heroes.find(({_id}) => _id === 'groot');

        assert.deepEqual(
            groot.config.cards.slice(6).map(({count, card}) => [
                count,
                card.type,
                card.params.name,
            ]),
            [
                [1, CARD_TYPE_UPGRADE, 'Enredaderas'],
                [1, CARD_TYPE_UPGRADE, 'Lianas lacerantes'],
                [1, CARD_TYPE_UPGRADE, 'Escudo de lianas'],
                [1, CARD_TYPE_UPGRADE, 'Lianas puntiagudas'],
            ],
        );
        assert.deepEqual(groot.config.precon.flatMap(({cardRefs}) => cardRefs), [
            {id: 'basic-energy', count: 1},
            {id: 'basic-strength', count: 1},
            {id: 'basic-genius', count: 1},
            {id: 'basic-mapache-cohete', count: 1},
            {id: 'basic-flora-y-fauna', count: 1},
            {id: 'basic-concentracion-eficaz', count: 3},
            {id: 'protection-defensa-desesperada', count: 3},
            {id: 'protection-el-poder-de-la-proteccion', count: 2},
            {id: 'protection-indomito', count: 2},
            {id: 'protection-halcon-estelar', count: 1},
            {id: 'protection-en-plena-forma', count: 3},
            {id: 'protection-intrepido', count: 3},
            {id: 'protection-dificil-de-ignorar', count: 3},
        ]);
        assert.equal(groot.config.obligation.count, 1);
        assert.equal(groot.config.obligation.card.type, CARD_TYPE_OBLIGATION);
        assert.equal(groot.config.obligation.card.params.name, 'Marchitamiento');
        assert.equal(groot.config.obligation.card.params.giveToOwner, true);
        assert.equal(groot.config.obligation.card.params.boost, 2);
        assert.deepEqual(
            groot.config.nemesis.map(({count, card}) => [
                count,
                card.type,
                card.params.name,
            ]),
            [
                [1, CARD_TYPE_SIDE_SCHEME_SCENARIO, 'Infierno abrasador'],
                [1, CARD_TYPE_MINION, 'Furnax'],
                [3, CARD_TYPE_TREACHERY, 'Avivar las llamas'],
            ],
        );
    });

    test('Groot upgrades use the intended basic-action trigger windows', async () => {
        const {heroes} = await loadCatalog();
        const groot = heroes.find(({_id}) => _id === 'groot');
        const upgrades = groot.config.cards.slice(6).map(({card}) => card.params);

        assert.deepEqual(upgrades.map(({resources, cost}) => [resources, cost]), [
            [[RESOURCE_MENTAL], 1],
            [[RESOURCE_ENERGY], 1],
            [[RESOURCE_PHYSICAL], 1],
            [[RESOURCE_PHYSICAL], 1],
        ]);
        assert.ok(upgrades.every(({traits, classification}) =>
            traits.includes(TRAIT_SUPERPOWER) &&
            classification === CLASSIFICATION_HERO));
        assert.equal(
            upgrades[0].abilities[0].params.trigger,
            TRIGGER_YOU_BASIC_THWART,
        );
        assert.deepEqual(upgrades[1].abilities[0].params.trigger, [
            TRIGGER_YOU_BASIC_ATTACK,
            TRIGGER_YOU_BASIC_THWART,
            TRIGGER_YOU_BASIC_DEFENSE,
        ]);
        assert.equal(
            upgrades[2].abilities[0].params.trigger,
            TRIGGER_HERO_DEFENDS_ATTACK,
        );
        assert.equal(
            upgrades[2].abilities[0].params.effect.type,
            EFFECT_MODIFY_DEFENSE_VALUE,
        );
        assert.equal(
            upgrades[3].abilities[0].params.trigger,
            TRIGGER_YOU_BASIC_ATTACK,
        );
        assert.equal(
            upgrades[0].abilities[0].type,
            ABILITY_HERO_INTERRUPT,
        );
        assert.equal(
            upgrades[1].abilities[0].type,
            ABILITY_HERO_RESPONSE,
        );
    });

    test('shared Protection and Basic cards preserve their printed values and restrictions', async () => {
        const {aspects} = await loadCatalog();
        const starhawk = getCard(aspects, 'protection-halcon-estelar');
        const inTopShape = getCard(aspects, 'protection-en-plena-forma');
        const fearless = getCard(aspects, 'protection-intrepido');
        const hardToIgnore = getCard(aspects, 'protection-dificil-de-ignorar');
        const rocket = getCard(aspects, 'basic-mapache-cohete');
        const flora = getCard(aspects, 'basic-flora-y-fauna');
        const concentration = getCard(aspects, 'basic-concentracion-eficaz');

        assert.deepEqual(
            [starhawk.type, starhawk.params.name, starhawk.params.subtitle],
            [CARD_TYPE_ALLY, 'Halcón Estelar', 'Stakar Ogord'],
        );
        assert.deepEqual(starhawk.params.traits, [TRAIT_AERIAL, TRAIT_GUARDIAN]);
        assert.deepEqual(
            [starhawk.params.cost, starhawk.params.hitPoints, starhawk.params.attack,
                starhawk.params.attackConsequential, starhawk.params.thwart,
                starhawk.params.thwartConsequential],
            [2, 3, 2, 2, 1, 1],
        );
        assert.equal(starhawk.params.resources[0], RESOURCE_PHYSICAL);
        assert.equal(
            starhawk.params.abilities[0].params.trigger,
            TRIGGER_CHARACTER_WOULD_TAKE_DAMAGE,
        );
        assert.equal(
            starhawk.params.abilities[0].params.condition.triggeredTargetDamage
                .operator,
            'eq',
        );
        assert.equal(inTopShape.type, CARD_TYPE_EVENT);
        assert.equal(inTopShape.params.name, 'En plena forma');
        assert.equal(inTopShape.params.cost, 2);
        assert.equal(inTopShape.params.resources[0], RESOURCE_PHYSICAL);
        assert.deepEqual(inTopShape.params.traits, [TRAIT_ATTACK]);
        assert.deepEqual(inTopShape.params.abilities[0].params.labels, [LABEL_ATTACK]);
        assert.deepEqual(
            inTopShape.params.abilities[0].params.effect.params.condition,
            {
                'player.superhero.life': {
                    operator: 'gte',
                    path: 'player.superhero.currentSide.card.hitPoints',
                },
            },
        );

        assert.equal(fearless.type, CARD_TYPE_UPGRADE);
        assert.deepEqual(fearless.params.traits, [TRAIT_CONDITION]);
        assert.equal(fearless.params.cost, 1);
        assert.equal(fearless.params.resources[0], RESOURCE_ENERGY);
        assert.deepEqual(fearless.params.maximum, {
            count: 1,
            target: TARGET_PLAYER,
        });
        assert.equal(
            fearless.params.abilities[0].params.trigger,
            TRIGGER_YOUR_HERO_GET_RETALIATE,
        );
        assert.deepEqual(
            fearless.params.abilities[0].params.condition,
            {
                'effect.selectedTarget.life': {
                    operator: 'gte',
                    path: 'effect.selectedTarget.hitPoints',
                },
            },
        );
        assert.equal(
            fearless.params.abilities[0].params.effect.type,
            EFFECT_MODIFY_RETALIATE_VALUE,
        );
        assert.deepEqual(
            fearless.params.abilities[0].params.effect.params,
            {target: TARGET_EFFECT, count: 1},
        );

        assert.equal(hardToIgnore.type, CARD_TYPE_UPGRADE);
        assert.deepEqual(hardToIgnore.params.traits, [TRAIT_SKILL]);
        assert.equal(
            hardToIgnore.params.abilities[0].params.trigger,
            TRIGGER_HERO_DEFENDED_ATTACK,
        );
        assert.equal(hardToIgnore.params.abilities[0].params.condition.attackDamage, 0);

        assert.equal(rocket.type, CARD_TYPE_ALLY);
        assert.deepEqual(rocket.params.traits, [TRAIT_GUARDIAN]);
        assert.equal(rocket.params.cost, 3);
        assert.equal(rocket.params.resources[0], RESOURCE_WILD);
        assert.deepEqual(rocket.params.paramsToPlay, {
            'superhero.currentSide.traits': TRAIT_GUARDIAN,
        });
        assert.equal(
            rocket.params.abilities[0].params.effect.params.effects[0].params.count,
            3,
        );
        assert.equal(
            rocket.params.abilities[0].params.effect.params.effects[1].params.modify
                .keywords.overkill,
            true,
        );

        assert.equal(flora.type, CARD_TYPE_EVENT);
        assert.equal(flora.params.cost, 1);
        assert.equal(flora.params.resources[0], RESOURCE_WILD);
        assert.deepEqual(flora.params.keywords.teamUp, ['Groot', 'Mapache Cohete']);
        assert.deepEqual(flora.params.maximum, {count: 1, target: TARGET_DECK});
        assert.equal(
            flora.params.abilities[0].params.effect.params.options[0]
                .params.effect.params.effects[0].type,
            EFFECT_PLACE_COUNTERS,
        );
        assert.equal(
            flora.params.abilities[0].params.effect.params.options[0]
                .params.effect.params.effects[1].type,
            EFFECT_READY,
        );
        assert.equal(
            flora.params.abilities[0].params.effect.params.options[1]
                .params.effect.params.condition['card.set'],
            'Mapache Cohete',
        );

        assert.equal(concentration.type, CARD_TYPE_UPGRADE);
        assert.deepEqual(concentration.params.traits, [TRAIT_SKILL]);
        assert.equal(concentration.params.cost, 1);
        assert.equal(concentration.params.resources[0], RESOURCE_ENERGY);
        assert.deepEqual(concentration.params.maximum, {
            count: 1,
            target: TARGET_PLAYER,
        });
        const costReduction = concentration.params.abilities[0].params.effect.params;
        assert.equal(costReduction.triggerType, TRIGGER_YOU_PLAY_CARD);
        assert.deepEqual(costReduction.condition, {
            'effect.card.traits': TRAIT_SUPERPOWER,
        });
        assert.equal(costReduction.effect.type, EFFECT_MODIFY_COST);
        assert.equal(costReduction.effect.params.target, TARGET_EFFECT);
        assert.equal(costReduction.effect.params.count, -1);
    });

    test('Mapache Cohete is playable while Groot is in his Guardian identity', async () => {
        const {aspects} = await loadCatalog();
        const {match, player} = await createGrootFixture('rocket-raccoon-playability');
        const rocket = new CardsFactory({match}).createGameCardFromConfig(
            getCard(aspects, 'basic-mapache-cohete'),
            {owner: player},
        );

        assert.equal(await rocket.canPlay({player}), true);
    });

    test('Groot counter-based Events calculate zero effects without Growth counters', async () => {
        const {groot, match, player, superhero} =
            await createGrootFixture('groot-counter-based-event-playability');
        const cardsFactory = new CardsFactory({match});
        const targets = [
            {
                id: 'groot-event-test-scheme',
                isInPlay: true,
                isScheme: true,
                canRemoveThreat() {
                    return true;
                },
            },
            {
                id: 'groot-event-test-enemy',
                isInPlay: true,
                isEnemy: true,
                canBeAttacked() {
                    return true;
                },
            },
        ];
        match.scenario = {schemes: [targets[0]], villain: targets[1]};

        for (const {card} of groot.config.cards.slice(1, 3)) {
            const event = cardsFactory.createGameCardFromConfig(card, {
                owner: player,
            });
            const [ability] = event.abilities;
            assert.equal(event.card.paramsToPlay, undefined, card.params.name);
            superhero.counters = 0;
            assert.equal(
                await event.canPlay({player, abilityType: ABILITY_ACTION}),
                false,
                card.params.name,
            );
            assert.equal(
                await ability.effect.canRun({match, player}),
                false,
                card.params.name,
            );

            superhero.counters = 1;
            assert.equal(
                await ability.effect.calculate({match, player}),
                1,
                card.params.name,
            );
            assert.equal(
                await ability.effect.canRun({match, player}),
                true,
                card.params.name,
            );
            assert.equal(
                await event.canPlay({player, abilityType: ABILITY_ACTION}),
                true,
                card.params.name,
            );
        }
    });

    test('Lianas lacerantes is unavailable until Groot can pay its full counter cost', async () => {
        const {groot, match, player, superhero} =
            await createGrootFixture('groot-lacerating-lianas-counter-cost');
        const lianasConfig = groot.config.cards.find(({card}) =>
            card.params.name === 'Lianas lacerantes').card;
        const lianas = new CardsFactory({match}).createGameCardFromConfig(
            lianasConfig,
            {owner: player},
        );
        lianas.controller = player;
        player.gameZone.addToGameZone(lianas);
        superhero.exhaust();

        const [ability] = lianas.abilities;
        superhero.counters = 1;
        assert.equal(await ability.canRun({match, player}), false);
        assert.equal(superhero.counters, 1);

        superhero.counters = 2;
        assert.equal(await ability.canRun({match, player}), true);
        assert.equal(superhero.counters, 2);
    });

    test('Groot nemesis ForEach abilities compile through the card factory', async () => {
        const {heroes} = await loadCatalog();
        const groot = heroes.find(({_id}) => _id === 'groot');
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'Groot setup',
        });
        const superhero = new MatchFactory(match).createSuperhero({
            ...groot.config,
            cards: [],
            precon: [],
        });
        const effects = superhero.nemesis.slice(0, 2).map(card => card.abilities[0].effect);

        assert.ok(effects.every(effect => typeof effect.canRun === 'function'));
        assert.deepEqual(effects.map(({effectType, effectDefinition}) => ({
            type: effectType,
            definition: effectDefinition,
        })), [
            {
                type: EFFECT_FOR_EACH,
                definition: {
                    type: EFFECT_ASSIGN_DAMAGE,
                    params: {
                        target: TARGET_YOU,
                        damage: 2,
                    },
                },
            },
            {
                type: EFFECT_FOR_EACH,
                definition: {
                    type: EFFECT_ASSIGN_DAMAGE,
                    params: {
                        target: TARGET_YOU,
                        damage: 2,
                    },
                },
            },
        ]);
    });

    test('nemesis cards use the required threat, damage, and Leviatón data', async () => {
        const {heroes} = await loadCatalog();
        const groot = heroes.find(({_id}) => _id === 'groot');
        const [inferno, furnax, flames] =
            groot.config.nemesis.map(({card}) => card.params);

        assert.equal(inferno.startingThreat, 3);
        assert.equal(inferno.abilities[0].params.trigger, TRIGGER_VILLAIN_PHASE_START);
        assert.equal(inferno.abilities[0].params.effect.type, EFFECT_FOR_EACH);
        assert.equal(
            inferno.abilities[0].params.effect.params.target,
            TARGET_ALL_PLAYERS,
        );
        assert.deepEqual(
            inferno.abilities[0].params.effect.params.effect,
            {
                type: EFFECT_ASSIGN_DAMAGE,
                params: {
                    target: TARGET_YOU,
                    damage: 2,
                },
            },
        );
        assert.deepEqual(furnax.traits, [TRAIT_LEVIATHON]);
        assert.deepEqual(
            [furnax.attack, furnax.scheme, furnax.hitPoints, furnax.boost],
            [2, 2, 6, 3],
        );
        assert.equal(furnax.abilities[0].params.trigger, TRIGGER_THIS_ACTIVATES);
        assert.deepEqual(
            furnax.abilities[0].params.effect.params.effect,
            {
                type: EFFECT_ASSIGN_DAMAGE,
                params: {
                    target: TARGET_YOU,
                    damage: 2,
                },
            },
        );
        assert.equal(flames.boost, 1);
        const flameEffect = flames.abilities[0].params.effect;
        assert.equal(flameEffect.type, EFFECT_CHAINED);
        assert.equal(flameEffect.params.hasAdditional, true);
        const [baseDamage, infernoBonus, furnaxBonus] =
            flameEffect.params.effects;
        assert.equal(baseDamage.type, EFFECT_ASSIGN_DAMAGE);
        assert.deepEqual(baseDamage.params, {
            target: TARGET_YOU,
            damage: 2,
        });
        assert.equal(infernoBonus.type, EFFECT_DO_IF);
        assert.deepEqual(infernoBonus.params.condition, {
            'match.sideSchemes.*.name': 'Infierno abrasador',
        });
        assert.equal(
            infernoBonus.params.effect.type,
            EFFECT_ADD_ADDITIONAL_DAMAGE,
        );
        assert.deepEqual(infernoBonus.params.effect.params, {
            target: TARGET_SOURCE,
            source: 'effects.0',
            count: 1,
        });
        assert.equal(furnaxBonus.type, EFFECT_DO_IF);
        assert.deepEqual(furnaxBonus.params.condition, {
            'match.minions.*.name': 'Furnax',
        });
        assert.equal(
            furnaxBonus.params.effect.type,
            EFFECT_ADD_ADDITIONAL_DAMAGE,
        );
        assert.deepEqual(furnaxBonus.params.effect.params, {
            target: TARGET_SOURCE,
            source: 'effects.0',
            count: 1,
        });
    });

    test('Avivar las llamas deals 2 damage with no side scheme or Furnax in play', async () => {
        assert.equal(
            await resolveFlamesDamage('groot-flames-no-bonus', {}),
            2,
        );
    });

    test('Avivar las llamas deals 3 damage with only Infierno abrasador in play', async () => {
        assert.equal(
            await resolveFlamesDamage('groot-flames-side-scheme', {
                burningInfernoInPlay: true,
            }),
            3,
        );
    });

    test('Avivar las llamas deals 3 damage with only Furnax in play', async () => {
        assert.equal(
            await resolveFlamesDamage('groot-flames-furnax', {
                furnaxInPlay: true,
            }),
            3,
        );
    });

    test('Avivar las llamas deals 4 damage with Infierno abrasador and Furnax in play', async () => {
        assert.equal(
            await resolveFlamesDamage('groot-flames-both-bonuses', {
                burningInfernoInPlay: true,
                furnaxInPlay: true,
            }),
            4,
        );
    });

    test("player-targeted indirect damage is assigned among that player's characters", async () => {
        const {aspects, heroes} = await loadCatalog();
        const groot = heroes.find(({_id}) => _id === 'groot');
        const flamesConfig = groot.config.nemesis.find(({card}) =>
            card.params.name === 'Avivar las llamas').card;
        const {match, player, superhero} =
            await createGrootFixture('groot-indirect-damage-assignment');
        match.scenario = {
            villain: {isInPlay: false},
            schemes: [],
            sideSchemes: [{name: 'Infierno abrasador'}],
            gameZone: {inPlayCards: []},
        };
        player.gameZone.engage({name: 'Furnax'});
        const starhawk = new CardsFactory({match}).createGameCardFromConfig(
            getCard(aspects, 'protection-halcon-estelar'),
            {owner: player},
        );
        starhawk.controller = player;
        player.gameZone.addToGameZone(starhawk);
        let assignmentDialog;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_ASSIGN) {
                assignmentDialog = dialog;

                return {
                    assigned: {
                        [superhero.id]: 2,
                        [starhawk.id]: 2,
                    },
                };
            }

            return {};
        };
        const flames = new CardsFactory({match}).createGameCardFromConfig(
            flamesConfig,
            {owner: player},
        );

        await flames.abilities[0].resolveAbility({
            card: flames,
            match,
            player,
        });

        assert.equal(assignmentDialog.targetPlayer, player);
        assert.deepEqual(
            assignmentDialog.data.cards.map(({id}) => id),
            [superhero.id, starhawk.id],
        );
        assert.equal(assignmentDialog.data.count, 4);
        assert.deepEqual([superhero.damage, starhawk.damage], [2, 2]);
    });

    test('Marchitamiento surges when its counter-removal option removes none', async () => {
        const {groot, match, player, superhero} =
            await createGrootFixture('groot-withering-zero-counters');
        match.scenario = {
            deck: {
                discardPile: [],
                async discard() {},
            },
            gameZone: {
                async discard() {},
            },
        };
        const obligation = new CardsFactory({match}).createGameCardFromConfig(
            groot.config.obligation.card,
            {owner: player},
        );
        player.encounters.push(obligation);
        const reveal = {surge: false};
        match.openDialog = async ({data}) => {
            const option = data.options.find(({text}) =>
                text.startsWith('Quita 3 contadores'));
            assert.ok(option, 'Expected the counter-removal option to be available');

            return {selected: {id: option.id}};
        };

        await obligation.abilities[1].resolveAbility({
            card: obligation,
            match,
            player,
            reveal,
        });

        assert.equal(superhero.counters ?? 0, 0);
        assert.equal(reveal.surge, true);
    });

    test('Halcón Estelar returns to hand only for damage exactly equal to remaining life', async () => {
        const {aspects} = await loadCatalog();
        const {match, player} = await createGrootFixture('starhawk-lethal-damage');
        match.scenario = {
            villain: {isInPlay: false},
            schemes: [],
            sideSchemes: [],
        };
        const starhawk = new CardsFactory({match}).createGameCardFromConfig(
            getCard(aspects, 'protection-halcon-estelar'),
            {owner: player},
        );
        starhawk.controller = player;
        match.openDialog = async ({data, dialogType}) => {
            assert.equal(dialogType, DIALOG_USE_CARD);

            return {selected: {id: data.cards[0].id}};
        };
        player.gameZone.addToGameZone(starhawk);
        await starhawk.initTriggers({match, player});

        const nonlethalDamage = new TakeDamageEffect({
            damage: 2,
            match,
            selectedTarget: starhawk,
        });
        await nonlethalDamage.runEffect({match, player});
        assert.equal(starhawk.damage, 2);
        assert.equal(player.hand.cards.includes(starhawk), false);

        const lethalDamage = new TakeDamageEffect({
            damage: 1,
            match,
            selectedTarget: starhawk,
        });
        await lethalDamage.runEffect({match, player});

        assert.equal(player.hand.cards.includes(starhawk), true);
        assert.equal(starhawk.damage, 0);
        assert.equal(starhawk.isInPlay, false);
    });

    test('Intrépido dynamically grants Retaliate while Groot is a full-health hero', async () => {
        const {aspects} = await loadCatalog();
        const {match, player, superhero} =
            await createGrootFixture('intrepido-health-condition');
        match.scenario = {
            villain: {isInPlay: false},
            schemes: [],
            sideSchemes: [],
        };
        superhero.selectedSide = 0;
        const fearless = new CardsFactory({match}).createGameCardFromConfig(
            getCard(aspects, 'protection-intrepido'),
            {owner: player},
        );
        fearless.controller = player;
        player.gameZone.addToGameZone(fearless);
        await fearless.initTriggers({match, player});

        assert.equal(Boolean(superhero.isHero), false);
        assert.equal(await superhero.getRetaliateValue({player}), 0);

        superhero.selectedSide = 1;
        assert.equal(superhero.isHero, true);
        assert.equal(await superhero.getRetaliateValue({player}), 1);
        const heroSnapshot = await superhero.toObjWithAbilityAvailability(player);
        assert.deepEqual(
            heroSnapshot.extraKeywords.filter(({name}) => name === 'retaliate'),
            [{name: 'retaliate', value: 1}],
        );
        const playerSnapshot = await player.toObjWithPlayableHand();
        assert.deepEqual(
            playerSnapshot.superhero.extraKeywords.filter(({name}) => name === 'retaliate'),
            [{name: 'retaliate', value: 1}],
        );

        superhero.damage = 1;
        assert.equal(await superhero.getRetaliateValue({player}), 0);
        superhero.damage = 0;
        assert.equal(await superhero.getRetaliateValue({player}), 1);

        superhero.selectedSide = 0;
        assert.equal(await superhero.getRetaliateValue({player}), 0);
        superhero.selectedSide = 1;
        assert.equal(await superhero.getRetaliateValue({player}), 1);

        player.gameZone.remove(fearless);
        fearless.controller = undefined;
        assert.equal(fearless.isInPlay, false);
        assert.equal(await superhero.getRetaliateValue({player}), 0);
    });
});
