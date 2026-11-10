import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

import {
    DIALOG_ENCOUNTERS_DEALT,
    PRIORITY_CONSTANT,
    TRIGGER_VILLAIN_PHASE_START,
} from 'mc-shared';
import {Delayed} from '../../src/engine/delayed.js';
import {PlayPlayersPhaseEffect} from '../../src/effects/play-players-phase-effect.js';
import {PlayVillainPhaseEffect} from '../../src/effects/play-villain-phase-effect.js';
import {Match} from '../../src/model/match/match.js';
import {Scenario} from '../../src/model/match/scenario.js';

describe('PlayVillainPhaseEffect encounter dealing', () => {
    test('phase-start trigger runs before the first Villain-phase step', async () => {
        const match = {
            limits: {},
            name: 'villain-phase-start-test',
            async persist() {},
            playing: true,
            villainPhaseStep: 0,
        };
        const phase = new PlayVillainPhaseEffect({match});
        const events = [];
        const phaseStartCalls = [];
        phase.trigger = async (priority, triggerTypes) => {
            if (triggerTypes.includes(TRIGGER_VILLAIN_PHASE_START)) {
                phaseStartCalls.push(priority);
            }
            if (priority === PRIORITY_CONSTANT &&
                triggerTypes.includes(TRIGGER_VILLAIN_PHASE_START)) {
                events.push('phase-start');
            }

            return true;
        };
        phase.canContinuePhase = () => true;
        phase.runTracedStep = async (name, action) => {
            events.push(name);
            await action();
        };
        phase.stepAccelerateScheme = async () => {};
        phase.stepActivations = async () => {};
        phase.stepDealEncounters = async () => {};
        phase.stepRevealEncounters = async () => {};
        phase.runEndVillainPhase = async () => {};

        await phase.execute({match});

        assert.deepEqual(events.slice(0, 2), ['phase-start', 'place-threat']);
        assert.equal(
            phaseStartCalls.filter(priority => priority === PRIORITY_CONSTANT).length,
            1
        );
    });

    test('encounter dealt dialog reports player counts and hazard extras without serializing card identities', async () => {
        let dealtCards = 0;
        const dialogs = [];
        const knownCard = {
            id: 'encounter-1',
            toObj() {
                assert.fail('The dealing summary must not serialize an encounter card.');
            },
        };
        const unseenCard = {
            id: 'encounter-2',
            toObj() {
                assert.fail('The dealing summary must not serialize an encounter card.');
            },
        };
        const scenario = {
            deck: {
                knownCards: [knownCard],
            },
        };
        const player = {
            superhero: {name: 'Hulka'},
            encounters: [],
            gameZone: {
                dealEncounterCard(cards) {
                    player.encounters.push(...cards);
                },
                async refresh() {},
            },
        };
        const match = {
            hazardIcons: 1,
            orderedPlayers: [player],
            players: [player],
            scenario,
            triggerCards: {},
            async drawEncounterCards() {
                dealtCards++;
                const card = dealtCards === 1 ? knownCard : unseenCard;
                scenario.deck.knownCards = [];
                return [card];
            },
            async openDialog(dialog) {
                dialogs.push(dialog);
            },
        };
        const phase = new PlayVillainPhaseEffect({match});

        await phase.stepDealEncounters();

        assert.equal(player.encounters.length, 2);
        assert.equal(dialogs[0].dialogType, DIALOG_ENCOUNTERS_DEALT);
        assert.equal(dialogs[0].data.hazardIcons, 1);
        assert.deepEqual(dialogs[0].data.encounters, [{
            name: 'Hulka',
            count: 2,
            hazardIcons: 1,
        }]);
    });

    test('global hazard icons deal one extra encounter each in player order', async () => {
        let dealtCards = 0;
        let dialog;
        const createPlayer = name => {
            const player = {
                superhero: {name},
                encounters: [],
            };
            player.gameZone = {
                dealEncounterCard(cards) {
                    player.encounters.push(...cards);
                },
                async refresh() {},
            };

            return player;
        };
        const players = ['Hulka', 'Mapache Cohete'].map(createPlayer);
        const match = {
            hazardIcons: 3,
            orderedPlayers: players,
            players,
            scenario: {
                deck: {
                    knownCards: [],
                },
            },
            triggerCards: {},
            async drawEncounterCards() {
                dealtCards++;
                return [{
                    id: `encounter-${dealtCards}`,
                    toObj() {
                        return {id: this.id};
                    },
                }];
            },
            async openDialog(options) {
                dialog = options;
            },
        };
        const phase = new PlayVillainPhaseEffect({match});

        await phase.stepDealEncounters();

        assert.deepEqual(dialog.data.encounters, [
            {
                name: 'Hulka',
                count: 3,
                hazardIcons: 2,
            },
            {
                name: 'Mapache Cohete',
                count: 2,
                hazardIcons: 1,
            },
        ]);
        assert.equal(dialog.data.hazardIcons, 3);
    });

    test('hazard icons are shared across zones and extras rotate across the global order', async () => {
        const match = new Match({
            mc: {mcSocket: {send() {}}},
            name: 'global-hazard-test',
        });
        const scenario = new Scenario({
            mainSchemes: [],
            match,
            name: 'scenario',
            scenarioCards: [],
            sets: [],
            separatePlayAreas: true,
            villains: [],
        });
        const firstZone = scenario.createZone({id: 'first-zone'});
        const secondZone = scenario.createZone({id: 'second-zone'});
        firstZone.cards.push({hazardIcons: 1});
        scenario.deck = {knownCards: []};
        let dealtCards = 0;
        scenario.drawEncounterCards = async () => [{
            id: `encounter-${++dealtCards}`,
            toObj() {
                return {id: this.id};
            },
        }];

        const players = ['Hulka', 'Mapache Cohete'].map((name, index) => {
            const player = {
                defeated: false,
                hazardIcons: 0,
                initial: index === 0,
                name,
                superhero: {name},
                encounters: [],
                gameZone: {
                    dealEncounterCard(cards) {
                        player.encounters.push(...cards);
                    },
                    async refresh() {},
                },
            };
            (index === 0 ? firstZone : secondZone).addPlayer(player);
            return player;
        });
        match.players = players;
        match.currentPlayer = players[0];
        match.scenario = scenario;
        match.playing = true;
        const dialogs = [];
        match.openDialog = async dialog => dialogs.push(dialog);

        await new PlayVillainPhaseEffect({match}).stepDealEncounters();

        assert.deepEqual(players.map(player => player.encounters.length), [2, 1]);
        assert.equal(dialogs[0].data.hazardIcons, 1);
        assert.deepEqual(
            dialogs[0].data.encounters.map(encounter => encounter.hazardIcons),
            [1, 0]
        );

        match.players.forEach(player => {
            player.encounters = [];
        });
        match.players[0].initial = false;
        match.players[1].initial = true;
        await new PlayVillainPhaseEffect({match}).stepDealEncounters();
        assert.deepEqual(players.map(player => player.encounters.length), [1, 2]);
    });

    test('scenario delayed effects resolve after the player and villain phases', async () => {
        for (const PhaseEffect of [
            PlayPlayersPhaseEffect,
            PlayVillainPhaseEffect,
        ]) {
            const match = new Match({
                mc: {mcSocket: {send() {}}},
                name: 'scenario-phase-delayed-effects-test',
            });
            const scenario = new Scenario({
                mainSchemes: [],
                match,
                name: 'scenario',
                scenarioCards: [],
                sets: [],
                villains: [],
            });
            match.scenario = scenario;
            match.playing = true;
            const player = {name: 'Hulka'};
            let resolved = 0;
            scenario.createDelayedEffect(new Delayed({
                card: {id: 'source'},
                player,
                effect: {
                    async runEffect(params) {
                        resolved++;
                        assert.strictEqual(params.player, player);
                        assert.strictEqual(params.match, match);
                    },
                },
            }));
            const phase = new PhaseEffect({match});

            await phase.triggerEnds({effect: phase, match, player});

            assert.equal(resolved, 1);
            assert.equal(scenario.delayedEffects.length, 0);
        }
    });

    test('numbered steps do not expire delayed effects or emit the phase-end window', async () => {
        const calls = [];
        const match = {
            playing: true,
            triggerCards: {},
            scenario: {
                async resolveDelayedEffects() {
                    calls.push('scenario-delayed');
                },
            },
        };
        const phase = new PlayVillainPhaseEffect({match});
        phase.resolveDelayedEffects = async () => calls.push('phase-delayed');
        phase.trigger = async (_priority, triggers, params) => {
            calls.push({triggers, step: params.step});
            return true;
        };
        for (let step = 1; step <= 5; step++) {
            await phase.triggerPhaseStep(step, {});
        }

        assert.equal(calls.includes('scenario-delayed'), false);
        assert.equal(calls.includes('phase-delayed'), false);
        assert.deepEqual([...new Set(calls.map(call => call.step))], [1, 2, 3, 4, 5]);
        await phase.triggerEnds({effect: phase});
        assert.ok(calls.includes('phase-delayed'));
        assert.equal(calls.at(-1), 'scenario-delayed');
    });
});
