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
    static getDestinationDeck(targetDeck, card) {
        if (!card.isInPlay || !targetDeck?.isScenarioDeck) {
            return targetDeck;
        }

        return targetDeck.owner?.getExtraDeckForCard?.(card) ?? targetDeck;
    }
    async removeFromPlay(card) {
        if (!card.isInPlay) {
            return undefined;
        }

        const gameZones = [
            card.controller?.gameZone,
            card.gameZone,
            card.owner?.gameZone,
            this.match?.scenario?.gameZone,
        ];
        const gameZone = gameZones.find(zone =>
            zone?.cards?.includes(card));

        if (gameZone) {
            await gameZone.discard(card);
        }
        if (typeof card.init === 'function') {
            await card.init();
        }

        return gameZone;
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
            const cardsByDeck = new Map();
            if (cardsToMove.length > 0) {
                cardsToMove.forEach(card => {
                    const destinationDeck = MoveToDeckEffect.getDestinationDeck(
                        targetDeck,
                        card,
                    );
                    if (!cardsByDeck.has(destinationDeck)) {
                        cardsByDeck.set(destinationDeck, []);
                    }
                    cardsByDeck.get(destinationDeck).push(card);
                });
            } else {
                cardsByDeck.set(targetDeck, []);
            }

            const gameZones = new Set();
            for (const [destinationDeck, cards] of cardsByDeck) {
                for (const card of cards) {
                    const gameZone = await this.removeFromPlay(card);
                    if (gameZone) {
                        gameZones.add(gameZone);
                    }
                    destinationDeck.searchDiscard(card);
                    if (typeof destinationDeck.removeCardFromDeck === 'function') {
                        destinationDeck.removeCardFromDeck(card);
                    } else {
                        const index = destinationDeck.cards?.indexOf(card);
                        if (index > -1) {
                            destinationDeck.cards.splice(index, 1);
                        }
                    }
                }

                if (this.position === DECK_POSITION_TOP) {
                    destinationDeck.cards.unshift(...cards);
                } else {
                    destinationDeck.addToDeck(cards);
                }

                if (cards.length > 0) {
                    logGameTrace('deck.cards-moved', {
                        match: this.match.name,
                        player: destinationDeck.owner?.name,
                        count: cards.length,
                    });
                }

                if (this.position === DECK_POSITION_SHUFFLE) {
                    destinationDeck.shuffle();
                    logGameTrace('deck.shuffled', {
                        match: this.match.name,
                        player: destinationDeck.owner?.name,
                    });
                }
            }

            if (cardsToMove.length > 0) {
                await this.promisesSequential([...gameZones], gameZone =>
                    gameZone.refresh?.());
                await this.promisesSequential([...cardsByDeck.keys()], deck =>
                    deck.refresh?.());
            }
        }
    }
}
