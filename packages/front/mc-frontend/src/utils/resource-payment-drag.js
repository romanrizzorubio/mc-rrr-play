export const RESOURCE_PAYMENT_SOURCE_HAND = 'hand';
export const RESOURCE_PAYMENT_SOURCE_GENERATORS = 'generators';

export function getResourcePaymentSource(card) {
    if (card?.isResource) {
        return RESOURCE_PAYMENT_SOURCE_HAND;
    }

    if (card?.abilities?.some(ability => ability.isResource)) {
        return RESOURCE_PAYMENT_SOURCE_GENERATORS;
    }
}

export function getResourcePaymentOption(card, dragResourcePayment) {
    const sourceCardId = dragResourcePayment?.card?.id;
    const source = dragResourcePayment?.source;

    if (!card?.id || !sourceCardId || !source) {
        return undefined;
    }

    const ability = (card.abilities || []).find((candidate, index) =>
        !candidate.disable &&
        candidate.resourcePayment?.sourceIds?.includes(sourceCardId) &&
        (candidate.index ?? index) >= 0
    );

    if (!ability) {
        return undefined;
    }

    const abilityIndex = card.abilities.indexOf(ability);

    return {
        abilityIndex: ability.index ?? abilityIndex,
        cardId: sourceCardId,
        source,
    };
}

export function isResourcePaymentDropTarget(card, dragResourcePayment) {
    return Boolean(getResourcePaymentOption(card, dragResourcePayment));
}
