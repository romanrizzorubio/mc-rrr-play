import {
    RESOURCE_ANY,
    RESOURCE_WILD,
} from 'mc-shared';

export function normalizeResourceRequirements(requirements) {
    if (!Array.isArray(requirements)) {
        throw new TypeError('Resource requirements must be an array.');
    }

    return requirements.map(requirement => {
        const alternatives = Array.isArray(requirement) ?
            requirement :
            [requirement];

        if (!alternatives.length ||
            alternatives.some(resource => typeof resource !== 'string')) {
            throw new TypeError('Each resource requirement must contain resource types.');
        }

        return alternatives.slice();
    });
}

export function resourceSatisfiesRequirement(
    resource,
    requirement,
    {allowWildConversion = true} = {}
) {
    const alternatives = Array.isArray(requirement) ?
        requirement :
        [requirement];

    return alternatives.includes(RESOURCE_ANY) ||
        resource === RESOURCE_ANY ||
        alternatives.includes(resource) ||
        (allowWildConversion && resource === RESOURCE_WILD);
}

export function getResourceIcons(card, {printed = false, cardToPay} = {}) {
    if (!printed &&
        card &&
        Object.hasOwn(card, 'resources') &&
        Array.isArray(card.resources) &&
        card.resources.every(resource => typeof resource === 'string')) {
        return [...card.resources];
    }

    const printedCard = card?.card ?? card;
    const getResources = printed ?
        printedCard?.getPrintedResources :
        printedCard?.getResources;

    if (typeof getResources === 'function') {
        const resources = getResources.call(printedCard, cardToPay);
        if (!Array.isArray(resources)) {
            throw new TypeError('Card resources must resolve to an array.');
        }

        return [...resources];
    }

    const resources = printedCard?.resources ?? card?.resources ?? [];
    if (!Array.isArray(resources)) {
        throw new TypeError('Card resources must be an array.');
    }

    return resources.filter(resource => typeof resource === 'string');
}

export function toResourcePaymentCard(
    card,
    params = {},
    {printed = false, cardToPay} = {}
) {
    const cardParams = cardToPay ?
        {...params, card: cardToPay} :
        params;

    return {
        ...card.toObj(cardParams),
        resources: getResourceIcons(card, {printed, cardToPay}),
    };
}
