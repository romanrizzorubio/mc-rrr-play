export const getCharacterForDamageTarget = target => {
    if (target?.isPlayer) {
        return getCharacterForDamageTarget(target.superhero?.currentSide);
    }

    const currentSide = target?.currentSide;

    return currentSide && currentSide !== target ?
        getCharacterForDamageTarget(currentSide) :
        target;
};
