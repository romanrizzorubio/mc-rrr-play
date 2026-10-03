import {ChangeRoundEffect} from './change-round-effect.js';
import {Effect} from './effect.js';
import {PlayRoundEffect} from './play-round-effect.js';
import {Engine} from '../engine/engine.js';

export class PlayMatchEffect extends Effect {
    async execute(params) {
        const {match} = this;

        const playRoundEffect = new PlayRoundEffect({
            match: this.match,
        });
        const changeRoundEffect = new ChangeRoundEffect({
            match: this.match,
        });
        Engine.currentRound = playRoundEffect;

        match.currentPlayer = match.currentPlayer ||
            match.players.find(player => player.initial);
        match.playing = true;

        while (match.playing) {
            if (match.phase === 'round-complete') {
                await changeRoundEffect.runEffect(params);
                match.phase = 'players';
                await match.persist();
                continue;
            }

            await playRoundEffect.runEffect({
                player: match.currentPlayer,
            });

            match.playing = playRoundEffect.playing;

            if (!playRoundEffect.playing) {
                break;
            }

            await changeRoundEffect.runEffect(params);
            match.phase = 'players';
            await match.persist();
        }
    }
}