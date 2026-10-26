export async function refreshCharacter(character) {
    const {owner} = character;
    if (owner?.isPlayer && typeof owner.refresh === 'function') {
        await owner.refresh();
        return;
    }

    const {parent} = character;
    const refreshTarget = parent?.sides?.includes(character) &&
        typeof parent.refresh === 'function' ?
        parent :
        character;

    await refreshTarget.refresh();
}
