import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_HERO_ACTION,
    CLASSIFICATION_BASIC,
    CARD_TYPE_EVENT,
    CARD_TYPE_MINION,
    CARD_TYPE_RESOURCE,
    CARD_TYPE_TREACHERY,
    DIALOG_LIST,
    DIALOG_PAY_COST,
    DIALOG_USE_CARD,
    EFFECT_DRAW_CARD,
    EFFECT_PLAY_CARD,
    RESOURCE_ANY,
    RESOURCE_ENERGY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    TARGET_CARD,
    TARGET_YOU,
    TRAIT_CRIMINAL,
    TRIGGER_PLAYER_TURN_START,
    PRIORITY_FORCED_INTERRUPT,
} from 'mc-shared';
import {loadCatalog} from '../../../mc-data/seed/catalog.js';
import captainAmerica from '../../../mc-data/seed/catalog/heroes/captain-america.js';
import galacticArtifacts from '../../../mc-data/seed/catalog/sets/galactic-artifacts.js';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {AttackBasicAbility} from '../../src/abilities/basic/attack-basic-ability.js';
import {DefeatEffect} from '../../src/effects/defeat-effect.js';
import {GetAttackEffect} from '../../src/effects/get-attack-effect.js';
import {GetDefenseEffect} from '../../src/effects/get-defense-effect.js';
import {GetThwartEffect} from '../../src/effects/get-thwart-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('Artefactos galácticos modular set', () => {
    const names = [
        'Manto de Hércules',
        'Poción de obediencia',
        'Chaqueta del Todopoderoso',
        'El Veneno',
        'Varita vandariana de energía',
        'Huevo del monarca hujahdariano',
        'Tetera mágica',
        'Piedra filosofal',
        'Bola de cristal',
    ];

    const createGame = async ({playerCount = 1} = {}) => {
        const match = new Match({
            name: 'galactic-artifacts-test',
            mc: {mcSocket: {send() {}}},
        });
        match.persist = async () => {};
        match.refresh = async () => {};
        match.skipDiscardOrderDialog = true;
        match.openDialog = async () => ({});
        const factory = new MatchFactory(match);
        const players = Array.from({length: playerCount}, (_, index) => {
            const player = match.createPlayer({
                name: `Player ${index + 1}`,
                userId: `captain-america-${index + 1}`,
                initial: index === 0,
                superhero: factory.createSuperhero({
                    ...captainAmerica.config,
                    cards: [],
                    precon: [],
                    nemesis: [],
                    obligation: undefined,
                }),
            });
            player.initPlayer();
            player.superhero.selectedSide = 1;

            return player;
        });
        match.currentPlayer = players[0];
        match.scenario = await factory.createScenario({
            ...rhino.config,
            sets: [],
            defaultSets: [],
            cards: [],
        });
        await match.scenario.initScenario([], false);
        match.scenario.deck.cards = [
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_TREACHERY,
                params: {name: 'Remaining encounter card', boost: 0},
            }, {owner: match.scenario}),
        ];
        match.phase = 'players';
        match.playing = true;

        return {factory, match, player: players[0], players};
    };

    const getSetCardConfig = name => galacticArtifacts.config.cards.find(
        ({card}) => card.params.name === name,
    ).card;

    const createSetCard = (factory, scenario, name) =>
        factory.cardsFactory.createGameCardFromConfig(
            getSetCardConfig(name),
            {owner: scenario},
        );

    const createResourceCard = (factory, player, name, resources) =>
        factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_RESOURCE,
            params: {name, resources},
        }, {owner: player});

    const addEnemy = async (factory, scenario, name, attack, scheme) => {
        const enemy = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_MINION,
            params: {
                name,
                set: galacticArtifacts._id,
                boost: 0,
                attack,
                scheme,
                hitPoints: 5,
            },
        }, {owner: scenario});
        enemy.controller = scenario;
        scenario.gameZone.addToGameZone(enemy);
        await enemy.initTriggers();

        return enemy;
    };

    const attachCard = async (card, target, player) => {
        card.controller = card.owner;
        card.owner.gameZone.addToGameZone(card);
        const attachEffect = card.card.createAttachEffect(card);
        attachEffect.selectedTarget = target;
        await attachEffect.runEffect({player});
        await card.initTriggers();

        return attachEffect;
    };

    const useDialogs = (match, callback) => {
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            return callback(dialog);
        };

        return dialogs;
    };

    const assertEncounterCardDiscarded = (card, scenario, host) => {
        assert.equal(host.attached.includes(card), false);
        assert.ok(
            scenario.deck.discardPile.includes(card) ||
            scenario.deck.cards.includes(card),
            JSON.stringify({
                inDiscard: scenario.deck.discardPile.includes(card),
                inDeck: scenario.deck.cards.includes(card),
                inScenarioZone: scenario.gameZone.cards.includes(card),
                attached: host.attached.includes(card),
            }),
        );
    };

    const defeatSideScheme = async ({
        factory,
        match,
        player,
        name,
        dialogs,
    }) => {
        const card = createSetCard(factory, match.scenario, name);
        card.controller = match.scenario;
        match.scenario.gameZone.addToGameZone(card);
        await card.initTriggers();
        const defeat = new DefeatEffect({
            match,
            selectedTarget: card,
            target: TARGET_CARD,
        });
        await defeat.runEffect({match, player, card});

        return {card, defeat, dialogs};
    };

    test('registers nine unique, one-copy cards with their printed set data', async () => {
        const {sets} = await loadCatalog();
        const set = sets.find(({_id}) => _id === galacticArtifacts._id);

        assert.ok(set);
        assert.equal(set.config.name, 'Artefactos galácticos');
        assert.deepEqual(
            set.config.cards.map(({card}) => card.params.name),
            names,
        );
        assert.ok(set.config.cards.every(({count, card}) =>
            count === 1 && card.params.unique === true));
        assert.deepEqual(
            set.config.cards.map(({card}) => card.params.boost),
            [2, 2, 3, 2, 1, 1, 1, 1, 1],
        );
        assert.ok(names.slice(5).every(name =>
            getSetCardConfig(name).params.keywords.victory === 0));

        const sideSchemes = set.config.cards.slice(5);
        assert.ok(sideSchemes.every(({card}) =>
            card.params.startingThreat === 3 &&
            card.params.keywords.hinder[0] === 2 &&
            card.params.keywords.hinder[1] === true));
        assert.deepEqual(sideSchemes.map(({card}) => card.params.icons), [
            {acceleration: 1},
            {hazard: 1},
            {amplification: 1},
            {acceleration: 1},
        ]);
        assert.equal(
            getSetCardConfig('Bola de cristal')
                .params.abilities[0].params.effect.params.effect.type,
            EFFECT_PLAY_CARD,
        );
        assert.equal(
            getSetCardConfig('Bola de cristal')
                .params.abilities[0].params.effect.params.effect.params.requiresSharedTrait,
            false,
        );
    });

    test('min and max attachment conditions select eligible enemies and preserve ties', async () => {
        const {factory, match, player} = await createGame();
        const scenario = match.scenario;
        const lowestAttackA = await addEnemy(factory, scenario, 'Lowest ATK A', 1, 4);
        const lowestAttackB = await addEnemy(factory, scenario, 'Lowest ATK B', 1, 1);
        const highestSchemeA = await addEnemy(factory, scenario, 'Highest PLA A', 3, 4);
        const lowestSchemeB = await addEnemy(factory, scenario, 'Lowest PLA B', 4, 1);

        const cloak = createSetCard(factory, scenario, 'Manto de Hércules');
        const cloakTargets = await cloak.card.createAttachEffect(cloak)
            .getValidTarget({player});
        assert.deepEqual(
            cloakTargets.map(card => card.name).sort(),
            [lowestAttackA.name, lowestAttackB.name].sort(),
        );
        await attachCard(cloak, lowestAttackA, player);
        assert.equal(
            await lowestAttackA.getAttackValue({player}),
            4,
        );

        const wand = createSetCard(
            factory,
            scenario,
            'Varita vandariana de energía',
        );
        const wandTargets = await wand.card.createAttachEffect(wand)
            .getValidTarget({player});
        assert.deepEqual(
            wandTargets.map(card => card.name).sort(),
            [lowestAttackB.name, lowestSchemeB.name, match.villain.name].sort(),
        );

        const jacket = createSetCard(
            factory,
            scenario,
            'Chaqueta del Todopoderoso',
        );
        const jacketTargets = await jacket.card.createAttachEffect(jacket)
            .getValidTarget({player});
        assert.deepEqual(
            jacketTargets.map(card => card.name).sort(),
            [lowestAttackA.name, highestSchemeA.name].sort(),
        );

        const cloakResources = Array.from({length: 3}, (_, index) =>
            createResourceCard(
                factory,
                player,
                `Physical ${index + 1}`,
                [RESOURCE_PHYSICAL],
            ));
        player.hand.cards = cloakResources;
        const cloakDialogs = useDialogs(match, dialog => {
            assert.equal(dialog.dialogType, DIALOG_PAY_COST);
            assert.deepEqual(dialog.data.requirement, [
                RESOURCE_PHYSICAL,
                RESOURCE_PHYSICAL,
                RESOURCE_PHYSICAL,
            ]);

            return {
                paid: {
                    generators: [],
                    hand: cloakResources.map(card => ({id: card.id})),
                },
                resources: Array(3).fill(RESOURCE_PHYSICAL),
                fullyPaid: true,
            };
        });
        await player.resolveAbility(cloak.id, 0);
        assert.equal(cloakDialogs.length, 1);
        assert.ok(cloakResources.every(card =>
            player.deck.discardPile.includes(card)));
        assert.equal(await lowestAttackA.getAttackValue({player}), 1);

        await attachCard(wand, lowestSchemeB, player);
        const wandResources = Array.from({length: 3}, (_, index) =>
            createResourceCard(
                factory,
                player,
                `Energy ${index + 1}`,
                [RESOURCE_ENERGY],
            ));
        player.hand.cards = wandResources;
        const wandDialogs = useDialogs(match, dialog => {
            assert.equal(dialog.dialogType, DIALOG_PAY_COST);
            assert.deepEqual(dialog.data.requirement, [
                RESOURCE_ENERGY,
                RESOURCE_ENERGY,
                RESOURCE_ENERGY,
            ]);

            return {
                paid: {
                    generators: [],
                    hand: wandResources.map(card => ({id: card.id})),
                },
                resources: Array(3).fill(RESOURCE_ENERGY),
                fullyPaid: true,
            };
        });
        await player.resolveAbility(wand.id, 0);
        assert.equal(wandDialogs.length, 1);
        assert.ok(wandResources.every(card =>
            player.deck.discardPile.includes(card)));
        assertEncounterCardDiscarded(wand, scenario, lowestSchemeB);
    });

    test('Poción de obediencia lowers the attached hero stats and its action pays both costs', async () => {
        const {factory, match, player} = await createGame();
        const potion = createSetCard(factory, match.scenario, 'Poción de obediencia');
        const getStat = async (Effect, property) => {
            const effect = new Effect({
                match,
                selectedTarget: player.superhero,
            });
            await effect.runEffect({match, player});

            return effect[property];
        };
        const baseStats = {
            attack: await getStat(GetAttackEffect, 'attack'),
            defense: await getStat(GetDefenseEffect, 'defense'),
            thwart: await getStat(GetThwartEffect, 'thwart'),
        };

        await attachCard(potion, player.superhero, player);
        assert.deepEqual({
            attack: await getStat(GetAttackEffect, 'attack'),
            defense: await getStat(GetDefenseEffect, 'defense'),
            thwart: await getStat(GetThwartEffect, 'thwart'),
        }, {
            attack: baseStats.attack - 1,
            defense: baseStats.defense - 1,
            thwart: baseStats.thwart - 1,
        });

        const resources = [
            createResourceCard(factory, player, 'Mental 1', [RESOURCE_MENTAL]),
            createResourceCard(factory, player, 'Mental 2', [RESOURCE_MENTAL]),
        ];
        player.hand.cards = resources;
        const dialogs = useDialogs(match, dialog => {
            assert.equal(dialog.dialogType, DIALOG_PAY_COST);
            assert.equal(dialog.targetPlayer, player);
            assert.deepEqual(dialog.data.requirement, [
                RESOURCE_MENTAL,
                RESOURCE_MENTAL,
            ]);

            return {
                paid: {
                    generators: [],
                    hand: resources.map(card => ({id: card.id})),
                },
                resources: [RESOURCE_MENTAL, RESOURCE_MENTAL],
                fullyPaid: true,
            };
        });

        await player.resolveAbility(potion.id, 3);

        assert.equal(dialogs.length, 1);
        assert.equal(player.superhero.damage, 1);
        assert.ok(resources.every(card => player.deck.discardPile.includes(card)));
        assertEncounterCardDiscarded(potion, match.scenario, player.superhero);
    });

    test('Poción de obediencia reduces ATQ during a basic attack', async () => {
        const {factory, match, player} = await createGame();
        const potion = createSetCard(factory, match.scenario, 'Poción de obediencia');
        await attachCard(potion, player.superhero, player);
        const enemy = await addEnemy(
            factory,
            match.scenario,
            'Target enemy',
            1,
            1,
        );
        const attack = new AttackBasicAbility({
            card: player.superhero.currentSide,
            match,
        });

        assert.equal(
            await player.superhero.currentSide.getAttackValue({player}),
            1,
        );

        await attack.resolveAbility({
            player,
            card: player.superhero.currentSide,
            selectedTarget: enemy,
            preselectedTarget: true,
            fixedPreselectedTarget: true,
        });

        assert.equal(attack.resolved, true);
        assert.equal(enemy.damage, 1);
    });

    test('Chaqueta del Todopoderoso places threat and pays two same-type resources before discarding', async () => {
        const {factory, match, player} = await createGame();
        const jacket = createSetCard(
            factory,
            match.scenario,
            'Chaqueta del Todopoderoso',
        );
        await attachCard(jacket, match.villain, player);
        const resources = [createResourceCard(
            factory,
            player,
            'Double energy',
            [RESOURCE_ENERGY, RESOURCE_ENERGY],
        )];
        player.hand.cards = resources;
        const mainScheme = match.mainScheme;
        const startingThreat = mainScheme.threat;
        const dialogs = useDialogs(match, dialog => {
            assert.equal(dialog.dialogType, DIALOG_PAY_COST);
            assert.deepEqual(dialog.data.requirement, [
                RESOURCE_ANY,
                RESOURCE_ANY,
            ]);
            assert.equal(dialog.data.sameType, true);

            return {
                paid: {
                    generators: [],
                    hand: resources.map(card => ({id: card.id})),
                },
                resources: [RESOURCE_ENERGY, RESOURCE_ENERGY],
                fullyPaid: true,
            };
        });

        await player.resolveAbility(jacket.id, 0);

        assert.equal(dialogs.length, 1);
        assert.equal(mainScheme.threat, startingThreat + 2);
        assert.ok(resources.every(card => player.deck.discardPile.includes(card)));
        assertEncounterCardDiscarded(jacket, match.scenario, match.villain);
    });

    test('El Veneno escalates damage at turn start and any player can remove it with distinct resources', async () => {
        const {factory, match, player, players} = await createGame({
            playerCount: 2,
        });
        const otherPlayer = players[1];
        const poison = createSetCard(factory, match.scenario, 'El Veneno');
        await attachCard(poison, player.superhero, player);
        const [turnStart] = poison.triggers[TRIGGER_PLAYER_TURN_START][
            PRIORITY_FORCED_INTERRUPT
        ];

        await turnStart.runTrigger({match, player, effect: {}});
        assert.equal(poison.counters, 1);
        assert.equal(player.superhero.damage, 1);
        await turnStart.runTrigger({match, player, effect: {}});
        assert.equal(poison.counters, 2);
        assert.equal(player.superhero.damage, 3);

        const resources = [
            createResourceCard(factory, otherPlayer, 'Energy', [RESOURCE_ENERGY]),
            createResourceCard(factory, otherPlayer, 'Mental', [RESOURCE_MENTAL]),
            createResourceCard(factory, otherPlayer, 'Physical', [RESOURCE_PHYSICAL]),
        ];
        otherPlayer.hand.cards = resources;
        const dialogs = useDialogs(match, dialog => {
            assert.equal(dialog.dialogType, DIALOG_PAY_COST);
            assert.equal(dialog.targetPlayer, otherPlayer);
            assert.equal(dialog.data.differentTypes, true);

            return {
                paid: {
                    generators: [],
                    hand: resources.map(card => ({id: card.id})),
                },
                resources: [
                    RESOURCE_ENERGY,
                    RESOURCE_MENTAL,
                    RESOURCE_PHYSICAL,
                ],
                fullyPaid: true,
            };
        });

        await otherPlayer.resolveAbility(poison.id, 1);

        assert.equal(dialogs.length, 1);
        assert.ok(resources.every(card =>
            otherPlayer.deck.discardPile.includes(card)));
        assertEncounterCardDiscarded(poison, match.scenario, player.superhero);
    });

    test('defeating the egg lets its defeater ready their superhero', async () => {
        const {factory, match, player} = await createGame();
        player.superhero.exhausted = true;
        const dialogs = useDialogs(match, dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }
            if (dialog.dialogType === DIALOG_LIST) {
                return {selected: {id: 0}};
            }
        });

        await defeatSideScheme({
            factory,
            match,
            player,
            name: 'Huevo del monarca hujahdariano',
            dialogs,
        });

        assert.equal(player.superhero.exhausted, false);
    });

    test('defeating the teapot lets its defeater heal four damage', async () => {
        const {factory, match, player} = await createGame();
        player.superhero.damage = 6;
        const dialogs = useDialogs(match, dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }
            if (dialog.dialogType === DIALOG_LIST) {
                return {selected: {id: 0}};
            }
        });

        await defeatSideScheme({
            factory,
            match,
            player,
            name: 'Tetera mágica',
            dialogs,
        });

        assert.equal(player.superhero.damage, 2);
    });

    test('defeating the stone lets its defeater draw two cards', async () => {
        const {factory, match, player} = await createGame();
        player.deck.cards = [
            createResourceCard(factory, player, 'Draw 1', [RESOURCE_ENERGY]),
            createResourceCard(factory, player, 'Draw 2', [RESOURCE_MENTAL]),
        ];
        const dialogs = useDialogs(match, dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }
            if (dialog.dialogType === DIALOG_LIST) {
                return {selected: {id: 0}};
            }
        });

        await defeatSideScheme({
            factory,
            match,
            player,
            name: 'Piedra filosofal',
            dialogs,
        });

        assert.equal(player.hand.cards.length, 2);
    });

    test('defeating the crystal lets its defeater play any hand card at a reduced cost', async () => {
        const {factory, match, player} = await createGame();
        const event = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_EVENT,
            params: {
                name: 'Off-trait event',
                set: galacticArtifacts._id,
                classification: CLASSIFICATION_BASIC,
                traits: [TRAIT_CRIMINAL],
                cost: 4,
                resources: [RESOURCE_MENTAL],
                abilities: [
                    {
                        type: ABILITY_HERO_ACTION,
                        params: {
                            effect: {
                                type: EFFECT_DRAW_CARD,
                                params: {target: TARGET_YOU, count: 1},
                            },
                        },
                    },
                ],
            },
        }, {owner: player});
        const payment = createResourceCard(
            factory,
            player,
            'Physical payment',
            [RESOURCE_PHYSICAL],
        );
        const drawn = createResourceCard(
            factory,
            player,
            'Card drawn',
            [RESOURCE_ENERGY],
        );
        player.hand.cards = [event, payment];
        player.deck.cards = [drawn];
        const dialogs = useDialogs(match, dialog => {
            if (dialog.dialogType === DIALOG_USE_CARD) {
                return {selected: {id: dialog.data.cards[0].id}};
            }
            if (dialog.dialogType === DIALOG_LIST) {
                return {selected: {id: 0}};
            }
            if (dialog.dialogType === DIALOG_PAY_COST) {
                assert.equal(dialog.data.card.name, 'Off-trait event');
                assert.equal(dialog.data.cost, 1);

                return {
                    paid: {
                        generators: [],
                        hand: [{id: payment.id}],
                    },
                    resources: [RESOURCE_PHYSICAL],
                    fullyPaid: true,
                };
            }
        });

        await defeatSideScheme({
            factory,
            match,
            player,
            name: 'Bola de cristal',
            dialogs,
        });

        assert.ok(dialogs.some(dialog =>
            dialog.dialogType === DIALOG_PAY_COST));
        assert.ok(player.deck.discardPile.includes(event));
        assert.ok(
            player.deck.discardPile.includes(payment) ||
            player.deck.cards.includes(payment),
        );
        assert.deepEqual(player.hand.cards, [drawn]);
    });
});
