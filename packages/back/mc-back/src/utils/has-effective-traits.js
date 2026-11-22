export const getCardEffectiveTraits = async (card, player) => {
    if (!card) {
        return undefined;
    }
    const selectedTarget = card.currentSide ?? card;
    const traitPlayer = card.controller ?? player;
    return typeof selectedTarget.getEffectiveTraits === 'function' ?
        await selectedTarget.getEffectiveTraits({player: traitPlayer}) :
        selectedTarget.traits ?? [];
};

export const hasEffectiveTraits = async (card, traits, player) => {
    if (!card || traits === undefined || traits === null) {
        return false;
    }

    const effectiveTraits = await getCardEffectiveTraits(card, player) ?? [];
    const requiredTraits = Array.isArray(traits) ? traits : [traits];

    return requiredTraits.some(trait => effectiveTraits.includes(trait));
};
