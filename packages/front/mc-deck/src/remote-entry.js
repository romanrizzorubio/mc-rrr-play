import {LitElement, html} from 'lit-element';

import 'mc-components';

import './components/mc-deck-hero-selector/mc-deck-hero-selector.js';
import './components/mc-deck-list/mc-deck-list.js';
import './components/mc-deck-editor/mc-deck-editor.js';
import {getPlayerDeckCardCopyLimit} from 'mc-shared';
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
            heroes: {type: Array},
            heroId: {type: String},
            catalog: {type: Object},
            decks: {type: Array},
            deck: {type: Object},
            search: {type: String},
            loading: {type: Boolean},
            initialDataLoading: {type: Boolean},
            saving: {type: Boolean},
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
        this.heroes = [];
        this.heroId = '';
        this.catalog = null;
        this.decks = [];
        this.deck = null;
        this.search = '';
        this.loading = false;
        this.initialDataLoading = false;
        this.saving = false;
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
        if (changedProperties.has('pageRoute') || changedProperties.has('routeParams')) {
            this.syncRoute();
        }
    }
    async loadInitialData() {
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
        } catch (error) {
            this.error = error.message;
        } finally {
            this.initialDataLoading = false;
        }
    }
    async loadCatalog(heroId) {
        const requestSequence = ++this.requestSequence;
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
            aspect: '',
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
        const deck = this.decks.find(item => item.id === deckId);
        if (!deck) {
            this.error = `No se encontró el mazo "${deckId}".`;
            return;
        }

        const catalog = await this.loadCatalog(deck.heroId);
        if (!catalog || this.pageRoute !== 'decks-edit' ||
            this.routeParams?.id !== deckId) {
            return;
        }

        this.deck = {
            ...deck,
            cards: deck.cards.map(({id, count}) => ({id, count})),
        };
        this.search = '';
        this.error = '';
        this.notice = '';
    }
    syncRoute() {
        const deckId = this.routeParams?.id || '';
        const routeKey = `${this.pageRoute}:${deckId}`;
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
            this.heroId = '';
            this.search = '';
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
    cancelDeckCreation() {
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
        const aspect = this.deck.aspect ||
            (count > 0 && card.aspect !== 'basic' ? card.aspect : '');
        const deckForLimit = aspect === this.deck.aspect ?
            this.deck :
            {...this.deck, aspect};
        const copyLimit = getPlayerDeckCardCopyLimit(deckForLimit, this.catalog, cardId);
        if (count > copyLimit && count > currentCount) {
            this.error = `No puedes incluir más de ${copyLimit} copias de "${card.name}" en este mazo.`;
            return;
        }

        const cards = this.deck.cards.filter(entry => entry.id !== cardId);
        if (count > 0) {
            cards.push({id: cardId, count});
        }
        this.updateDeck({
            ...(aspect !== this.deck.aspect ? {aspect} : {}),
            cards,
        });
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

        return this.catalog.cards
            .filter(card => !this.deck.aspect ||
                card.aspect === 'basic' ||
                card.aspect === this.deck.aspect)
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
                this.navigateTo(`/decks/edit/${encodeURIComponent(savedDeck.id)}`, true);
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
        this.navigateTo('/decks');
    }
    render() {
        return html`
            <main>
                ${this.error ? html`<p role="alert">${this.error}</p>` : ''}
                ${this.notice ? html`<p role="status">${this.notice}</p>` : ''}
                ${this.deck ? html`
                    <mc-deck-editor
                        .deck="${this.deck}"
                        .catalog="${this.catalog}"
                        .deckSize="${this.deckSize}"
                        .selectedCards="${this.selectedCards}"
                        .availableCards="${this.availableCards}"
                        .search="${this.search}"
                        .saving="${this.saving}"
                        @deck-update="${this.handleDeckUpdated.bind(this)}"
                        @card-search-changed="${this.handleSearchChanged.bind(this)}"
                        @add-card="${this.handleCardAdded.bind(this)}"
                        @set-card-count="${this.handleCardCountChanged.bind(this)}"
                        @save-deck="${this.saveDeck.bind(this)}"
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
                        @create-deck="${this.handleDeckCreated.bind(this)}"
                        @edit-deck="${this.handleDeckEdited.bind(this)}"
                        @delete-deck="${this.handleDeckDeleted.bind(this)}"
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
