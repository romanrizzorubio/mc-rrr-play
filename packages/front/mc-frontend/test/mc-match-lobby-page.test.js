import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {
    customElements: {
        get() {
            return undefined;
        },
        define() {},
    },
};
globalThis.CustomEvent ??= class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {McMatchLobbyPage} = await import(
    '../src/pages/mc-match-lobby-page/mc-match-lobby-page.js'
);
const {default: McMatchLobbyPageCss} = await import(
    '../src/pages/mc-match-lobby-page/mc-match-lobby-page.css.js'
);
const {McFormPlayer} = await import(
    '../src/components/config/mc-form-player/mc-form-player.js'
);
const {McDeckPicker} = await import(
    '../src/components/config/mc-deck-picker/mc-deck-picker.js'
);

const templateText = template => {
    if (Array.isArray(template)) {
        return template.map(templateText).join('');
    }
    if (template?.strings && template?.values) {
        return template.strings.map((part, index) =>
            `${part}${templateText(template.values[index])}`).join('');
    }

    return typeof template === 'string' || typeof template === 'number' ?
        String(template) :
        '';
};

const createDeckPicker = properties => Object.assign(
    Object.create(McDeckPicker.prototype),
    {
        hero: '',
        heroesList: [],
        decksList: [],
        selectedDeckId: '',
        loadingDecks: false,
        hideCreateDeck: false,
        deckNameFilter: '',
        deckAspectFilter: '',
        ...properties,
    }
);

