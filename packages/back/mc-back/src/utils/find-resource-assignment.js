import {RESOURCE_WILD} from 'mc-shared';

export const findResourceAssignment = (cards, requirements, forcedCard) => {
    const resourceIcons = cards.flatMap(card =>
        (card.resources || []).map((resource, index) => ({
            card,
            resource,
            index,
        })));
    const findAssignment = (requirementIndex, usedIcons) => {
        if (requirementIndex === requirements.length) {
            return !forcedCard || usedIcons.some(icon => icon.card === forcedCard) ?
                usedIcons :
                undefined;
        }

        const requirement = requirements[requirementIndex];
        for (const icon of resourceIcons) {
            if (usedIcons.some(usedIcon =>
                usedIcon.card === icon.card && usedIcon.index === icon.index) ||
                (icon.resource !== RESOURCE_WILD &&
                    !requirement.includes(icon.resource))) {
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
