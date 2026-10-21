export function placeDamageTokens(target, damage) {
    return target.placeDamage(damage);
}

export function removeDamageTokens(target, damage) {
    const removeDamage = target.healDamage ?? target.removeDamage;

    return removeDamage.call(target, damage);
}

export function moveDamageTokens(source, destination, damage) {
    removeDamageTokens(source, damage);
    placeDamageTokens(destination, damage);
}

export function placeThreatTokens(target, threat) {
    return target.placeThreat(threat);
}

export function removeThreatTokens(target, threat) {
    return target.removeThreat(threat);
}

export function moveThreatTokens(source, destination, threat) {
    removeThreatTokens(source, threat);
    placeThreatTokens(destination, threat);
}
