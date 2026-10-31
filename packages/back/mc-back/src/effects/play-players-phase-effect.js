import {PlayPhaseEffect} from './play-phase-effect.js';
import {PlayTurnEffect} from './play-turn-effect.js';

export class PlayPlayersPhaseEffect extends PlayPhaseEffect {
    constructor() {
        super(arguments[0]);
    }
    async triggerEnds(params, options) {
        await super.triggerEnds(params, options);
        await this.match.scenario?.resolveDelayedEffects?.(params);
    }
    async runEndPlayersPhase(params) {
        const players = this.match.orderedPlayers;
        const startIndex = this.match.endPlayerIndex;
        const discardPromptsByUser = new Map();
        const discardSelections = new Map();

        for (let i = startIndex ; i < players.length ; i++) {
            const player = players[i];
            if (player.defeated) {
                continue;
            }

            const user = player.userId || player;
            const playerIndexes = discardPromptsByUser.get(user) || [];
            playerIndexes.push(i);
            discardPromptsByUser.set(user, playerIndexes);
        }

        await Promise.all(Array.from(
            discardPromptsByUser.values(),
            async playerIndexes => {
                for (const index of playerIndexes) {
                    discardSelections.set(
                        index,
                        await players[index].selectEndPlayersPhaseDiscards(params)
                    );
                }
            }
        ));

        for (let i = startIndex ; i < players.length ; i++) {
            if (!players[i].defeated) {
                await players[i].runEndPlayersPhase(
                    params,
                    discardSelections.get(i)
                );
            }
            this.match.endPlayerIndex = i + 1;
            await this.match.persist();
        }
    }

    async execute(params) {
        const players = this.match.orderedPlayers;

        for (let i = this.match.turnIndex ; i < players.length ; i++) {
            const player = players[i];
            if (player.defeated) {
                this.match.turnIndex = i + 1;
                await this.match.persist();
                continue;
            }
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