import {PlayPhaseEffect} from './play-phase-effect.js';
import {PlayTurnEffect} from './play-turn-effect.js';

export class PlayPlayersPhaseEffect extends PlayPhaseEffect {
    constructor() {
        super(arguments[0]);
    }
    async runEndPlayersPhase(params) {
        const players = this.match.orderedPlayers;

        for (let i = this.match.endPlayerIndex ; i < players.length ; i++) {
            await players[i].runEndPlayersPhase(params);
            this.match.endPlayerIndex = i + 1;
            await this.match.persist();
        }
    }

    async execute(params) {
        const players = this.match.orderedPlayers;

        for (let i = this.match.turnIndex ; i < players.length ; i++) {
            const player = players[i];
            this.match.currentTurnPlayer = player;
            const turn = new PlayTurnEffect({
                match: this.match,
            });
            await turn.runEffect({player});
            this.match.turnIndex = i + 1;
            this.match.turnStartProcessed = false;
            await this.match.persist();
            if (!this.match.playing) {
                return;
            }
        }

        this.match.turnIndex = players.length;
        await this.match.persist();
        await this.runEndPlayersPhase(params);

        this.match.turnIndex = 0;
        this.match.endPlayerIndex = 0;
        delete this.match.currentTurnPlayer;
        await this.match.persist();
        await super.execute(params);
    }
}