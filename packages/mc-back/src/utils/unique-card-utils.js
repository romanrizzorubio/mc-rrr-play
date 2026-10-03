const getUniqueIdentity = card => {
    const sides = card.sides || [];
    const heroSide = sides.find(side => side.isHero);
    const alterEgoSide = sides.find(side => side.isAlterEgo);
    const printedCard = card.card;
    const subtitle = card.subtitle || (printedCard && printedCard.subtitle);

    return {
        title: heroSide ? heroSide.name : card.name,
        relatedNames: [subtitle, alterEgoSide && alterEgoSide.name]
            .filter(Boolean),
    };
};

export const cardsShareUniqueIdentity = (first, second) => {
    if (!first.unique || !second.unique) {
        return false;
    }

    const firstIdentity = getUniqueIdentity(first);
    const secondIdentity = getUniqueIdentity(second);
    const firstNames = [firstIdentity.title, ...firstIdentity.relatedNames];
    const secondNames = [secondIdentity.title, ...secondIdentity.relatedNames];

    if (!firstIdentity.relatedNames.length &&
        !secondIdentity.relatedNames.length &&
        firstIdentity.title === secondIdentity.title) {
        return true;
    }

    return firstIdentity.relatedNames.some(name => secondNames.includes(name)) ||
        secondIdentity.relatedNames.some(name => firstNames.includes(name));
};
