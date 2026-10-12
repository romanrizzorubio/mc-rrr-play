import {
    DECK_POSITION_BOTTOM,
    DECK_POSITION_SHUFFLE,
    DECK_POSITION_TOP,
} from 'mc-shared';
import {Effect} from './effect.js';
import {logGameTrace} from '../utils/game-trace.js';

const DECK_POSITIONS = [
    DECK_POSITION_BOTTOM,
    DECK_POSITION_SHUFFLE,
    DECK_POSITION_TOP,
];

export class MoveToDeckEffect extends Effect {
    constructor({position = DECK_POSITION_SHUFFLE, ...params}) {
        super(params);

        if (!DECK_POSITIONS.includes(position)) {
            throw new TypeError(`MoveToDeckEffect position must be one of: ${
                DECK_POSITIONS.join(', ')
            }.`);
        }

        this.position = position;
    }
    async execute(params) {
        const {player, selectedCards} = params;
        const targetPlayer = this.selectedTarget || player;
        const cardsToMove = selectedCards || (params.card ? [params.card] : []);

        if (targetPlayer?.deck) {
            if (cardsToMove.length > 0) {
                cardsToMove.forEach(card => {
                    targetPlayer.deck.searchDiscard(card);
                });

                if (this.position === DECK_POSITION_TOP) {
                    targetPlayer.deck.cards.unshift(...cardsToMove);
                } else {
                    targetPlayer.deck.addToDeck(cardsToMove);
                }

                logGameTrace('deck.cards-moved', {
                    match: this.match.name,
                    player: targetPlayer.name,
                    count: cardsToMove.length,
                });
            }

            if (this.position === DECK_POSITION_SHUFFLE) {
                targetPlayer.deck.shuffle();
                logGameTrace('deck.shuffled', {
                    match: this.match.name,
                    player: targetPlayer.name,
                });
            }
        }
    }
}
