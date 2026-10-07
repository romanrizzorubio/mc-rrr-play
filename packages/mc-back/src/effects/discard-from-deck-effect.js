import {DIALOG_REVEAL_CARDS, TARGET_ALL_PLAYERS} from 'mc-shared';

import {Effect} from './effect.js';

export class DiscardFromDeckEffect extends Effect {
    constructor({
        count = 1,
        players,
    }) {
        super(arguments[0]);

        this.count = count;
        this.playersTarget = players;
        this.cards = [];
    }

    async execute(params) {
        const {count, playersTarget} = this;
        const players = playersTarget === TARGET_ALL_PLAYERS ?
            this.getAllPlayers() :
            [params.player];

        for (const player of players) {
            const deck = typeof this.selectedTarget?.discardTopCards === 'function' ?
                this.selectedTarget :
                player.deck;
            const discardCount = this.paramsCalc ?
                await this.calculate({...params, player}) :
                count;
            const cards = await deck.discardTopCards(discardCount);

            this.cards = this.cards.concat(cards);
            if (cards.length > 0) {
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
