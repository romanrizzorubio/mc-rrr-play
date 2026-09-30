export const endpoints = {
    card: {
        refresh: 'card-refresh',
    },
    deck: {
        refresh: 'deck-refresh',
    },
    dialog: {
        open: 'open-dialog',
        response: 'dialog-response',
    },
    hand: {
        refresh: 'hand-refresh',
    },
    match: {
        create: 'create-match',
        created: 'match-created',
        getHeroesList: 'get-heroes-list',
        getScenariosList: 'get-scenarios-list',
        init: 'init-match',
        refresh: 'match-refresh',
    },
    player: {
        create: 'create-player',
        created: 'player-created',
        flip: 'player-flip',
        refresh: 'player-refresh',
        playCard: 'play-card',
        resolveAbility: 'resolve-ability',
    },
    playerZone: {
        refresh: 'player-zone-refresh',
    },
    round: {
        end: 'round-end',
    },
    scenario: {
        create: 'create-scenario',
        created: 'scenario-created',
        refresh: 'scenario-refresh',
    },
    scenarioZone: {
        refresh: 'scenario-zone-refresh',
    },
    turn: {
        end: 'end-turn',
    }
};