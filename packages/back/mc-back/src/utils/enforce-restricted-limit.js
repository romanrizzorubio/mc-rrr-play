import {DiscardFromGameEffect} from '../effects/discard-from-game-effect.js';
import {ValidTarget} from '../targets/valid-target.js';

export function getRestrictedCards(player) {
    return player.gameZone.cards.filter(card => card.restricted);
}

export async function enforceRestrictedLimit(player, match, selectedCardId) {
    const validTarget = new ValidTarget({match});

    while (getRestrictedCards(player).length > 2) {
        const restrictedCards = getRestrictedCards(player);
        const selectedCard = selectedCardId !== undefined ?
            restrictedCards.find(card => card.id === selectedCardId) :
            undefined;
        selectedCardId = undefined;

        const cardToDiscard = selectedCard || await validTarget.selectFrom(
            restrictedCards,
            {
                player,
                dialogTitle: 'Elige una carta restringida para descartar',
            }
        );
        if (!cardToDiscard) {
            throw new Error('Debe elegirse una carta restringida para descartar.');
        }

        const discardEffect = new DiscardFromGameEffect({
            selectedTarget: cardToDiscard,
            match,
        });
        await discardEffect.runEffect({player});
    }
}
