import assert from 'node:assert/strict';
import {describe, test} from 'node:test';

globalThis.HTMLElement ??= class {};
globalThis.window ??= {
    customElements: {
        define() {},
        get() {
            return undefined;
        },
    },
};

const {McDeckList} = await import('../src/components/mc-deck-list/mc-deck-list.js');
const {McDeckEditor} = await import('../src/components/mc-deck-editor/mc-deck-editor.js');
const {McDeckSelectedCards} = await import(
    '../src/components/mc-deck-selected-cards/mc-deck-selected-cards.js'
);
const {McDeckApp} = await import('../src/remote-entry.js');

const templateText = template => {
    if (Array.isArray(template)) {
        return template.map(templateText).join('');
    }
    if (template?.strings && template?.values) {
        return template.strings.map((part, index) =>
            `${part}${templateText(template.values[index])}`).join('');
    }

    return typeof template === 'string' || typeof template === 'number' ||
        typeof template === 'boolean' ?
        String(template) :
        '';
};

describe('read-only public deck access', () => {
    test('guest deck creation routes show a login link instead of the editor', () => {
        const app = Object.assign(Object.create(McDeckApp.prototype), {
            user: null,
            pageRoute: 'decks-create',
            error: '',
            notice: '',
        });
        const markup = templateText(app.render());

        assert.match(markup, /Inicia sesión para gestionar tus mazos/u);
        assert.match(markup, /href="\/login"/u);
        assert.doesNotMatch(markup, /mc-deck-hero-selector/u);
    });

    test('shows public decks without edit and delete controls and links to login', () => {
        const deckList = Object.assign(Object.create(McDeckList.prototype), {
            decks: [{
                id: 'public-deck',
                name: 'Mazo público',
                heroName: 'Héroe',
                aspect: 'justice',
                creatorName: 'RRR',
                validation: {size: 40},
            }],
            loading: false,
            readOnly: true,
            filter: '',
            sortColumn: 'name',
            sortDirection: 'asc',
        });
        const markup = templateText(deckList.render());

        assert.match(markup, /Modo de consulta/u);
        assert.match(markup, /href="\/login"/u);
        assert.match(markup, /Ver mazo Mazo público/u);
        assert.match(markup, /Creador/u);
        assert.match(markup, /RRR/u);
        assert.doesNotMatch(markup, /Crear mazo|Eliminar|Guardar copia en el catálogo/u);
    });

    test('labels a non-owned deck as view-only in the logged-in deck list', () => {
        const deckList = Object.assign(Object.create(McDeckList.prototype), {
            decks: [{
                id: 'shared-deck',
                name: 'Mazo compartido',
                heroName: 'Héroe',
                aspect: 'justice',
                creatorName: 'RRR',
                canEdit: false,
                validation: {size: 40},
            }],
            loading: false,
            readOnly: false,
            filter: '',
            sortColumn: 'name',
            sortDirection: 'asc',
        });
        const markup = templateText(deckList.render());

        assert.match(markup, /aria-label="Ver mazo Mazo compartido"/u);
        assert.doesNotMatch(markup, /aria-label="Editar mazo Mazo compartido"/u);
    });

    test('restores deck filters and ordering from route query parameters', () => {
        const deckList = Object.assign(Object.create(McDeckList.prototype), {
            routeQuery: {
                name: 'Clon',
                hero: 'hero-id',
                aspect: 'justice',
                creator: 'RRR',
                scope: 'favorites',
                sort: 'creator',
                direction: 'desc',
            },
            filter: '',
            heroFilter: '',
            aspectFilter: '',
            creatorFilter: '',
            scopeFilter: 'all',
            sortColumn: 'name',
            sortDirection: 'asc',
        });

        deckList.syncFiltersFromQuery();

        assert.equal(deckList.filter, 'Clon');
        assert.equal(deckList.heroFilter, 'hero-id');
        assert.equal(deckList.aspectFilter, 'justice');
        assert.equal(deckList.creatorFilter, 'RRR');
        assert.equal(deckList.scopeFilter, 'favorites');
        assert.equal(deckList.sortColumn, 'creator');
        assert.equal(deckList.sortDirection, 'desc');
    });

    test('filters owned decks, favorites, and a selected creator', () => {
        const deckList = Object.assign(Object.create(McDeckList.prototype), {
            decks: [
                {
                    id: 'mine',
                    name: 'Mi mazo',
                    heroId: 'hero-spider',
                    heroName: 'Spider-Man',
                    aspect: 'justice',
                    creatorName: 'RRR',
                    canEdit: true,
                    isFavorite: false,
                    validation: {size: 40},
                },
                {
                    id: 'favorite',
                    name: 'Favorito',
                    heroId: 'hero-captain',
                    heroName: 'Capitana Marvel',
                    aspect: ['aggression', 'justice'],
                    creatorName: 'Alice',
                    canEdit: false,
                    isFavorite: true,
                    validation: {size: 40},
                },
                {
                    id: 'other',
                    name: 'Otro mazo',
                    heroId: 'hero-captain',
                    heroName: 'Capitana Marvel',
                    aspect: 'protection',
                    creatorName: 'Bob',
                    canEdit: false,
                    isFavorite: false,
                    validation: {size: 40},
                },
            ],
            loading: false,
            readOnly: false,
            user: {id: 'current-user'},
            favoritePendingId: '',
            filter: '',
            scopeFilter: 'mine',
            heroFilter: '',
            aspectFilter: '',
            creatorFilter: '',
            sortColumn: 'name',
            sortDirection: 'asc',
        });

        assert.deepEqual(deckList.filteredDecks.map(deck => deck.id), ['mine']);
        deckList.filter = 'spider-man';
        assert.deepEqual(deckList.filteredDecks, []);
        deckList.filter = 'mi mazo';
        assert.deepEqual(deckList.filteredDecks.map(deck => deck.id), ['mine']);
        deckList.filter = '';
        deckList.scopeFilter = 'favorites';
        assert.deepEqual(deckList.filteredDecks.map(deck => deck.id), ['favorite']);
        deckList.scopeFilter = 'all';
        deckList.heroFilter = 'hero-captain';
        assert.deepEqual(
            deckList.filteredDecks.map(deck => deck.id),
            ['favorite', 'other'],
        );
        deckList.aspectFilter = 'justice';
        assert.deepEqual(deckList.filteredDecks.map(deck => deck.id), ['favorite']);
        deckList.aspectFilter = 'protection';
        assert.deepEqual(deckList.filteredDecks.map(deck => deck.id), ['other']);
        deckList.heroFilter = '';
        deckList.aspectFilter = '';
        deckList.creatorFilter = 'Bob';
        assert.deepEqual(deckList.filteredDecks.map(deck => deck.id), ['other']);
        assert.deepEqual(deckList.creatorOptions, ['Alice', 'Bob', 'RRR']);
        assert.deepEqual(deckList.heroOptions, [
            {id: 'hero-captain', name: 'Capitana Marvel'},
            {id: 'hero-spider', name: 'Spider-Man'},
        ]);
        assert.deepEqual(
            deckList.aspectOptions.map(({id}) => id).sort(),
            ['aggression', 'justice', 'protection'],
        );
    });

    test('clears filters while preserving the selected sort order', () => {
        let querySyncCount = 0;
        const deckList = Object.assign(Object.create(McDeckList.prototype), {
            filter: 'Spider',
            heroFilter: 'hero-spider',
            aspectFilter: 'justice',
            creatorFilter: 'RRR',
            scopeFilter: 'favorites',
            sortColumn: 'size',
            sortDirection: 'desc',
            syncFilterQuery: () => {
                querySyncCount++;
            },
        });

        assert.equal(deckList.hasActiveFilters, true);
        deckList.handleClearFilters();

        assert.equal(deckList.filter, '');
        assert.equal(deckList.heroFilter, '');
        assert.equal(deckList.aspectFilter, '');
        assert.equal(deckList.creatorFilter, '');
        assert.equal(deckList.scopeFilter, 'all');
        assert.equal(deckList.sortColumn, 'size');
        assert.equal(deckList.sortDirection, 'desc');
        assert.equal(deckList.hasActiveFilters, false);
        assert.equal(querySyncCount, 1);
    });

    test('shows favorites for other creators and delete only for the creator', () => {
        const deckList = Object.assign(Object.create(McDeckList.prototype), {
            decks: [{
                id: 'shared',
                name: 'Mazo compartido',
                creatorName: 'RRR',
                canEdit: false,
                isFavorite: false,
                validation: {size: 40},
            }, {
                id: 'owned',
                name: 'Mi mazo',
                creatorName: 'Current user',
                canEdit: true,
                isFavorite: false,
                validation: {size: 40},
            }],
            loading: false,
            readOnly: false,
            user: {id: 'current-user'},
            favoritePendingId: '',
            filter: '',
            scopeFilter: 'all',
            creatorFilter: '',
            sortColumn: 'name',
            sortDirection: 'asc',
        });
        const markup = templateText(deckList.render());

        assert.match(markup, /Marcar favorito/u);
        assert.match(markup, /Eliminar mazo Mi mazo/u);
        assert.doesNotMatch(markup, /Eliminar mazo Mazo compartido/u);
        assert.match(markup, /Solo mis mazos/u);
        assert.match(markup, /Solo favoritos/u);
        assert.match(markup, /Filtrar por creador/u);
        assert.match(markup, /Limpiar filtros/u);
        assert.match(markup, /label="Buscar por nombre"/u);
        assert.match(markup, /label="Filtrar por héroe"/u);
        assert.match(markup, /label="Filtrar por aspecto"/u);
        assert.doesNotMatch(
            markup,
            /Buscar por nombre, héroe, aspecto o creador/u,
        );
    });

    test('shows repository actions only to administrators', () => {
        const deckList = Object.assign(Object.create(McDeckList.prototype), {
            decks: [],
            loading: false,
            readOnly: false,
            user: {id: 'regular-user', isAdmin: false},
            favoritePendingId: '',
            filter: '',
            scopeFilter: 'all',
            heroFilter: '',
            aspectFilter: '',
            creatorFilter: '',
            sortColumn: 'name',
            sortDirection: 'asc',
        });

        const regularUserMarkup = templateText(deckList.render());
        assert.doesNotMatch(
            regularUserMarkup,
            /Guardar copia en el catálogo|Restaurar del repositorio/u,
        );
        assert.match(regularUserMarkup, /Crear mazo/u);

        deckList.user = {id: 'admin-user', isAdmin: true};

        const adminMarkup = templateText(deckList.render());
        assert.match(adminMarkup, /Guardar copia en el catálogo/u);
        assert.match(adminMarkup, /Restaurar del repositorio/u);
        assert.match(adminMarkup, /Crear mazo/u);
    });

    test('writes deck filters and ordering to shareable query navigation', () => {
        let navigation;
        const app = Object.assign(Object.create(McDeckApp.prototype), {
            navigateTo: (path, replace) => {
                navigation = {path, replace};
            },
        });

        app.handleDeckFiltersChanged({
            detail: {
                name: 'Clon de Spider-Man',
                hero: 'spider-man',
                aspect: 'justice',
                creator: 'RRR',
                scope: 'favorites',
                sort: 'size',
                direction: 'desc',
            },
        });

        assert.deepEqual(navigation, {
            path: '/decks?name=Clon+de+Spider-Man&hero=spider-man&aspect=justice&creator=RRR&scope=favorites&sort=size&direction=desc',
            replace: true,
        });
    });

    test('renders deck details without editor controls or a card pool', () => {
        const editor = Object.assign(Object.create(McDeckEditor.prototype), {
            deck: {
                id: 'public-deck',
                name: 'Mazo público',
                aspect: 'justice',
                creatorName: 'RRR',
                cards: [],
                validation: {legal: true, errors: []},
            },
            catalog: {
                hero: {baseCardCount: 15},
            },
            deckSize: 40,
            selectedCards: [],
            availableCards: [],
            search: '',
            saving: false,
            readOnly: true,
        });
        const markup = templateText(editor.render());

        assert.match(markup, /Ver mazo/u);
        assert.match(markup, /Nombre:<\/strong> Mazo público/u);
        assert.match(markup, /Creador:<\/strong> RRR/u);
        assert.match(markup, /Iniciar sesión para clonar/u);
        assert.match(markup, /href="\/login"/u);
        assert.match(markup, /\.readOnly="true"/u);
        assert.doesNotMatch(
            markup,
            /md-filled-text-field|md-filled-select|mc-deck-card-pool|Guardar/u,
        );
    });

    test('offers cloning to logged-in owners and non-owners of saved decks', () => {
        const deck = {
            id: 'public-deck',
            name: 'Mazo compartido',
            aspect: 'justice',
            creatorName: 'RRR',
            cards: [],
            validation: {legal: true, errors: []},
        };
        const editorForNonOwner = Object.assign(
            Object.create(McDeckEditor.prototype),
            {
                deck,
                catalog: {hero: {baseCardCount: 15}},
                deckSize: 40,
                selectedCards: [],
                availableCards: [],
                search: '',
                saving: false,
                cloning: false,
                readOnly: true,
                canClone: true,
            },
        );
        const editorForOwner = Object.assign(
            Object.create(McDeckEditor.prototype),
            {
                ...editorForNonOwner,
                readOnly: false,
                catalog: {
                    hero: {baseCardCount: 15},
                    aspects: [{id: 'justice'}],
                },
            },
        );

        assert.match(templateText(editorForNonOwner.render()), /Clonar/u);
        assert.doesNotMatch(templateText(editorForNonOwner.render()), /Guardar/u);
        assert.match(templateText(editorForOwner.render()), /Clonar/u);
        assert.match(templateText(editorForOwner.render()), /Guardar/u);
    });

    test('keeps non-owned saved decks read-only while allowing a logged-in clone', () => {
        const app = Object.assign(Object.create(McDeckApp.prototype), {
            user: {id: 'other-user'},
            pageRoute: 'decks-edit',
            error: '',
            notice: '',
            loading: false,
            initialDataLoading: false,
            saving: false,
            cloning: false,
            deck: {
                id: 'shared-deck',
                name: 'Mazo compartido',
                aspect: 'justice',
                cards: [],
                canEdit: false,
            },
            catalog: {
                hero: {baseCardCount: 15, fixedCards: []},
                cards: [],
            },
            search: '',
        });
        const markup = templateText(app.render());

        assert.match(markup, /\.readOnly="true"/u);
        assert.match(markup, /\.canClone="true"/u);
    });

    test('clones a saved deck into a new deck and navigates to the owned copy', async () => {
        const sourceDeck = {
            id: 'source-deck',
            name: 'Mazo compartido',
            heroId: 'hero',
            aspect: 'justice',
            cards: [{id: 'card-1', count: 2}],
            creatorName: 'RRR',
            canEdit: false,
        };
        let clonedSource;
        let destination;
        const clonedDeck = {
            id: 'cloned-deck',
            name: sourceDeck.name,
            heroId: sourceDeck.heroId,
            aspect: sourceDeck.aspect,
            cards: sourceDeck.cards,
            creatorName: 'Other User',
            canEdit: true,
        };
        const app = Object.assign(Object.create(McDeckApp.prototype), {
            user: {id: 'other-user'},
            deck: sourceDeck,
            decks: [sourceDeck],
            saving: false,
            cloning: false,
            error: '',
            notice: '',
            deckService: {
                cloneDeck: async deck => {
                    clonedSource = deck;
                    return clonedDeck;
                },
            },
            navigateTo: (path, replace) => {
                destination = {path, replace};
            },
        });

        await app.cloneDeck();

        assert.equal(clonedSource, sourceDeck);
        assert.equal(app.deck, clonedDeck);
        assert.deepEqual(destination, {
            path: '/decks/edit/cloned-deck',
            replace: true,
        });
        assert.match(app.notice, /eres su creador/u);
        assert.equal(app.saving, false);
        assert.equal(app.cloning, false);
    });

    test('opens deck creation for the requested hero and preserves the lobby destination', () => {
        let selectedHero;
        const app = Object.assign(Object.create(McDeckApp.prototype), {
            pageRoute: 'decks-create',
            routeParams: {},
            routeQuery: {
                hero: 'spiderwoman',
                returnLobby: 'lobby-1',
            },
            initialDataLoaded: true,
            lastRouteKey: null,
            requestSequence: 0,
            loading: false,
            error: '',
            notice: '',
            deck: null,
            catalog: null,
            heroId: '',
            search: '',
            returnLobbyId: '',
            loadHero: heroId => {
                selectedHero = heroId;
            },
        });

        app.syncRoute();

        assert.equal(selectedHero, 'spiderwoman');
        assert.equal(app.returnLobbyId, 'lobby-1');
    });

    test('returns to the lobby with a newly saved deck selected', async () => {
        let destination;
        const savedDeck = {
            id: 'new-deck',
            name: 'Mazo nuevo',
            heroId: 'spiderwoman',
            validation: {legal: true},
        };
        const app = Object.assign(Object.create(McDeckApp.prototype), {
            deck: {name: 'Mazo nuevo', heroId: 'spiderwoman'},
            decks: [],
            saving: false,
            error: '',
            notice: '',
            returnLobbyId: 'lobby-1',
            deckService: {
                saveDeck: async () => savedDeck,
            },
            navigateTo: path => {
                destination = path;
            },
        });

        await app.saveDeck();

        assert.equal(
            destination,
            '/match-lobby/lobby-1?hero=spiderwoman&deckId=new-deck',
        );
        assert.equal(app.returnLobbyId, '');
        assert.equal(app.deck, savedDeck);
    });

    test('toggles a favorite for the logged-in user and updates the list state', async () => {
        const sharedDeck = {
            id: 'shared-deck',
            name: 'Mazo compartido',
            canEdit: false,
            isFavorite: false,
        };
        let requestedFavorite;
        const app = Object.assign(Object.create(McDeckApp.prototype), {
            user: {id: 'current-user'},
            deck: null,
            decks: [sharedDeck],
            favoritePendingId: '',
            error: '',
            notice: '',
            deckService: {
                setDeckFavorite: async (_deckId, isFavorite) => {
                    requestedFavorite = isFavorite;
                    return {isFavorite};
                },
            },
        });

        await app.toggleFavoriteDeck(sharedDeck);

        assert.equal(requestedFavorite, true);
        assert.equal(app.decks[0].isFavorite, true);
        assert.equal(app.notice, 'Mazo añadido a favoritos.');
        assert.equal(app.favoritePendingId, '');
    });

    test('does not process card removal or count changes in read-only mode', () => {
        const selectedCards = Object.assign(
            Object.create(McDeckSelectedCards.prototype),
            {
                cards: [],
                readOnly: true,
                pendingRemoval: null,
            },
        );
        let dispatched = false;
        selectedCards.dispatchEvent = () => {
            dispatched = true;
        };

        selectedCards.handleCardRowClick(
            {target: {closest: () => null}},
            {fixed: false},
        );
        selectedCards.pendingRemoval = {id: 'card-1'};
        selectedCards.confirmRemoval();
        selectedCards.handleCountChanged({}, 'card-1');

        assert.equal(dispatched, false);
        assert.deepEqual(selectedCards.pendingRemoval, {id: 'card-1'});
    });
});
