import {EVENTS} from 'mc-endpoints';

import {Effect} from './effect.js';

export class PlayTurnEffect extends Effect {
    async execute({player}) {
        const {match} = this;

        match.currentPlayer = player;

        const turnEnded = new Promise(resolve => {
            match.listen(EVENTS.TURN.END, resolve, true);
        });

        await match.refresh();

        return turnEnded;
    }
}