import {PLACE_IN_PLAY} from 'mc-shared';
import {checkCondition} from '../engine/utils.js';

import {Effect} from './effect.js';


export class SelectAndOrderCardsEffect extends Effect {
    constructor({
        locations = [PLACE_IN_PLAY],
        filter = {},
        title = 'Elige el orden de las cartas',
    }) {
        super(arguments[0]);
        this.locations = locations;
        this.filter = filter;
        this.title = title;
    }

    async execute(params) {
        const {player} = params;
        const pool = [];

        this.locations.forEach(location => {
            let cards = [];
            if (location === PLACE_IN_PLAY) {
                cards = player.inPlay;
            }
            // Podríamos añadir más localizaciones si fuera necesario

            cards.forEach(gameCard => {
                if (checkCondition(gameCard.card, this.filter)) {
                    pool.push(gameCard);
                }
            });
        });

        if (pool.length === 0) {
            params.orderedCards = [];
            return;
        }

        params.orderedCards = await this.selectCardOrder(pool, this.title);
    }
}
