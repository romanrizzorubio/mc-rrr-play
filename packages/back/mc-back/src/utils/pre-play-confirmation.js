export function findPrePlayConfirmationEffect(effect) {
    if (!effect || typeof effect !== 'object') {
        return undefined;
    }
    if (Object.hasOwn(effect, 'prePlayConfirmation') ||
        Object.hasOwn(effect, 'requiresPrePlayConfirmation')) {
        return effect;
    }

    if (Array.isArray(effect.effects)) {
        for (const child of effect.effects) {
            const confirmationEffect =
                findPrePlayConfirmationEffect(child);
            if (confirmationEffect) {
                return confirmationEffect;
            }
        }
    }

    return undefined;
}

export function getPrePlayConfirmationCard(card, params) {
    if (!card || typeof card.toObj !== 'function') {
        throw new TypeError(
            'Pre-play confirmation requires a serializable card.'
        );
    }

    return {
        card: card.toObj(params),
        horizontal: Boolean(card.isMainScheme || card.isSideScheme),
    };
}

export async function confirmPrePlay(effect, params, {
    title,
    subtitle,
    data,
}) {
    const response = await effect.openDialog({
        dialogType: 'confirm',
        title: title ?? effect.ability?.card?.name,
        subtitle,
        data,
    });

    return response?.confirmed === true;
}
