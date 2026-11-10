import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {
    customElements: {
        define() {},
    },
    mcStaticRemote: {
        getAssetUrl(path) {
            return path;
        },
    },
};
globalThis.CustomEvent ??= class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {getEndTurnConfirmationReasons} = await import(
    '../src/utils/end-turn.js'
);
const {McMatchPage} = await import('../src/pages/mc-match-page/mc-match-page.js');
const {
    MENU_OPTION_END,
    MENU_OPTION_FLIP,
    MENU_OPTION_REQUEST_PLAYER_ACTION,
    MENU_OPTION_VIEW_HAND,
} = await import(
    '../src/components/cards/characters/mc-superhero-card/mc-superhero-card.js'
);

function createPlayer({heroExhausted, allies = [], hand = []}) {
    return {
        superhero: {exhausted: heroExhausted},
        gameZone: {cards: allies},
        hand,
    };
}

const createActiveMatch = (player, playerData = {}) => ({
    phase: 'players',
    currentTurnPlayer: player,
    actionRequest: null,
    players: [{
        name: player,
        superhero: {id: 'hero-1'},
        gameZone: {cards: []},
        ...playerData,
    }],
});

describe('mc-match-page actions', () => {
    const createTwoHeroPage = () => {
        const requests = [];
        const events = [];
        const players = ['1', '2'].map(number => ({
            id: `seat-${number}`,
            userId: 'account',
            name: `Ana (${number})`,
            superhero: {
                id: `hero-${number}`,
                exhausted: false,
                abilities: [{
                    availableTargetIds: ['villain'],
                    disable: false,
                    index: 0,
                    isAttack: true,
                    isBasic: true,
                }],
            },
            gameZone: {cards: [{
                id: 'shared-ally',
                isAlly: true,
                abilities: [{
                    availableTargetIds: ['villain'],
                    disable: false,
                    index: 0,
                    isAttack: true,
                    isBasic: true,
                }],
            }]},
            deck: {id: `deck-${number}`, cards: [{}]},
            hand: [],
        }));
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            player: 'seat-1',
            match: {
                id: 'match', players, phase: 'players',
                currentTurnPlayer: 'seat-1', actionRequest: null,
            },
            apiPlayer: {
                resolveAbility: async (...args) => requests.push(['ability', ...args]),
                endTurn: async (...args) => requests.push(['end', ...args]),
                flip: async (...args) => requests.push(['flip', ...args]),
                playCard: async (...args) => requests.push(['play', ...args]),
                requestAction: async (...args) =>
                    requests.push(['request-action', ...args]),
            },
            dispatchEvent: event => events.push(event),
        });
        return {page, requests, events};
    };

    test('an automatic hero view change clears targeting state from the previous hero', () => {
        const {page} = createTwoHeroPage();
        page.player = 'seat-2';
        page.deckTargetSelection = {player: 'seat-1', cardId: 'source'};
        page.dragActivation = {player: 'seat-1'};
        page.dragPlayCard = {player: 'seat-1'};
        page.dragResourcePayment = {player: 'seat-1'};
        page.updated(new Map([['player', 'seat-1']]));
        assert.equal(page.deckTargetSelection, null);
        assert.equal(page.dragActivation, null);
        assert.equal(page.dragPlayCard, null);
        assert.equal(page.dragResourcePayment, null);
        assert.equal(page.player, 'seat-2');
        assert.equal(page.match.currentTurnPlayer, 'seat-1');
    });

    test('end-turn confirmations reject a changed selected seat instead of ending its turn', async () => {
        const {page, requests, events} = createTwoHeroPage();
        page.endTurn();
        await events.pop().detail.callback({confirmed: true});
        assert.deepEqual(requests, [['end', 'seat-1']]);
        page.endTurn();
        const confirmation = events.pop();
        page.player = 'seat-2';
        page.match.currentTurnPlayer = 'seat-2';
        assert.throws(() => confirmation.detail.callback({confirmed: true}), /ha cambiado/);
        assert.deepEqual(requests, [['end', 'seat-1']]);
        assert.equal(page.player, 'seat-2');
    });

    test('every stale menu action rejects before resolving or opening a viewer for another seat', async () => {
        for (const selected of [
            {id: 'ability-0'},
            {id: MENU_OPTION_END},
            {id: MENU_OPTION_FLIP},
            {id: MENU_OPTION_REQUEST_PLAYER_ACTION},
            {id: MENU_OPTION_VIEW_HAND},
            {id: 'view-tucked-cards'},
            {
                basicActivation: true, abilityIndex: 0,
                activationType: 'attack', targetId: 'villain',
            },
        ]) {
            const {page, requests, events} = createTwoHeroPage();
            page.handleChangeMenu({
                stopPropagation() {},
                detail: {
                    card: page.match.players[0].superhero,
                    menuOptions: [selected],
                },
            });
            const menu = events.pop();
            page.player = 'seat-2';
            page.match.currentTurnPlayer = 'seat-2';
            assert.throws(() => menu.detail.callback({selected}), /ha cambiado/);
            assert.deepEqual(requests, []);
            assert.deepEqual(events, []);
            assert.equal(page.player, 'seat-2');
        }
        const {page, requests} = createTwoHeroPage();
        await page.handleMenuOption(page.match.players[0].superhero)({
            selected: {id: 'ability-0'},
        });
        assert.deepEqual(requests, [['ability', 'seat-1', 'hero-1', 0]]);
    });

    test('requests actions and opens hands from the superhero menu with ownership checks', async () => {
        const {page, requests, events} = createTwoHeroPage();
        await page.handleMenuOption(
            page.match.players[1].superhero,
            'seat-2',
        )({
            selected: {id: MENU_OPTION_REQUEST_PLAYER_ACTION},
        });
        assert.deepEqual(requests, [
            ['request-action', 'seat-1', 'seat-2'],
        ]);

        await page.handleMenuOption(
            page.match.players[1].superhero,
            'seat-2',
        )({
            selected: {id: MENU_OPTION_VIEW_HAND},
        });
        assert.equal(events.at(-1).type, 'view-player-hand');
        assert.deepEqual(events.at(-1).detail, {playerId: 'seat-2'});

        page.match.players[1].userId = 'another-account';
        await page.handleMenuOption(
            page.match.players[1].superhero,
            'seat-2',
        )({
            selected: {id: MENU_OPTION_VIEW_HAND},
        });
        assert.equal(events.length, 1);
    });

    test('places hand and action options on the panel opposite the active controlled hero', async () => {
        const {page, requests, events} = createTwoHeroPage();
        page.match.currentTurnPlayer = 'seat-2';

        assert.equal(page.activePlayerId, 'seat-2');
        assert.equal(page.canViewPlayerHand('seat-1'), true);
        assert.equal(page.canViewPlayerHand('seat-2'), false);

        await page.handleMenuOption(
            page.match.players[0].superhero,
            'seat-1',
        )({
            selected: {id: MENU_OPTION_REQUEST_PLAYER_ACTION},
        });
        await page.handleMenuOption(
            page.match.players[0].superhero,
            'seat-1',
        )({
            selected: {id: MENU_OPTION_VIEW_HAND},
        });

        assert.deepEqual(requests, [
            ['request-action', 'seat-2', 'seat-1'],
        ]);
        assert.deepEqual(events.at(-1).detail, {playerId: 'seat-1'});
    });

    test('basic confirmations preserve hero and ally actors and never save another seat preference', async () => {
        for (const useAlly of [false, true]) {
            const {page, requests, events} = createTwoHeroPage();
            let saved = 0;
            page.shouldSkipBasicActivationConfirmation = () => false;
            page.rememberBasicActivationConfirmationChoice = () => saved++;
            const player = page.match.players[0];
            const actor = useAlly ? player.gameZone.cards[0] : player.superhero;
            const card = {id: 'villain'};
            const option = {
                basicActivation: true, abilityIndex: 0,
                activationType: 'attack', targetId: 'villain',
            };
            page.handleBasicActivationSelection(card, option, actor);
            const validConfirmation = events.pop();
            assert.equal(validConfirmation.detail.basicActivation.activator, actor);
            await validConfirmation.detail.callback({confirmed: true});
            assert.deepEqual(requests, [['ability', 'seat-1', actor.id, 0, 'villain']]);
            page.handleBasicActivationSelection(card, option, actor);
            const staleConfirmation = events.pop();
            page.player = 'seat-2';
            page.match.currentTurnPlayer = 'seat-2';
            assert.throws(() => staleConfirmation.detail.callback({
                confirmed: true, skipBasicActivationConfirmation: true,
            }), /ha cambiado/);
            assert.equal(saved, 0);
            assert.equal(requests.length, 1);
            assert.equal(page.player, 'seat-2');
        }
    });

    test('deck target selections bind the initiating seat and report stale selection', async () => {
        const {page, requests, events} = createTwoHeroPage();
        const card = {
            id: 'deck-action',
            abilities: [{
                targetSelectionMode: 'deck',
                availableTargetIds: ['deck-1', 'deck-2'],
            }],
        };
        page.resolveAbilityOrSelectDeck(card, 0);
        assert.equal(page.deckTargetSelection.player, 'seat-1');
        await page.handleDeckTargetSelect({
            stopPropagation() {}, detail: {deckId: 'deck-2'},
        });
        assert.deepEqual(requests, [['ability', 'seat-1', 'deck-action', 0, 'deck-2']]);
        page.resolveAbilityOrSelectDeck(card, 0);
        page.player = 'seat-2';
        page.match.currentTurnPlayer = 'seat-2';
        await page.handleDeckTargetSelect({
            stopPropagation() {}, detail: {deckId: 'deck-2'},
        });
        assert.equal(requests.length, 1);
        assert.equal(page.deckTargetSelection, null);
        assert.equal(events.pop().type, 'communication-error');
        assert.equal(page.player, 'seat-2');
    });

    test('switches owned hero independently of the turn and clears transient targeting', () => {
        const players = [
            {id: 'seat-1', userId: 'account'},
            {id: 'seat-2', userId: 'account'},
            {id: 'guest', userId: 'guest-account'},
        ];
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            player: 'seat-1',
            match: {players, phase: 'players', currentTurnPlayer: 'seat-1'},
            dragActivation: {actor: 'old'},
            dragPlayCard: {cardId: 'old'},
            dragResourcePayment: {card: 'old'},
            clearDeckTargetSelection() { this.deckTargetSelection = null; },
        });
        let stopped = false;
        const event = {
            detail: {player: 'seat-2'},
            stopPropagation() { stopped = true; },
        };
        page.handleSelectControlledPlayer(event);
        assert.equal(page.player, 'seat-2');
        assert.equal(page.match.currentTurnPlayer, 'seat-1');
        assert.equal(page.canInteract, false);
        assert.equal(page.dragActivation, null);
        assert.equal(page.dragPlayCard, null);
        assert.equal(page.dragResourcePayment, null);
        assert.equal(stopped, false);
        page.match.currentTurnPlayer = 'seat-2';
        assert.equal(page.canInteract, true);
        page.match.phase = 'villain';
        event.detail.player = 'seat-1';
        page.handleSelectControlledPlayer(event);
        assert.equal(page.player, 'seat-1');
        event.detail.player = 'guest';
        page.handleSelectControlledPlayer(event);
        assert.equal(page.player, 'seat-1');
        assert.equal(stopped, true);
    });

    test('refreshes the owning hero hand and zone even while another hero is selected', () => {
        const players = [
            {
                id: 'seat-1', userId: 'account', name: 'Ana (1)',
                hand: [{id: 'first-card'}],
                gameZone: {id: 'zone-1', cards: [], minions: []},
            },
            {
                id: 'seat-2', userId: 'account', name: 'Ana (2)',
                hand: [{id: 'second-card'}],
                gameZone: {id: 'zone-2', cards: [], minions: []},
            },
        ];
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            player: 'seat-1',
            match: {players},
            dispatchEvent() {},
        });
        const hand = [{id: 'new-second-card'}];
        page.updateHand({playerId: 'seat-2', hand});
        assert.deepEqual(page.match.players[0].hand, [{id: 'first-card'}]);
        assert.equal(page.match.players[1].hand, hand);
        const zone = {id: 'zone-2', cards: [{id: 'support'}], minions: []};
        page.updatePlayerZone(zone);
        assert.equal(page.match.players[1].gameZone, zone);
        assert.equal(page.match.players[0].gameZone, players[0].gameZone);
    });

    test('refreshes an unselected hero card using its identity, not the selected seat name', () => {
        const players = ['1', '2'].map(number => ({
            id: `seat-${number}`, userId: 'account', name: `Ana (${number})`,
            superhero: {id: `hero-${number}`, life: 10},
            gameZone: {id: `zone-${number}`, cards: [], minions: []},
        }));
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            player: 'seat-1',
            match: {players, scenario: {zones: [], gameZone: {cards: []}}},
            dispatchEvent() {},
        });
        const card = {id: 'hero-2', life: 7};

        assert.equal(page.updateCard(card), true);
        assert.equal(page.match.players[1].superhero, card);
        assert.equal(page.match.players[0].superhero.life, 10);
        assert.equal(page.player, 'seat-1');
    });

    test('routes actions from the visible owned hero through that seat to cross-board targets', async () => {
        const {page, requests} = createTwoHeroPage();
        page.match.currentTurnPlayer = 'seat-2';

        await page.handleAbility({
            detail: {
                card: page.match.players[1].superhero,
                ability: 0,
                playerId: 'seat-2',
            },
        });
        await page.handlePlayCardDrop({
            detail: {
                card: {id: 'targeted-event', playable: true},
                targetId: 'guest-player',
                playerId: 'seat-2',
            },
        });

        assert.deepEqual(requests, [
            ['ability', 'seat-2', 'hero-2', 0],
            ['play', 'seat-2', 'targeted-event', 'guest-player'],
        ]);
        assert.equal(page.player, 'seat-1');
        assert.equal(page.match.currentTurnPlayer, 'seat-2');
    });

    test('uses the controller seat when two heroes have cards with the same printed ID', () => {
        const players = ['1', '2'].map(number => ({
            id: `seat-${number}`, userId: 'account', name: `Ana (${number})`,
            superhero: {id: `hero-${number}`},
            gameZone: {
                id: `zone-${number}`, minions: [],
                cards: [{id: 'shared-support', exhausted: false}],
            },
        }));
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            player: 'seat-1',
            match: {players, scenario: {zones: [], gameZone: {cards: []}}},
            dispatchEvent() {},
        });
        const card = {id: 'shared-support', playerId: 'seat-2', exhausted: true};

        assert.equal(page.updateCard(card), true);
        assert.equal(page.match.players[0].gameZone.cards[0].exhausted, false);
        assert.equal(page.match.players[1].gameZone.cards[0], card);
    });

    test('passes the local player as the default board when another player accepts a request', () => {
        const local = {name: 'Local', userId: 'local'};
        const other = {name: 'Otro', userId: 'other'};
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            player: 'local',
            match: {
                phase: 'players',
                currentTurnPlayer: 'local',
                players: [local, other],
                actionRequest: {targetId: 'other', status: 'accepted'},
            },
        });
        const template = page.render();
        const boardIndex = template.strings.findIndex(part =>
            part.includes('.boardPlayer="'));
        assert.notEqual(boardIndex, -1);
        assert.equal(template.values[boardIndex], local);
    });

    test('passes the dialog target separately from the active player board', () => {
        const players = [
            {id: 'seat-1', userId: 'local'},
            {id: 'seat-2', userId: 'local'},
        ];
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            dialogBoardPlayerId: 'seat-2',
            match: {
                phase: 'players',
                currentTurnPlayer: 'seat-1',
                players,
                actionRequest: null,
            },
            player: 'seat-1',
        });
        const template = page.render();
        const dialogBoardIndex = template.strings.findIndex(part =>
            part.includes('.dialogBoardPlayerId='));

        assert.notEqual(dialogBoardIndex, -1);
        assert.equal(template.values[dialogBoardIndex], 'seat-2');
    });

    test('an accepted request permits Actions but blocks own-turn options, clicks and drags', async () => {
        const requests = [];
        const errors = [];
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            player: 'requested',
            match: {
                ...createActiveMatch('requested'),
                currentTurnPlayer: 'current',
                actionRequest: {
                    target: 'requested',
                    requester: 'current',
                    status: 'accepted',
                },
            },
            apiPlayer: {
                flip: async () => requests.push('flip'),
                resolveAbility: async (...args) => requests.push(args),
                playCard: async (...args) => requests.push(args),
            },
            dispatchEvent: event => errors.push(event),
        });
        const actor = {id: 'hero', abilities: [
            {isBasic: true, isAction: false},
            {isAction: true},
        ]};
        const permanent = {id: 'support', isSupport: true, playable: true};
        const event = {id: 'event', isEvent: true, playable: true, abilities: [
            {isAction: true},
        ]};

        assert.equal(page.canInteract, true);
        assert.equal(page.canUseOwnTurnOptions, false);
        await page.flipSuperhero();
        assert.throws(() => page.resolveAbilityOrSelectDeck(actor, 0), /Acción/);
        await page.handleSelectCardHand({detail: {card: permanent}});
        page.handlePlayCardDragStart({detail: {card: permanent}});
        assert.equal(page.dragPlayCard, undefined);
        page.handleActivationDragStart({detail: {
            actor,
            options: [{abilityIndex: 0}, {abilityIndex: 1}],
        }});
        assert.deepEqual(page.dragActivation.options, [{abilityIndex: 1}]);
        assert.equal(requests.length, 0);
        assert.equal(errors[0].type, 'communication-error');

        await page.resolveAbilityOrSelectDeck(actor, 1);
        await page.handleSelectCardHand({detail: {card: event}});
        page.handlePlayCardDragStart({detail: {card: event}});
        assert.equal(page.dragPlayCard.cardId, event.id);
        assert.deepEqual(requests, [
            ['requested', actor.id, 1],
            ['requested', event.id, undefined],
        ]);
    });

    test('explains each reason that requires end-turn confirmation', () => {
        assert.deepEqual(
            getEndTurnConfirmationReasons(createPlayer({
                heroExhausted: false,
                allies: [
                    {isAlly: true, exhausted: false},
                    {isAlly: true, exhausted: true},
                ],
                hand: [
                    {id: 'playable-card', playable: true},
                    {id: 'unplayable-card', playable: false},
                ],
            })),
            [
                'Tu superhéroe está preparado.',
                'Tienes 1 aliado preparado.',
                'Tienes 1 carta jugable en la mano.',
            ]
        );
    });

    test('does not include unplayable cards as a confirmation reason when another reason is present', () => {
        assert.deepEqual(getEndTurnConfirmationReasons(createPlayer({
            heroExhausted: true,
            allies: [{isAlly: true, exhausted: false}],
            hand: [{id: 'unplayable-card', playable: false}],
        })), [
            'Tienes 1 aliado preparado.',
        ]);
    });

    test('does not confirm when the hero and allies are exhausted and the hand is empty', () => {
        const player = createPlayer({
            heroExhausted: true,
            allies: [
                {isAlly: true, exhausted: true},
                {isAlly: false, exhausted: false},
            ],
        });

        assert.deepEqual(getEndTurnConfirmationReasons(player), []);
    });

    test('ignores unplayable cards when the hero and allies are exhausted', () => {
        const player = createPlayer({
            heroExhausted: true,
            allies: [{isAlly: true, exhausted: true}],
            hand: [
                {id: 'unplayable-event', playable: false},
                {id: 'resource-card', playable: false},
            ],
        });

        assert.deepEqual(getEndTurnConfirmationReasons(player), []);
    });

    test('forwards a dropped event target to the play-card request', async () => {
        const requests = [];
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            apiPlayer: {
                async playCard(...params) {
                    requests.push(params);
                },
            },
            match: createActiveMatch('TChalla'),
            player: 'TChalla',
            playCardPending: false,
        });

        await page.handlePlayCardDrop({
            detail: {
                card: {id: 'damage-event'},
                targetCard: {id: 'villain-1'},
            },
        });

        assert.deepEqual(requests, [['TChalla', 'damage-event', 'villain-1']]);
        assert.equal(page.playCardPending, false);
    });

    test('routes a dropped attack from the owned secondary hero to another player zone', async () => {
        const requests = [];
        const upgrade = {
            abilities: [{
                availableTargetIds: ['minion-1'],
                disable: false,
                index: 1,
                isAction: true,
                isAttack: true,
                isBasic: false,
                isThwart: false,
                name: 'Disparar',
            }],
            id: 'energy-channel',
            isUpgrade: true,
        };
        const players = [
            {id: 'seat-1', userId: 'account'},
            {
                id: 'seat-2',
                userId: 'account',
                superhero: {id: 'hero-2'},
                gameZone: {cards: [upgrade]},
            },
            {
                id: 'guest',
                userId: 'guest-account',
                gameZone: {minions: [{id: 'minion-1'}]},
            },
        ];
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            apiPlayer: {
                async resolveAbility(...params) {
                    requests.push(params);
                },
            },
            match: {
                phase: 'players',
                currentTurnPlayer: 'seat-2',
                actionRequest: null,
                players,
            },
            player: 'seat-1',
        });

        await page.handleBasicActivation({
            stopPropagation() {},
            detail: {
                actor: upgrade,
                card: {id: 'minion-1'},
                option: {
                    abilityIndex: 1,
                    activationType: 'attack',
                    targetId: 'minion-1',
                },
                playerId: 'seat-2',
            },
        });

        assert.deepEqual(requests, [
            ['seat-2', 'energy-channel', 1, 'minion-1'],
        ]);
        assert.equal(page.player, 'seat-1');
    });

    test('resolves a basic attack from the secondary hero against a minion in another zone', async () => {
        const requests = [];
        const players = [
            {id: 'seat-1', userId: 'account'},
            {
                id: 'seat-2',
                userId: 'account',
                superhero: {
                    id: 'hero-2',
                    abilities: [{
                        availableTargetIds: ['minion-1'],
                        disable: false,
                        index: 0,
                        isAttack: true,
                        isBasic: true,
                    }],
                },
            },
            {
                id: 'guest',
                userId: 'guest-account',
                gameZone: {minions: [{id: 'minion-1'}]},
            },
        ];
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            apiPlayer: {
                async resolveAbility(...params) {
                    requests.push(params);
                },
            },
            match: {
                phase: 'players',
                currentTurnPlayer: 'seat-2',
                actionRequest: null,
                players,
            },
            player: 'seat-1',
            shouldSkipBasicActivationConfirmation: () => true,
        });

        await page.handleBasicActivation({
            stopPropagation() {},
            detail: {
                actor: players[1].superhero,
                card: {id: 'minion-1'},
                option: {
                    basicActivation: true,
                    abilityIndex: 0,
                    activationType: 'attack',
                    targetId: 'minion-1',
                },
                playerId: 'seat-2',
            },
        });

        assert.deepEqual(requests, [['seat-2', 'hero-2', 0, 'minion-1']]);
    });

    test('resolves a dropped resource payment without opening a payment dialog', async () => {
        const requests = [];
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            apiPlayer: {
                async resolveAbility(...params) {
                    requests.push(params);
                },
            },
            match: createActiveMatch('Carol'),
            player: 'Carol',
        });

        await page.handleResourcePaymentDrop({
            detail: {
                card: {id: 'energy-card'},
                option: {
                    abilityIndex: 0,
                    cardId: 'energy-card',
                    source: 'hand',
                },
                targetCard: {id: 'energy-channel'},
            },
        });

        assert.deepEqual(requests, [
            [
                'Carol',
                'energy-channel',
                0,
                undefined,
                {
                    cardId: 'energy-card',
                    source: 'hand',
                },
            ],
        ]);
    });

    test('allows ordinary actions only during the local player turn or an accepted action request', () => {
        const page = Object.assign(Object.create(McMatchPage.prototype), {
            match: {
                phase: 'players',
                currentTurnPlayer: 'Carol',
                actionRequest: null,
            },
            player: 'Peter',
        });
        const actionEvent = {
            isEvent: true,
            abilities: [{isAction: true}],
        };

        assert.equal(page.canInteract, false);
        assert.equal(page.canPlayCard(actionEvent), false);

        page.match.actionRequest = {
            requester: 'Carol',
            target: 'Peter',
            status: 'accepted',
        };
        assert.equal(page.canInteract, true);
        assert.equal(page.canPlayCard(actionEvent), true);

        page.match.actionRequest.status = 'pending';
        assert.equal(page.canInteract, false);
        assert.equal(page.canPlayCard(actionEvent), false);
    });

    test('allows the requested controlled hero to use only Action cards and abilities', async () => {
        const {page, requests} = createTwoHeroPage();
        page.match.actionRequest = {
            requester: 'seat-1',
            targetId: 'seat-2',
            status: 'accepted',
        };
        const actionEvent = {
            id: 'action-event',
            isEvent: true,
            abilities: [{isAction: true}],
        };
        const permanent = {id: 'support', isSupport: true};
        const actionCard = {
            id: 'action-card',
            abilities: [{isAction: true}],
        };
        const basicCard = {
            id: 'basic-card',
            abilities: [{isBasic: true}],
        };

        assert.equal(page.canInteractFor('seat-2'), true);
        assert.equal(page.canPlayCard(actionEvent, 'seat-2'), true);
        assert.equal(page.canPlayCard(permanent, 'seat-2'), false);
        assert.equal(page.canActivateAbility(actionCard, 0, 'seat-2'), true);
        assert.equal(page.canActivateAbility(basicCard, 0, 'seat-2'), false);

        await page.handleSelectCardHand({
            detail: {card: actionEvent, playerId: 'seat-2'},
        });
        await page.resolveAbilityOrSelectDeck(actionCard, 0, 'seat-2');

        assert.deepEqual(requests, [
            ['play', 'seat-2', 'action-event', undefined],
            ['ability', 'seat-2', 'action-card', 0],
        ]);
    });

    test('routes action-request acceptance and completion to the controlled target seat', async () => {
        const {page, requests} = createTwoHeroPage();
        page.match.actionRequest = {
            targetId: 'seat-2',
            status: 'pending',
        };
        page.apiPlayer.respondToActionRequest = async (...args) =>
            requests.push(['respond', ...args]);
        page.apiPlayer.completeRequestedAction = async (...args) =>
            requests.push(['complete', ...args]);

        await page.handleRespondPlayerAction({
            detail: {accept: true, playerId: 'seat-1'},
        });
        await page.handleRespondPlayerAction({
            detail: {accept: true, playerId: 'seat-2'},
        });
        page.match.actionRequest.status = 'accepted';
        await page.handleCompletePlayerAction({
            detail: {playerId: 'seat-2'},
        });

        assert.deepEqual(requests, [
            ['respond', 'seat-2', true],
            ['complete', 'seat-2'],
        ]);
    });

    test('table consultation disables both game actions and action requests', async () => {
        const {page, requests} = createTwoHeroPage();
        page.tableConsultationMode = true;

        assert.equal(page.canInteract, false);
        assert.equal(page.canRequestAction, false);
        assert.equal(page.canUseOwnTurnOptions, false);

        await page.handleRequestPlayerAction({
            detail: {targetPlayer: 'seat-2'},
        });
        assert.deepEqual(requests, []);
    });

    test('requests an action as the controlled hero taking the turn on the secondary board', async () => {
        const {page, requests} = createTwoHeroPage();
        page.match.players.push({id: 'guest', userId: 'other-account'});
        page.match.currentTurnPlayer = 'seat-2';

        assert.equal(page.canRequestAction, true);
        await page.handleRequestPlayerAction({
            detail: {targetPlayer: 'guest'},
        });

        assert.deepEqual(requests, [
            ['request-action', 'seat-2', 'guest'],
        ]);
    });
});
