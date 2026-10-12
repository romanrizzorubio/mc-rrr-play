import {TARGET_CARD} from 'mc-shared';
import {path} from '../engine/utils.js';

import {Effect} from './effect.js';


export class MoveToHandEffect extends Effect {
    constructor({
        refreshTarget = true,
        target = TARGET_CARD,
        ...params
    }) {
        super({
            ...params,
            refreshTarget,
            target,
        });
    }
    async execute(params) {
        const {player} = params;
        const cards = Array.isArray(this.selectedTarget) ?
            this.selectedTarget :
            this.selectedTarget ? [this.selectedTarget] : [];

        if (!cards.length) {
            return;
        }
        if (!player?.hand ||
            typeof player.hand.addCard !== 'function' ||
            typeof player.hand.refresh !== 'function') {
            throw new Error('MoveToHandEffect requires a player with a hand.');
        }

        const sourceParams = {
            ...params,
            ability: this.ability,
        };
        const sourceCards = this.source ?
            path(sourceParams, this.source) :
            undefined;
        if (this.source && !Array.isArray(sourceCards)) {
            throw new TypeError('MoveToHandEffect source must resolve to a card array.');
        }
        if (sourceCards &&
            cards.some(card => !sourceCards.includes(card))) {
            throw new Error('MoveToHandEffect target is no longer in its configured source.');
        }
        if (new Set(cards).size !== cards.length) {
            throw new Error('MoveToHandEffect cannot move the same card more than once.');
        }

        const sourcePath = this.source?.split('.');
        const sourceContainer = sourcePath?.length > 1 ?
            path(sourceParams, sourcePath.slice(0, -1).join('.')) :
            undefined;
        const sourceDecks = new Set();

        for (const card of cards) {
            if (!card || typeof card !== 'object') {
                throw new TypeError('MoveToHandEffect requires card objects.');
            }

            const sourceDeck = [card.owner?.deck, player.deck]
                .find(deck => deck &&
                    (deck.cards.includes(card) || deck.discardPile.includes(card)));

            if (sourceDeck?.cards.includes(card)) {
                await sourceDeck.searchDeck(card);
                sourceDecks.add(sourceDeck);
            } else if (sourceDeck?.discardPile.includes(card)) {
                sourceDeck.searchDiscard(card);
                sourceDecks.add(sourceDeck);
            }

            if (sourceCards &&
                typeof sourceContainer?.refresh === 'function') {
                sourceCards.splice(sourceCards.indexOf(card), 1);
            }

            player.hand.addCard(card);
        }

        const objectsToRefresh = new Set(sourceDecks);
        if (sourceContainer &&
            typeof sourceContainer.refresh === 'function') {
            objectsToRefresh.add(sourceContainer);
        }
        objectsToRefresh.add(player.hand);
        await this.promisesSequential(
            [...objectsToRefresh],
            source => source.refresh()
        );
    }
}
