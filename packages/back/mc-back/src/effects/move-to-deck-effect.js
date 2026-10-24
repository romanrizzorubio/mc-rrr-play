import {
    DECK_POSITION_BOTTOM,
    DECK_POSITION_SHUFFLE,
    DECK_POSITION_TOP,
    EFFECT_CATEGORY_LEAVE_PLAY,
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
        deckId,
        ...params
    }) {
        super(params);

        if (!DECK_POSITIONS.includes(position)) {
            throw new TypeError(`MoveToDeckEffect position must be one of: ${
                DECK_POSITIONS.join(', ')
            }.`);
        }

        this.position = position;
        this.deckId = deckId;
        this.cardsSource = cardsSource;
    }
    get effectCategories() {
        return [EFFECT_CATEGORY_LEAVE_PLAY];
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
        const cardsToMove = this.getCardsToMove(params).filter(card =>
            this.validTarget.filter(card, {
                ...params,
                ability: this.ability,
                effect: this,
                source: this.source ?? params.source,
            }));
        const targetDeck = this.selectedTarget?.cards &&
            typeof this.selectedTarget.addToDeck === 'function' ?
            this.selectedTarget :
            this.selectedTarget?.deck ||
            this.selectedTarget?.owner?.deck ||
            cardsToMove[0]?.owner?.deck ||
            player?.deck;

        if (targetDeck) {
            if (cardsToMove.length > 0) {
                cardsToMove.forEach(card => {
                    targetDeck.searchDiscard(card);
                    if (typeof targetDeck.removeCardFromDeck === 'function') {
                        targetDeck.removeCardFromDeck(card);
                    } else {
                        const index = targetDeck.cards?.indexOf(card);
                        if (index > -1) {
                            targetDeck.cards.splice(index, 1);
                        }
                    }
                });

                if (this.position === DECK_POSITION_TOP) {
                    targetDeck.cards.unshift(...cardsToMove);
                } else {
                    targetDeck.addToDeck(cardsToMove);
                }

                logGameTrace('deck.cards-moved', {
                    match: this.match.name,
                    player: targetDeck.owner?.name,
                    count: cardsToMove.length,
                });
            }

            if (this.position === DECK_POSITION_SHUFFLE) {
                targetDeck.shuffle();
                logGameTrace('deck.shuffled', {
                    match: this.match.name,
                    player: targetDeck.owner?.name,
                });
            }
        }
    }
}
