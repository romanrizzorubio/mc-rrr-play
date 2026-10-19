import {DIALOG_REVEAL_CARDS, TARGET_ALL_PLAYERS} from 'mc-shared';
import {path} from '../engine/utils.js';

import {Effect} from './effect.js';

export class DiscardFromDeckEffect extends Effect {
    constructor({
        count = 1,
        players,
        deckId,
        showDialog = true,
        cards: cardsSource,
    }) {
        super(arguments[0]);

        this.count = count;
        this.playersTarget = players;
        this.deckId = deckId;
        this.showDialog = showDialog;
        this.cardsSource = cardsSource;
        this.cards = [];
    }
    getCardsToDiscard(params) {
        if (this.cardsSource === undefined) {
            return undefined;
        }

        const source = typeof this.cardsSource === 'string' ?
            path(params, this.cardsSource) :
            this.cardsSource;
        if (!Array.isArray(source)) {
            throw new TypeError('DiscardFromDeckEffect cards must resolve to a card list.');
        }

        return source.slice();
    }

    resetResolutionData() {
        super.resetResolutionData();
        this.cards = [];
    }

    async execute(params) {
        const {count, playersTarget} = this;
        this.cards = [];
        const players = playersTarget === TARGET_ALL_PLAYERS ?
            this.getAllPlayers() :
            [params.player];

        for (const player of players) {
            const deck = typeof this.selectedTarget?.discardTopCards === 'function' ?
                this.selectedTarget :
                player.deck;
            const discardCount = this.paramsCalc ?
                await this.calculate({...params, player}) :
                this.calcPerPlayer(count);
            const selectedCards = this.getCardsToDiscard(params);
            let cards;
            if (selectedCards === undefined) {
                cards = await deck.discardTopCards(discardCount);
            } else {
                if (new Set(selectedCards).size !== selectedCards.length ||
                    selectedCards.some(card => !deck.cards.includes(card))) {
                    throw new Error(
                        'DiscardFromDeckEffect cards must be unique cards in the selected deck.'
                    );
                }

                selectedCards.forEach(card => deck.removeCardFromDeck(card));
                if (selectedCards.length > 0) {
                    await deck.discard(selectedCards);
                }
                cards = selectedCards;
            }

            this.cards = this.cards.concat(cards);
            if (cards.length > 0 && this.showDialog) {
                await this.openDialog({
                    dialogType: DIALOG_REVEAL_CARDS,
                    title: 'Cartas que se van a descartar',
                    subtitle: 'En el orden en que se descartarán, desde la carta superior.',
                    data: {
                        cards: cards.map(card => card.toObj({...params, player})),
                    },
                });
            }

            deck.refresh();
        }
    }
    getAllPlayers() {
        const {players, initialPlayer} = this.match;
        const initialPlayerIndex = players.indexOf(initialPlayer);

        if (initialPlayerIndex < 0) {
            throw new Error('No se pudo determinar al primer jugador para descartar cartas.');
        }

        return players.slice(initialPlayerIndex)
            .concat(players.slice(0, initialPlayerIndex));
    }
}
