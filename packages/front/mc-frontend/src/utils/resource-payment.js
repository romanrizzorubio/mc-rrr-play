import {
    RESOURCE_ANY,
    RESOURCE_WILD,
} from 'mc-shared';

export function normalizeResourceRequirements(requirement = []) {
    if (!Array.isArray(requirement)) {
        return [];
    }

    return requirement.map(required =>
        Array.isArray(required) ? required.slice() : [required]);
}

export function getResourceUnitKey({source, cardId, resourceIndex}) {
    return JSON.stringify([source, cardId, resourceIndex]);
}

export function getResourceUnitKeysForCard(card, source) {
    const resources = source === 'hand' ?
        card.resources :
        (card.abilities || [])
            .filter(ability => ability.isResource)
            .flatMap(ability => ability.resources || [ability.resource]);

    return resources.map((_resource, index) =>
        getResourceUnitKey({
            source,
            cardId: card.id,
            resourceIndex: index,
        }));
}

export function getPaymentResourceUnits(
    cards,
    {
        selectedOnly = false,
        selectedWilds = [],
        allowWildConversion = true,
        selectedResourceKeys,
    } = {}
) {
    const {generators = [], hand = []} = cards;
    const selected = selectedOnly ?
        card => card.selected :
        () => true;
    const wilds = selectedWilds.slice();
    let wildIndex = 0;
    const units = [];
    const addResourceUnits = (
        card,
        resources,
        source,
        resourceIndex = 0
    ) => {
        resources.forEach((resource, index) => {
            const canConvertWild = allowWildConversion &&
                resource === RESOURCE_WILD &&
                wilds.length;
            const convertedResource = canConvertWild ?
                wilds.shift() :
                resource;

            units.push({
                resource: convertedResource,
                originalResource: resource,
                cardId: card.id,
                resourceIndex: resourceIndex + index,
                source,
                ...(canConvertWild ? {
                    wild: true,
                    wildIndex: wildIndex++,
                } : {}),
            });
        });
    };

    hand.filter(selected).forEach(card =>
        addResourceUnits(card, card.resources, 'hand'));

    generators.filter(selected).forEach(card => {
        let resourceIndex = 0;
        card.abilities.forEach(ability => {
            if (!ability.isResource) {
                return;
            }

            const resources = ability.resources || [ability.resource];
            addResourceUnits(card, resources, 'generators', resourceIndex);
            resourceIndex += resources.length;
        });
    });

    if (Array.isArray(selectedResourceKeys)) {
        const selectedKeys = new Set(selectedResourceKeys);

        return units.filter(unit =>
            selectedKeys.has(getResourceUnitKey(unit)));
    }

    return units;
}

export function getAutomaticWilds(
    {
        requirement = [],
        resourcePreferences = [],
        exclusiveResourcePreferences = [],
    },
    resources,
    {allowWildConversion = true} = {}
) {
    if (!allowWildConversion) {
        return [];
    }

    const wilds = resources
        .filter(unit => unit.originalResource === RESOURCE_WILD)
        .map(() => RESOURCE_WILD);
    const resourceCounts = new Map();
    resources.forEach(({originalResource: resource}) => {
        if (resource !== RESOURCE_WILD) {
            resourceCounts.set(resource, (resourceCounts.get(resource) || 0) + 1);
        }
    });
    const paidResourceCounts = new Map(resourceCounts);
    const requirements = normalizeResourceRequirements(requirement);

    let wildIndex = 0;
    requirements.forEach(alternatives => {
        const available = alternatives.find(resource =>
            resource !== RESOURCE_ANY &&
            resource !== RESOURCE_WILD &&
            (resourceCounts.get(resource) || 0) > 0);
        if (available) {
            resourceCounts.set(available, resourceCounts.get(available) - 1);
        } else {
            const conversion = alternatives.find(resource =>
                resource !== RESOURCE_ANY && resource !== RESOURCE_WILD);
            if (conversion !== undefined && wildIndex < wilds.length) {
                wilds[wildIndex++] = conversion;
                paidResourceCounts.set(
                    conversion,
                    (paidResourceCounts.get(conversion) || 0) + 1
                );
            }
        }
    });

    const exclusivePreference = exclusiveResourcePreferences.find(resource =>
        resource !== RESOURCE_ANY && resource !== RESOURCE_WILD);
    if (exclusivePreference !== undefined) {
        while (wildIndex < wilds.length) {
            wilds[wildIndex++] = exclusivePreference;
            paidResourceCounts.set(
                exclusivePreference,
                (paidResourceCounts.get(exclusivePreference) || 0) + 1
            );
        }
    }

    new Set(resourcePreferences).forEach(resource => {
        if ((paidResourceCounts.get(resource) || 0) > 0 ||
            wildIndex >= wilds.length) {
            return;
        }

        wilds[wildIndex++] = resource;
        paidResourceCounts.set(
            resource,
            (paidResourceCounts.get(resource) || 0) + 1
        );
    });

    return wilds;
}

export function getResourceMatches(
    resources,
    requirement,
    {allowWildConversion = true} = {}
) {
    const requirements = normalizeResourceRequirements(requirement);
    const matchedResourceIndexes = Array(requirements.length).fill(-1);
    const canPay = (resource, alternatives) =>
        alternatives.includes(RESOURCE_ANY) ||
        resource === RESOURCE_ANY ||
        alternatives.includes(resource) ||
        (allowWildConversion && resource === RESOURCE_WILD);
    const assignResource = (resourceIndex, visitedRequirements) => {
        for (let index = 0; index < requirements.length; index++) {
            if (visitedRequirements.has(index) ||
                !canPay(resources[resourceIndex].resource, requirements[index])) {
                continue;
            }

            visitedRequirements.add(index);
            const matchedResourceIndex = matchedResourceIndexes[index];
            if (matchedResourceIndex === -1 ||
                assignResource(matchedResourceIndex, visitedRequirements)) {
                matchedResourceIndexes[index] = resourceIndex;

                return true;
            }
        }

        return false;
    };

    let count = 0;
    resources.forEach((_resource, index) => {
        if (assignResource(index, new Set())) {
            count++;
        }
    });

    const cardIds = new Set(matchedResourceIndexes
        .filter(index => index > -1)
        .map(index => resources[index].cardId));

    return {count, cardIds};
}
