import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    ABILITY_BOOST,
    ABILITY_WHEN_REVEALED,
    CARD_TYPE_ALTEREGO,
    CARD_TYPE_HERO,
    CARD_TYPE_MINION,
    CARD_TYPE_TREACHERY,
    DIALOG_ACTIVATE,
    DIALOG_ENCOUNTERS_DEALT,
    DIALOG_ENCOUNTERS_REVEAL,
    DIALOG_SELECT_TARGET,
    EFFECT_CHAINED,
    EFFECT_DEAL_DAMAGE,
    EFFECT_DEAL_ENCOUNTER,
    TARGET_INITIAL_PLAYER,
    TARGET_VILLAIN,
    TARGET_YOU,
    TRIGGER_PHASE_ENDS,
} from 'mc-shared';
import rhino from '../../../mc-data/seed/catalog/scenarios/rhino.js';
import {ChangeRoundEffect} from '../../src/effects/change-round-effect.js';
import {EnemyAttackEffect} from '../../src/effects/enemy-attack-effect.js';
import {EnemySchemeEffect} from '../../src/effects/enemy-scheme-effect.js';
import {PlayMatchEffect} from '../../src/effects/play-match-effect.js';
import {PlayPlayersPhaseEffect} from '../../src/effects/play-players-phase-effect.js';
import {PlayRoundEffect} from '../../src/effects/play-round-effect.js';
import {PlayTurnEffect} from '../../src/effects/play-turn-effect.js';
import {PlayVillainPhaseEffect} from '../../src/effects/play-villain-phase-effect.js';
import {SeveralActivationsEffect} from '../../src/effects/several-activations-effect.js';
import {StoreBoostEffect} from '../../src/effects/store-boost-effect.js';
import {MatchFactory} from '../../src/factory/match-factory.js';
import {Match} from '../../src/model/match/match.js';

