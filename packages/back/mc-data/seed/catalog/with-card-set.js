export const withCardSet = (card, set) => ({
    ...card,
    params: {
        ...card.params,
        set,
    },
});
