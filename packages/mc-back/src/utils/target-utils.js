export function getSelectedTargets(target) {
    return Array.isArray(target) ? target : [target];
}

export function getCurrentVillainStage(target, match) {
    if (target?.isVillain &&
        !target.isInPlay &&
        match?.villain?.name === target.name) {
        return match.villain;
    }

    return target;
}

export function getAttackedTargets({attack, match}) {
    if (!attack) {
        return [];
    }

    const effect = attack.effect;
    const attacked = attack.attackedTargets ??
        effect?.attacked ??
        effect?.selectedTarget ??
        attack.selectedTarget;
    const targets = Array.isArray(attacked) ? attacked : [attacked];

    return targets
        .filter(Boolean)
        .map(target => target?.isPlayer ? target.superhero.currentSide : target)
        .map(target => getCurrentVillainStage(target, match))
        .filter(target => target?.isInPlay);
}
