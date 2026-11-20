import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_ACTION,
    ABILITY_HERO_RESPONSE,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_ALLY,
    CARD_TYPE_EVENT,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CALC_COUNTERS,
    CLASSIFICATION_BASIC,
    CLASSIFICATION_PROTECTION,
    DIALOG_REVEAL_CARDS,
    DIALOG_SELECT_NUMBER,
    EFFECT_DEFEAT,
    EFFECT_MODIFY_COST,
    EFFECT_MODIFY_ATTACK_VALUE,
    EFFECT_MODIFY_RETALIATE_VALUE,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    RESOURCE_ENERGY,
    RESOURCE_PHYSICAL,
    TARGET_ALTEREGO_SIDE,
    TARGET_ENEMY,
    TARGET_MINION,
    TARGET_SOURCE,
    TARGET_YOUR_SUPERHERO,
    TRAIT_GUARDIAN,
    TRAIT_OUTLAW,
    TRIGGER_CHARACTER_TAKES_DAMAGE,
    TRIGGER_ENEMY_ATTACKS,
    TRIGGER_THIS_PLAY_CARD,
    TRIGGER_THIS_ATTACK,
    TRIGGER_THIS_THWARTS,
    TRIGGER_YOU_BASIC_ATTACK,
    TRIGGER_VILLAIN_ATTACKS_YOU,
    TRIGGER_YOUR_HERO_GET_ATTACK,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import {Attack} from '../../src/activations/attack.js';
