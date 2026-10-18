import {
    DECK_POSITION_BOTTOM,
    DECK_POSITION_SHUFFLE,
    DECK_POSITION_TOP,
} from 'mc-shared';
import {path} from '../engine/utils.js';
import {Effect} from './effect.js';
import {logGameTrace} from '../utils/game-trace.js';

const DECK_POSITIONS = [
    DECK_POSITION_BOTTOM,
    DECK_POSITION_SHUFFLE,
    DECK_POSITION_TOP,
];

export class MoveToDeckEffect extends Effect {
    constructor({
        cards: cardsSource,
        position = DECK_POSITION_SHUFFLE,
        ...params
    }) {
        super(params);

        if (!DECK_POSITIONS.includes(position)) {
            throw new TypeError(`MoveToDeckEffect position must be one of: ${
                DECK_POSITIONS.join(', ')
            }.`);
        }

        this.position = position;
        this.cardsSource = cardsSource;
    }
    getCardsToMove(params) {
        if (this.cardsSource !== undefined) {
            const source = typeof this.cardsSource === 'string' ?
                path(params, this.cardsSource) :
                this.cardsSource;
            if (!Array.isArray(source)) {
                throw new TypeError('MoveToDeckEffect cards must resolve to a card list.');
            }

            return source.slice();
        }

        const {selectedCards} = params;

        return selectedCards ?
            selectedCards.slice() :
            params.card ? [params.card] : [];
    }
    async execute(params) {
        const {player} = params;
        const targetPlayer = this.selectedTarget || player;
        const cardsToMove = this.getCardsToMove(params);

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
