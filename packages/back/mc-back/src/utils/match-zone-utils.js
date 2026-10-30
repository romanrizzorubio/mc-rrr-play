export function getScenarioZone(match, player) {
    if (typeof match?.getScenarioZone === 'function') {
        return match.getScenarioZone(player);
    }

    return player?.scenarioZone ??
        match?.scenario?.getZoneForPlayer?.(player) ??
        match?.scenario?.gameZone;
}

export function getScenarioZoneForCard(match, card) {
    if (typeof match?.getScenarioZoneForCard === 'function') {
        return match.getScenarioZoneForCard(card);
    }

    return card?.scenarioZone ??
        card?.controller?.scenarioZone ??
        card?.owner?.scenarioZone ??
        card?.engaged?.scenarioZone ??
        card?.attachedTo?.scenarioZone ??
        card?.parent?.scenarioZone;
}

export function getMainSchemeFor(match, player) {
    if (typeof match?.getMainSchemeFor === 'function') {
        return match.getMainSchemeFor(player);
    }

    const zone = getScenarioZone(match, player);
    return zone?.currentScheme?.currentSide ??
        zone?.mainScheme ??
        match?.mainScheme ??
        match?.scenario?.mainScheme?.currentSide ??
        match?.scenario?.mainScheme;
}

export function getVillainFor(match, player) {
    if (typeof match?.getVillainFor === 'function') {
        return match.getVillainFor(player);
    }

    return getScenarioZone(match, player)?.currentVillain ??
        match?.villain ??
        match?.scenario?.villain;
}

export function getSchemesFor(match, player) {
    if (typeof match?.getSchemesFor === 'function') {
        return match.getSchemesFor(player);
    }

    const zone = getScenarioZone(match, player);
    return zone?.schemes ??
        match?.schemes ??
        [
            ...(zone?.currentScheme ?
                [zone.currentScheme.currentSide ?? zone.currentScheme] :
                []),
            ...(zone?.sideSchemes ?? []),
        ];
}

export function getSideSchemesFor(match, player) {
    if (typeof match?.getSideSchemesFor === 'function') {
        return match.getSideSchemesFor(player);
    }

    const zone = getScenarioZone(match, player);
    return zone?.sideSchemes ??
        match?.sideSchemes ??
        (zone?.cards ?? []).filter(card => card.isSideScheme);
}

export function getPlayersFor(match, player) {
    if (typeof match?.getPlayersFor === 'function') {
        return match.getPlayersFor(player);
    }

    if (!match?.scenario?.separatePlayAreas) {
        return match?.players ?? (player ? [player] : []);
    }

    return player ?
        getScenarioZone(match, player)?.players ?? [player] :
        match?.players ?? [];
}

export function getHeroesFor(match, player) {
    const players = getPlayersFor(match, player);
    const heroes = players.filter(zonePlayer => zonePlayer.isHero);
    if (match?.scenario?.separatePlayAreas ||
        players.some(zonePlayer => typeof zonePlayer.isHero === 'boolean')) {
        return heroes;
    }

    return Array.isArray(match?.heroes) ?
        match.heroes :
        players.filter(zonePlayer => zonePlayer.superhero);
}

export function getHazardIconsFor(match, player) {
    if (typeof match?.getHazardIconsFor === 'function') {
        return match.getHazardIconsFor(player);
    }

    if (Number.isFinite(match?.hazardIcons)) {
        return match.hazardIcons;
    }

    return (match?.scenario?.hazardIcons ?? 0) +
        getPlayersFor(match, player).reduce((total, zonePlayer) =>
            total + (zonePlayer.hazardIcons ?? 0), 0);
}

export function getAccelerationIconsFor(match, player) {
    if (typeof match?.getAccelerationIconsFor === 'function') {
        return match.getAccelerationIconsFor(player);
    }

    const zone = getScenarioZone(match, player);
    const players = getPlayersFor(match, player);
    if (zone) {
        return (zone.accelerationIcons ?? 0) +
            players.reduce((total, zonePlayer) =>
                total + (zonePlayer.accelerationIcons ?? 0), 0);
    }

    return match?.accelerationIcons ??
        (match?.scenario?.accelerationIcons ?? 0) +
        players.reduce((total, zonePlayer) =>
            total + (zonePlayer.accelerationIcons ?? 0), 0);
}

export function getAccelerationTokensFor(match, player) {
    if (typeof match?.getAccelerationTokensFor === 'function') {
        return match.getAccelerationTokensFor(player);
    }

    const zone = getScenarioZone(match, player);
    const players = getPlayersFor(match, player);
    if (zone) {
        return (zone.accelerationTokens ?? 0) +
            players.reduce((total, zonePlayer) =>
                total + (zonePlayer.accelerationTokens ?? 0), 0);
    }

    return match?.accelerationTokens ??
        (match?.scenario?.accelerationTokens ?? 0) +
        players.reduce((total, zonePlayer) =>
            total + (zonePlayer.accelerationTokens ?? 0), 0);
}

export function getAccelerationPlusFor(match, player) {
    if (typeof match?.getAccelerationPlusFor === 'function') {
        return match.getAccelerationPlusFor(player);
    }
    if (Number.isFinite(match?.accelerationPlus)) {
        return match.accelerationPlus;
    }

    return getAccelerationIconsFor(match, player) +
        getAccelerationTokensFor(match, player);
}

export function getMinionsFor(match, player) {
    if (typeof match?.getMinionsFor === 'function') {
        return match.getMinionsFor(player);
    }

    if (Array.isArray(match?.minions)) {
        return match.minions;
    }

    return getPlayersFor(match, player).flatMap(zonePlayer =>
        zonePlayer.minions ?? zonePlayer.gameZone?.minions ?? []);
}

export function getEnemiesFor(match, player) {
    if (typeof match?.getEnemiesFor === 'function') {
        return match.getEnemiesFor(player);
    }
    if (Array.isArray(match?.enemies)) {
        return match.enemies;
    }

    return [
        ...getMinionsFor(match, player),
        getVillainFor(match, player),
    ].filter(Boolean);
}

export function getFriendsFor(match, player) {
    if (typeof match?.getFriendsFor === 'function') {
        return match.getFriendsFor(player);
    }
    if (Array.isArray(match?.friends)) {
        return match.friends;
    }

    return getPlayersFor(match, player).flatMap(zonePlayer =>
        zonePlayer.friends ?? [
            ...(zonePlayer.allies ?? []),
            zonePlayer.superhero,
        ].filter(Boolean));
}

export function getCharactersFor(match, player) {
    if (typeof match?.getCharactersFor === 'function') {
        return match.getCharactersFor(player);
    }
    if (Array.isArray(match?.characters)) {
        return match.characters;
    }

    return getEnemiesFor(match, player).concat(getFriendsFor(match, player));
}
