import {Effect} from './effect.js';
import {logGameTrace} from '../utils/game-trace.js';

export class ShuffleDeckEffect extends Effect {
    async execute(params) {
        const {player} = params;
        const selectedTarget = this.selectedTarget || player;
        const targets = Array.isArray(selectedTarget) ?
            selectedTarget : [selectedTarget];
        for (const target of targets) {
            const deck = target?.deck ?? target;
            if (typeof deck?.shuffle !== 'function') {
                throw new TypeError('ShuffleDeckEffect requires a player or deck.');
            }
            await deck.shuffle();
            logGameTrace('deck.shuffled', {
                match: this.match.name,
                player: deck.owner?.name ?? target.name,
            });
        }
    }
}
