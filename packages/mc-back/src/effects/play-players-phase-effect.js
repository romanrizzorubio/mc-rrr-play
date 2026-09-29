import {PlayPhaseEffect} from "./play-phase-effect.js";
import {PlayTurnEffect} from "./play-turn-effect.js";

export class PlayPlayersPhaseEffect extends PlayPhaseEffect {
    constructor() {
        super(arguments[0]);

        this.turn = new PlayTurnEffect({
            match: this.match,
        });
    }
    async runEndPlayersPhase(params) {
        const players = this.match.orderedPlayers;

        await this.promisesSequential(players, player => player.runEndPlayersPhase(params))
    }

    async execute(params) {
        const players = this.match.orderedPlayers;

        await this.promisesSequential(players, player => this.turn.runEffect({
            player,
        }));

        await this.runEndPlayersPhase(params);

        await super.execute(params);
    }
}