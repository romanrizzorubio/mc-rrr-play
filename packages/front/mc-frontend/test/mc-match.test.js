import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {describe, test} from 'node:test';
import {PartType} from 'lit/directive.js';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {};
globalThis.window.customElements ??= {define() {}};
globalThis.window.mcStaticRemote ??= {
    getAssetUrl: path => `/static/${path}`,
};
globalThis.CustomEvent ??= class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {HandComponent: McCardList} = await import(
    '../src/components/cards/mc-card-list/mc-card-list.js'
);
const {CardComponent} = await import(
    '../src/components/cards/mc-card/mc-card.js'
);
const {MatchComponent} = await import(
    '../src/components/views/mc-match/mc-match.js'
);
const {McPlayer} = await import(
    '../src/components/match/mc-player/mc-player.js'
);
const {SuperheroCardComponent} = await import(
    '../src/components/cards/characters/mc-superhero-card/mc-superhero-card.js'
);
const {BACK_CARD_PLAYER} = await import('../src/misc/cards.js');
const {MENU_OPTION_VIEW_TUCKED_CARDS} = await import('../src/misc/card-menu.js');
const [
    matchStyles,
    playerStyles,
    superheroCardStyles,
    scenarioStyles,
    cardStyles,
    deckStyles,
    gameZoneStyles,
] =
    await Promise.all([
        'views/mc-match/mc-match.css.js',
        'match/mc-player/mc-player.css.js',
        'cards/characters/mc-superhero-card/mc-superhero-card.css.js',
        'match/mc-scenario/mc-scenarios.css.js',
        'cards/mc-card/mc-card.css.js',
        'panels/mc-deck/mc-deck.css.js',
        'panels/mc-game-zone/mc-game-zone.css.js',
    ].map(path => readFile(
        new URL(`../src/components/${path}`, import.meta.url),
        'utf8',
    )));
const firstPlayerToken = await readFile(
    new URL('../../mc-static/src/assets/images/first-player-token.svg', import.meta.url),
    'utf8',
);
const matchPageStyles = await readFile(
    new URL('../src/pages/mc-match-page/mc-match-page.css.js', import.meta.url),
    'utf8',
);

function templateText(value) {
    if (Array.isArray(value)) {
        return value.map(templateText).join('');
    }
    if (typeof value === 'string' || typeof value === 'number') {
        return String(value);
    }
    if (value?.strings && value?.values) {
        return value.strings.reduce((result, part, index) =>
            `${result}${part}${templateText(value.values[index])}`,
        '');
    }

    return '';
}

