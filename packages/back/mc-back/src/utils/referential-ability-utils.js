const REFERENCE_CARD_TYPE_ENCOUNTER = 'encounter';
const REFERENCE_CARD_TYPE_PLAYER = 'player';
const REFERENCE_PRIORITY_NO_MATCH = -1;
export const REFERENCE_PRIORITY_SOURCE_CARD = 0;
export const REFERENCE_PRIORITY_ASSOCIATED_SET = 1;
const REFERENCE_PRIORITY_CARD_TYPE = 2;

export const REFERENCE_PRIORITY_COUNT = REFERENCE_PRIORITY_CARD_TYPE + 1;

export const getCardSet = card => card?.set ?? card?.card?.set;

export const getAssociatedSet = (referenceCard, match) => {
    const ownerSuperheroSet = getCardSet(referenceCard?.owner?.superhero);
    if (ownerSuperheroSet) {
        return ownerSuperheroSet;
    }

    const referenceSet = getCardSet(referenceCard);
    const associatedSuperhero = (match?.players || []).find(({superhero}) =>
        referenceSet && getCardSet(superhero) === referenceSet)?.superhero;

    return getCardSet(associatedSuperhero) ??
        (isEncounterCard(referenceCard) ? referenceSet : undefined);
};

export const isPlayerCard = card => Boolean(
    !card?.isPlayer && (
        card?.isPlayerCard ||
        card?.card?.isPlayerCard ||
        card?.isSuperhero ||
        card?.card?.isSuperhero
    )
);

export const isEncounterCard = card =>
    Boolean(card?.isEncounterCard || card?.card?.isEncounterCard);

export const getReferenceCardType = card => {
    if (isEncounterCard(card)) {
        return REFERENCE_CARD_TYPE_ENCOUNTER;
    }
    if (isPlayerCard(card)) {
        return REFERENCE_CARD_TYPE_PLAYER;
    }
};

export const isSameCard = (card, referenceCard) =>
    card === referenceCard ||
    card?.parent === referenceCard ||
    referenceCard?.parent === card ||
    referenceCard?.sides?.includes(card) ||
    card?.sides?.includes(referenceCard);

export const getReferencePriority = (
    card,
    referenceCard,
    associatedSet,
    referenceCardType
) => {
    if (isSameCard(card, referenceCard)) {
        return REFERENCE_PRIORITY_SOURCE_CARD;
    }
    if (associatedSet && getCardSet(card) === associatedSet) {
        return REFERENCE_PRIORITY_ASSOCIATED_SET;
    }
    if (
        (referenceCardType === REFERENCE_CARD_TYPE_ENCOUNTER &&
            isEncounterCard(card)) ||
        (referenceCardType === REFERENCE_CARD_TYPE_PLAYER &&
            isPlayerCard(card))
    ) {
        return REFERENCE_PRIORITY_CARD_TYPE;
    }

    return REFERENCE_PRIORITY_NO_MATCH;
};

const getReferenceNames = condition => {
    const conditions = Array.isArray(condition) ? condition : [condition];

    return [...new Set(conditions
        .flatMap(candidate => {
            const names = [];
            if (typeof candidate?.name === 'string') {
                names.push(candidate.name);
            }
            if (typeof candidate?.['card.name'] === 'string') {
                names.push(candidate['card.name']);
            }

            return names;
        }))];
};

export const hasReferentialTargetCondition = (condition, referenceCard) =>
    getReferenceNames(condition).length > 0 &&
    Boolean(getReferenceCardType(referenceCard));

const getNamedTarget = (target, name) => {
    if (!isPlayerCard(target) && !isEncounterCard(target)) {
        return undefined;
    }
    if (target?.name !== name &&
        target?.mainName !== name &&
        target?.card?.name !== name) {
        return undefined;
    }

    return target;
};

export const isReferentialNameTarget = (target, condition) =>
    getReferenceNames(condition).some(name =>
        Boolean(getNamedTarget(target, name)));

export const filterReferentialTargets = (
    targets,
    condition,
    referenceCard,
    match
) => {
    const names = getReferenceNames(condition);
    const referenceCardType = getReferenceCardType(referenceCard);
    if (!names.length || !referenceCard || !referenceCardType) {
        return targets;
    }
    if (!targets.some(target =>
        isPlayerCard(target) || isEncounterCard(target))) {
        return targets;
    }

    const associatedSet = getAssociatedSet(referenceCard, match);
    const highestPriorityTargets = new Set();
    names.forEach(name => {
        const namedTargets = targets.flatMap(target => {
            const namedTarget = getNamedTarget(target, name);

            return namedTarget ? [namedTarget] : [];
        });
        const priorities = namedTargets.map(target =>
            getReferencePriority(
                target,
                referenceCard,
                associatedSet,
                referenceCardType
            ));
        const matchingPriorities = priorities.filter(priority =>
            priority >= 0);
        const highestPriority = matchingPriorities.length ?
            Math.min(...matchingPriorities) :
            REFERENCE_PRIORITY_NO_MATCH;

        if (highestPriority >= 0) {
            namedTargets.forEach((target, index) => {
                if (priorities[index] === highestPriority) {
                    highestPriorityTargets.add(target);
                }
            });
        }
    });

    return targets.flatMap(target => {
        const namedTargets = names.map(name => getNamedTarget(target, name))
            .filter(namedTarget => namedTarget &&
                highestPriorityTargets.has(namedTarget));

        return [...new Set(namedTargets)];
    });
};
