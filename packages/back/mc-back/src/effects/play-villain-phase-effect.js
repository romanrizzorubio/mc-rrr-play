import {
    DIALOG_ENCOUNTERS_DEALT,
    TRIGGER_VILLAIN_PHASE_STEP,
} from 'mc-shared';

import {AccelerateSchemeEffect} from './accelerate-scheme-effect.js';
import {ActivateEffect} from './activate-effect.js';
import {DealEncounterEffect} from './deal-encounter-effect.js';
import {PlayPhaseEffect} from './play-phase-effect.js';
import {SeveralActivationsEffect} from './several-activations-effect.js';
import {logGameTrace} from '../utils/game-trace.js';

export class PlayVillainPhaseEffect extends PlayPhaseEffect {
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
        const accelerationSchemeEffect = new AccelerateSchemeEffect({
            match: this.match,
        });

        return accelerationSchemeEffect.runEffect(params);
    }
    stepActivations(params) {
        const players = this.match.orderedPlayers;

        return this.promisesSequential(players, async player => {
            const activateEffect = new ActivateEffect({
                selectedTarget: this.match.villain,
                match: this.match,
            });
            await activateEffect.runEffect({
                player
            });

            const severalActivationsEffect = new SeveralActivationsEffect({
                enemies: player.minions.slice(),
                match: this.match,
            });
            await severalActivationsEffect.runEffect(params);
        });
    }
    async stepDealEncounters() {
        const players = this.match.orderedPlayers;
        const hazardIcons = this.match.hazardIcons;
        const encountersCount = players.length + hazardIcons;
        const knownEncounterCards = new Set(
            this.match.scenario.deck.knownCards
        );
        const hazardIconsByPlayer = new Map(
            players.map(player => [player, 0])
        );

        let i = 0;
        let index = i;
        while(i < encountersCount) {
            const player = players[index];
            if (i >= players.length) {
                hazardIconsByPlayer.set(
                    player,
                    hazardIconsByPlayer.get(player) + 1
                );
            }

            const dealEncounterEffect = new DealEncounterEffect({
                selectedTarget: player,
                match: this.match,
            });

            await dealEncounterEffect.runEffect({
                player
            });

            i++;
            if (i < players.length) {
                index = i;
            } else {
                index = 0;
            }
        }

        await this.openDialog({
            dialogType: DIALOG_ENCOUNTERS_DEALT,
            data: {
                hazardIcons,
                encounters: players.map(player => ({
                    name: player.superhero.name,
                    count: player.encounters.length,
                    hazardIcons: hazardIconsByPlayer.get(player),
                    cards: player.encounters.map(card => ({
                        ...card.toObj({player}),
                        isFacedownCard: true,
                        canPeekFacedown: knownEncounterCards.has(card),
                    })),
                })),
            },
        });
    }
    async stepRevealEncounters() {
        const players = this.match.orderedPlayers;

        while(this.match.hasEncounters) {
            await this.promisesSequential(players, player => player.revealEncounterCards());
        }
    }
    runEndVillainPhase() {
        let index = this.match.players.findIndex(player => {
            if (player.initial) {
                player.initial = false;
                return true;
            }
            return false;
        });
        index++;
        if (index >= this.match.players.length) {
            index = 0;
        }
        this.match.players[index].initial = true;
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

        await this.triggerEnds(triggerParams, {triggerTypes});
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