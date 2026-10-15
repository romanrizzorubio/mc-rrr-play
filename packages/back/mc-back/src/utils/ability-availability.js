export async function getAbilitiesWithAvailability(card, player) {
    return Promise.all(card.currentSide.abilities.map(async (ability, index) => {
        const serializedAbility = {
            ...ability.toObj(),
            index,
            ...(ability.isBasic ? {
                isAttack: ability.isAttack,
                isThwart: ability.isThwart,
            } : {}),
        };

        if (!ability.isAction && !ability.isBasic) {
            return serializedAbility;
        }

        ability.prepareEffect();

        const availabilityParams = {
            player,
            card,
        };
        const canRun = await ability.canRun(availabilityParams);
        const availableTargetIds = ability.isBasic &&
            (ability.isAttack || ability.isThwart) &&
            canRun &&
            ability.effect ?
            (await ability.effect.getValidTarget(availabilityParams))
                .map(target => target.id) :
            undefined;

        return {
            ...serializedAbility,
            disable: !canRun,
            ...(availableTargetIds ?
                {availableTargetIds} :
                {}),
        };
    }));
}
