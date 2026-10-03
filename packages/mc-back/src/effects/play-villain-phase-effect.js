import {DIALOG_ENCOUNTERS_DEALT} from 'mc-shared';

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
        const encountersCount = players.length + this.match.hazardIcons;

        let i = 0;
        let index = i;
        while(i < encountersCount) {
            const player = players[index];

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
                encounters: players.map(player => ({
                    name: player.superhero.name,
                    count: player.encounters.length,
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
            this.match.villainPhaseStep = i + 1;
            await this.match.persist();
        }

        await super.execute(params);

        logGameTrace('villain-phase.end', {
            match: this.match.name,
        });
    }
}