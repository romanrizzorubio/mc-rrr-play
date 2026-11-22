import {
    RESOURCE_ENERGY,
    RESOURCE_ANY,
    RESOURCE_MENTAL,
    RESOURCE_PHYSICAL,
    RESOURCE_WILD,
} from 'mc-shared';
import {
    getResourceIcons,
    normalizeResourceRequirements,
    resourceSatisfiesRequirement,
} from './resource-requirements.js';

export const findResourceAssignment = (
    cards,
    requirements,
    forcedCard,
    {
        allowWildConversion = true,
        cardToPay,
        differentTypes = false,
        printed = false,
        sameType = false,
    } = {}
) => {
    const normalizedRequirements = normalizeResourceRequirements(requirements);
    const resourceIcons = cards.flatMap(card =>
        getResourceIcons(card, {cardToPay, printed}).map((resource, index) => ({
            card,
            resource,
            index,
        })));
    const resourceTypeOptions = (resource, requirement) => {
        if (resource !== RESOURCE_WILD ||
            !allowWildConversion ||
            (!sameType && !differentTypes)) {
            return [resource];
        }

        const alternatives = Array.isArray(requirement) ?
            requirement :
            [requirement];
        const types = [
            RESOURCE_ENERGY,
            RESOURCE_MENTAL,
            RESOURCE_PHYSICAL,
            RESOURCE_WILD,
        ];

        return alternatives.includes(RESOURCE_ANY) ?
            types :
            types.filter(type => alternatives.includes(type));
    };
    const findAssignment = (requirementIndex, usedIcons, usedTypes = []) => {
        if (requirementIndex === normalizedRequirements.length) {
            return !forcedCard || usedIcons.some(icon => icon.card === forcedCard) ?
                usedIcons :
                undefined;
        }

        const requirement = normalizedRequirements[requirementIndex];
        for (const icon of resourceIcons) {
            if (usedIcons.some(usedIcon =>
                usedIcon.card === icon.card && usedIcon.index === icon.index) ||
                !resourceSatisfiesRequirement(
                    icon.resource,
                    requirement,
                    {allowWildConversion}
                )) {
                continue;
            }

            for (const resourceType of resourceTypeOptions(
                icon.resource,
                requirement
            )) {
                if (sameType &&
                    usedTypes.length &&
                    usedTypes[0] !== resourceType) {
                    continue;
                }
                if (differentTypes && usedTypes.includes(resourceType)) {
                    continue;
                }

                const assignment = findAssignment(
                    requirementIndex + 1,
                    [...usedIcons, {...icon, requirementIndex}],
                    [...usedTypes, resourceType]
                );
                if (assignment) {
                    return assignment;
                }
            }
        }

        return undefined;
    };

    return findAssignment(0, []);
};
