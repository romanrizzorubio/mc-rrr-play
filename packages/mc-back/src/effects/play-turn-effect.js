import {EVENTS} from 'mc-endpoints';
import {
    PRIORITY_CONSTANT,
    PRIORITY_FORCED_INTERRUPT,
    PRIORITY_FORCED_RESPONSE,
    PRIORITY_INTERRUPT,
    PRIORITY_RESPONSE,
    TRIGGER_PLAYER_TURN_START,
} from 'mc-shared';

import {Effect} from './effect.js';
import {logGameTrace} from '../utils/game-trace.js';

export class PlayTurnEffect extends Effect {
    async execute({player}) {
        const {match} = this;

        match.currentPlayer = player;
        const turnEnded = new Promise(resolve => {
            match.listen(EVENTS.TURN.END, response => {
                logGameTrace('player-turn.end-received', {
                    match: match.name,
                    player: player.name,
                });
                resolve(response);
            }, true);
        });

        if (!match.turnStartProcessed) {
            match.turnStartProcessed = true;
            await match.persist();

            const turnStartParams = {
                effect: this,
                player,
            };
            const turnStartTrigger = [TRIGGER_PLAYER_TURN_START];

            await this.trigger(PRIORITY_CONSTANT, turnStartTrigger, turnStartParams);
            await this.trigger(PRIORITY_FORCED_INTERRUPT, turnStartTrigger, turnStartParams);
            await this.trigger(PRIORITY_INTERRUPT, turnStartTrigger, turnStartParams);
            await this.trigger(PRIORITY_FORCED_RESPONSE, turnStartTrigger, turnStartParams);
            await this.trigger(PRIORITY_RESPONSE, turnStartTrigger, turnStartParams);
        }

        logGameTrace('player-turn.waiting-for-end', {
            match: match.name,
            player: player.name,
        });
        await match.refresh();

        const response = await turnEnded;

        delete match.currentTurnPlayer;
        await match.refresh();

        return response;
    }
}