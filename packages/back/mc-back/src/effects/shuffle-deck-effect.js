import {Effect} from './effect.js';
import {logGameTrace} from '../utils/game-trace.js';


export class ShuffleDeckEffect extends Effect {
    async execute(params) {
        const {player} = params;
        const targetPlayer = this.selectedTarget || player;

        if (targetPlayer && targetPlayer.deck) {
            targetPlayer.deck.shuffle();
            logGameTrace('deck.shuffled', {
                match: this.match.name,
                player: targetPlayer.name,
            });
        }
    }
}
