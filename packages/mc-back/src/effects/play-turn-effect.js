import {endpoints} from '../constants/endpoints.js';

import {Effect} from './effect.js';

export class PlayTurnEffect extends Effect {
    async execute({player}) {
        const {match} = this;

        match.currentPlayer = player;

        const turnEnded = new Promise(resolve => {
            match.listen(endpoints.turn.end, resolve, true);
        });

        await match.refresh();

        return turnEnded;
    }
}