import {
    DIALOG_LIST,
    STATUS_CONFUSED,
    STATUS_STUNNED,
    STATUS_TOUGH,
} from 'mc-shared';

const STATUS_IMAGES = {
    [STATUS_CONFUSED]: 'status/confused.webp',
    [STATUS_STUNNED]: 'status/stunned.webp',
    [STATUS_TOUGH]: 'status/though.webp',
};

export async function selectStatusOption(
    effect,
    options,
    title,
    {alwaysDialog = false, targetPlayer} = {}
) {
    if (!options.length) {
        throw new Error('No hay cartas de Estado disponibles para seleccionar.');
    }
    if (!alwaysDialog && options.length === 1) {
        return options[0][0];
    }

    const response = await effect.openDialog({
        dialogType: DIALOG_LIST,
        hideOk: true,
        targetPlayer,
        title,
        data: {
            options: options.map(([id, name]) => ({
                id,
                text: name,
                image: STATUS_IMAGES[id],
            })),
        },
    });
    const selected = options.find(([id]) => id === response?.selected?.id);

    if (!selected) {
        throw new Error('La selección de la carta de Estado no es válida.');
    }

    return selected[0];
}
