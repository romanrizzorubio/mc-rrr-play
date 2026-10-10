import {uniqueCardsShareIdentity} from 'mc-shared';

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
    const firstIdentity = getUniqueIdentity(first);
    const secondIdentity = getUniqueIdentity(second);

    return uniqueCardsShareIdentity(
        {...firstIdentity, unique: first.unique},
        {...secondIdentity, unique: second.unique},
    );
};
