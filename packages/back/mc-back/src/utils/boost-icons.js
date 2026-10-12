export const getBoostIconCancellation = effect => {
    const remainingBoostIcons = Number.isFinite(effect?.boostValue) ?
        Math.max(0, effect.boostValue) :
        0;
    const alreadyCancelledBoostIcons = Number.isFinite(effect?.cancelledBoostIcons) ?
        Math.max(0, effect.cancelledBoostIcons) :
        0;

    return {
        alreadyCancelledBoostIcons,
        remainingBoostIcons,
    };
};
