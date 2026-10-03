import {DIALOG_SELECT_CARD,PLACE_DECK, PLACE_DISCARD_PILE, PLACE_HAND,TARGET_ALL_PLAYERS, TARGET_YOU} from 'mc-shared';
import {checkCondition} from '../engine/utils.js';

import {Effect} from './effect.js';


export class SearchCardsEffect extends Effect {
    constructor({
        locations = [], // ['discardPile', 'deck', 'hand']
        players = TARGET_YOU,
        filter = {},
        title = 'Elige una carta',
        count = 1,
        firstMatch = false,
        requireMatch = false,
    }) {
        super(arguments[0]);
        this.locations = locations;
        this.playersTarget = players;
        this.filter = filter;
        this.title = title;
        this.count = count;
        this.firstMatch = firstMatch;
        this.requireMatch = requireMatch;
    }

    async canRun(params) {
        if (!await super.canRun(params)) {
            return false;
        }

        if (!this.requireMatch) {
            return true;
        }

        const players = this.playersTarget === TARGET_ALL_PLAYERS ?
            this.match.players :
            [params.player];

        return players.some(player => this.locations.some(location =>
            this.getCardsAtLocation(player, location)
                .some(card => checkCondition(card, this.filter))));
    }

    getCardsAtLocation(player, location) {
        if (location === PLACE_DISCARD_PILE) {
            return player.deck.discardPile;
        } else if (location === PLACE_DECK) {
            return player.deck.cards;
        } else if (location === PLACE_HAND) {
            return player.hand.cards;
        }

        return [];
    }

    async execute(params) {
        const game = this.match;
        const {player} = params;

        if (this.firstMatch) {
            params.selectedCards = [];
            params.selectedCard = undefined;
            params.card = undefined;
        }
        
        let targetPlayers = [];
        if (this.playersTarget === TARGET_ALL_PLAYERS) {
            targetPlayers = game.players;
        } else {
            targetPlayers = [player];
        }

        const options = [];
        for (const p of targetPlayers) {
            for (const location of this.locations) {
                let cards = this.getCardsAtLocation(p, location);
                if (this.firstMatch && location === PLACE_DISCARD_PILE) {
                    cards = cards.slice().reverse();
                }

                if (this.firstMatch) {
                    const card = cards.find(candidate => checkCondition(candidate, this.filter));
                    if (card) {
                        options.push(card);
                        break;
                    }
                } else {
                    cards.forEach(card => {
                        if (checkCondition(card, this.filter)) {
                            options.push(card);
                        }
                    });
                }
            }
            if (this.firstMatch && options.length) {
                break;
            }
        }

        if (options.length === 0) {
            return;
        }

        if (this.firstMatch) {
            params.selectedCards = options;
            params.selectedCard = options[0];
            params.card = options[0];
            return;
        }

        const response = await this.openDialog({
            dialogType: DIALOG_SELECT_CARD,
            data: {
                title: this.title,
                cards: options.map(card => card.toObj(params)),
                count: this.count,
            },
        });

        const {selected} = response;
        if (selected && selected[0]) {
            // Guardamos el resultado en params para efectos encadenados
            params.selectedCards = selected.map(s => options.find(c => c.id === s.id));
            params.selectedCard = params.selectedCards[0];
            params.card = params.selectedCard;
        }
    }
}
