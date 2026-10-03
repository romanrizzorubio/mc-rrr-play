import {EVENTS} from 'mc-endpoints';

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

        logGameTrace('player-turn.waiting-for-end', {
            match: match.name,
            player: player.name,
        });
        await match.refresh();

        return turnEnded;
    }
}