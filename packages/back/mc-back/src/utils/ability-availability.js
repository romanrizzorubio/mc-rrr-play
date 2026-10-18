async function getResourcePaymentAvailability(ability, card, player, canRun) {
    if (!canRun || !player?.getCardsToPay) {
        return undefined;
    }

    const cost = ability.arrow?.cost;
    const resourceType = cost?.resourceType;
    const requirements = Array.isArray(cost?.resources) ?
        cost.resources :
        undefined;

    if (resourceType === undefined && requirements === undefined) {
        return undefined;
    }

    const cards = await player.getCardsToPay(card, resourceType);
    const sourceIds = [...cards.hand, ...cards.generators]
        .map(source => source.id)
        .filter(id => id !== undefined && id !== null);

    if (!sourceIds.length) {
        return undefined;
    }

    return {
        sourceIds: [...new Set(sourceIds)],
        ...(resourceType !== undefined ? {resourceType} : {}),
        ...(requirements !== undefined ? {requirements} : {}),
    };
}

export async function getAbilitiesWithAvailability(card, player) {
    return Promise.all(card.currentSide.abilities.map(async (ability, index) => {
        const isTargetedActivation = ability.isAction || ability.isBasic;
        const isAttackOrThwart = ability.isAttack || ability.isThwart;
        const isDragActivation =
            ability.isAction || (ability.isBasic && isAttackOrThwart);
        const serializedAbility = {
            ...ability.toObj(),
            index,
            ...(isTargetedActivation ? {
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
        const availableTargetIds = isDragActivation &&
            canRun &&
            ability.effect &&
            (!ability.effect.validTarget ||
                !ability.effect.validTarget.isMultipleTarget({
                    target: ability.effect.target,
                })) ?
            (await ability.effect.getValidTarget(availabilityParams))
                .map(target => target.id) :
            undefined;
        const resourcePayment = await getResourcePaymentAvailability(
            ability,
            card,
            player,
            canRun
        );

        return {
            ...serializedAbility,
            disable: !canRun,
            ...(availableTargetIds ?
                {availableTargetIds} :
                {}),
            ...(resourcePayment ? {resourcePayment} : {}),
        };
    }));
}
