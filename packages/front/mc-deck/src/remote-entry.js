import {LitElement, html} from 'lit-element';

import 'mc-components';

import './components/mc-deck-hero-selector/mc-deck-hero-selector.js';
import './components/mc-deck-list/mc-deck-list.js';
import './components/mc-deck-editor/mc-deck-editor.js';
import {
    CLASSIFICATION_BASIC,
    getPlayerDeckCardCopyLimit,
    getSelectedDeckAspects,
    hasClassification,
} from 'mc-shared';
import {DeckServiceClient} from './services/deck-service-client.js';
import styles from './remote-entry.css.js';

export class McDeckApp extends LitElement {
    static get is() {
        return 'mc-deck-app';
    }
    static get properties() {
        return {
            serviceUrl: {type: String, attribute: 'service-url'},
            pageRoute: {type: String},
            routeParams: {type: Object, attribute: false},
            routeQuery: {type: Object, attribute: false},
            user: {type: Object},
            heroes: {type: Array},
            heroId: {type: String},
            catalog: {type: Object},
            decks: {type: Array},
            deck: {type: Object},
            search: {type: String},
            returnLobbyId: {type: String},
            loading: {type: Boolean},
            initialDataLoading: {type: Boolean},
            saving: {type: Boolean},
            cloning: {type: Boolean},
            favoritePendingId: {type: String},
            error: {type: String},
            notice: {type: String},
        };
    }
    static get styles() {
        return [styles];
    }
    constructor() {
        super();

        this.serviceUrl = '';
        this.deckService = new DeckServiceClient(this.serviceUrl);
        this.pageRoute = '';
        this.routeParams = {};
        this.routeQuery = {};
        this.user = null;
        this.heroes = [];
        this.heroId = '';
        this.catalog = null;
        this.decks = [];
        this.deck = null;
        this.search = '';
        this.returnLobbyId = '';
        this.loading = false;
        this.initialDataLoading = false;
        this.saving = false;
        this.cloning = false;
        this.favoritePendingId = '';
        this.error = '';
        this.notice = '';
        this.requestSequence = 0;
        this.initialDataLoaded = false;
        this.lastRouteKey = null;
    }
    updated(changedProperties) {
        if (changedProperties.has('serviceUrl')) {
            this.deckService = new DeckServiceClient(this.serviceUrl);
            if (this.serviceUrl && !this.initialDataLoaded) {
                this.loadInitialData();
            }
        }
        if (changedProperties.has('pageRoute') ||
            changedProperties.has('routeParams') ||
            changedProperties.has('routeQuery')) {
            this.syncRoute();
        }
        if (changedProperties.has('user') && this.initialDataLoaded) {
            this.refreshDeckAccess();
        }
    }
    async loadInitialData() {
        const userId = this.user?.id || '';
        this.initialDataLoading = true;
        this.error = '';
        try {
            const [heroes, decks] = await Promise.all([
                this.deckService.getHeroes(),
                this.deckService.getDecks(),
            ]);
            this.heroes = heroes;
            this.decks = decks;
            this.initialDataLoaded = true;
            this.syncRoute();
            if ((this.user?.id || '') !== userId) {
                this.refreshDeckAccess();
            }
        } catch (error) {
            this.error = error.message;
        } finally {
            this.initialDataLoading = false;
        }
    }
    async loadCatalog(heroId, requestSequence = ++this.requestSequence) {
        this.heroId = heroId;
        this.catalog = null;
        this.error = '';
        this.loading = true;
        try {
            const catalog = await this.deckService.getCatalog(heroId);
            if (requestSequence !== this.requestSequence) {
                return null;
            }

            this.catalog = catalog;
            return catalog;
        } catch (error) {
            if (requestSequence === this.requestSequence) {
                this.error = error.message;
            }
            return null;
        } finally {
            if (requestSequence === this.requestSequence) {
                this.loading = false;
            }
        }
    }
    async loadHero(heroId) {
        this.notice = '';
        if (!heroId) {
            this.requestSequence++;
            this.heroId = '';
            this.catalog = null;
            this.loading = false;
            this.error = '';
            return;
        }

        const catalog = await this.loadCatalog(heroId);
        if (catalog && this.pageRoute === 'decks-create') {
            this.startNewDeck();
            this.navigateTo('/decks/edit');
        }
    }
    startNewDeck() {
        if (!this.catalog) {
            return;
        }

        const {hero} = this.catalog;
        this.deck = {
            name: `Mazo de ${hero.name}`,
            heroId: this.heroId,
            aspect: hero.deckBuildingRules?.aspectCount > 1 ? [] : '',
            cards: [],
            validation: null,
        };
        this.search = '';
        this.notice = '';
        this.error = '';
    }
    editDeck(deck) {
        this.navigateTo(`/decks/edit/${encodeURIComponent(deck.id)}`);
    }
    async loadDeckFromRoute(deckId) {
        const requestSequence = ++this.requestSequence;
        this.loading = true;
        this.error = '';
        try {
            const deck = await this.deckService.getDeck(deckId);
            if (requestSequence !== this.requestSequence ||
                this.pageRoute !== 'decks-edit' ||
                this.routeParams?.id !== deckId) {
                return;
            }

            const catalog = await this.loadCatalog(deck.heroId, requestSequence);
            if (!catalog || requestSequence !== this.requestSequence ||
                this.pageRoute !== 'decks-edit' ||
                this.routeParams?.id !== deckId) {
                return;
            }

            this.deck = {
                ...deck,
                cards: deck.cards.map(({id, count}) => ({id, count})),
            };
            this.decks = [
                ...this.decks.filter(item => item.id !== deck.id),
                this.deck,
            ];
            this.search = '';
            this.error = '';
            this.notice = '';
        } catch (error) {
            if (requestSequence === this.requestSequence) {
                this.error = error.message;
            }
        } finally {
            if (requestSequence === this.requestSequence) {
                this.loading = false;
            }
        }
    }
    async refreshDeckAccess() {
        const userId = this.user?.id || '';
        this.favoritePendingId = '';
        this.decks = this.decks.map(deck => ({
            ...deck,
            canEdit: false,
            isFavorite: false,
        }));
        if (this.deck?.id) {
            this.deck = {...this.deck, canEdit: false, isFavorite: false};
        }

        try {
            const decks = await this.deckService.getDecks();
            if ((this.user?.id || '') !== userId) {
                return;
            }

            this.decks = decks;
            if (this.pageRoute === 'decks-edit' && this.routeParams?.id) {
                await this.loadDeckFromRoute(this.routeParams.id);
            }
        } catch (error) {
            this.error = error.message;
        }
    }
    syncRoute() {
        const deckId = this.routeParams?.id || '';
        const requestedHero = this.routeQuery?.hero || '';
        const returnLobbyId = this.routeQuery?.returnLobby || '';
        const routeKey = `${this.pageRoute}:${deckId}:${
            this.pageRoute === 'decks-create' ?
                `${requestedHero}:${returnLobbyId}` :
                ''
        }`;
        if (this.pageRoute === 'decks-create' && !this.initialDataLoaded) {
            this.returnLobbyId = returnLobbyId;
            this.heroId = requestedHero;
            return;
        }
        if (this.lastRouteKey === routeKey) {
            return;
        }
        if (this.pageRoute === 'decks-edit' && !this.initialDataLoaded) {
            return;
        }
        if (this.pageRoute === 'decks-edit' && this.deck?.id === deckId && this.catalog) {
            this.lastRouteKey = routeKey;
            return;
        }

        this.lastRouteKey = routeKey;
        this.requestSequence++;
        this.loading = false;
        this.error = '';
        this.notice = '';

        if (this.pageRoute !== 'decks-create' &&
            this.pageRoute !== 'decks-edit-new') {
            this.returnLobbyId = '';
        }
        if (this.pageRoute === 'decks') {
            this.deck = null;
            this.catalog = null;
            this.heroId = '';
            this.search = '';
            return;
        }
        if (this.pageRoute === 'decks-create') {
            this.deck = null;
            this.catalog = null;
            this.heroId = requestedHero;
            this.search = '';
            this.returnLobbyId = returnLobbyId;
            if (requestedHero) {
                this.loadHero(requestedHero);
            }
            return;
        }
        if (this.pageRoute === 'decks-edit-new') {
            if (!this.deck || this.deck.id) {
                this.navigateTo('/decks/create');
            }
            return;
        }
        if (this.pageRoute === 'decks-edit') {
            if (this.deck?.id === deckId && this.catalog) {
                return;
            }
            this.deck = null;
            this.catalog = null;
            this.heroId = '';
            this.loadDeckFromRoute(deckId);
        }
    }
    navigateTo(path, replace = false) {
        this.dispatchEvent(new CustomEvent('navigate-route', {
            detail: {route: path, replace},
            bubbles: true,
            composed: true,
        }));
    }
    handleDeckFiltersChanged(event) {
        const filters = event.detail;
        const query = new URLSearchParams();
        for (const key of [
            'name',
            'hero',
            'aspect',
            'creator',
            'scope',
            'sort',
            'direction',
        ]) {
            const value = filters[key];
            if (typeof value === 'string' && value.trim() &&
                !((key === 'scope' && value === 'all') ||
                    (key === 'sort' && value === 'name') ||
                    (key === 'direction' && value === 'asc'))) {
                query.set(key, value.trim());
            }
        }

        const search = query.toString();
        this.navigateTo(`/decks${search ? `?${search}` : ''}`, true);
    }
    handleLoginClick(event) {
        event.preventDefault();
        this.navigateTo('/login');
    }
    renderLoginRequired() {
        return html`
            <section class="login-required" aria-labelledby="deck-login-title">
                <h2 id="deck-login-title">Inicia sesión para gestionar tus mazos</h2>
                <p>
                    Puedes consultar los mazos sin iniciar sesión, pero necesitas una cuenta
                    para crear o editar mazos.
                </p>
                <md-text-button
                    href="/login"
                    @click="${this.handleLoginClick.bind(this)}"
                >
                    Iniciar sesión
                </md-text-button>
            </section>
        `;
    }
    cancelDeckCreation() {
        this.returnLobbyId = '';
        this.navigateTo('/decks');
    }
    updateDeck(changes) {
        this.deck = {
            ...this.deck,
            ...changes,
            validation: null,
        };
        this.error = '';
        this.notice = '';
    }
    addCard(cardId, count) {
        const currentCount = (this.deck.cards || [])
            .filter(entry => entry.id === cardId)
            .reduce((total, entry) => total + entry.count, 0);
        this.setCardCount(cardId, currentCount + count);
    }
    setCardCount(cardId, count) {
        const card = this.cardById.get(cardId);
        if (!card) {
            this.error = 'La carta seleccionada no está disponible en este catálogo.';
            return;
        }
        if (!Number.isInteger(count) || count < 0) {
            this.error = 'La cantidad de copias indicada no es válida.';
            return;
        }
        const currentCount = this.deck.cards
            .filter(entry => entry.id === cardId)
            .reduce((total, entry) => total + entry.count, 0);
        const multiAspectDeck = this.catalog.hero.deckBuildingRules?.aspectCount > 1;
        const selectedAspects = getSelectedDeckAspects(this.deck);
        const shouldSelectAspect = selectedAspects.length === 0 &&
            count > 0 &&
            !hasClassification(card.classification, CLASSIFICATION_BASIC);
        const selectedAspectIds = shouldSelectAspect ?
            [card.aspect] :
            selectedAspects;
        const aspect = multiAspectDeck ?
            selectedAspectIds :
            selectedAspectIds[0] || '';
        const deckForLimit = {...this.deck, aspect};
        const copyLimit = getPlayerDeckCardCopyLimit(deckForLimit, this.catalog, cardId);
        if (count > copyLimit && count > currentCount) {
            this.error = `No puedes incluir más de ${copyLimit} copias de "${card.name}" en este mazo.`;
            return;
        }

        const cards = this.deck.cards.filter(entry => entry.id !== cardId);
        if (count > 0) {
            cards.push({id: cardId, count});
        }
        this.updateDeck({aspect, cards});
    }
    get cardById() {
        return new Map((this.catalog?.cards || []).map(card => [card.id, card]));
    }
    get deckSize() {
        if (!this.deck || !this.catalog) {
            return 0;
        }

        return this.catalog.hero.baseCardCount + this.deck.cards.reduce((total, entry) => {
            const card = this.cardById.get(entry.id);
            return total + (card && !card.permanent ? entry.count : 0);
        }, 0);
    }
    get selectedCards() {
        const heroCards = (this.catalog?.hero.fixedCards || []).map((card, index) => ({
            ...card,
            id: `hero-fixed-${index}`,
            fixed: true,
        }));
        const editableCards = (this.deck?.cards || [])
            .map(entry => ({
                ...this.cardById.get(entry.id),
                id: entry.id,
                count: entry.count,
                fixed: false,
                maxCopies: getPlayerDeckCardCopyLimit(
                    this.deck,
                    this.catalog,
                    entry.id,
                ),
            }))
            .filter(card => card.name);
        return [...heroCards, ...editableCards];
    }
    get availableCards() {
        if (!this.catalog || !this.deck) {
            return [];
        }

        const selectedCounts = (this.deck.cards || []).reduce((counts, {id, count}) => {
            counts.set(id, (counts.get(id) || 0) + count);
            return counts;
        }, new Map());
        const selectedAspects = getSelectedDeckAspects(this.deck);

        return this.catalog.cards
            .filter(card => !selectedAspects.length ||
                hasClassification(card.classification, CLASSIFICATION_BASIC) ||
                selectedAspects.includes(card.aspect))
            .map(card => ({
                ...card,
                maxAddCount: Math.max(
                    0,
                    getPlayerDeckCardCopyLimit(this.deck, this.catalog, card.id) -
                        (selectedCounts.get(card.id) || 0),
                ),
            }))
            .sort((left, right) =>
                left.name.localeCompare(right.name, 'es', {sensitivity: 'base'}));
    }
    async saveDeck() {
        if (!this.deck || this.saving) {
            return;
        }

        this.saving = true;
        this.error = '';
        this.notice = '';
        const isNewDeck = !this.deck.id;
        try {
            const savedDeck = await this.deckService.saveDeck(this.deck);
            this.deck = savedDeck;
            this.decks = [
                ...this.decks.filter(deck => deck.id !== savedDeck.id),
                savedDeck,
            ].sort((left, right) =>
                left.name.localeCompare(right.name, 'es', {sensitivity: 'base'}));
            if (isNewDeck && savedDeck.id) {
                if (this.returnLobbyId) {
                    const returnLobbyId = this.returnLobbyId;
                    this.returnLobbyId = '';
                    const query = new URLSearchParams({
                        hero: savedDeck.heroId,
                        deckId: savedDeck.id,
                    });
                    this.navigateTo(
                        `/match-lobby/${encodeURIComponent(returnLobbyId)}?${query}`,
                    );
                } else {
                    this.navigateTo(
                        `/decks/edit/${encodeURIComponent(savedDeck.id)}`,
                        true,
                    );
                }
            }
            this.notice = savedDeck.validation.legal ?
                'Mazo legal guardado.' :
                'Borrador guardado. Solo los mazos legales se pueden elegir al crear una partida.';
        } catch (error) {
            this.error = error.message;
        } finally {
            this.saving = false;
        }
    }
    async cloneDeck() {
        if (!this.user || !this.deck?.id || this.saving) {
            return;
        }

        this.saving = true;
        this.cloning = true;
        this.error = '';
        this.notice = '';
        try {
            const clonedDeck = await this.deckService.cloneDeck(this.deck);
            this.deck = clonedDeck;
            this.decks = [
                ...this.decks.filter(deck => deck.id !== clonedDeck.id),
                clonedDeck,
            ].sort((left, right) =>
                left.name.localeCompare(right.name, 'es', {sensitivity: 'base'}));
            this.navigateTo(
                `/decks/edit/${encodeURIComponent(clonedDeck.id)}`,
                true,
            );
            this.notice = 'Mazo clonado. Ahora eres su creador y puedes editarlo.';
        } catch (error) {
            this.error = error.message;
        } finally {
            this.saving = false;
            this.cloning = false;
        }
    }
    async toggleFavoriteDeck(deck) {
        if (!this.user || !deck || deck.canEdit || this.favoritePendingId) {
            return;
        }

        this.favoritePendingId = deck.id;
        this.error = '';
        this.notice = '';
        try {
            const result = await this.deckService.setDeckFavorite(
                deck.id,
                !deck.isFavorite,
            );
            this.decks = this.decks.map(item => item.id === deck.id ? {
                ...item,
                isFavorite: result.isFavorite,
            } : item);
            if (this.deck?.id === deck.id) {
                this.deck = {...this.deck, isFavorite: result.isFavorite};
            }
            this.notice = result.isFavorite ?
                'Mazo añadido a favoritos.' :
                'Mazo eliminado de favoritos.';
        } catch (error) {
            this.error = error.message;
        } finally {
            this.favoritePendingId = '';
        }
    }
    async deleteDeck(deck) {
        if (!window.confirm(`¿Eliminar el mazo "${deck.name}"?`)) {
            return;
        }

        try {
            await this.deckService.deleteDeck(deck.id);
            this.decks = this.decks.filter(item => item.id !== deck.id);
            if (this.deck?.id === deck.id) {
                this.deck = null;
            }
            this.error = '';
            this.notice = 'Mazo eliminado.';
        } catch (error) {
            this.error = error.message;
        }
    }
    async restoreRepositoryDecks() {
        if (this.loading || !window.confirm(
            '¿Restaurar los mazos guardados en el repositorio? Para cada ID se conservará ' +
            'la versión más reciente; se aplicarán los borrados explícitos del repositorio, ' +
            'sin eliminar mazos que solo existan localmente.',
        )) {
            return;
        }

        this.loading = true;
        this.error = '';
        this.notice = '';
        try {
            const result = await this.deckService.restoreRepositoryDecks();
            this.decks = await this.deckService.getDecks();
            this.notice = result.total === 0 ?
                'El repositorio no contiene mazos guardados.' :
                `Mazos restaurados: ${result.restored}; borrados explícitos aplicados: ` +
                `${result.deleted}; versiones locales iguales o más recientes conservadas: ` +
                `${result.keptLocal}.`;
        } catch (error) {
            this.error = error.message;
        } finally {
            this.loading = false;
        }
    }
    async saveRepositoryDeckSnapshot() {
        if (this.loading) {
            return;
        }

        this.loading = true;
        this.error = '';
        this.notice = '';
        try {
            const result = await this.deckService.saveRepositoryDeckSnapshot();
            this.notice = `Copia guardada en el catálogo: ${result.decks} mazos y ` +
                `${result.deletions} borrados explícitos.`;
        } catch (error) {
            this.error = error.message;
        } finally {
            this.loading = false;
        }
    }
    handleHeroSelected(event) {
        this.loadHero(event.detail.heroId);
    }
    handleDeckCreated() {
        this.navigateTo('/decks/create');
    }
    handleDeckEdited(event) {
        this.editDeck(event.detail.deck);
    }
    handleDeckDeleted(event) {
        this.deleteDeck(event.detail.deck);
    }
    handleDeckCloned() {
        this.cloneDeck();
    }
    handleDeckFavorited(event) {
        this.toggleFavoriteDeck(event.detail.deck);
    }
    handleRepositoryDecksRestore() {
        this.restoreRepositoryDecks();
    }
    handleRepositoryDecksSave() {
        this.saveRepositoryDeckSnapshot();
    }
    handleDeckUpdated(event) {
        this.updateDeck(event.detail.changes);
    }
    handleSearchChanged(event) {
        this.search = event.detail.search;
    }
    handleCardAdded(event) {
        this.addCard(event.detail.cardId, event.detail.count);
    }
    handleCardCountChanged(event) {
        this.setCardCount(event.detail.cardId, event.detail.count);
    }
    handleEditorClosed() {
        this.returnLobbyId = '';
        this.navigateTo('/decks');
    }
    render() {
        const loginRequired = !this.user &&
            ['decks-create', 'decks-edit-new'].includes(this.pageRoute);

        return html`
            <main>
                ${this.error ? html`<p role="alert">${this.error}</p>` : ''}
                ${this.notice ? html`<p role="status">${this.notice}</p>` : ''}
                ${loginRequired ? this.renderLoginRequired() : this.deck ? html`
                    <mc-deck-editor
                        .deck="${this.deck}"
                        .catalog="${this.catalog}"
                        .deckSize="${this.deckSize}"
                        .selectedCards="${this.selectedCards}"
                        .availableCards="${this.availableCards}"
                        .search="${this.search}"
                        .saving="${this.saving}"
                        .cloning="${this.cloning}"
                        .canClone="${Boolean(this.user)}"
                        .readOnly="${!this.user ||
                            Boolean(this.deck.id && !this.deck.canEdit)}"
                        @deck-update="${this.handleDeckUpdated.bind(this)}"
                        @card-search-changed="${this.handleSearchChanged.bind(this)}"
                        @add-card="${this.handleCardAdded.bind(this)}"
                        @set-card-count="${this.handleCardCountChanged.bind(this)}"
                        @save-deck="${this.saveDeck.bind(this)}"
                        @clone-deck="${this.handleDeckCloned.bind(this)}"
                        @close-deck="${this.handleEditorClosed.bind(this)}"
                    ></mc-deck-editor>
                ` : this.pageRoute === 'decks-create' ? html`
                    <section class="hero-selection" aria-labelledby="hero-selection-title">
                        <h2 id="hero-selection-title">Crear mazo</h2>
                        <p>Selecciona el superhéroe de este mazo.</p>
                        <mc-deck-hero-selector
                            .heroes="${this.heroes}"
                            .heroId="${this.heroId}"
                            .disabled="${this.loading || this.initialDataLoading}"
                            @hero-selected="${this.handleHeroSelected.bind(this)}"
                        ></mc-deck-hero-selector>
                        ${this.loading || this.initialDataLoading ?
                            html`<p role="status">Cargando...</p>` :
                            ''
                        }
                        <div class="hero-selection-actions">
                            <md-text-button
                                type="button"
                                @click="${this.cancelDeckCreation.bind(this)}"
                            >
                                Volver
                            </md-text-button>
                        </div>
                    </section>
                ` : this.pageRoute === 'decks-edit' ? html`
                    ${this.loading || this.initialDataLoading ?
                        html`<p role="status">Cargando el mazo...</p>` :
                        ''
                    }
                ` : html`
                    <mc-deck-list
                        .decks="${this.decks}"
                        .loading="${this.loading || this.initialDataLoading}"
                        .readOnly="${!this.user}"
                        .routeQuery="${this.routeQuery}"
                        .user="${this.user}"
                        .favoritePendingId="${this.favoritePendingId}"
                        @create-deck="${this.handleDeckCreated.bind(this)}"
                        @edit-deck="${this.handleDeckEdited.bind(this)}"
                        @delete-deck="${this.handleDeckDeleted.bind(this)}"
                        @favorite-deck="${this.handleDeckFavorited.bind(this)}"
                        @deck-filters-change="${this.handleDeckFiltersChanged.bind(this)}"
                        @save-repository-decks="${this.handleRepositoryDecksSave.bind(this)}"
                        @restore-repository-decks="${this.handleRepositoryDecksRestore.bind(this)}"
                    ></mc-deck-list>
                `}
            </main>
        `;
    }
}

if (!window.customElements.get(McDeckApp.is)) {
    window.customElements.define(McDeckApp.is, McDeckApp);
}
