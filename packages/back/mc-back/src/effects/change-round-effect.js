import {Effect} from './effect.js';

export class ChangeRoundEffect extends Effect {
    async execute(_params) {
        const {match} = this;

        match.currentPlayer = match.initialPlayer;
    }
}