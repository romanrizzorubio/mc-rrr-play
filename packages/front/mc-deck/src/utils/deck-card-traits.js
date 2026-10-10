export const NO_TRAITS_FILTER = '__no_traits__';

export function getCardTraits(card) {
    const traits = Array.isArray(card?.traits) ?
        card.traits :
        typeof card?.traits === 'string' ? [card.traits] : [];

    return traits.filter(trait => typeof trait === 'string' && trait.length > 0);
}

export function matchesCardTraitFilter(card, selectedTrait) {
    const traits = getCardTraits(card);
    if (selectedTrait === NO_TRAITS_FILTER) {
        return traits.length === 0;
    }

    return selectedTrait === 'all' || traits.includes(selectedTrait);
}
