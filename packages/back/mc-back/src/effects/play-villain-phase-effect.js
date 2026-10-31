import {
    DIALOG_ENCOUNTERS_DEALT,
    TARGET_ALL_ENGAGED_MINIONS,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';

import {AccelerateSchemeEffect} from './accelerate-scheme-effect.js';
import {ActivateEffect} from './activate-effect.js';
import {DealEncounterEffect} from './deal-encounter-effect.js';
import {PlayPhaseEffect} from './play-phase-effect.js';
import {SeveralActivationsEffect} from './several-activations-effect.js';
import {logGameTrace} from '../utils/game-trace.js';
import {
    getScenarioZone,
    getMainSchemeFor,
    getVillainFor,
} from '../utils/match-zone-utils.js';

export class PlayVillainPhaseEffect extends PlayPhaseEffect {
    async triggerEnds(params, options) {
        if (!this.canContinuePhase()) {
            return;
        }
        await super.triggerEnds(params, options);
        if (this.canContinuePhase()) {
            await this.match.scenario?.resolveDelayedEffects?.(params);
        }
    }
    canContinuePhase() {
        return this.match.playing !== false && !this.match.gameOverReason;
    }
    async runTracedStep(step, action) {
        const details = {
            match: this.match.name,
            step,
        };

        logGameTrace('villain-phase.step.start', details);

        let outcome = 'failed';
        try {
            await action();
            outcome = 'completed';
        } finally {
            logGameTrace('villain-phase.step.end', {
                ...details,
                outcome,
            });
        }
    }
    stepAccelerateScheme(params) {
        const players = this.getPlayersInVillainPhase();
        const zoneFor = player => getScenarioZone(this.match, player);
        const zones = [...new Set(players.map(zoneFor))];

        return this.promisesSequential(zones, async zone => {
            if (!this.canContinuePhase()) {
                return;
            }
            const player = players.find(zonePlayer =>
                !zonePlayer.defeated && zoneFor(zonePlayer) === zone);
            if (!player) {
                return;
            }
            if (getMainSchemeFor(this.match, player)?.completed) {
                return;
            }
            const accelerationSchemeEffect = new AccelerateSchemeEffect({
                match: this.match,
            });

            await accelerationSchemeEffect.runEffect({
                ...params,
                player,
            });
        });
    }
    stepActivations(params) {
        const players = this.getPlayersInVillainPhase();

        return this.promisesSequential(players, async player => {
            if (!this.canContinuePhase() || player.defeated ||
                getMainSchemeFor(this.match, player)?.completed) {
                return;
            }
            const playerParams = {...params, player};
            const activateEffect = new ActivateEffect({
                selectedTarget: getVillainFor(this.match, player),
                match: this.match,
            });
            await activateEffect.runEffect(playerParams);

            if (!this.canContinuePhase() || player.defeated ||
                getMainSchemeFor(this.match, player)?.completed) {
                return;
            }

            const severalActivationsEffect = new SeveralActivationsEffect({
                enemiesType: TARGET_ALL_ENGAGED_MINIONS,
                enemiesCondition: {
                    not: {'engaged.scenarioZone.currentScheme.currentSide.completed': true},
                },
                match: this.match,
            });
            await severalActivationsEffect.runEffect(playerParams);
        });
    }
    async stepDealEncounters() {
        const players = this.getPlayersInVillainPhase();
        const globalHazardIcons = Math.max(
            0,
            this.match.hazardIcons ?? this.match.scenario?.hazardIcons ?? 0
        );
        const hazardIconsByPlayer = new Map(players.map(player => [player, 0]));

        const dealToPlayer = async player => {
            if (!this.canContinuePhase() || player.defeated) {
                return false;
            }
            const dealEncounterEffect = new DealEncounterEffect({
                selectedTarget: player,
                match: this.match,
            });

            await dealEncounterEffect.runEffect({player});
            return true;
        };
        for (const player of players) {
            await dealToPlayer(player);
        }

        let nextPlayerIndex = 0;
        for (let count = 0; count < globalHazardIcons; count++) {
            const player = players.slice(nextPlayerIndex)
                .concat(players.slice(0, nextPlayerIndex))
                .find(player => !player.defeated);
            if (!this.canContinuePhase() || !player) {
                return;
            }
            if (await dealToPlayer(player)) {
                hazardIconsByPlayer.set(player, hazardIconsByPlayer.get(player) + 1);
            }
            nextPlayerIndex = (players.indexOf(player) + 1) % players.length;
        }

        if (!this.canContinuePhase()) {
            return;
        }
        const hazardIcons = [...hazardIconsByPlayer.values()]
            .reduce((total, count) => total + count, 0);

        await this.openDialog({
            dialogType: DIALOG_ENCOUNTERS_DEALT,
            data: {
                hazardIcons,
                encounters: players.filter(player => !player.defeated).map(player => ({
                    name: player.superhero.name,
                    count: player.encounters.length,
                    hazardIcons: hazardIconsByPlayer.get(player),
                })),
            },
        });
    }
    async stepRevealEncounters() {
        const players = this.getPlayersInVillainPhase();

        while (this.canContinuePhase() &&
            players.some(player => !player.defeated && player.encounters.length)) {
            await this.promisesSequential(players, player => {
                if (this.canContinuePhase() && !player.defeated) {
                    return player.revealEncounterCards();
                }
            });
        }
    }
    getPlayersInVillainPhase() {
        const players = this.match.orderedPlayers.filter(player => !player.defeated);
        if (!this.match.scenario?.separatePlayAreas) {
            return players;
        }

        return players.filter(player =>
            player.scenarioZone);
    }
    runEndVillainPhase() {
        const {players} = this.match;
        const initialIndex = players.findIndex(player => player.initial);
        const startIndex = initialIndex >= 0 ? initialIndex : 0;
        for (let offset = 0; offset < players.length; offset++) {
            const player = players[(startIndex + offset) % players.length];
            player.initial = false;
        }
        for (let offset = 1; offset <= players.length; offset++) {
            const player = players[(startIndex + offset) % players.length];
            if (!player.defeated) {
                player.initial = true;
                break;
            }
        }
    }
    async triggerPhaseStep(step, params) {
        const triggerTypes = [TRIGGER_VILLAIN_PHASE_STEP];
        // Trigger deduplication is scoped by effect identity, and each step is a new occurrence.
        const stepEffect = new PlayVillainPhaseEffect({match: this.match});
        const triggerParams = {
            ...params,
            effect: stepEffect,
            match: this.match,
            step,
        };

        await super.triggerEnds(triggerParams, {
            triggerTypes,
            resolveDelayedEffects: false,
        });
    }

    async execute(params) {
        logGameTrace('villain-phase.start', {
            match: this.match.name,
        });

        const steps = [
            ['place-threat', () => this.stepAccelerateScheme(params)],
            ['enemy-activations', () => this.stepActivations(params)],
            ['deal-encounters', () => this.stepDealEncounters(params)],
            ['reveal-encounters', () => this.stepRevealEncounters(params)],
            ['advance-first-player', () => this.runEndVillainPhase()],
        ];

        for (let i = this.match.villainPhaseStep ; i < steps.length ; i++) {
            if (!this.canContinuePhase()) {
                return;
            }
            const [name, action] = steps[i];
            await this.runTracedStep(name, action);
            if (this.match.playing) {
                await this.triggerPhaseStep(i + 1, params);
            }
            this.match.villainPhaseStep = i + 1;
            await this.match.persist();
            if (!this.match.playing) {
                return;
            }
        }

        await super.execute(params);

        logGameTrace('villain-phase.end', {
            match: this.match.name,
        });
    }
}