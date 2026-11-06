import {DIALOG_LIST, DIALOG_SELECT_CARD} from 'mc-shared';

const LIST_DIALOG_THRESHOLD = 5;

export async function selectItemForResolution({
    items,
    openDialog,
    targetPlayer,
    title,
    getCard,
    getText,
    closeOnResponse,
    showSingleCardDialog = false,
    invalidSelectionMessage = 'La selección del elemento que se resolverá no es válida.',
}) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new TypeError('selectItemForResolution requires selectable items.');
    }
    if (items.length > LIST_DIALOG_THRESHOLD) {
        const response = await openDialog({
            closeOnResponse,
            dialogType: DIALOG_LIST,
            hideOk: true,
            targetPlayer,
            title,
            data: {
                options: items.map((item, index) => ({
                    id: index,
                    text: getText(item),
                })),
            },
        });
        const selectedIndex = response?.selected?.id;
        if (!Number.isInteger(selectedIndex) ||
            selectedIndex < 0 ||
            selectedIndex >= items.length) {
            throw new Error(invalidSelectionMessage);
        }

        return items[selectedIndex];
    }

    const response = await openDialog({
        closeOnResponse,
        dialogType: DIALOG_SELECT_CARD,
        hideOk: true,
        showSingleCardDialog,
        targetPlayer,
        title,
        data: {
            cards: items.map(getCard),
        },
    });
    const selectedId = response?.selected?.[0]?.id;
    const selectedItem = items.find(item =>
        getCard(item)?.id === selectedId);
    if (!selectedItem) {
        throw new Error(invalidSelectionMessage);
    }

    return selectedItem;
}