describe('multiplayer player boards', () => {
    test('switches owned heroes on the first summary click regardless of a reused row being open', () => {
        const players = [
            {id: 'seat-1', userId: 'account', name: 'Ana (1)', superhero: {image: 'one.png'}},
            {id: 'seat-2', userId: 'account', name: 'Ana (2)', superhero: {image: 'two.png'}},
        ];
        const selected = [];
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: players[0], focusedPlayerId: '', match: {players, currentTurnPlayer: 'guest'},
            dispatchEvent(event) {
                selected.push(event.detail.player);
                this.player = players.find(player => player.id === event.detail.player);
            },
        });
        for (const open of [true, false, true, false]) {
            const expectedPlayer = players.find(player => player !== component.player);
            const template = component.renderPlayerAccordions();
            const entry = template.values.find(Array.isArray)[0];
            const clickIndex = entry.strings.findIndex(part => part.endsWith('@click="'));
            const event = {
                defaultPrevented: false,
                currentTarget: {parentElement: {open}},
                preventDefault() { this.defaultPrevented = true; },
            };
            entry.values[clickIndex](event);
            assert.equal(event.defaultPrevented, true);
            assert.equal(component.player.id, expectedPlayer.id);
            assert.equal(component.displayedPlayer.id, expectedPlayer.id);
            assert.equal(component.match.currentTurnPlayer, 'guest');
        }
        assert.deepEqual(selected, ['seat-2', 'seat-1', 'seat-2', 'seat-1']);
    });

    test('resets an open reused row using its live DOM state rather than its previous binding', () => {
        const players = [
            {id: 'seat-1', userId: 'account', superhero: {image: 'one.png'}},
            {id: 'seat-2', userId: 'account', superhero: {image: 'two.png'}},
        ];
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: players[0], focusedPlayerId: '', match: {players},
        });
        const entry = component.renderPlayerAccordions().values.find(Array.isArray)[0];
        const openIndex = entry.strings.findIndex(part => part.endsWith('.open="'));
        const binding = entry.values[openIndex];
        const part = {
            type: PartType.PROPERTY, name: 'open', element: {open: true},
        };
        const directive = new binding._$litDirective$(part);
        assert.equal(directive.update(part, binding.values), false);
    });

    test('shows the controlled dialog target board temporarily without changing the active player', () => {
        const players = [
            {id: 'seat-1', userId: 'account'},
            {id: 'seat-2', userId: 'account'},
        ];
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            boardPlayer: players[0],
            dialogBoardPlayerId: 'seat-2',
            focusedPlayerId: '',
            interactive: true,
            match: {players},
            player: players[0],
        });

        assert.equal(component.displayedPlayer, players[1]);
        assert.equal(component.boardInteractive, false);
        assert.equal(component.player, players[0]);

        component.dialogBoardPlayerId = '';
        assert.equal(component.displayedPlayer, players[0]);
        assert.equal(component.boardInteractive, true);
    });

    test('leaves foreign-player accordion opening and closing to the native toggle', () => {
        const players = [
            {id: 'local', userId: 'account'},
            {id: 'guest', userId: 'another-account'},
        ];
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: players[0], focusedPlayerId: '', match: {players},
        });
        component.handlePlayerSummaryClick({
            preventDefault() { assert.fail('foreign accordions must still toggle normally'); },
        }, 'guest');
        assert.equal(component.displayedPlayer.id, 'local');
        component.handlePlayerAccordionToggle({currentTarget: {open: true}}, 'guest');
        assert.equal(component.displayedPlayer.id, 'guest');
        component.handlePlayerAccordionToggle({currentTarget: {open: false}}, 'guest');
        assert.equal(component.displayedPlayer.id, 'local');
    });

    test('hides the player list for a single hero but shows it for two heroes of one account', () => {
        const players = [
            {id: 'seat-1', userId: 'account', name: 'Ana (1)', superhero: {image: 'one.png'}},
            {id: 'seat-2', userId: 'account', name: 'Ana (2)', superhero: {image: 'two.png'}},
        ];
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: players[0],
            focusedPlayerId: '',
            match: {players: [players[0]]},
        });
        assert.equal(component.renderPlayerAccordions(), '');
        component.match.players = players;
        assert.match(templateText(component.renderPlayerAccordions()), /aria-label="Jugadores"/u);
        assert.match(templateText(component.renderPlayerAccordions()), /Ana \(2\) \(tú\)/u);
    });

    test('hides the local player name from the board heading and sidebar', () => {
        const players = [
            {id: 'local', name: 'Local', superhero: {image: 'local.png'}},
            {id: 'guest', name: 'Invitado', superhero: {image: 'guest.png'}},
        ];
        const component = Object.assign(new MatchComponent(), {
            player: players[0],
            focusedPlayerId: '',
            match: {players},
        });

        assert.equal(component.renderPlayerHeading(), '');
        assert.doesNotMatch(
            templateText(component.renderPlayerAccordions()),
            /Local \(tú\)/u,
        );

        component.focusedPlayerId = 'guest';
        assert.match(templateText(component.renderPlayerHeading()), /Invitado/u);
    });

    test('collapses the player panel to a Ver jugadores control and reopens it', () => {
        const initializedComponent = new MatchComponent();
        assert.equal(initializedComponent.playersPanelOpen, false);

        const players = [
            {id: 'seat-1', userId: 'account', name: 'Ana (1)', superhero: {image: 'one.png'}},
            {id: 'seat-2', userId: 'account', name: 'Ana (2)', superhero: {image: 'two.png'}},
        ];
        const component = Object.assign(initializedComponent, {
            player: players[0],
            focusedPlayerId: '',
            match: {players},
            playersPanelOpen: false,
        });

        let panel = component.renderPlayerAccordions();
        let expandedIndex = panel.strings.findIndex(part => part.includes('aria-expanded="'));
        let hiddenIndex = panel.strings.findIndex(part => part.includes('?hidden="'));
        const collapsedMarkup = templateText(panel);
        assert.equal(panel.values[expandedIndex], false);
        assert.equal(panel.values[hiddenIndex], true);
        assert.match(collapsedMarkup, /Ver jugadores/u);
        assert.match(collapsedMarkup, /player-sidebar-chevron/u);

        component.togglePlayersPanel();
        panel = component.renderPlayerAccordions();
        expandedIndex = panel.strings.findIndex(part => part.includes('aria-expanded="'));
        hiddenIndex = panel.strings.findIndex(part => part.includes('?hidden="'));
        assert.equal(panel.values[expandedIndex], true);
        assert.equal(panel.values[hiddenIndex], false);
        assert.doesNotMatch(templateText(panel), /Ver jugadores/u);
        assert.match(templateText(panel), /<h2>Jugadores<\/h2>/u);

        component.togglePlayersPanel();
        panel = component.renderPlayerAccordions();
        expandedIndex = panel.strings.findIndex(part => part.includes('aria-expanded="'));
        hiddenIndex = panel.strings.findIndex(part => part.includes('?hidden="'));
        assert.equal(panel.values[expandedIndex], false);
        assert.equal(panel.values[hiddenIndex], true);
        assert.match(templateText(panel), /Ver jugadores/u);
        assert.match(templateText(panel), /player-sidebar collapsed/u);
    });

    test('selecting an owned hero changes the controlling seat without changing the turn', () => {
        const players = [
            {id: 'seat-1', userId: 'account'},
            {id: 'seat-2', userId: 'account'},
            {id: 'guest', userId: 'guest-account'},
        ];
        const events = [];
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: players[0],
            focusedPlayerId: '',
            match: {players, currentTurnPlayer: 'guest'},
            dispatchEvent: event => events.push(event),
        });

        component.handlePlayerAccordionToggle({currentTarget: {open: true}}, 'seat-2');
        assert.equal(events[0].type, 'select-controlled-player');
        assert.deepEqual(events[0].detail, {player: 'seat-2'});
        assert.equal(component.focusedPlayerId, '');
        assert.equal(component.match.currentTurnPlayer, 'guest');
        component.player = players[1];
        assert.equal(component.displayedPlayer, players[1]);
        const hand = component.renderHand();
        const cardsIndex = hand.strings.findIndex(part => part.includes('.cards="'));
        players[1].hand = [{id: 'second-hand'}];
        assert.deepEqual(component.renderHand().values[cardsIndex], players[1].hand);

        component.showPlayerBoard('guest');
        assert.equal(component.displayedPlayer, players[2]);
        assert.equal(events.length, 1);
    });

    test('keeps the selected owned hero when the turn or phase changes', () => {
        const players = [
            {id: 'seat-1', userId: 'account'},
            {id: 'seat-2', userId: 'account'},
        ];
        const previousMatch = {
            id: 'match', players, phase: 'players', currentTurnPlayer: 'seat-1',
        };
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: players[1],
            focusedPlayerId: '',
            match: {...previousMatch, currentTurnPlayer: 'seat-2'},
        });
        component.updated(new Map([['match', previousMatch]]));
        assert.equal(component.displayedPlayer, players[1]);
        const playerPhase = component.match;
        component.match = {...playerPhase, phase: 'villain', currentTurnPlayer: ''};
        component.updated(new Map([['match', playerPhase]]));
        assert.equal(component.displayedPlayer, players[1]);
    });

    test('requests an action from another owned hero without selecting its board', () => {
        const events = [];
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: {id: 'seat-1', userId: 'account'},
            focusedPlayerId: '',
            canRequestAction: true,
            actionRequest: null,
            match: {players: [
                {id: 'seat-1', userId: 'account', name: 'Ana (1)'},
                {
                    id: 'seat-2', userId: 'account', name: 'Ana (2)',
                    superhero: {image: 'two.png'},
                },
            ]},
            dispatchEvent: event => events.push(event),
        });

        test('consultation mode blocks gameplay menus but opens tucked-card inspection', () => {
            const events = [];
            const player = {id: 'seat-1', userId: 'account'};
            const component = Object.assign(Object.create(MatchComponent.prototype), {
                player,
                boardPlayer: player,
                dialogBoardPlayerId: '',
                tableConsultationMode: true,
                interactive: false,
                focusedPlayerId: '',
                match: {players: [player], scenario: {}},
                actionRequest: {
                    status: 'pending',
                    targetId: 'seat-1',
                    requester: 'Other',
                },
                dispatchEvent: event => events.push(event),
            });
            let stopped = false;
            component.guardBoardInteraction({
                type: 'change-menu',
                detail: {
                    card: {
                        id: 'host',
                        tuckedCards: [{id: 'tucked-card'}],
                    },
                    menuOptions: [
                        {id: 'attack'},
                        {id: MENU_OPTION_VIEW_TUCKED_CARDS},
                    ],
                },
                stopPropagation() {
                    stopped = true;
                },
            });

            assert.equal(stopped, true);
            assert.equal(events.length, 1);
            assert.equal(events[0].type, 'view-tucked-cards');
            assert.equal(events[0].detail.cards[0].id, 'tucked-card');
            assert.equal(component.renderActionRequest(), '');
            assert.match(templateText(component.renderScenario()), /class="consultation"/u);
        });
        const markup = templateText(component.renderPlayerAccordions());
        assert.ok(markup.indexOf('Pedir una acción') > markup.indexOf('</details>'));
        let prevented = false;
        let stopped = false;
        component.requestControlledPlayerAction({
            preventDefault() { prevented = true; },
            stopPropagation() { stopped = true; },
        }, 'seat-2');
        assert.equal(prevented, true);
        assert.equal(stopped, true);
        assert.equal(component.player.id, 'seat-1');
        assert.equal(component.focusedPlayerId, '');
        assert.deepEqual(events[0].detail, {targetPlayer: 'seat-2'});
    });

    test('never shows turn labels or highlights in the board or player list', () => {
        const players = ['local', 'guest'].map(id => ({
            id, name: 'Jugador',
            superhero: {image: `${id}.png`},
        }));
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: players[0],
            focusedPlayerId: '',
            match: {
                playing: true,
                phase: 'players',
                currentTurnPlayer: 'local',
                players,
            },
        });
        assert.doesNotMatch(templateText(component.renderPlayer()), /Tu turno|current-turn/u);
        assert.doesNotMatch(templateText(component.renderPlayerAccordions()), /Tu turno|En turno|turn-indicator/u);
        assert.doesNotMatch(templateText(component.renderPlayerAccordions()), /current-turn/u);

        component.match = {...component.match, currentTurnPlayer: 'guest'};
        assert.doesNotMatch(templateText(component.renderPlayer()), /turn-indicator/u);
        const list = templateText(component.renderPlayerAccordions());
        assert.doesNotMatch(list, /current-turn/u);
        assert.doesNotMatch(list, /Tu turno|En turno|turn-indicator/u);

        component.player = players[1];
        assert.doesNotMatch(templateText(component.renderPlayer()), /Tu turno|current-turn/u);
        assert.doesNotMatch(templateText(component.renderPlayerAccordions()), /Tu turno|En turno|turn-indicator/u);
        component.match.phase = 'villain';
        assert.doesNotMatch(templateText(component.renderPlayer()), /turn-indicator/u);
        assert.doesNotMatch(templateText(component.renderPlayerAccordions()), /turn-indicator/u);
        component.match.phase = 'players';
        component.match.playing = false;
        assert.doesNotMatch(templateText(component.renderPlayerAccordions()), /turn-indicator/u);
        assert.doesNotMatch(matchStyles, /current-turn|turn-indicator/u);
        assert.match(matchStyles, /\.player-accordion summary\s*\{[^}]*flex-wrap:\s*nowrap/su);
        assert.match(matchStyles, /\.player-name\s*\{[^}]*min-width:\s*0/su);
    });

    test('an accepted action request never marks the guest as taking a turn', () => {
        const players = ['active', 'requested'].map(id => ({
            id, name: id, superhero: {image: `${id}.png`},
        }));
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: players[1],
            focusedPlayerId: '',
            actionRequest: {targetId: 'requested', status: 'accepted'},
            match: {playing: true, phase: 'players', currentTurnPlayer: 'active', players},
        });
        assert.doesNotMatch(templateText(component.renderPlayer()), /Tu turno/u);
        assert.doesNotMatch(templateText(component.renderPlayerAccordions()), /Tu turno|En turno|turn-indicator/u);
    });

    test('shows only the completion button after accepting a request', () => {
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: {name: 'Solicitado', userId: 'requested'},
            actionRequest: {
                requester: 'Actual',
                target: 'Solicitado',
                targetId: 'requested',
                status: 'accepted',
            },
        });
        const template = component.renderActionRequest();
        const text = template.strings.join('');
        assert.match(text, /He terminado/);
        assert.doesNotMatch(text, /<p\b/u);
        assert.equal((text.match(/<md-filled-button\b/gu) || []).length, 1);
    });

    test('keeps the local board while another player acts and only switches on explicit selection', () => {
        const localPlayer = {id: 'local', name: 'Local'};
        const otherPlayer = {id: 'other', name: 'Otro'};
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: localPlayer,
            boardPlayer: otherPlayer,
            focusedPlayerId: '',
            interactive: false,
            actionRequest: {
                targetId: otherPlayer.id,
                status: 'accepted',
            },
            match: {
                currentTurnPlayer: otherPlayer.id,
                players: [localPlayer, otherPlayer],
            },
        });
        assert.equal(component.displayedPlayer, localPlayer);
        component.showPlayerBoard(otherPlayer.id);
        assert.equal(component.displayedPlayer, otherPlayer);
        assert.equal(component.boardInteractive, false);
        component.showPlayerBoard(localPlayer.id);
        assert.equal(component.displayedPlayer, localPlayer);
    });

    test('draws the first-player mark as an SVG outline instead of live text', () => {
        assert.match(firstPlayerToken, /<path\b/u);
        assert.doesNotMatch(firstPlayerToken, /<text\b/u);
        assert.match(firstPlayerToken, /<ellipse\b/u);
        assert.doesNotMatch(firstPlayerToken, /<circle\b/u);
        assert.match(firstPlayerToken, /id="first-player-mark"/u);
        assert.match(firstPlayerToken, /id="number-face"/u);
        assert.match(
            firstPlayerToken,
            /<ellipse cx="48" cy="44" rx="32" ry="21" fill="#ffffff"/u,
        );
    });

    test('a different player board is read-only even during the local turn', () => {
        const component = Object.assign(
            Object.create(MatchComponent.prototype),
            {
                player: {id: 'local-id', name: 'Jugador'},
                boardPlayer: {id: 'local-id', name: 'Jugador'},
                focusedPlayerId: 'other-id',
                interactive: true,
                actionRequest: null,
                match: {
                    currentTurnPlayer: 'local-id',
                    players: [
                        {id: 'local-id', name: 'Jugador'},
                        {id: 'other-id', name: 'Jugador'},
                    ],
                },
            },
        );
        let propagationStopped = false;

        assert.equal(component.displayedPlayer.id, 'other-id');
        assert.equal(component.boardInteractive, false);
        assert.doesNotMatch(
            matchStyles,
            /mc-scenario\.read-only,\s*mc-player\.read-only\s*\{\s*pointer-events:\s*none/u,
        );

        component.guardBoardInteraction({
            stopPropagation() {
                propagationStopped = true;
            },
        });
        assert.equal(propagationStopped, true);

        let defaultPrevented = false;
        let contextMenuPropagationStopped = false;
        const card = Object.assign(Object.create(CardComponent.prototype), {
            clickDisabled: true,
            _showBig: false,
        });

        card.hableContextMenu({
            preventDefault() {
                defaultPrevented = true;
            },
            stopPropagation() {
                contextMenuPropagationStopped = true;
            },
        });
        assert.equal(defaultPrevented, true);
        assert.equal(contextMenuPropagationStopped, true);
        assert.equal(card._showBig, true);

        component.showPlayerBoard('local-id');
        assert.equal(component.boardInteractive, true);
    });

    test('action requests target the account id when display names are repeated', () => {
        const component = Object.assign(
            Object.create(MatchComponent.prototype),
            {
                player: {id: 'local-id', name: 'Jugador'},
                actionRequest: {
                    requester: 'Jugador',
                    target: 'Jugador',
                    targetId: 'other-id',
                    status: 'pending',
                },
                match: {
                    players: [
                        {id: 'local-id', name: 'Jugador'},
                        {id: 'other-id', name: 'Jugador'},
                    ],
                },
            },
        );

        assert.equal(component.isActionTarget(component.player), false);
        assert.equal(component.isActionTarget(component.match.players[1]), true);
    });

    test('never duplicates another player discard above the board and preserves deck selection', () => {
        const localPlayer = {
            id: 'local-id',
            name: 'Local',
            deck: {id: 'local-deck', cards: [], discard: []},
        };
        const otherPlayer = {
            id: 'other-id',
            name: 'Invitado',
            deck: {
                id: 'other-deck',
                cards: [{id: 'hidden-card'}],
                discard: [{id: 'discarded-card'}],
            },
        };
        const component = Object.assign(
            Object.create(MatchComponent.prototype),
            {
                player: localPlayer,
                boardPlayer: localPlayer,
                focusedPlayerId: '',
                deckSelectionTargetIds: [],
                match: {
                    currentTurnPlayer: 'other-id',
                    players: [localPlayer, otherPlayer],
                },
            },
        );

        assert.equal(component.renderOtherPlayerDiscards(), '');

        component.showPlayerBoard('other-id');
        assert.equal(component.displayedPlayer, otherPlayer);
        assert.equal(component.renderOtherPlayerDiscards(), '');

        component.focusedPlayerId = '';
        component.deckSelectionTargetIds = ['other-deck'];
        assert.match(
            templateText(component.renderOtherPlayerDiscards()),
            /Mazo de Invitado/u,
        );
    });

    test('places the player list in the bottom-aligned board row rather than beside the hand', () => {
        const localPlayer = {id: 'local', name: 'Local', hand: []};
        const otherPlayer = {
            id: 'other',
            name: 'Otro',
            superhero: {image: 'other-hero.png'},
        };
        const component = Object.assign(Object.create(MatchComponent.prototype), {
            player: localPlayer,
            focusedPlayerId: '',
            deckSelectionTargetIds: [],
            actionRequest: null,
            match: {players: [localPlayer, otherPlayer]},
        });
        const markup = templateText(component.render());
        const playerRow = markup.indexOf('class="player-board-row ');
        const playerBoard = markup.indexOf('<mc-player', playerRow);
        const sidebar = markup.indexOf('class="player-sidebar ', playerRow);
        const hand = markup.indexOf('<mc-hand');
        assert.ok(playerRow >= 0);
        assert.ok(playerBoard > playerRow);
        assert.ok(sidebar > playerBoard);
        assert.ok(hand > sidebar);
        assert.match(matchStyles,
            /\.player-board-row\s*\{[^}]*display:\s*grid;[^}]*align-items:\s*end;/su);
        assert.match(matchStyles,
            /\.match-layout\s*\{[^}]*flex:\s*1 1 0;[^}]*overflow-y:\s*auto;/su);
        assert.match(matchStyles,
            /\.match-layout\s*\{[^}]*border:\s*1px solid #e4e0ea;[^}]*padding:\s*16px 16px 0;/su);
        assert.match(matchStyles,
            /\.match-board\s*\{[^}]*display:\s*flex;[^}]*min-height:\s*100%;/su);
        assert.match(matchStyles,
            /\.player-board-row\s*\{[^}]*margin-top:\s*auto;/su);
        assert.match(matchStyles,
            /\.player-board-row\s*\{[^}]*padding:\s*16px 0;/su);
        assert.match(matchStyles,
            /:host\s*\{[^}]*background-color:\s*transparent;/su);
        assert.match(matchStyles,
            /\.match-layout\s*\{[^}]*background-color:\s*#f7f5fb;/su);
        assert.match(matchStyles,
            /:host\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*overflow:\s*hidden;/su);
        assert.doesNotMatch(matchStyles, /\.read-only mc-hand/u);
    });

    test('keeps the game area 16px below the top bar without double padding', () => {
        assert.match(matchPageStyles, /:host\s*\{[^}]*padding:\s*16px 0 0;/su);
        assert.match(matchStyles, /:host\s*\{[^}]*padding:\s*0 16px;/su);
    });

    test('shows the initial-player token before the resolved hero image in the player list', () => {
        const localPlayer = {id: 'local-id', name: 'Local'};
        const otherPlayer = {
            id: 'other-id',
            name: 'Invitado',
            initial: true,
            superhero: {
                image: 'heroes/captain-marvel/01010b.png',
            },
        };
        const component = Object.assign(
            Object.create(MatchComponent.prototype),
            {
                player: localPlayer,
                focusedPlayerId: 'local-id',
                firstPlayerTokenUrl: '/first-player-token.svg',
                actionRequest: null,
                canRequestAction: false,
                match: {
                    currentTurnPlayer: 'local-id',
                    players: [localPlayer, otherPlayer],
                },
            },
        );
        const markup = templateText(component.renderPlayerAccordions());
        const tokenIndex = markup.indexOf('class="first-player-token"');
        const heroIndex = markup.indexOf('class="hero-thumbnail"');

        assert.match(
            markup,
            /src="\/static\/images\/cards\/heroes\/captain-marvel\/01010b\.png"/u,
        );
        assert.notEqual(tokenIndex, -1);
        assert.notEqual(heroIndex, -1);
        assert.ok(tokenIndex < heroIndex);
        assert.match(
            matchStyles,
            /\.first-player-token\s*\{[^}]*width:\s*32px;[^}]*height:\s*32px;/su,
        );
        assert.match(
            matchStyles,
            /\.player-accordion \.first-player-token\s*\{[^}]*flex:\s*0\s+0\s+auto;[^}]*margin:\s*0;/su,
        );
    });

    test('accepts card drops only on eligible player rows', () => {
        const component = Object.assign(
            Object.create(MatchComponent.prototype),
            {
                dragPlayCard: {
                    card: {id: 'shared-upgrade'},
                    playablePlayerIds: ['other-id'],
                },
            },
        );
        const localPlayer = {id: 'local-id'};
        const otherPlayer = {id: 'other-id'};
        let dropAllowed = false;
        let dispatchedEvent;

        component.dispatchEvent = event => {
            dispatchedEvent = event;
        };
        assert.equal(
            component.isPlayerPlayCardDropTarget(localPlayer),
            false,
        );
        assert.equal(
            component.isPlayerPlayCardDropTarget(otherPlayer),
            true,
        );
        component.handlePlayerPlayCardDrop({
            preventDefault() {},
            stopPropagation() {},
        }, localPlayer);
        assert.equal(dispatchedEvent, undefined);

        component.handlePlayerPlayCardDragOver({
            preventDefault() {
                dropAllowed = true;
            },
            dataTransfer: {},
        }, otherPlayer);
        assert.equal(dropAllowed, true);

        let propagationStopped = false;
        component.handlePlayerPlayCardDrop({
            preventDefault() {},
            stopPropagation() {
                propagationStopped = true;
            },
        }, otherPlayer);

        assert.equal(propagationStopped, true);
        assert.equal(dispatchedEvent.type, 'play-card-drop');
        assert.deepEqual(dispatchedEvent.detail, {
            card: {id: 'shared-upgrade'},
            targetId: 'other-id',
        });
    });

    test('reveals a player hero only for an explicitly authorized target', () => {
        const list = Object.assign(
            Object.create(McCardList.prototype),
            {
                size: 'm',
                marked: [],
                disabledCards: [],
                showBasicStats: false,
                showAcquiredTraits: false,
                showLife: false,
                showDamage: false,
                showThreat: false,
                showGeneric: false,
                emphasizedStats: [],
                highlightPlayable: false,
                rotatePlanCards: false,
                allowPlayCardDrag: false,
                selectOnClick: false,
                showExhausted: false,
                basicActivationType: '',
                showMenuAbilities: false,
            },
        );
        const hero = {
            id: 'hero-player-id',
            isPlayer: true,
            image: 'heroes/captain-marvel/01010a.png',
            name: 'Capitana Marvel',
            showPlayerHero: true,
        };
        const privatePlayer = {...hero, showPlayerHero: false};
        const imageFor = card => {
            const markup = list.renderCard(card, 0);
            const imageBindingIndex = markup.strings.findIndex(part =>
                part.includes('image='));

            return markup.values[imageBindingIndex];
        };

        assert.equal(imageFor(hero), hero.image);
        assert.equal(imageFor(privatePlayer), BACK_CARD_PLAYER);
    });

    test('shows the initial-player token above the superhero card on the board', () => {
        const component = Object.assign(
            Object.create(McPlayer.prototype),
            {
                player: {
                    initial: true,
                    handSize: 5,
                    superhero: {
                        name: 'Captain Marvel',
                        image: 'heroes/captain-marvel/01010a.png',
                    },
                    gameZone: {cards: []},
                },
                firstPlayerTokenUrl: '/first-player-token.svg',
            },
        );
        const playerMarkup = templateText(component.renderSuperhero());
        const superheroComponent = Object.assign(
            Object.create(SuperheroCardComponent.prototype),
            {
                firstPlayerTokenUrl: '/first-player-token.svg',
                image: 'heroes/captain-marvel/01010a.png',
                card: {},
                abilities: [],
                tuckedCards: [],
                obligations: [],
                canEndTurn: false,
            },
        );
        const superheroMarkup = templateText(superheroComponent.render());
        const cardIndex = superheroMarkup.indexOf('<mc-card');
        const markerIndex = superheroMarkup.indexOf('slot="image-marker"');
        const cardCloseIndex = superheroMarkup.indexOf('</mc-card>');
        const matchComponent = Object.assign(
            Object.create(MatchComponent.prototype),
            {
                player: component.player,
                firstPlayerTokenUrl: '/first-player-token.svg',
                match: {
                    currentTurnPlayer: 'first-player',
                    players: [
                        {id: 'first-player', ...component.player},
                        {id: 'second-player', name: 'Segundo jugador'},
                    ],
                },
            },
        );

        assert.notEqual(cardIndex, -1);
        assert.notEqual(markerIndex, -1);
        assert.ok(cardIndex < markerIndex);
        assert.ok(markerIndex < cardCloseIndex);
        assert.match(
            playerMarkup,
            /\.firstPlayerTokenUrl="\/first-player-token\.svg"/u,
        );
        assert.match(
            cardStyles,
            /\.card-image-marker\s*\{[^}]*right:\s*0;[^}]*bottom:\s*calc\(100% \+ 4px\);[^}]*left:\s*0;[^}]*justify-content:\s*center;/su,
        );
        assert.match(
            superheroCardStyles,
            /\.first-player-token\s*\{[^}]*width:\s*48px;[^}]*height:\s*48px;/su,
        );
        assert.match(
            templateText(matchComponent.renderPlayer()),
            /\.firstPlayerTokenUrl="\/first-player-token\.svg"/u,
        );
    });

    test('hides the first-player token for a solo match but keeps it for multiple heroes of one account', () => {
        const player = {
            id: 'first-player',
            userId: 'same-account',
            name: 'Jugador inicial',
            initial: true,
            superhero: {image: 'heroes/captain-marvel/01010a.png'},
            gameZone: {cards: []},
        };
        const component = Object.assign(
            Object.create(MatchComponent.prototype),
            {
                player,
                firstPlayerTokenUrl: '/first-player-token.svg',
                match: {players: [player], currentTurnPlayer: player.id},
            },
        );
        assert.match(templateText(component.renderPlayer()), /\.firstPlayerTokenUrl=""/u);
        assert.equal(component.renderPlayerAccordions(), '');

        const soloPlayer = Object.assign(Object.create(McPlayer.prototype), {
            player,
            firstPlayerTokenUrl: '',
        });
        assert.match(templateText(soloPlayer.renderSuperhero()), /\.firstPlayerTokenUrl=""/u);
        const soloHero = Object.assign(Object.create(SuperheroCardComponent.prototype), {
            firstPlayerTokenUrl: '',
            card: {},
            abilities: [],
            tuckedCards: [],
            obligations: [],
            canEndTurn: false,
        });
        assert.doesNotMatch(templateText(soloHero.render()), /class="first-player-token"/u);

        component.match = {
            ...component.match,
            players: [player, {...player, id: 'second-player', initial: false}],
        };
        assert.match(
            templateText(component.renderPlayer()),
            /\.firstPlayerTokenUrl="\/first-player-token\.svg"/u,
        );
    });

    test('aligns the player decks and centers the main scheme between the deck and villain', () => {
        assert.match(
            playerStyles,
            /\.player-decks\s*\{[^}]*align-self:\s*flex-end;/su,
        );
        assert.match(
            scenarioStyles,
            /\.schemes\s*\{[^}]*flex:\s*1\s+1\s+auto;/su,
        );
        assert.match(
            scenarioStyles,
            /\.main-scheme-decks\s*\{[^}]*justify-content:\s*center;/su,
        );
    });

    test('keeps card and deck count labels at regular font weight', () => {
        assert.match(
            cardStyles,
            /\.character-stat\s*\{[^}]*font-weight:\s*400;/su,
        );
        assert.match(
            deckStyles,
            /\.count\s*\{[^}]*font-weight:\s*400;/su,
        );
        assert.match(
            gameZoneStyles,
            /\.count\s*\{[^}]*font-weight:\s*400;/su,
        );
    });
});
