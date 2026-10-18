import {
    getResourceIcons,
    normalizeResourceRequirements,
    resourceSatisfiesRequirement,
} from './resource-requirements.js';

export const findResourceAssignment = (
    cards,
    requirements,
    forcedCard,
    {allowWildConversion = true, printed = false} = {}
) => {
    const normalizedRequirements = normalizeResourceRequirements(requirements);
    const resourceIcons = cards.flatMap(card =>
        getResourceIcons(card, {printed}).map((resource, index) => ({
            card,
            resource,
            index,
        })));
    const findAssignment = (requirementIndex, usedIcons) => {
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

            const assignment = findAssignment(
                requirementIndex + 1,
                [...usedIcons, {...icon, requirementIndex}]
            );
            if (assignment) {
                return assignment;
            }
        }

        return undefined;
    };

    return findAssignment(0, []);
};
