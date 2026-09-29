export const endpoints = {
    card: {
        defeat: 'card-defeat',
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
        create: '/create-match',
        getHeroesList: '/get-heroes-list',
        getScenariosList: '/get-scenarios-list',
        init: '/init-match',
        refresh: 'match-refresh',
    },
    player: {
        create: '/create-player',
        defeat: 'defeat-player',
        flip: '/player-flip',
        refresh: 'player-refresh',
        playCard: '/play-card',
        resolveAbility: '/resolve-ability',
    },
    playerZone: {
        refresh: 'player-zone-refresh',
    },
    round: {
        end: 'round-end',
    },
    scenario: {
        create: '/create-scenario',
        defeat: 'defeat-scenario',
        refresh: 'scenario-refresh',
    },
    scenarioZone: {
        refresh: 'scenario-zone-refresh',
    },
    turn: {
        end: 'end-turn',
    }
}