describe('villain phase multiplayer rules', () => {
    const createGame = async (count = 2, initialIndex = 1) => {
        const match = new Match({
            name: 'villain-phase-rules',
            mc: {mcSocket: {send() {}}},
        });
        const factory = new MatchFactory(match);
        match.persist = async () => {};
        match.refresh = async () => {};
        match.skipDiscardOrderDialog = true;
        match.skipBoostDealtNotification = true;
        const dialogs = [];
        match.openDialog = async dialog => {
            dialogs.push(dialog);
            if (dialog.dialogType === DIALOG_SELECT_TARGET) {
                return {selected: dialog.data.cards.at(-1)};
            }
            return {};
        };
        for (let index = 0; index < count; index++) {
            const player = match.createPlayer({
                id: `player-${index}`,
                name: `Player ${index}`,
                userId: `account-${index}`,
                initial: index === initialIndex,
                superhero: factory.createSuperhero({
                    sides: [
                        {
                            type: CARD_TYPE_ALTEREGO,
                            params: {
                                name: `Alter Ego ${index}`,
                                hitPoints: 30,
                                handSize: 6,
                                recovery: 3,
                            },
                        },
                        {
                            type: CARD_TYPE_HERO,
                            params: {
                                name: `Hero ${index}`,
                                hitPoints: 30,
                                handSize: 5,
                                attack: 2,
                                thwart: 2,
                                defense: 1,
                            },
                        },
                    ],
                    cards: [],
                    precon: [],
                }),
            });
            player.initPlayer();
            player.superhero.selectedSide = index % 2 === 0 ? 1 : 0;
        }
        match.currentPlayer = match.players[0];
        match.scenario = await factory.createScenario({
            ...rhino.config,
            sets: [],
            defaultSets: [],
            cards: [{
                count: 40,
                card: {
                    type: CARD_TYPE_TREACHERY,
                    params: {name: 'Encounter', boost: 0},
                },
            }],
        });
        await match.scenario.initScenario([], false);
        match.playing = true;
        match.phase = 'villain';
        dialogs.length = 0;
        const addMinion = (player, name) => {
            const minion = factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_MINION,
                params: {name, attack: 1, scheme: 1, hitPoints: 5, boost: 0},
            }, {owner: match.scenario});
            minion.controller = player;
            minion.engaged = player;
            player.engage(minion);
            return minion;
        };
        for (const [index, player] of match.players.entries()) {
            addMinion(player, `Minion ${index}a`);
            addMinion(player, `Minion ${index}b`);
        }

        return {
            addMinion,
            dialogs,
            factory,
            match,
            phase: new PlayVillainPhaseEffect({match}),
        };
    };

    test('activates the villain then each engaged minion for every player from the first player', async () => {
        const {dialogs, match, phase} = await createGame();
        await phase.stepActivations({player: match.players[0]});

        assert.deepEqual(
            dialogs.filter(dialog => dialog.dialogType === DIALOG_ACTIVATE)
                .map(({data}) => [data.character.name, data.target.name]),
            [
                ['Rino', 'Alter Ego 1'],
                ['Minion 1b', 'Alter Ego 1'],
                ['Minion 1a', 'Alter Ego 1'],
                ['Rino', 'Hero 0'],
                ['Minion 0b', 'Hero 0'],
                ['Minion 0a', 'Hero 0'],
            ],
        );
        assert.deepEqual(
            dialogs.filter(dialog => dialog.dialogType === DIALOG_SELECT_TARGET)
                .map(dialog => dialog.targetPlayer),
            ['player-1', 'player-0'],
        );
        assert.equal(match.players[0].superhero.damage, 4);
        assert.equal(match.players[1].superhero.damage, 0);
        assert.equal(match.scenario.mainScheme.threat, 3);
        const activations = dialogs.filter(dialog =>
            dialog.dialogType === DIALOG_ACTIVATE);
        assert.deepEqual(activations.map(dialog => dialog.targetPlayer.id), [
            'player-1', 'player-1', 'player-1',
            'player-0', 'player-0', 'player-0',
        ]);
        assert.ok(activations.every(dialog => dialog.showToAll));
        const reveals = dialogs.filter(dialog =>
            dialog.dialogType === DIALOG_ENCOUNTERS_REVEAL);
        assert.deepEqual(reveals.map(dialog => dialog.targetPlayer.id), [
            'player-1', 'player-0',
        ]);
        assert.ok(reveals.every(dialog => dialog.showToAll));
    });

    test('newly engaged minions activate during the same group without activating others twice', async () => {
        const {addMinion, dialogs, match, phase} = await createGame(1, 0);
        const openDialog = match.openDialog;
        let added = false;
        match.openDialog = async dialog => {
            if (!added && dialog.dialogType === DIALOG_ACTIVATE &&
                dialog.data.character.name.startsWith('Minion')) {
                added = true;
                addMinion(match.players[0], 'Late Minion');
            }
            return openDialog(dialog);
        };

        await phase.stepActivations({player: match.players[0]});

        const names = dialogs.filter(dialog => dialog.dialogType === DIALOG_ACTIVATE)
            .map(({data}) => data.character.name);
        assert.equal(names.length, 4);
        assert.deepEqual(new Set(names), new Set([
            'Rino', 'Minion 0a', 'Minion 0b', 'Late Minion',
        ]));
        assert.equal(match.players[0].superhero.damage, 5);
    });

    test('a same-title villain stage change does not add a second activation to a group', async () => {
        const {match} = await createGame(1, 0);
        const firstStage = match.villain;
        const nextStage = match.scenario.villains.find(villain => villain.stage === 2);
        const activations = [];
        const effect = new SeveralActivationsEffect({
            enemiesType: TARGET_VILLAIN,
            match,
        });
        effect.activate = async enemy => {
            activations.push(enemy);
            match.scenario.gameZone.addVillain(nextStage);
        };

        await effect.runEffect({player: match.players[0]});

        assert.deepEqual(activations, [firstStage]);
    });

    test('all four starting positions activate every player once regardless of the previous turn', async () => {
        for (let initial = 0; initial < 4; initial++) {
            const {dialogs, match, phase} = await createGame(4, initial);
            match.currentPlayer = match.players[(initial + 2) % 4];
            const expected = match.orderedPlayers.map(player => player.superhero.name);

            await phase.stepActivations({player: match.currentPlayer});

            assert.deepEqual(
                dialogs.filter(dialog => dialog.dialogType === DIALOG_ACTIVATE)
                    .map(({data}) => data.target.name),
                expected.flatMap(name => [name, name, name]),
            );
        }
    });

    test('encounters dealt while revealing are appended, including to a player who already revealed', async () => {
        const {factory, match, phase} = await createGame();
        const [second, first] = match.players;
        const createEncounter = (name, abilities = []) =>
            factory.cardsFactory.createGameCardFromConfig({
                type: CARD_TYPE_TREACHERY,
                params: {name, boost: 0, abilities},
            }, {owner: match.scenario});
        first.gameZone.dealEncounterCard([createEncounter('First')]);
        second.gameZone.dealEncounterCard([createEncounter('Source', [{
            type: ABILITY_WHEN_REVEALED,
            params: {
                effect: {
                    type: EFFECT_CHAINED,
                    params: {
                        effects: [TARGET_INITIAL_PLAYER, TARGET_YOU].map(target => ({
                            type: EFFECT_DEAL_ENCOUNTER,
                            params: {target},
                        })),
                    },
                },
            },
        }])]);
        const revealed = [];
        for (const player of match.players) {
            const reveal = player.revealEncounterCard.bind(player);
            player.revealEncounterCard = async card => {
                revealed.push([player.id, card.name]);
                return reveal(card);
            };
        }

        await phase.stepRevealEncounters();

        assert.deepEqual(revealed, [
            [first.id, 'First'],
            [second.id, 'Source'],
            [second.id, 'Encounter'],
            [first.id, 'Encounter'],
        ]);
        assert.ok(match.players.every(player => !player.encounters.length));
    });

    test('reveal queues stop after a player is eliminated or the game ends', async () => {
        for (const gameOver of [false, true]) {
            const {match, phase} = await createGame();
            const [second, first] = match.players;
            first.gameZone.dealEncounterCard(await match.drawEncounterCards(2));
            second.gameZone.dealEncounterCard(await match.drawEncounterCards(1));
            let firstReveals = 0;
            let secondReveals = 0;
            const revealFirst = first.revealEncounterCard.bind(first);
            const revealSecond = second.revealEncounterCard.bind(second);
            first.revealEncounterCard = async card => {
                firstReveals++;
                await revealFirst(card);
                if (gameOver) {
                    await match.finishGame('test-ended');
                } else {
                    await first.defeat();
                }
            };
            second.revealEncounterCard = async card => {
                secondReveals++;
                return revealSecond(card);
            };

            await phase.stepRevealEncounters();

            assert.equal(firstReveals, 1);
            assert.equal(secondReveals, gameOver ? 0 : 1);
            assert.equal(first.encounters.length, 1);
        }
    });

    test('omits eliminated players from activations, encounter dealing and encounter reveal', async () => {
        const {dialogs, match, phase} = await createGame(3, 1);
        match.players[0].defeated = true;
        match.players[0].revealEncounterCards = () => {
            assert.fail('Eliminated player must not reveal encounters.');
        };
        await phase.stepActivations({player: match.players[0]});
        await phase.stepDealEncounters();
        await phase.stepRevealEncounters();

        assert.deepEqual(phase.getPlayersInVillainPhase(), [
            match.players[1], match.players[2],
        ]);
        assert.equal(dialogs.filter(dialog =>
            dialog.dialogType === DIALOG_ACTIVATE).length, 6);
        const dealt = dialogs.find(dialog =>
            dialog.dialogType === DIALOG_ENCOUNTERS_DEALT);
        assert.deepEqual(dealt.data.encounters.map(({name}) => name), [
            'Alter Ego 1', 'Hero 2',
        ]);
        assert.equal(match.players[0].superhero.damage, 0);
        assert.ok(match.players.every(player => !player.encounters.length));
    });

    test('an eliminated player passes the marker and intact minions to the next surviving player', async () => {
        const {match, phase} = await createGame(3, 0);
        const [first, skipped, next] = match.players;
        skipped.defeated = true;
        const minions = first.minions.slice();
        const [minion] = minions;
        minion.damage = 2;
        minion.stun();
        minion.confuse();
        minion.tough = 1;
        const faceDown = minion.faceDown;
        const attached = minion.attached;
        const tuckedCards = minion.tuckedCards;

        await first.defeat();

        assert.equal(match.initialPlayer, next);
        assert.equal(first.minions.length, 0);
        for (const card of minions) {
            assert.equal(card.engaged, next);
            assert.ok(next.minions.includes(card));
        }
        assert.equal(minion.damage, 2);
        assert.equal(minion.isStunned, true);
        assert.equal(minion.isConfused, true);
        assert.equal(minion.isTough, true);
        assert.equal(minion.faceDown, faceDown);
        assert.equal(minion.attached, attached);
        assert.equal(minion.tuckedCards, tuckedCards);
        assert.deepEqual(phase.getPlayersInVillainPhase(), [next]);
    });

    test('a player defeated by the villain is skipped while their minions activate against the next player', async () => {
        const {dialogs, match, phase} = await createGame(2, 0);
        match.players[0].superhero.damage = 29;
        const transferred = match.players[0].minions.slice();

        await phase.stepActivations({player: match.players[0]});

        assert.equal(match.players[0].defeated, true);
        assert.equal(match.initialPlayer, match.players[1]);
        assert.ok(transferred.every(minion => minion.engaged === match.players[1]));
        assert.deepEqual(
            dialogs.filter(dialog => dialog.dialogType === DIALOG_ACTIVATE)
                .map(({data}) => data.target.name),
            ['Hero 0', 'Alter Ego 1', ...Array(4).fill('Alter Ego 1')],
        );
        assert.equal(match.scenario.mainScheme.threat, 5);
    });

    test('an eliminated player is also skipped during turns and hand refills in the next player phase', async t => {
        const {match} = await createGame(3, 1);
        match.players[0].defeated = true;
        match.phase = 'players';
        const turns = [];
        const refills = [];
        t.mock.method(PlayTurnEffect.prototype, 'runEffect', async ({player}) => {
            turns.push(player.id);
        });
        for (const player of match.players) {
            player.runEndPlayersPhase = async () => refills.push(player.id);
        }

        await new PlayPlayersPhaseEffect({match}).runEffect({});

        assert.deepEqual(turns, ['player-1', 'player-2']);
        assert.deepEqual(refills, turns);
    });

    test('eliminating another player defending with their hero ends the attack', async () => {
        const {match} = await createGame();
        const [target, defendingPlayer] = match.players;
        const effect = new EnemyAttackEffect({
            selectedTarget: target,
            enemy: match.villain,
            match,
        });
        effect.defender = defendingPlayer.superhero;
        defendingPlayer.defeated = true;

        assert.equal(effect.canContinueActivation(), false);
        assert.equal(effect.isResolved(), false);
    });

    test('finishes all five steps in order, then advances the first player only once for the next round', async () => {
        const {dialogs, match, phase} = await createGame(3, 1);
        const steps = [];
        const triggerPhaseStep = phase.triggerPhaseStep.bind(phase);
        phase.triggerPhaseStep = async (step, params) => {
            steps.push(step);
            return triggerPhaseStep(step, params);
        };
        const initialThreat = match.scenario.mainScheme.threat;
        await phase.runEffect({player: match.players[0]});

        assert.deepEqual(steps, [1, 2, 3, 4, 5]);
        assert.equal(match.villainPhaseStep, 5);
        assert.equal(match.scenario.mainScheme.threat, initialThreat + 6);
        assert.equal(dialogs.filter(dialog =>
            dialog.dialogType === DIALOG_ACTIVATE).length, 9);
        assert.equal(match.initialPlayer, match.players[2]);
        await new ChangeRoundEffect({match}).runEffect({});
        assert.equal(match.currentPlayer, match.players[2]);
        assert.deepEqual(match.players.map(player => player.initial), [false, false, true]);
        assert.ok(match.players.every(player => !player.encounters.length));
    });

    test('first-player order stays circular across repeated rounds and skips eliminated players', async () => {
        for (let count = 1; count <= 4; count++) {
            const {match, phase} = await createGame(count, count - 1);
            if (count > 2) {
                match.players[1].defeated = true;
            }
            const living = match.players.filter(player => !player.defeated);
            for (let round = 0; round < count * 2; round++) {
                const previous = match.initialPlayer;
                const next = living[(living.indexOf(previous) + 1) % living.length];
                phase.runEndVillainPhase();
                await new ChangeRoundEffect({match}).runEffect({});
                assert.equal(match.initialPlayer, next);
                assert.equal(match.currentPlayer, next);
                assert.equal(match.players.filter(player => player.initial).length, 1);
            }
        }
    });

    test('resuming a completed round starts with its already advanced first player', async t => {
        const {match, phase} = await createGame(3, 1);
        phase.runEndVillainPhase();
        match.phase = 'round-complete';
        let nextPlayer;
        t.mock.method(PlayRoundEffect.prototype, 'runEffect', async function (params) {
            nextPlayer = params.player;
            this.playing = false;
            match.playing = false;
        });

        await new PlayMatchEffect({match}).runEffect({});

        assert.equal(nextPlayer, match.players[2]);
        assert.equal(match.initialPlayer, match.players[2]);
        assert.equal(match.players.filter(player => player.initial).length, 1);
    });

    test('ends the phase immediately when the game ends during an activation', async () => {
        const {dialogs, match, phase} = await createGame();
        const openDialog = match.openDialog;
        const initialDeckSize = match.scenario.deck.cards.length;
        match.openDialog = async dialog => {
            if (dialog.dialogType === DIALOG_ACTIVATE) {
                match.gameOverReason = 'test-ended';
                match.playing = false;
            }
            return openDialog(dialog);
        };

        await phase.runEffect({player: match.players[0]});

        assert.equal(dialogs.filter(dialog =>
            dialog.dialogType === DIALOG_ACTIVATE).length, 1);
        assert.equal(dialogs.some(dialog =>
            dialog.dialogType === DIALOG_ENCOUNTERS_DEALT), false);
        assert.equal(match.initialPlayer, match.players[1]);
        assert.equal(match.villainPhaseStep, 2);
        assert.equal(match.scenario.deck.cards.length, initialDeckSize);
        assert.equal(match.scenario.mainScheme.threat, 2);
    });

    test('completing the final main scheme stops the phase before any activation or encounter', async () => {
        const {dialogs, match, phase} = await createGame();
        match.scenario.mainScheme.threat = match.scenario.mainScheme.value - 1;
        const initial = match.initialPlayer;

        await phase.runEffect({player: match.currentPlayer});

        assert.ok(match.gameOverReason);
        assert.equal(match.playing, false);
        assert.equal(match.villainPhaseStep, 1);
        assert.equal(match.initialPlayer, initial);
        assert.equal(dialogs.some(dialog =>
            dialog.dialogType === DIALOG_ACTIVATE ||
            dialog.dialogType === DIALOG_ENCOUNTERS_DEALT), false);
    });

    test('a lethal boost stops scheming and discards unresolved boosts without revealing them', async () => {
        const {dialogs, factory, match} = await createGame(1, 0);
        const [player] = match.players;
        player.superhero.selectedSide = 0;
        const lethalBoost = factory.cardsFactory.createGameCardFromConfig({
            type: CARD_TYPE_TREACHERY,
            params: {
                name: 'Lethal Boost',
                boost: 1,
                boostAbility: {
                    type: ABILITY_BOOST,
                    params: {
                        effect: {
                            type: EFFECT_DEAL_DAMAGE,
                            params: {target: TARGET_YOU, damage: 40},
                        },
                    },
                },
            },
        }, {owner: match.scenario});
        match.scenario.deck.cards.unshift(lethalBoost);
        await new StoreBoostEffect({
            match,
            selectedTarget: match.villain,
        }).runEffect({player});
        const nextBoost = match.scenario.deck.cards[0];
        const effect = new EnemySchemeEffect({enemy: match.villain, match});
        dialogs.length = 0;

        await effect.runEffect({player});

        assert.equal(player.defeated, true);
        assert.ok(match.gameOverReason);
        assert.equal(effect.resolved, false);
        assert.equal(match.scenario.mainScheme.threat, 0);
        assert.ok(match.scenario.deck.discardPile.includes(lethalBoost));
        assert.ok(match.scenario.deck.discardPile.includes(nextBoost));
        assert.equal(dialogs.some(dialog =>
            dialog.dialogType === DIALOG_ENCOUNTERS_REVEAL &&
            dialog.data.card.id === nextBoost.id), false);
    });

    test('a group of minion activations is not a phase-end window', () => {
        const effect = new SeveralActivationsEffect({match: {}});
        assert.equal(effect.getTriggersEnds().includes(TRIGGER_PHASE_ENDS), false);
    });
});
