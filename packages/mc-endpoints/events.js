export const EVENTS = {
    CARD: {
        DEFEAT: 'card-defeat',
        REFRESH: 'card-refresh',
    },
    DECK: {
        REFRESH: 'deck-refresh',
    },
    DIALOG: {
        OPEN: 'open-dialog',
        RESPONSE: 'dialog-response',
    },
    HAND: {
        REFRESH: 'hand-refresh',
    },
    MATCH: {
        CREATED: 'match-created',
        REFRESH: 'match-refresh',
    },
    PLAYER: {
        CREATED: 'player-created',
        DEFEAT: 'defeat-player',
        REFRESH: 'player-refresh',
    },
    PLAYER_ZONE: {
        REFRESH: 'player-zone-refresh',
    },
    ROUND: {
        END: 'round-end',
    },
    SCENARIO: {
        CREATED: 'scenario-created',
        DEFEAT: 'defeat-scenario',
        REFRESH: 'scenario-refresh',
    },
    SCENARIO_ZONE: {
        REFRESH: 'scenario-zone-refresh',
    },
    TURN: {
        END: 'end-turn',
    },
};

export const REFRESH_EVENTS = {
    card: EVENTS.CARD.REFRESH,
    deck: EVENTS.DECK.REFRESH,
    hand: EVENTS.HAND.REFRESH,
    match: EVENTS.MATCH.REFRESH,
    player: EVENTS.PLAYER.REFRESH,
    playerZone: EVENTS.PLAYER_ZONE.REFRESH,
    scenario: EVENTS.SCENARIO.REFRESH,
    scenarioZone: EVENTS.SCENARIO_ZONE.REFRESH,
};