import {AttackBasicAbility} from '../../src/abilities/basic/attack-basic-ability.js';
import {DealDamageEffect} from '../../src/effects/deal-damage-effect.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {EngageEffect} from '../../src/effects/engage-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {FlipEffect} from '../../src/effects/flip-effect.js';
import {GetAttackEffect} from '../../src/effects/get-attack-effect.js';
import {GetRetaliateEffect} from '../../src/effects/get-retaliate-effect.js';
import {TakeDamageEffect} from '../../src/effects/take-damage-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Drax', () => {
    const createFixture = async () => {
        const catalog = await loadCatalog();
        const hero = catalog.heroes.find(({_id}) => _id === 'drax');
        assert.ok(hero);

        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'drax-test',
        });
        match.openDialog = async dialog => ({
            selected: dialog.data?.cards?.[0] ??
                dialog.data?.options?.[0] ??
                {id: '0'},
        });
        match.refresh = async () => {};
        match.persist = async () => {};
        const factory = new MatchFactory(match);
        const superhero = factory.createSuperhero({
            ...hero.config,
            cards: [],
            precon: [],
            obligation: undefined,
            nemesis: [],
        });
        superhero.refresh = async () => {};
        superhero.selectedSide = 1;
        const player = match.createPlayer({
            name: 'Drax',
            superhero,
            initial: true,
        });
        player.initPlayer();
        await superhero.initTriggers({match, player});

        return {
            catalog,
            factory,
            hero,
            match,
            player,
            superhero,
        };
    };

    const findFixedCard = (hero, name) =>
        hero.config.cards.find(({card}) => card.params.name === name);
    const findAspectCard = (catalog, id) =>
        catalog.aspects.find(({_id}) => _id === id);
    const createAspectGameCard = (factory, catalog, id, player) => {
        const entry = findAspectCard(catalog, id);
        assert.ok(entry, `Missing aspect card ${id}`);

        return factory.cardsFactory.createGameCardFromConfig(entry.card, {
            owner: player,
        });
    };
    const createScenarioFixture = async () => {
        const fixture = await createFixture();
        const {catalog, factory, match} = fixture;
        const rhino = catalog.scenarios.find(({_id}) => _id === 'rhino');
        assert.ok(rhino);
        const scenario = await factory.createScenario({
            ...rhino.config,
            cards: [],
            sets: [],
            defaultSets: [],
        });
        match.addScenario(scenario);
        await scenario.initScenario([], false);

        return {...fixture, scenario};
    };

    test('defines both identities, fixed card counts, optional encounter data, and the supplied precon', async () => {
        const {catalog, hero} = await createFixture();
        const [alterEgo, drax] = hero.config.sides;
        const aspectCards = new Map(catalog.aspects.map(({_id, card}) =>
            [_id, card]));

        assert.equal(alterEgo.type, CARD_TYPE_ALTEREGO);
        assert.equal(alterEgo.params.name, 'Drax');
        assert.equal(alterEgo.params.unique, true);
        assert.equal(alterEgo.params.recovery, 4);
        assert.equal(alterEgo.params.handSize, 6);
        assert.equal(alterEgo.params.hitPoints, 14);
        assert.deepEqual(alterEgo.params.traits, [TRAIT_OUTLAW]);
        assert.equal(drax.type, CARD_TYPE_HERO);
        assert.equal(drax.params.unique, true);
        assert.deepEqual(drax.params.traits, [TRAIT_GUARDIAN]);
        assert.deepEqual([
            drax.params.thwart,
            drax.params.attack,
            drax.params.defense,
            drax.params.handSize,
            drax.params.hitPoints,
        ], [1, 1, 2, 4, 14]);
        assert.equal(hero.config.obligation, undefined);
        assert.deepEqual(hero.config.nemesis, []);
        assert.equal(findFixedCard(hero, 'Mantis').card.params.unique, true);

        assert.deepEqual(
            hero.config.cards.map(({count, card}) => [card.params.name, count]),
            [
                ['Mantis', 1],
                ['¡Enfréntate a mí, cobarde!', 2],
                ['Intimidación', 2],
                ['Salto y apuñalamiento', 2],
                ['Parada', 2],
                ['Vengar afrenta', 2],
                ['El puñal de Drax', 1],
                ['El otro puñal de Drax', 1],
                ['Maestro de dwi theet', 1],
                ['Demasiado terco para morir', 1],
            ],
        );
        assert.deepEqual(
            findFixedCard(hero, '¡Enfréntate a mí, cobarde!')
                .card.params.resources,
            [RESOURCE_PHYSICAL],
        );
        assert.equal(hero.config.cards.reduce((total, {count}) =>
            total + count, 0), 15);

        const preconCards = hero.config.precon.flatMap(({
            aspect,
            classification,
            cardRefs,
        }) => cardRefs.map(({id, count}) => [
            aspect || classification,
            aspectCards.get(id)?.params.name,
            count,
        ]));
        assert.deepEqual(preconCards, [
            [CLASSIFICATION_PROTECTION, 'Contragolpe', 2],
            [CLASSIFICATION_PROTECTION, 'Indómito', 2],
            [CLASSIFICATION_PROTECTION, 'Mártir', 1],
            [CLASSIFICATION_PROTECTION, 'Dragón Lunar', 1],
            [CLASSIFICATION_PROTECTION, 'Desvío', 3],
            [CLASSIFICATION_PROTECTION, 'Una dura lección', 3],
            [CLASSIFICATION_PROTECTION, 'Golpe de tanteo', 3],
            [CLASSIFICATION_PROTECTION, 'Sometimiento', 3],
            [CLASSIFICATION_BASIC, 'Preparación física', 3],
            [CLASSIFICATION_BASIC, 'Energía', 1],
            [CLASSIFICATION_BASIC, 'Fuerza', 1],
            [CLASSIFICATION_BASIC, 'Genio', 1],
            [CLASSIFICATION_BASIC, 'Gamora', 1],
        ]);
        assert.equal(preconCards.reduce((total, [, , count]) =>
            total + count, 0), 25);
        assert.equal(
            hero.config.cards.reduce((total, {count}) => total + count, 0) +
            preconCards.reduce((total, [, , count]) => total + count, 0),
            40,
        );
    });

    test('compiles each configured ability as one runnable effect instance', async () => {
        const {catalog, factory, hero, player} = await createFixture();
        const definitions = [
            ...hero.config.sides,
            ...hero.config.cards.map(({card}) => card),
            ...[
                'protection-martir',
                'protection-dragon-lunar',
                'protection-desvio',
                'protection-una-dura-leccion',
                'protection-golpe-de-tanteo',
                'protection-sometimiento',
                'basic-gamora',
            ].map(id => {
                const entry = findAspectCard(catalog, id);
                assert.ok(entry, `Missing precon card ${id}`);

                return entry.card;
            }),
        ];

        for (const definition of definitions) {
            const card = factory.cardsFactory.createGameCardFromConfig(
                definition,
                {owner: player},
            );
            for (const ability of card.abilities) {
                assert.ok(ability.effect, `Missing effect on ${card.name}`);
                assert.equal(Array.isArray(ability.effect), false);
                assert.equal(typeof ability.effect.canRun, 'function');
            }
        }

        const fixed = findFixedCard(hero, 'Salto y apuñalamiento').card;
        const jumpCostAbility = factory.cardsFactory.createGameCardFromConfig(
            fixed,
            {owner: player},
        ).abilities.find(({trigger}) => trigger === TRIGGER_THIS_PLAY_CARD);
        assert.ok(jumpCostAbility);
        assert.equal(
            fixed.params.abilities[0].params.effect.type,
            EFFECT_MODIFY_COST,
        );
        assert.equal(
            jumpCostAbility.effect.paramsCalc.formula,
            CALC_COUNTERS,
        );
        assert.equal(
            jumpCostAbility.effect.paramsCalc.multiply,
            -1,
        );

        const dagger = findFixedCard(hero, 'El puñal de Drax').card;
        const daggerGameCard = factory.cardsFactory.createGameCardFromConfig(
            dagger,
            {owner: player},
        );
        assert.equal(daggerGameCard.restricted, true);
        assert.equal(daggerGameCard.unique, true);
        assert.equal(
            dagger.params.abilities[0].params.effect.type,
            EFFECT_MODIFY_ATTACK_VALUE,
        );

        const retaliateDagger = findFixedCard(
            hero,
            'El otro puñal de Drax',
        ).card;
        assert.equal(
            retaliateDagger.params.abilities[0].params.effect.type,
            EFFECT_MODIFY_RETALIATE_VALUE,
        );
        assert.equal(retaliateDagger.params.unique, true);
    });

    test('Mártir gains Tough after an attack defeats an enemy and deals consequential damage', async () => {
        const {catalog, factory, match, player} =
            await createScenarioFixture();
        const martyr = createAspectGameCard(
            factory,
            catalog,
            'protection-martir',
            player,
        );
        player.addToGameZone(martyr);
        await martyr.initTriggers({match, player});

        const minion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Esbirro de prueba',
                hitPoints: 2,
                attack: 1,
                scheme: 1,
            },
        }, {owner: match.scenario});
        await new EngageEffect({
            card: minion,
            controller: match.scenario,
            match,
            selectedTarget: player,
        }).runEffect({player});
        const attack = martyr.abilities.find(ability =>
            ability instanceof AttackBasicAbility);
        assert.ok(attack);

        await attack.resolveAbility({
            activationTarget: minion,
            card: martyr,
            match,
            player,
        });

        assert.equal(minion.isInPlay, false);
        assert.equal(martyr.damage, 1);
        assert.equal(martyr.isTough, true);
        assert.ok(martyr.triggers[TRIGGER_CHARACTER_TAKES_DAMAGE]);
    });

    test('Mártir does not gain Tough when the attacked enemy survives', async () => {
        const {catalog, factory, match, player} =
            await createScenarioFixture();
        const martyr = createAspectGameCard(
            factory,
            catalog,
            'protection-martir',
            player,
        );
        player.addToGameZone(martyr);
        await martyr.initTriggers({match, player});

        const minion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Esbirro de prueba',
                hitPoints: 3,
                attack: 1,
                scheme: 1,
            },
        }, {owner: match.scenario});
        await new EngageEffect({
            card: minion,
            controller: match.scenario,
            match,
            selectedTarget: player,
        }).runEffect({player});
        const attack = martyr.abilities.find(ability =>
            ability instanceof AttackBasicAbility);
        assert.ok(attack);

        await attack.resolveAbility({
            activationTarget: minion,
            card: martyr,
            match,
            player,
        });

        assert.equal(minion.isInPlay, true);
        assert.equal(martyr.damage, 1);
        assert.equal(martyr.isTough, false);
    });

    test('Desvío discards only the amount of attack damage it prevents', async () => {
        const {catalog, factory, match, player, superhero} =
            await createScenarioFixture();
        const desvio = createAspectGameCard(
            factory,
            catalog,
            'protection-desvio',
            player,
        );
        player.hand.addCard(desvio);
        await desvio.initTriggers({match, player});
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_SELECT_NUMBER) {
                return {value: 1};
            }

            return {selected: dialog.data?.cards?.[0]};
        };
        for (let index = 0; index < 4; index++) {
            player.deck.cards.push(factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_EVENT,
                params: {name: `Carta de prueba ${index}`},
            }, {owner: player}));
        }

        const incomingDamage = new TakeDamageEffect({
            damage: 3,
            isAttack: true,
            match,
            preventDamage: 1,
            selectedTarget: superhero.currentSide,
        });
        await desvio.abilities[0].effect.runEffect({
            effect: incomingDamage,
            match,
            player,
            triggeredTarget: superhero.currentSide,
            triggeredTargetDamage: 2,
        });

        assert.equal(dialogs[0].dialogType, DIALOG_SELECT_NUMBER);
        assert.equal(dialogs[0].data.max, 2);
        assert.match(dialogs[0].subtitle, /Vas a sufrir 2 de daño/);
        assert.equal(dialogs[1].dialogType, DIALOG_REVEAL_CARDS);
        assert.equal(dialogs[1].data.cards.length, 1);
        assert.equal(
            dialogs[1].data.cards[0].id,
            player.deck.discardPile[0].id
        );
        assert.equal(desvio.abilities[0].effect.effects[0].preventedDamage, 1);
        assert.equal(player.deck.discardPile.length, 1);
        assert.equal(incomingDamage.takenDamage, 1);
    });

    test('Una dura lección gives Drax Tough when its attack defeats its target', async () => {
        const {catalog, factory, match, player, scenario, superhero} =
            await createScenarioFixture();
        const minion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Esbirro de prueba',
                hitPoints: 4,
                attack: 1,
                scheme: 1,
            },
        }, {owner: scenario});
        await new EngageEffect({
            card: minion,
            controller: scenario,
            match,
            selectedTarget: player,
        }).runEffect({player});
        match.openDialog = async dialog => ({
            selected: dialog.data?.cards?.find(({id}) => id === minion.id) ??
                dialog.data?.cards?.[0] ??
                dialog.data?.options?.[0] ??
                {id: '0'},
        });
        const event = createAspectGameCard(
            factory,
            catalog,
            'protection-una-dura-leccion',
            player,
        );
        const damageEffect = event.abilities[0].effect.effects[0];
        assert.ok(
            (await damageEffect.getValidTarget({match, player}))
                .includes(minion),
        );
        damageEffect.selectedTarget = minion;

        await event.abilities[0].effect.runEffect({match, player});

        assert.equal(damageEffect.defeated, true);
        assert.equal(minion.isInPlay, false);
        assert.equal(superhero.currentSide.isTough, true);
    });

    test('Dragón Lunar lets a Guard minion attack another enemy', async () => {
        const {catalog, factory, match, player, scenario} =
            await createScenarioFixture();
        const minion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Esbirro de prueba',
                hitPoints: 4,
                attack: 1,
                scheme: 1,
                keywords: {
                    guard: true,
                },
            },
        }, {owner: scenario});
        await new EngageEffect({
            card: minion,
            controller: scenario,
            match,
            selectedTarget: player,
        }).runEffect({player});
        const ally = createAspectGameCard(
            factory,
            catalog,
            'protection-dragon-lunar',
            player,
        );
        const action = ally.abilities.find(({abilityType}) =>
            abilityType === ABILITY_ACTION);
        const chain = action.effect;
        const attack = chain.effects[0];

        assert.equal(player.hasGuard, true);
        assert.equal(chain.target, TARGET_MINION);
        assert.equal(attack.enemyType, TARGET_SOURCE);
        assert.equal(attack.source, 'parentTargets');
        assert.equal(attack.target, TARGET_ENEMY);
        assert.equal(attack.giveBoost, true);
        assert.equal(await chain.canRun({match, player}), true);
        const selectionOrder = [];
        const selectMinion = chain.selectTarget.bind(chain);
        const selectEnemy = attack.selectEnemy.bind(attack);
        const selectTarget = attack.selectTarget.bind(attack);
        chain.selectTarget = async params => {
            selectionOrder.push('minion');
            return selectMinion(params);
        };
        attack.selectEnemy = async params => {
            selectionOrder.push('attacker');
            await selectEnemy(params);
            assert.strictEqual(attack.enemy, minion);
        };
        attack.selectTarget = async params => {
            selectionOrder.push('target');
            return selectTarget(params);
        };
        await chain.prepare({match, player});
        await attack.prepare(chain.getEffectParams({match, player}));
        assert.deepEqual(selectionOrder, ['minion', 'attacker', 'target']);
        assert.strictEqual(chain.selectedTarget, minion);
        assert.strictEqual(attack.enemy, minion);
        assert.notStrictEqual(attack.selectedTarget, minion);
        assert.equal(attack.selectedTarget.id, scenario.villain.id);
        const villainDamage = scenario.villain.damage;
        await attack.execute({match, player});
        assert.equal(scenario.villain.damage, villainDamage + 1);
        assert.equal(attack.boostCards.length, 0);

        match.getEnemiesFor = () => [minion];
        const noOtherEnemy = createAspectGameCard(
            factory,
            catalog,
            'protection-dragon-lunar',
            player,
        ).abilities.find(({abilityType}) =>
            abilityType === ABILITY_ACTION).effect;
        assert.equal(await noOtherEnemy.canRun({match, player}), false);
    });

    test('Dragón Lunar gives boost cards to Villainous minions', async () => {
        const {catalog, factory, match, player, scenario} =
            await createScenarioFixture();
        const minion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Esbirro Infame de prueba',
                hitPoints: 4,
                attack: 1,
                scheme: 1,
                keywords: {
                    villainous: true,
                },
            },
        }, {owner: scenario});
        await new EngageEffect({
            card: minion,
            controller: scenario,
            match,
            selectedTarget: player,
        }).runEffect({player});
        const boostCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Carta de aumento',
                boost: 1,
                hitPoints: 1,
                attack: 1,
                scheme: 1,
            },
        }, {owner: scenario});
        scenario.deck.cards.unshift(boostCard);

        const ally = createAspectGameCard(
            factory,
            catalog,
            'protection-dragon-lunar',
            player,
        );
        const chain = ally.abilities.find(({abilityType}) =>
            abilityType === ABILITY_ACTION).effect;
        await chain.prepare({match, player});
        const attack = chain.effects[0];
        await attack.prepare(chain.getEffectParams({match, player}));
        await attack.dealBoostCards({match, player});

        assert.equal(minion.villainous, true);
        assert.deepEqual(attack.boostCards, [boostCard]);
    });

    test('Dragón Lunar resolves its attack after paying its self-discarding cost', async () => {
        const {catalog, factory, match, player, scenario} =
            await createScenarioFixture();
        const minion = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Esbirro de prueba',
                hitPoints: 4,
                attack: 1,
                scheme: 1,
            },
        }, {owner: scenario});
        await new EngageEffect({
            card: minion,
            controller: scenario,
            match,
            selectedTarget: player,
        }).runEffect({player});
        const ally = createAspectGameCard(
            factory,
            catalog,
            'protection-dragon-lunar',
            player,
        );
        ally.controller = player;
        player.gameZone.addToGameZone(ally);
        const action = ally.abilities.find(({abilityType}) =>
            abilityType === ABILITY_ACTION);
        const villainDamage = scenario.villain.damage;

        await action.resolveAbility({match, player});

        assert.equal(ally.isInPlay, false);
        assert.ok(
            player.deck.cards.includes(ally) ||
            player.deck.discardPile.includes(ally),
        );
        assert.strictEqual(action.effect.selectedTarget, minion);
        assert.strictEqual(action.effect.effects[0].enemy, minion);
        assert.strictEqual(action.effect.effects[0].selectedTarget, scenario.villain);
        assert.equal(scenario.villain.damage, villainDamage + 1);
    });

    test('Sometimiento reduces any enemy attack at its initiation', async () => {
        const {catalog, factory, match, player, scenario} =
            await createScenarioFixture();
        const sometimiento = createAspectGameCard(
            factory,
            catalog,
            'protection-sometimiento',
            player,
        );
        player.hand.addCard(sometimiento);
        await sometimiento.initTriggers({match, player});
        const ability = sometimiento.abilities[0];
        const attack = new EnemyAttackEffect({
            enemy: scenario.villain,
            giveBoost: false,
            match,
            player,
            selectedTarget: player,
        });
        ability.effect.selectedTarget = attack;
        await ability.effect.runEffect({effect: attack, match, player});

        assert.equal(ability.trigger, TRIGGER_ENEMY_ATTACKS);
        assert.ok(sometimiento.triggers[TRIGGER_ENEMY_ATTACKS][PRIORITY_INTERRUPT]);
        assert.deepEqual(
            findAspectCard(catalog, 'protection-sometimiento').card.params.resources,
            [RESOURCE_ENERGY],
        );
        assert.equal(attack.modifyAttack, -3);
        assert.ok(attack.getTriggersInit().includes(TRIGGER_ENEMY_ATTACKS));
    });

    test('Golpe de tanteo readies Drax when the attack actually deals damage', async () => {
        const {catalog, factory, match, player, scenario, superhero} =
            await createScenarioFixture();
        const boostCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Carta de aumento',
                boost: 0,
                hitPoints: 1,
                attack: 1,
                scheme: 1,
            },
        }, {owner: scenario});
        const nextCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Siguiente carta',
                hitPoints: 1,
                attack: 1,
                scheme: 1,
            },
        }, {owner: scenario});
        scenario.deck.cards.unshift(boostCard, nextCard);
        const event = createAspectGameCard(
            factory,
            catalog,
            'protection-golpe-de-tanteo',
            player,
        );
        const basicAttack = new AttackBasicAbility({
            card: superhero.currentSide,
            match,
        });
        const attackEffect = basicAttack.effect;
        const activation = new Attack({effect: attackEffect});
        attackEffect.activation = activation;
        attackEffect.selectedTarget = scenario.villain;
        superhero.currentSide.exhausted = true;

        await event.abilities[0].effect.runEffect({
            effect: attackEffect,
            match,
            player,
        });

        assert.equal(attackEffect.modifyAttack, 0);
        await attackEffect.execute({match, player});
        assert.equal(attackEffect.dealtDamage, 1);
        assert.equal(activation.takenDamage, 1);
        await attackEffect.resolveDelayedEffects({match, player});
        assert.equal(superhero.currentSide.exhausted, false);
        assert.strictEqual(scenario.deck.discardPile[0], boostCard);
    });

    test('Golpe de tanteo does not ready Drax when the attack deals no damage', async () => {
        const {catalog, factory, match, player, scenario, superhero} =
            await createScenarioFixture();
        const boostCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Carta de aumento',
                boost: 1,
                hitPoints: 1,
                attack: 1,
                scheme: 1,
            },
        }, {owner: scenario});
        const nextCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name: 'Siguiente carta',
                hitPoints: 1,
                attack: 1,
                scheme: 1,
            },
        }, {owner: scenario});
        scenario.deck.cards.unshift(boostCard, nextCard);
        const event = createAspectGameCard(
            factory,
            catalog,
            'protection-golpe-de-tanteo',
            player,
        );
        const basicAttack = new AttackBasicAbility({
            card: superhero.currentSide,
            match,
        });
        const attackEffect = basicAttack.effect;
        const activation = new Attack({effect: attackEffect});
        attackEffect.activation = activation;
        attackEffect.selectedTarget = scenario.villain;
        superhero.currentSide.exhausted = true;

        await event.abilities[0].effect.runEffect({
            effect: attackEffect,
            match,
            player,
        });

        assert.equal(attackEffect.modifyAttack, -1);
        await attackEffect.execute({match, player});
        assert.equal(attackEffect.dealtDamage, 0);
        assert.equal(activation.takenDamage, 0);
        await attackEffect.resolveDelayedEffects({match, player});
        assert.equal(superhero.currentSide.exhausted, true);
        assert.strictEqual(scenario.deck.discardPile[0], boostCard);
    });

    test('Gamora is Guardian-only and returns the first Event discarded from your deck', async () => {
        const {catalog, factory, match, player, superhero} =
            await createFixture();
        const gamora = createAspectGameCard(
            factory,
            catalog,
            'basic-gamora',
            player,
        );
        const gamoraConfig = findAspectCard(catalog, 'basic-gamora');
        assert.equal(gamoraConfig.order, 19020);
        assert.equal(gamoraConfig.card.params.image, 'aspect/basic/allies/19020.png');
        assert.equal(
            gamoraConfig.card.params.abilities[0].type,
            ABILITY_HERO_RESPONSE,
        );

        superhero.selectedSide = 0;
        assert.equal(await gamora.canPlay({player}), false);
        superhero.selectedSide = 1;
        assert.equal(await gamora.canPlay({player}), true);
        player.addToGameZone(gamora);
        await gamora.initTriggers({match, player});

        const nonEvent = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_ALLY,
            params: {
                name: 'Carta que no es un Evento',
                attack: 1,
                thwart: 1,
                hitPoints: 1,
            },
        }, {owner: player});
        const event = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_EVENT,
            params: {name: 'Evento de prueba'},
        }, {owner: player});
        const tailCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_EVENT,
            params: {name: 'Última carta'},
        }, {owner: player});
        player.deck.cards.push(nonEvent, event, tailCard);

        assert.deepEqual(
            findAspectCard(catalog, 'basic-gamora')
                .card.params.abilities[0].params.trigger,
            [
                TRIGGER_THIS_ATTACK,
                TRIGGER_THIS_THWARTS,
            ],
        );
        const attackResponse =
            gamora.triggers[TRIGGER_THIS_ATTACK][PRIORITY_RESPONSE][0];
        const thwartResponse =
            gamora.triggers[TRIGGER_THIS_THWARTS][PRIORITY_RESPONSE][0];
        assert.ok(attackResponse);
        assert.ok(thwartResponse);
        await attackResponse.ability.effect.runEffect({match, player});

        assert.ok(player.hand.cards.includes(event));
        assert.ok(player.deck.discardPile.includes(nonEvent));
        assert.ok(player.deck.cards.includes(tailCard));
    });

    test('reduces Salto y apuñalamiento’s cost by the current vengeance count', async () => {
        const {factory, hero, match, player, superhero} = await createFixture();
        const card = findFixedCard(hero, 'Salto y apuñalamiento').card;
        const event = factory.cardsFactory.createGameCardFromConfig(
            card,
            {owner: player},
        );
        superhero.placeCounters(2);
        const costAbility = event.abilities.find(({trigger}) =>
            trigger === TRIGGER_THIS_PLAY_CARD);
        const playCardEffect = {modifyCost: 0};

        await costAbility.effect.runEffect({
            effect: playCardEffect,
            match,
            player,
        });

        assert.equal(playCardEffect.modifyCost, -2);
    });

    test('pays Mantis’s action costs and heals a friendly superhero', async () => {
        const {factory, hero, match, player, superhero} = await createFixture();
        const mantis = factory.cardsFactory.createGameCardFromConfig(
            findFixedCard(hero, 'Mantis').card,
            {owner: player},
        );
        mantis.controller = player;
        player.gameZone.addToGameZone(mantis);
        superhero.damage = 5;

        const action = mantis.abilities.find(({abilityType}) =>
            abilityType === ABILITY_ACTION);
        assert.equal(action.name, 'Cura 3 de Daño a un Superhéroe');
        await action.resolveAbility({match, player});

        assert.equal(mantis.exhausted, true);
        assert.equal(mantis.damage, 1);
        assert.equal(superhero.damage, 2);
    });

    test('increases Drax’s attack from vengeance counters and draws at the cap', async () => {
        const {factory, match, player, superhero} = await createFixture();
        const responseTrigger = superhero.currentSide.triggers[
            TRIGGER_VILLAIN_ATTACKS_YOU
        ][PRIORITY_RESPONSE][0];

        assert.equal(superhero.counters, undefined);
        const resolveVillainAttackResponse = async () => {
            const attack = new EnemyAttackEffect({
                enemy: {isVillain: true, name: 'Rino'},
                match,
                selectedTarget: player,
                giveBoost: false,
            });
            const params = attack.getTriggersParams({match, player});

            assert.strictEqual(params.effect.selectedTarget, player);
            assert.equal(await responseTrigger.canTrigger(params), true);
            await responseTrigger.runTrigger(params);
        };

        await resolveVillainAttackResponse();
        assert.equal(superhero.counters, 1);
        await resolveVillainAttackResponse();
        assert.equal(superhero.counters, 2);

        const attackModifier = superhero.currentSide.abilities.find(({trigger}) =>
            trigger === TRIGGER_YOUR_HERO_GET_ATTACK);
        const attack = new GetAttackEffect({
            match,
            selectedTarget: superhero.currentSide,
        });
        await attackModifier.effect.runEffect({match, player, effect: attack});
        await attack.execute({match, player});
        assert.equal(attack.attack, 3);

        await resolveVillainAttackResponse();
        assert.equal(superhero.counters, 3);

        const topCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_EVENT,
            params: {name: 'Carta de prueba'},
        }, {owner: player});
        player.deck.cards.push(topCard);
        await resolveVillainAttackResponse();
        assert.equal(superhero.counters, 3);
        assert.ok(player.hand.cards.includes(topCard));
    });

    test('Maestro de dwi theet draws after Drax makes a basic attack', async () => {
        const {factory, hero, match, player, superhero} = await createFixture();
        const maestro = factory.cardsFactory.createGameCardFromConfig(
            findFixedCard(hero, 'Maestro de dwi theet').card,
            {owner: player},
        );
        maestro.controller = player;
        player.gameZone.addToGameZone(maestro);
        await maestro.initTriggers({match, player});

        const topCard = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_EVENT,
            params: {name: 'Carta de prueba'},
        }, {owner: player});
        player.deck.cards.push(topCard);

        const effect = new DealDamageEffect({
            ability: {isBasic: true},
            character: superhero.currentSide,
            damage: 1,
            isAttack: true,
            match,
            selectedTarget: {name: 'Hombre de Arena'},
        });
        const attack = new Attack({effect});
        const params = attack.getTriggersParams({effect, match, player});
        const responseTrigger = maestro.triggers[
            TRIGGER_YOU_BASIC_ATTACK
        ][PRIORITY_RESPONSE][0];

        assert.equal(effect.selectedTarget.name, 'Hombre de Arena');
        assert.equal(await responseTrigger.canTrigger(params), true);
        await responseTrigger.runTrigger(params);

        assert.ok(player.hand.cards.includes(topCard));
    });

    test('the dagger upgrades grant Drax +1 ATQ and Retaliate 1', async () => {
        const {factory, hero, match, player, superhero} =
            await createFixture();
        const attack = new GetAttackEffect({
            match,
            selectedTarget: superhero.currentSide,
        });
        const attackDagger = factory.cardsFactory.createGameCardFromConfig(
            findFixedCard(hero, 'El puñal de Drax').card,
            {owner: player},
        );
        const retaliateDagger = factory.cardsFactory.createGameCardFromConfig(
            findFixedCard(hero, 'El otro puñal de Drax').card,
            {owner: player},
        );

        await attackDagger.abilities[0].effect.runEffect({
            effect: attack,
            match,
            player,
        });
        await attack.execute({match, player});
        assert.equal(attack.attack, 2);

        const retaliate = new GetRetaliateEffect({
            match,
            selectedTarget: superhero.currentSide,
        });
        await retaliateDagger.abilities[0].effect.runEffect({
            effect: retaliate,
            match,
            player,
        });
        await retaliate.execute({match, player});
        assert.equal(retaliate.retaliate, 1);
    });

    test('removes all vengeance counters and heals twice that amount on the alter-ego flip', async () => {
        const {match, player, superhero} = await createFixture();
        superhero.damage = 5;
        superhero.placeCounters(2);

        const flip = new FlipEffect({
            formTarget: TARGET_ALTEREGO_SIDE,
            match,
            target: TARGET_YOUR_SUPERHERO,
        });
        await flip.runEffect({match, player});

        assert.equal(superhero.currentSide.isAlterEgo, true);
        assert.equal(superhero.counters, 0);
        assert.equal(superhero.damage, 1);
    });

    test('resolves vengeance healing when Demasiado terco para morir flips Drax', async () => {
        const {factory, hero, match, player, superhero} = await createFixture();
        const stubbornness = factory.cardsFactory.createGameCardFromConfig(
            findFixedCard(hero, 'Demasiado terco para morir').card,
            {owner: player},
        );
        stubbornness.controller = player;
        player.gameZone.addToGameZone(stubbornness);
        await stubbornness.initTriggers({match, player});

        superhero.damage = 14;
        superhero.placeCounters(3);

        const defeat = new DefeatEffect({
            effectType: EFFECT_DEFEAT,
            match,
            selectedTarget: superhero.currentSide,
        });
        await defeat.runEffect({match, player});

        assert.equal(defeat.prevented, true);
        assert.equal(defeat.defeated, false);
        assert.equal(superhero.currentSide.isAlterEgo, true);
        assert.equal(superhero.counters, 0);
        assert.equal(superhero.damage, 4);
    });
});
