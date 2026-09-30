import {DIALOG_PLAY_CARD} from '../constants/dialogs.js';
import {PLACE_DECK, PLACE_DISCARD_PILE, PLACE_HAND} from '../constants/places.js';
import {TARGET_ALL_PLAYERS, TARGET_YOU} from '../constants/targets.js';
import {checkCondition} from '../engine/utils.js';

import {Effect} from './effect.js';


export class SearchCardsEffect extends Effect {
    constructor({
        locations = [], // ['discardPile', 'deck', 'hand']
        players = TARGET_YOU,
        filter = {},
        title = 'Elige una carta',
        count = 1,
    }) {
        super(arguments[0]);
        this.locations = locations;
        this.playersTarget = players;
        this.filter = filter;
        this.title = title;
        this.count = count;
    }

    async execute(params) {
        const game = this.match;
        const {player} = params;
        
        let targetPlayers = [];
        if (this.playersTarget === TARGET_ALL_PLAYERS) {
            targetPlayers = game.players;
        } else {
            targetPlayers = [player];
        }

        const options = [];
        targetPlayers.forEach(p => {
            this.locations.forEach(location => {
                let cards = [];
                if (location === PLACE_DISCARD_PILE) {
                    cards = p.deck.discardPile;
                } else if (location === PLACE_DECK) {
                    cards = p.deck.cards;
                } else if (location === PLACE_HAND) {
                    cards = p.hand.cards;
                }

                cards.forEach(card => {
                    if (checkCondition(card, this.filter)) {
                        options.push(card);
                    }
                });
            });
        });

        if (options.length === 0) {
            return;
        }

        const response = await this.openDialog({
            dialogType: DIALOG_PLAY_CARD,
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
