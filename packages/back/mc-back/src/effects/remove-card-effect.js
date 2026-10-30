import {EFFECT_CATEGORY_LEAVE_PLAY} from 'mc-shared';

import {Effect} from './effect.js';

export class RemoveCardEffect extends Effect {
    get effectCategories() {
        return [EFFECT_CATEGORY_LEAVE_PLAY];
    }
    async execute() {
        const card = this.selectedTarget;

        if (card.isInPlay) {
            await card.remove();
        } else {
            const {scenario} = this.match;
            const collections = [
                scenario?.deck?.cards,
                scenario?.deck?.discardPile,
                scenario?.apart,
                card.owner?.deck?.cards,
                card.owner?.deck?.discardPile,
                card.owner?.hand?.cards,
                ...(this.match.players || []).map(player =>
                    player.superhero?.nemesis),
            ];
            let removed = false;

            collections.forEach(collection => {
                if (!Array.isArray(collection)) {
                    return;
                }

                const index = collection.indexOf(card);
                if (index >= 0) {
                    collection.splice(index, 1);
                    removed = true;
                }
            });

            if (!removed) {
                throw new Error(
                    `No se encontró "${card.name}" en una zona desde la que se pueda retirar.`
                );
            }

            if (scenario?.deck?.knownCards) {
                scenario.deck.knownCards = scenario.deck.knownCards.filter(
                    knownCard => knownCard !== card
                );
            }
            this.match.removeCard(card);
            await card.init();
            await scenario?.deck?.refresh?.();
            await card.owner?.hand?.refresh?.();
        }

        await card.refresh?.();
    }
}