import {Effect} from './effect.js';


export class ShuffleDeckEffect extends Effect {
    async execute(params) {
        const {player} = params;
        const targetPlayer = this.selectedTarget || player;

        if (targetPlayer && targetPlayer.deck) {
            targetPlayer.deck.shuffle();
            this.match.logger.info(`${targetPlayer.name} baraja su mazo.`);
        }
    }
}
