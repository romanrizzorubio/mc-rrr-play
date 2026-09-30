import {checkCondition} from '../engine/utils.js';

import {Effect} from './effect.js';

export class SearchDiscardAndReturnToHandEffect extends Effect {
    constructor({
        condition,
    }) {
        super(arguments[0]);

        this.condition = condition;
    }
    async execute(params) {
        const {selectedTarget} = this;
        const {player} = params;

        // Si selectedTarget es un jugador, buscamos en su pila de descartes
        const targetPlayer = (selectedTarget && selectedTarget.isPlayer) ? selectedTarget : player;
        const discardPile = targetPlayer.deck.discardPile;

        // Buscamos la primera carta (desde arriba, que es el final del array) que cumpla la condición
        const card = discardPile.slice().reverse().find(card => checkCondition(card, this.condition));

        if (card) {
            // Encontrada. La quitamos del descarte y la añadimos a la mano.
            targetPlayer.deck.searchDiscard(card);
            targetPlayer.hand.addCard(card);

            this.match.logger.info(`${targetPlayer.name} devuelve ${card.name} a su mano desde el descarte.`);
        }
    }
}
