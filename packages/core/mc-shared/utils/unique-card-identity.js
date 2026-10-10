export const uniqueCardsShareIdentity = (first, second) => {
    if (!first.unique || !second.unique) {
        return false;
    }

    const firstTitle = first.title || first.name;
    const secondTitle = second.title || second.name;
    const firstRelatedNames = [
        first.subtitle,
        ...(first.relatedNames || []),
    ].filter(Boolean);
    const secondRelatedNames = [
        second.subtitle,
        ...(second.relatedNames || []),
    ].filter(Boolean);
    const firstNames = [firstTitle, ...firstRelatedNames];
    const secondNames = [secondTitle, ...secondRelatedNames];

    if (!firstRelatedNames.length && !secondRelatedNames.length) {
        return firstTitle === secondTitle;
    }

    return firstRelatedNames.some(name => secondNames.includes(name)) ||
        secondRelatedNames.some(name => firstNames.includes(name));
};