describe('match lobby page permissions', () => {
    test('an empty lobby offers the creator the same hero picker as guests but cannot start', async () => {
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            user: {id: 'creator'},
            lobby: {id: 'empty', ownerId: 'creator', status: 'waiting', players: [], maxPlayers: 4},
            heroesList: [{id: 'ironman'}], decksList: [],
            playerSelection: {hero: '', deckId: ''}, busy: false,
            apiConfigMatch: {startLobby: () => assert.fail('Empty lobbies cannot start')},
        });
        assert.equal(page.canJoin, true);
        assert.equal(page.currentPlayer, null);
        assert.match(templateText(page.renderJoinForm()), /Elegir héroe y mazo|<mc-deck-picker/u);
        const button = page.renderRoomActions();
        assert.equal(button.values[0], true);
        await page.startLobby();
    });

    test('a non-playing creator initializes the invited heroes without joining or taking their dialogs', async () => {
        const calls = [];
        const lobby = {
            id: 'room', name: 'Invitados', ownerId: 'creator', status: 'waiting',
            players: [{id: 'guest-seat', userId: 'guest', hero: 'ironman'}],
            maxPlayers: 1, expert: true,
        };
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            user: {id: 'creator'}, lobby, id: lobby.id, busy: false, enteringMatch: false,
            prepareMatch: async () => calls.push('prepare'),
            api: {
                beginMatch: name => calls.push(`begin:${name}`),
                joinMatch: () => assert.fail('Organizer must not impersonate a player'),
            },
            apiConfigMatch: {
                startLobby: async () => ({lobby: {...lobby, status: 'starting'}, matchName: lobby.name}),
                initMatch: async expert => {
                    assert.equal(expert, true);
                    calls.push('init');
                },
            },
            dispatchEvent: () => assert.fail('Organizer must stay in the lobby'),
        });
        await page.startLobby();
        assert.deepEqual(calls, ['prepare', 'begin:Invitados', 'init']);
        assert.equal(page.lobby.status, 'started');
        assert.equal(page.busy, false);
        assert.equal(page.enteringMatch, false);
    });

    test('reopening a preparing organizer lobby finishes configuration before retrying initialization', async () => {
        const calls = [];
        const lobby = {
            id: 'room', name: 'Invitados', ownerId: 'creator', status: 'starting',
            players: [{userId: 'guest'}], expert: false,
        };
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            user: {id: 'creator'}, active: true, id: 'room', loading: false,
            requestSequence: 0, enteringMatch: false,
            api: {beginMatch: name => calls.push(`begin:${name}`)},
            apiConfigMatch: {
                getLobby: async () => lobby,
                startLobby: async () => calls.push('configure'),
                initMatch: async () => calls.push('init'),
            },
            loadLobbyDecks: async () => {},
            applyRouteDeckSelection: async () => {},
        });
        await page.loadLobby();
        assert.deepEqual(calls, ['configure', 'begin:Invitados', 'init']);
        assert.equal(page.lobby.status, 'started');
        assert.equal(page.loading, false);
        assert.equal(page.enteringMatch, false);
        assert.equal(page.error, '');
    });
    test('roster player names are bold while aspect labels are regular weight', () => {
        assert.match(McMatchLobbyPageCss.cssText, /\.players \.player-name\s*\{[^}]*font-family:\s*var\(--mc-font-title,\s*sans-serif\);[^}]*font-weight:\s*700;/u);
        assert.match(McMatchLobbyPageCss.cssText, /\.players \.player-aspect\s*\{[^}]*font-weight:\s*400;/u);
        assert.match(McMatchLobbyPageCss.cssText, /\.players \.player-detail-separator\s*\{[^}]*display:\s*inline-block;[^}]*font-family:\s*var\(--mc-font-trait-separator,\s*sans-serif\);/u);
        assert.match(McMatchLobbyPageCss.cssText, /\.room-status\s*\{[^}]*font-size:\s*1\.25rem;[^}]*font-family:\s*var\(--mc-font-title,\s*sans-serif\);[^}]*font-weight:\s*700;/u);
    });

    test('the player form can hide its built-in deck selector', () => {
        const form = Object.assign(Object.create(McFormPlayer.prototype), {
            hideDeck: true,
            hideName: true,
            hideButton: true,
            hero: 'spiderwoman',
            heroesList: [],
        });
        const markup = templateText(form.render());

        assert.match(markup, /label="Héroe"/u);
        assert.doesNotMatch(markup, /label="Mazo"/u);
    });

    test('the creator can start before the room reaches its player limit', () => {
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            user: {id: 'host-1'},
            lobby: {
                ownerId: 'host-1',
                status: 'waiting',
                maxPlayers: 4,
                players: [{userId: 'host-1'}],
            },
        });

        assert.equal(page.isCreator, true);
        assert.equal(page.isWaiting, true);
        assert.equal(page.canJoin, true);
    });

    test('members can add distinct heroes until the total hero limit is reached', () => {
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            user: {id: 'host-1'},
            lobby: {
                ownerId: 'host-1',
                status: 'waiting',
                maxPlayers: 3,
                players: [
                    {id: 'seat-1', userId: 'host-1', hero: 'ironman'},
                    {id: 'seat-2', userId: 'guest', hero: 'spiderman'},
                ],
            },
            heroesList: [
                {id: 'ironman'}, {id: 'spiderman'}, {id: 'captainmarvel'},
            ],
            playerSelection: {hero: 'captainmarvel', deckId: ''},
            decksList: [],
        });

        assert.equal(page.canJoin, true);
        assert.deepEqual(page.availableHeroes, [{id: 'captainmarvel'}]);
        assert.match(templateText(page.renderJoinForm()), /Añadir otro héroe/u);
        assert.match(templateText(page.renderJoinForm()), /Añadir héroe/u);
        page.lobby.players.push({
            id: 'seat-3', userId: 'host-1', hero: 'captainmarvel',
        });
        assert.equal(page.canJoin, false);
        assert.equal(page.renderJoinForm(), '');
    });

    test('clears the hero selector after successfully adding a hero', async () => {
        const joins = [];
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            user: {id: 'host-1'},
            id: 'lobby-1',
            lobby: {
                ownerId: 'host-1',
                status: 'waiting',
                maxPlayers: 3,
                players: [{userId: 'host-1', hero: 'antman'}],
            },
            heroesList: [
                {id: 'antman', name: 'Ant-Man'},
                {id: 'ironman', name: 'Iron Man'},
                {id: 'spiderman', name: 'Spider-Man'},
            ],
            playerSelection: {hero: 'ironman', deckId: ''},
            decksList: [],
            deckListHero: 'ironman',
            deckListRequestSequence: 0,
            busy: false,
            apiConfigMatch: {
                joinLobby: async (id, selection) => {
                    joins.push({id, selection: {...selection}});
                    page.lobby.players.push({
                        userId: 'host-1',
                        hero: selection.hero,
                    });
                },
            },
            loadLobby: async () => {},
        });

        await page.joinLobby();

        assert.deepEqual(joins, [{
            id: 'lobby-1',
            selection: {hero: 'ironman', deckId: ''},
        }]);
        assert.deepEqual(page.playerSelection, {hero: '', deckId: ''});
        assert.deepEqual(
            page.availableHeroes.map(hero => hero.id),
            ['spiderman'],
        );

        const form = Object.assign(Object.create(McFormPlayer.prototype), {
            hero: page.playerSelection.hero,
            heroesList: page.availableHeroes,
        });
        const markup = templateText(form.renderSelect());
        assert.match(markup, /\.value=""/u);
        assert.match(
            markup,
            /<md-select-option value="">[\s\S]*Selecciona un héroe/u,
        );
    });

    test('an unregistered player can join only while a waiting room has space', () => {
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            user: {id: 'guest-1'},
            lobby: {
                ownerId: 'host-1',
                status: 'waiting',
                maxPlayers: 2,
                players: [{userId: 'host-1'}],
            },
        });

        assert.equal(page.currentPlayer, null);
        assert.equal(page.isCreator, false);
        assert.equal(page.canJoin, true);

        page.lobby.players.push({userId: 'guest-2'});
        assert.equal(page.canJoin, false);
        page.lobby.status = 'started';
        assert.equal(page.canJoin, false);
    });

    test('a waiting lobby marks its status prominently', () => {
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            user: {id: 'guest-1'},
            lobby: {
                name: 'Partida',
                ownerId: 'host-1',
                status: 'waiting',
                maxPlayers: 4,
                players: [],
            },
            lobbyDecks: [],
            heroesList: [],
            decksList: [],
            playerSelection: {hero: '', deckId: ''},
        });

        assert.match(
            templateText(page.renderRoom()),
            /<span class="room-status">[\s\S]*Esperando jugadores/u,
        );
    });

    test('guest selection uses the shared hero and deck picker', () => {
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            user: {id: 'guest-1'},
            lobby: {
                ownerId: 'host-1',
                status: 'waiting',
                maxPlayers: 4,
                players: [{userId: 'host-1', hero: 'ironman'}],
            },
            playerSelection: {hero: 'spiderwoman', deckId: ''},
            heroesList: [],
            decksList: [],
            loadingHeroes: false,
            loadingDecks: false,
            busy: false,
        });

        const markup = templateText(page.renderJoinForm());
        assert.match(markup, /<mc-form-player/u);
        assert.match(markup, /hide-deck/u);
        assert.match(markup, /<mc-deck-picker/u);
        assert.ok(markup.indexOf('</mc-form-player>') < markup.indexOf('<mc-deck-picker'));
    });

    test('offers the join action above and below the available deck picker', () => {
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            user: {id: 'guest-1'},
            lobby: {
                ownerId: 'host-1',
                status: 'waiting',
                maxPlayers: 4,
                players: [{userId: 'host-1', hero: 'ironman'}],
            },
            playerSelection: {hero: 'spiderwoman', deckId: ''},
            heroesList: [],
            decksList: [],
            loadingHeroes: false,
            loadingDecks: false,
            busy: false,
        });

        const markup = templateText(page.renderJoinForm());
        const firstJoinButton = markup.indexOf('Apuntarme a la partida');
        const deckPicker = markup.indexOf('<mc-deck-picker');
        const secondJoinButton = markup.lastIndexOf('Apuntarme a la partida');

        assert.ok(firstJoinButton >= 0);
        assert.ok(firstJoinButton < deckPicker);
        assert.ok(deckPicker < secondJoinButton);
    });

    test('the shared deck picker shows the Precon and aspect-aware deck table', () => {
        const picker = createDeckPicker({
            hero: 'spiderwoman',
            heroesList: [{
                id: 'spiderwoman',
                name: 'Spider-Woman',
                preconAspect: 'leadership',
            }],
            decksList: [{
                id: 'deck-1',
                name: 'Mazo de prueba',
                aspect: ['justice', 'leadership'],
                validation: {size: 40},
                creatorName: 'Ana',
            }],
        });

        const markup = templateText(picker.render());
        assert.match(markup, /<table class="deck-picker-table">/u);
        assert.match(markup, /<th scope="col">Nombre<\/th>/u);
        assert.match(markup, /<th scope="col">Aspecto<\/th>/u);
        assert.match(markup, /<th scope="col">Número de cartas<\/th>/u);
        assert.match(markup, /<th scope="col">Creador<\/th>/u);
        assert.match(markup, /class="deck-choice precon-choice aspect-leadership\s+selected"/u);
        assert.match(markup, /<td>Liderazgo\s*<\/td>/u);
        assert.match(markup, /label="Buscar por nombre"/u);
        assert.match(markup, /label="Filtrar por aspecto"/u);
        assert.match(markup, /Mazo de prueba/u);
        assert.match(markup, /40/u);
        assert.match(markup, /Ana/u);
        assert.match(markup, /Crear mazo/u);
        assert.match(markup, /class="deck-choice aspect-justice "/u);
        assert.match(markup, /class="deck-picker"/u);
        assert.doesNotMatch(markup, /<md-dialog/u);
        assert.ok(markup.indexOf('<colgroup>') < markup.indexOf('<thead>'));
        assert.match(
            markup,
            /background-image: linear-gradient\(90deg, var\(--deck-aspect-justice-color\), var\(--deck-aspect-leadership-color\)\);/u,
        );
    });

    test('shows the deck table before a hero has been chosen', () => {
        const picker = createDeckPicker();
        const markup = templateText(picker.render());

        assert.match(markup, /<table class="deck-picker-table">/u);
        assert.match(markup, /Elige un héroe para ver sus mazos/u);
    });

    test('filters available decks by case-insensitive name and selected aspect', () => {
        const picker = createDeckPicker({
            decksList: [
                {id: 'justice-1', name: 'Plan justo', aspect: 'justice'},
                {id: 'justice-2', name: 'Defensa urbana', aspect: 'justice'},
                {id: 'leadership-1', name: 'Plan táctico', aspect: 'leadership'},
            ],
            deckNameFilter: 'PLAN',
            deckAspectFilter: 'justice',
        });

        assert.deepEqual(
            picker.filteredDeckPickerDecks.map(deck => deck.id),
            ['justice-1'],
        );
        assert.deepEqual(picker.deckPickerAspectOptions, [
            {id: 'justice', name: 'Justicia'},
            {id: 'leadership', name: 'Liderazgo'},
        ]);
        assert.equal(picker.showPreconPickerOption, false);

        picker.clearDeckPickerFilters();

        assert.equal(picker.deckNameFilter, '');
        assert.equal(picker.deckAspectFilter, '');
        assert.equal(picker.filteredDeckPickerDecks.length, 3);
        assert.equal(picker.showPreconPickerOption, true);
    });

    test('changing hero resets the deck picker filters', () => {
        const picker = createDeckPicker({
            hero: 'spiderwoman',
            deckNameFilter: 'Plan',
            deckAspectFilter: 'justice',
        });

        picker.hero = 'captainmarvel';
        picker.willUpdate(new Map([['hero', 'spiderwoman']]));

        assert.equal(picker.deckNameFilter, '');
        assert.equal(picker.deckAspectFilter, '');
    });

    test('deck selection emits only a valid deck and supports Precon', () => {
        const picker = createDeckPicker({
            decksList: [{id: 'deck-1', name: 'Mazo legal'}],
        });
        const events = [];
        picker.dispatchEvent = event => events.push(event);

        picker.handleDeckSelected('deck-1');
        assert.equal(picker.selectedDeckId, 'deck-1');
        assert.deepEqual(events[0].detail, {deckId: 'deck-1'});

        picker.handleDeckSelected('');
        assert.equal(picker.selectedDeckId, '');
        assert.deepEqual(events[1].detail, {deckId: ''});

        picker.handleDeckSelected('invalid');
        assert.equal(events.length, 2);
    });

    test('selecting a deck updates the player and roster shows custom and precon names', async () => {
        const deck = {
            id: 'deck-1',
            name: 'Mazo táctico',
        };
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            lobby: {
                players: [
                    {
                        userId: 'host-1',
                        name: 'Host',
                        heroName: 'Iron Man',
                        aspect: 'leadership',
                        hero: 'ironman',
                        deckId: deck.id,
                    },
                    {
                        userId: 'guest-1',
                        name: 'Guest',
                        heroName: 'Captain Marvel',
                        aspect: 'justice',
                        hero: 'captainmarvel',
                        deckId: null,
                    },
                ],
            },
            lobbyDecks: [],
            lobbyDeckSignature: '',
            lobbyDeckRequestSequence: 0,
            deckInfoError: '',
            playerSelection: {hero: 'spiderwoman', deckId: ''},
            decksList: [deck],
            apiConfigMatch: {
                getDecksList: async () => [deck],
            },
        });

        await page.loadLobbyDecks(page.lobby);
        page.handleDeckSelected(deck.id);

        assert.deepEqual(page.playerSelection, {
            hero: 'spiderwoman',
            deckId: 'deck-1',
        });
        const markup = templateText(page.renderPlayers());
        assert.match(
            markup,
            /Iron Man[\s\S]*class="player-aspect aspect-leadership">Liderazgo<\/span>[\s\S]*Mazo táctico/u,
        );
        assert.match(
            markup,
            /Captain Marvel[\s\S]*class="player-aspect aspect-justice">Justicia<\/span>[\s\S]*Precon/u,
        );
        assert.equal(
            (markup.match(/class="player-detail-separator">\.<\/span>/gu) || []).length,
            4,
        );
        assert.doesNotMatch(markup, /Mazo:/u);
        assert.doesNotMatch(markup, /Mazo:<\/strong>/u);
    });

    test('opens deck creation with the current hero and lobby as return context', () => {
        let destination;
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            id: 'lobby-1',
            playerSelection: {hero: 'spiderwoman', deckId: ''},
            navigate: route => {
                destination = route;
            },
        });

        page.createDeckForHero();

        assert.equal(
            destination,
            '/decks/create?hero=spiderwoman&returnLobby=lobby-1',
        );
    });

    test('restores a newly saved deck selection on the first lobby load', async () => {
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            active: true,
            id: 'lobby-1',
            user: {id: 'guest-1'},
            routeQuery: {hero: 'spiderwoman', deckId: 'new-deck'},
            lobby: null,
            heroesList: [],
            loading: false,
            loadingHeroes: false,
            playerSelection: {hero: '', deckId: ''},
            decksList: [],
            lobbyDecks: [],
            lobbyDeckSignature: '',
            deckListHero: '',
            deckListRequestSequence: 0,
            lobbyDeckRequestSequence: 0,
            loadingDecks: false,
            loadedHeroes: false,
            error: '',
            deckInfoError: '',
            notice: '',
            routeDeckSelectionKey: '',
            requestSequence: 0,
            apiConfigMatch: {
                getLobby: async () => ({
                    ownerId: 'host-1',
                    status: 'waiting',
                    maxPlayers: 4,
                    players: [{userId: 'host-1', hero: 'ironman'}],
                }),
                getHeroesList: async () => [
                    {id: 'ironman', name: 'Iron Man'},
                    {id: 'spiderwoman', name: 'Spider-Woman'},
                ],
                getDecksList: async () => [{
                    id: 'new-deck',
                    name: 'Nuevo mazo',
                    validation: {legal: true, size: 40},
                }],
            },
        });

        await page.loadLobby();

        assert.deepEqual(page.playerSelection, {
            hero: 'spiderwoman',
            deckId: 'new-deck',
        });
        assert.equal(page.notice, '');
        const markup = templateText(page.renderDeckPicker());
        assert.match(markup, /\.selectedDeckId="new-deck"/u);

        const picker = createDeckPicker({
            hero: page.playerSelection.hero,
            heroesList: page.heroesList,
            decksList: page.decksList,
            selectedDeckId: page.playerSelection.deckId,
        });
        const pickerMarkup = templateText(picker.render());
        assert.match(pickerMarkup, /Nuevo mazo/u);
        assert.match(pickerMarkup, /class="deck-choice\s+selected"/u);
    });

    test('the creator joins the prepared match before initializing it', async () => {
        const calls = [];
        const page = Object.assign(Object.create(McMatchLobbyPage.prototype), {
            active: true,
            id: 'lobby-1',
            user: {id: 'host-1'},
            lobby: {
                id: 'lobby-1',
                name: 'Avengers',
                ownerId: 'host-1',
                status: 'waiting',
                expert: false,
                maxPlayers: 4,
                players: [{userId: 'host-1', name: 'Host'}],
            },
            prepareMatch: async () => calls.push('prepare'),
            apiConfigMatch: {
                startLobby: async () => ({
                    lobby: {
                        id: 'lobby-1',
                        name: 'Avengers',
                        ownerId: 'host-1',
                        status: 'starting',
                        expert: false,
                        maxPlayers: 4,
                        players: [{userId: 'host-1', name: 'Host'}],
                    },
                    matchId: 'match-1',
                    matchName: 'Avengers',
                    expert: false,
                }),
                initMatch: async () => ({id: 'match-1'}),
            },
            api: {
                beginMatch: name => calls.push(`begin:${name}`),
                markMatchReady: () => calls.push('ready'),
                joinMatch: async () => {
                    calls.push('join');
                    return true;
                },
            },
            busy: false,
            error: '',
            notice: '',
            enteringMatch: false,
            dispatchEvent: event => calls.push(event.type),
        });

        await page.startLobby();

        assert.deepEqual(calls, [
            'prepare',
            'prepare',
            'begin:Avengers',
            'ready',
            'match-resumed',
            'join',
            'match-resumed',
        ]);
        assert.equal(page.lobby.status, 'starting');
        assert.equal(page.lobby.matchId, 'match-1');
        assert.equal(page.busy, false);
    });
});
