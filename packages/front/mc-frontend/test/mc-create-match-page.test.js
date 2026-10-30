import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {
    customElements: {
        define() {},
    },
};
globalThis.CustomEvent ??= class {
    constructor(type, options = {}) {
        this.type = type;
        Object.assign(this, options);
    }
};

const {McCreateMatchPage} = await import(
    '../src/pages/mc-create-match-page/mc-create-match-page.js'
);

const flattenTemplate = template => template.strings.reduce((markup, part, index) => {
    const value = template.values[index];
    const renderedValue = Array.isArray(value) ?
        value.map(item => item?.strings ? flattenTemplate(item) : '').join('') :
        value?.strings ?
            flattenTemplate(value) :
            typeof value === 'string' || typeof value === 'number' ?
                value :
                '';

    return `${markup}${part}${renderedValue}`;
}, '');

describe('match list session prompt', () => {
    test('creation loads only scenario catalogs and opens the empty lobby directly', async () => {
        const payload = {
            name: 'Sala', maxPlayers: 2, expert: true,
            scenario: {scenario: 'rhino', modularSets: ['bomb-scare']},
        };
        const calls = [];
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            matches: [], lobbies: [], creatingGame: false,
            apiConfigMatch: {
                getHeroesList: () => assert.fail('Heroes are selected only in the lobby'),
                getScenariosList: async () => ['rhino'],
                getModularSetsList: async () => ['bomb-scare'],
                createLobby: async params => {
                    assert.deepEqual(params, payload);
                    return {id: 'new-lobby', players: []};
                },
            },
            dispatchEvent: event => calls.push(event),
            loadMatches: async () => {},
        });
        await page.startCreatingMatch();
        assert.deepEqual(page.scenariosList, ['rhino']);
        assert.deepEqual(page.modularSetsList, ['bomb-scare']);
        await page.handleCreate({detail: payload});
        assert.equal(page.creatingGame, false);
        assert.equal(page.creatingMatch, false);
        assert.equal(calls[0].detail.route, '/match-lobby/new-lobby');
    });

    test('organizers keep their created matches without receiving a player board', async () => {
        const match = {
            id: 'organizer-lobby', name: 'Sala', creatorUserId: 'creator', initialized: true,
            players: [{userId: 'guest', name: 'Invitado'}],
        };
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            user: {id: 'creator'}, matchListRequestSequence: 0,
            apiConfigMatch: {
                getMatchesList: async () => [match, {...match, creatorUserId: 'other'}],
                getLobbiesList: async () => [],
            },
        });
        await page.loadMatches();
        assert.deepEqual(page.matches, [match]);
        const markup = flattenTemplate(page.renderMatch(match));
        assert.match(markup, /Ver sala/u);
        assert.match(markup, /Eliminar partida/u);
        assert.doesNotMatch(markup, /Continuar partida|Reiniciar partida/u);
    });
    test('shows Rino and the delete button only for the match creator', () => {
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            user: {id: 'creator'},
        });
        const match = {
            id: 'match-id',
            name: 'Partida',
            creatorUserId: 'creator',
            scenario: 'rhino',
            scenarioName: 'Rino',
            players: [{userId: 'creator', name: 'Creador'}],
        };
        let markup = flattenTemplate(page.renderMatch(match));
        assert.match(markup, /Rino/u);
        assert.doesNotMatch(markup, /rhino/u);
        assert.match(markup, /Eliminar partida/u);
        assert.match(markup, /Reiniciar partida/u);
        page.user = {id: 'guest'};
        markup = flattenTemplate(page.renderMatch(match));
        assert.doesNotMatch(markup, /Eliminar partida/u);
        assert.doesNotMatch(markup, /Reiniciar partida/u);
    });

    test('guests cannot trigger a reset directly from the match list', async () => {
        const errors = [];
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            user: {id: 'guest'},
            reportCommunicationError: error => errors.push(error.message),
            apiConfigMatch: {resetMatch: () => assert.fail('No reset request allowed')},
        });
        await page.resetMatch({id: 'match-id', creatorUserId: 'creator'});
        assert.deepEqual(errors, ['Solo el creador puede reiniciar esta partida.']);
    });

    test('waiting lobbies also expose deletion only to their creator', () => {
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            user: {id: 'creator'},
            lobbies: [{
                id: 'lobby-id', name: 'Sala', ownerId: 'creator',
                players: [], maxPlayers: 2, scenarioName: 'Rino',
            }],
        });
        assert.match(flattenTemplate(page.renderLobbyList()), /Eliminar partida/u);
        page.user = {id: 'guest'};
        assert.doesNotMatch(flattenTemplate(page.renderLobbyList()), /Eliminar partida/u);
    });

    test('confirming deletion calls the API and removes the match without stale loading state', async () => {
        const confirmation = window.confirm;
        const calls = [];
        window.confirm = message => {
            assert.match(message, /no se puede deshacer/u);
            return true;
        };
        const match = {name: 'Partida', creatorUserId: 'creator'};
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            user: {id: 'creator'},
            deletingMatch: '', matches: [match],
            matchListRequestSequence: 1, loadingMatches: true,
            apiConfigMatch: {deleteMatch: async name => calls.push(name)},
        });
        try {
            await page.deleteMatch(match);
            assert.deepEqual(calls, ['Partida']);
            assert.deepEqual(page.matches, []);
            assert.equal(page.deletingMatch, '');
            assert.equal(page.loadingMatches, false);
            assert.equal(page.matchListRequestSequence, 2);
        } finally {
            window.confirm = confirmation;
        }
    });

    test('cancelling or lacking creator permission never sends a delete request', async () => {
        const confirmation = window.confirm;
        window.confirm = () => false;
        const calls = [];
        const errors = [];
        const match = {name: 'Partida', creatorUserId: 'creator'};
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            user: {id: 'creator'},
            matches: [match],
            dispatchEvent: event => errors.push(event.detail.message),
            apiConfigMatch: {deleteMatch: async name => calls.push(name)},
        });
        try {
            await page.deleteMatch(match);
            assert.deepEqual(calls, []);
            assert.deepEqual(page.matches, [match]);
            page.user = {id: 'guest'};
            await page.deleteMatch(match);
            assert.deepEqual(calls, []);
            assert.match(errors[0], /Solo el creador/u);
        } finally {
            window.confirm = confirmation;
        }
    });

    test('deletion failures preserve the match and report the error', async () => {
        const confirmation = window.confirm;
        window.confirm = () => true;
        const errors = [];
        const match = {name: 'Partida', creatorUserId: 'creator'};
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            user: {id: 'creator'},
            matches: [match],
            dispatchEvent: event => errors.push(event.detail.message),
            apiConfigMatch: {deleteMatch: async () => { throw new Error('Error de servidor'); }},
        });
        try {
            await page.deleteMatch(match);
            assert.deepEqual(page.matches, [match]);
            assert.equal(page.deletingMatch, '');
            assert.match(errors[0], /Error de servidor/u);
        } finally {
            window.confirm = confirmation;
        }
    });

    test('deleting a waiting lobby uses its ID and refreshes that list', async () => {
        const confirmation = window.confirm;
        window.confirm = () => true;
        const calls = [];
        const lobby = {id: 'lobby-id', name: 'Sala', ownerId: 'creator'};
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            user: {id: 'creator'},
            lobbies: [lobby],
            matchListRequestSequence: 0,
            apiConfigMatch: {deleteLobby: async id => calls.push(id)},
        });
        try {
            await page.deleteLobby(lobby);
            assert.deepEqual(calls, ['lobby-id']);
            assert.deepEqual(page.lobbies, []);
        } finally {
            window.confirm = confirmation;
        }
    });

    test('asks guests to sign in and links directly to the login page', () => {
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            user: null,
            loadingMatches: false,
            matches: [],
        });
        const markup = page.renderMatchList().strings.join('');

        assert.match(markup, /Inicia sesión para ver tus partidas iniciadas/u);
        assert.match(markup, /href="\/login"/u);
        assert.match(markup, /Iniciar sesión/u);
    });

    test('shows the signed-in user match state without the login prompt', () => {
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            user: {id: 'user-1'},
            loadingMatches: false,
            matches: [],
        });
        const markup = page.renderMatchList().strings.join('');

        assert.match(markup, /No hay partidas creadas/u);
        assert.doesNotMatch(markup, /href="\/login"/u);
    });

    test('does not request private matches for a guest while keeping public lobbies', async () => {
        let matchListRequests = 0;
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            apiConfigMatch: {
                getMatchesList() {
                    matchListRequests++;
                    return Promise.resolve([]);
                },
                getLobbiesList: async () => [{id: 'lobby-1'}],
            },
            user: null,
            matchListRequestSequence: 0,
            matches: [],
            lobbies: [],
            loadingMatches: false,
        });

        await page.loadMatches();

        assert.equal(matchListRequests, 0);
        assert.deepEqual(page.matches, []);
        assert.deepEqual(page.lobbies, [{id: 'lobby-1'}]);
    });

    test('shows available lobbies in a compact table', () => {
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {
            lobbies: [{
                id: 'lobby-1',
                name: 'Avengers',
                scenarioName: 'Ultron',
                expert: true,
                players: [{userId: 'player-1'}],
                maxPlayers: 4,
            }],
        });
        const markup = flattenTemplate(page.renderLobbyList());

        assert.match(markup, /<table class="lobby-table">/u);
        assert.match(markup, /<th scope="col">Partida<\/th>/u);
        assert.match(markup, /<th scope="col">Escenario<\/th>/u);
        assert.match(markup, /<th scope="col">Dificultad<\/th>/u);
        assert.match(markup, /<th scope="col">Superhéroes<\/th>/u);
        assert.match(markup, /Avengers/u);
        assert.match(markup, /Ultron/u);
        assert.match(markup, /Experto/u);
        assert.match(markup, /1\/4/u);
        assert.match(markup, /Ver partida/u);
        assert.doesNotMatch(markup, /<article class="match-card"/u);
    });

    test('navigates to the selected lobby when Ver partida is activated', () => {
        const page = Object.assign(Object.create(McCreateMatchPage.prototype), {});
        const events = [];
        page.dispatchEvent = event => events.push(event);

        page.openLobby('lobby 1');

        assert.equal(events[0].type, 'navigate-route');
        assert.equal(events[0].detail.route, '/match-lobby/lobby%201');
        assert.equal(events[0].bubbles, true);
        assert.equal(events[0].composed, true);
    });
});
