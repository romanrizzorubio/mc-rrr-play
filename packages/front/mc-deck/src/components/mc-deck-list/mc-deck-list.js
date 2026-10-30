import {LitElement, html} from 'lit-element';
import {getSelectedDeckAspects} from 'mc-shared';

import styles from './mc-deck-list.css.js';
import {
    getAspectName,
    getDeckAspectClass,
    getDeckAspectGradient,
    getDeckAspectName,
} from '../../utils/deck-presentation.js';
import {dispatchComponentEvent} from '../../utils/dispatch-component-event.js';
import {compareDeckListItems} from '../../utils/deck-list-sort.js';

export class McDeckList extends LitElement {
    static get is() {
        return 'mc-deck-list';
    }
    static get properties() {
        return {
            decks: {type: Array},
            loading: {type: Boolean},
            readOnly: {type: Boolean},
            routeQuery: {type: Object, attribute: false},
            user: {type: Object},
            favoritePendingId: {type: String},
            filter: {type: String},
            scopeFilter: {type: String},
            heroFilter: {type: String},
            aspectFilter: {type: String},
            creatorFilter: {type: String},
            sortColumn: {type: String},
            sortDirection: {type: String},
        };
    }
    static get styles() {
        return [styles];
    }
    constructor() {
        super();

        this.decks = [];
        this.loading = false;
        this.readOnly = false;
        this.routeQuery = {};
        this.user = null;
        this.favoritePendingId = '';
        this.filter = '';
        this.scopeFilter = 'all';
        this.heroFilter = '';
        this.aspectFilter = '';
        this.creatorFilter = '';
        this.sortColumn = 'name';
        this.sortDirection = 'asc';
    }
    updated(changedProperties) {
        if (changedProperties.has('routeQuery')) {
            this.syncFiltersFromQuery();
        }
    }
    syncFiltersFromQuery() {
        this.filter = this.routeQuery?.name || '';
        this.heroFilter = this.routeQuery?.hero || '';
        this.aspectFilter = this.routeQuery?.aspect || '';
        this.creatorFilter = this.routeQuery?.creator || '';
        this.scopeFilter = ['all', 'mine', 'favorites'].includes(
            this.routeQuery?.scope,
        ) ? this.routeQuery.scope : 'all';
        this.sortColumn = [
            'name',
            'hero',
            'aspect',
            'creator',
            'size',
        ].includes(this.routeQuery?.sort) ? this.routeQuery.sort : 'name';
        this.sortDirection = ['asc', 'desc'].includes(
            this.routeQuery?.direction,
        ) ? this.routeQuery.direction : 'asc';
    }
    syncFilterQuery() {
        dispatchComponentEvent(this, 'deck-filters-change', {
            name: this.filter,
            hero: this.heroFilter,
            aspect: this.aspectFilter,
            creator: this.creatorFilter,
            scope: this.user ? this.scopeFilter : 'all',
            sort: this.sortColumn,
            direction: this.sortDirection,
        });
    }
    get filteredDecks() {
        const query = this.filter.trim().toLocaleLowerCase('es');
        const scopeFilter = this.user ? this.scopeFilter : 'all';

        return this.decks.filter(deck => {
            const matchesScope = scopeFilter === 'mine' ?
                deck.canEdit :
                scopeFilter === 'favorites' ? deck.isFavorite : true;
            const matchesHero = !this.heroFilter ||
                deck.heroId === this.heroFilter;
            const matchesAspect = !this.aspectFilter ||
                getSelectedDeckAspects(deck).includes(this.aspectFilter);
            const matchesCreator = !this.creatorFilter ||
                deck.creatorName === this.creatorFilter;
            const matchesName = !query ||
                deck.name.toLocaleLowerCase('es').includes(query);

            return matchesScope && matchesHero && matchesAspect &&
                matchesCreator && matchesName;
        });
    }
    get hasActiveFilters() {
        return Boolean(
            this.filter.trim() ||
            this.heroFilter ||
            this.aspectFilter ||
            this.creatorFilter ||
            this.scopeFilter !== 'all',
        );
    }
    get heroOptions() {
        const heroes = new Map(this.decks
            .filter(deck => deck.heroId && deck.heroName)
            .map(({heroId, heroName}) => [heroId, heroName]));

        return [...heroes].map(([id, name]) => ({id, name}))
            .sort((left, right) =>
                left.name.localeCompare(right.name, 'es', {sensitivity: 'base'}));
    }
    get aspectOptions() {
        const aspects = new Set(this.decks.flatMap(getSelectedDeckAspects));

        return [...aspects].map(id => ({id, name: getAspectName(id)}))
            .sort((left, right) =>
                left.name.localeCompare(right.name, 'es', {sensitivity: 'base'}));
    }
    get creatorOptions() {
        return [...new Set(this.decks
            .map(deck => deck.creatorName)
            .filter(Boolean))]
            .sort((left, right) =>
                left.localeCompare(right, 'es', {sensitivity: 'base'}));
    }
    get sortedDecks() {
        return this.filteredDecks.slice().sort((left, right) =>
            compareDeckListItems(
                left,
                right,
                this.sortColumn,
                this.sortDirection,
            ));
    }
    handleFilter(event) {
        this.filter = event.target.value;
        this.syncFilterQuery();
    }
    handleScopeFilter(event) {
        this.scopeFilter = event.target.value;
        this.syncFilterQuery();
    }
    handleHeroFilter(event) {
        this.heroFilter = event.target.value;
        this.syncFilterQuery();
    }
    handleAspectFilter(event) {
        this.aspectFilter = event.target.value;
        this.syncFilterQuery();
    }
    handleCreatorFilter(event) {
        this.creatorFilter = event.target.value;
        this.syncFilterQuery();
    }
    handleClearFilters() {
        this.filter = '';
        this.heroFilter = '';
        this.aspectFilter = '';
        this.creatorFilter = '';
        this.scopeFilter = 'all';
        this.syncFilterQuery();
    }
    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.syncFilterQuery();
    }
    renderSortHeader(column, label, className = '') {
        const isSorted = this.sortColumn === column;
        const direction = this.sortDirection === 'asc' ? 'ascendente' : 'descendente';
        const indicator = isSorted ? (this.sortDirection === 'asc' ? '↑' : '↓') : '↕';
        const sortLabel = isSorted ?
            `${label}, orden ${direction}` :
            `${label}, sin ordenar`;

        return html`
            <span class="${className}">
                <button
                    class="sort-button"
                    type="button"
                    aria-label="${sortLabel}"
                    @click="${() => this.handleSort(column)}"
                >
                    ${label}
                    <span class="sort-indicator" aria-hidden="true">${indicator}</span>
                </button>
            </span>
        `;
    }
    handleCreate() {
        if (this.readOnly) {
            return;
        }
        dispatchComponentEvent(this, 'create-deck');
    }
    handleRestoreRepository() {
        if (this.readOnly || this.user?.isAdmin !== true) {
            return;
        }
        dispatchComponentEvent(this, 'restore-repository-decks');
    }
    handleSaveRepository() {
        if (this.readOnly || this.user?.isAdmin !== true) {
            return;
        }
        dispatchComponentEvent(this, 'save-repository-decks');
    }
    handleEdit(deck) {
        dispatchComponentEvent(this, 'edit-deck', {deck});
    }
    handleDelete(event, deck) {
        event.stopPropagation();
        if (this.readOnly || !deck.canEdit) {
            return;
        }
        dispatchComponentEvent(this, 'delete-deck', {deck});
    }
    handleFavorite(event, deck) {
        event.stopPropagation();
        if (this.readOnly || deck.canEdit || this.favoritePendingId) {
            return;
        }
        dispatchComponentEvent(this, 'favorite-deck', {deck});
    }
    handleLoginClick(event) {
        event.preventDefault();
        dispatchComponentEvent(this, 'navigate-route', {route: '/login'});
    }
    renderDeck(deck) {
        const aspectGradient = getDeckAspectGradient(deck);

        return html`
            <div
                class="deck-row ${getDeckAspectClass(deck)}"
                style="${aspectGradient ? `background-image: ${aspectGradient};` : ''}"
            >
                <md-list-item
                    class="deck-row-main"
                    type="button"
                    aria-label="${deck.canEdit ? 'Editar' : 'Ver'} mazo ${deck.name}"
                    ?disabled="${this.loading}"
                    @click="${() => this.handleEdit(deck)}"
                >
                    <div slot="headline" class="deck-row-fields">
                        <span class="deck-name">${deck.name}</span>
                        <span>
                            <span class="field-label">Héroe</span>
                            ${deck.heroName}
                        </span>
                        <span>
                            <span class="field-label">Aspecto</span>
                            ${getDeckAspectName(deck)}
                        </span>
                        <span>
                            <span class="field-label">Creador</span>
                            ${deck.creatorName || 'Desconocido'}
                        </span>
                        <span class="deck-size">
                            <span class="field-label">Cartas</span>
                            ${deck.validation.size}
                        </span>
                    </div>
                </md-list-item>
                <div class="deck-row-action">
                    ${this.readOnly ? '' : deck.canEdit ? html`
                        <md-text-button
                            type="button"
                            class="delete"
                            ?disabled="${this.loading}"
                            aria-label="Eliminar mazo ${deck.name}"
                            @click="${event => this.handleDelete(event, deck)}"
                        >
                            Eliminar
                        </md-text-button>
                    ` : html`
                        <md-text-button
                            type="button"
                            ?disabled="${this.loading || Boolean(this.favoritePendingId)}"
                            aria-label="${deck.isFavorite ?
                                'Quitar de favoritos' :
                                'Marcar como favorito'}: ${deck.name}"
                            aria-pressed="${deck.isFavorite}"
                            @click="${event => this.handleFavorite(event, deck)}"
                        >
                            ${deck.isFavorite ? 'Quitar favorito' : 'Marcar favorito'}
                        </md-text-button>
                    `}
                </div>
            </div>
        `;
    }
    renderDecks() {
        if (this.loading && !this.decks.length) {
            return html`<p role="status">Cargando mazos...</p>`;
        }
        if (!this.decks.length) {
            return html`<p>${this.readOnly ?
                'No hay mazos disponibles.' :
                'Aún no has creado mazos.'}</p>`;
        }
        if (!this.filteredDecks.length) {
            const scopeFilter = this.user ? this.scopeFilter : 'all';
            const message = scopeFilter === 'mine' ?
                'No tienes mazos propios que coincidan con el filtro.' :
                scopeFilter === 'favorites' ?
                    'No tienes mazos favoritos que coincidan con el filtro.' :
                    'No se encontraron mazos con ese filtro.';

            return html`<p>${message}</p>`;
        }

        return html`
            <section class="deck-table" aria-label="Mazos creados">
                <div class="deck-table-header">
                    ${this.renderSortHeader('name', 'Nombre')}
                    ${this.renderSortHeader('hero', 'Héroe')}
                    ${this.renderSortHeader('aspect', 'Aspecto')}
                    ${this.renderSortHeader('creator', 'Creador')}
                    ${this.renderSortHeader('size', 'Cartas', 'deck-size')}
                    <span aria-hidden="true"></span>
                </div>
                <div class="deck-rows">
                    ${this.sortedDecks.map(deck => this.renderDeck(deck))}
                </div>
            </section>
        `;
    }
    render() {
        return html`
            <section class="deck-list" aria-labelledby="deck-list-title">
                <div class="deck-list-heading">
                    <h2 id="deck-list-title">Mazos creados</h2>
                    ${this.readOnly ? html`
                        <div class="deck-list-actions">
                            <span>Modo de consulta. Inicia sesión para crear, editar o eliminar.</span>
                            <md-text-button
                                href="/login"
                                @click="${this.handleLoginClick.bind(this)}"
                            >
                                Iniciar sesión
                            </md-text-button>
                        </div>
                    ` : html`<div class="deck-list-actions">
                        ${this.user?.isAdmin === true ? html`
                            <md-text-button
                                type="button"
                                ?disabled="${this.loading}"
                                @click="${this.handleSaveRepository.bind(this)}"
                            >
                                Guardar copia en el catálogo
                            </md-text-button>
                            <md-text-button
                                type="button"
                                ?disabled="${this.loading}"
                                @click="${this.handleRestoreRepository.bind(this)}"
                            >
                                Restaurar del repositorio
                            </md-text-button>
                        ` : ''}
                        <md-filled-button
                            type="button"
                            ?disabled="${this.loading}"
                            @click="${this.handleCreate.bind(this)}"
                        >
                            Crear mazo
                        </md-filled-button>
                    </div>`}
                </div>
                <div class="deck-list-toolbar">
                    <div class="deck-filter">
                        <md-filled-text-field
                            label="Buscar por nombre"
                            type="search"
                            .value="${this.filter}"
                            @input="${this.handleFilter.bind(this)}"
                        ></md-filled-text-field>
                    </div>
                    ${this.user ? html`
                        <md-filled-select
                            label="Mostrar"
                            .value="${this.scopeFilter}"
                            @change="${this.handleScopeFilter.bind(this)}"
                        >
                            <md-select-option value="all">
                                <div slot="headline">Todos los mazos</div>
                            </md-select-option>
                            <md-select-option value="mine">
                                <div slot="headline">Solo mis mazos</div>
                            </md-select-option>
                            <md-select-option value="favorites">
                                <div slot="headline">Solo favoritos</div>
                            </md-select-option>
                        </md-filled-select>
                    ` : ''}
                    <md-filled-select
                        label="Filtrar por héroe"
                        .value="${this.heroFilter}"
                        @change="${this.handleHeroFilter.bind(this)}"
                    >
                        <md-select-option value="">
                            <div slot="headline">Todos los héroes</div>
                        </md-select-option>
                        ${this.heroOptions.map(hero => html`
                            <md-select-option value="${hero.id}">
                                <div slot="headline">${hero.name}</div>
                            </md-select-option>
                        `)}
                    </md-filled-select>
                    <md-filled-select
                        label="Filtrar por aspecto"
                        .value="${this.aspectFilter}"
                        @change="${this.handleAspectFilter.bind(this)}"
                    >
                        <md-select-option value="">
                            <div slot="headline">Todos los aspectos</div>
                        </md-select-option>
                        ${this.aspectOptions.map(aspect => html`
                            <md-select-option value="${aspect.id}">
                                <div slot="headline">${aspect.name}</div>
                            </md-select-option>
                        `)}
                    </md-filled-select>
                    <md-filled-select
                        label="Filtrar por creador"
                        .value="${this.creatorFilter}"
                        @change="${this.handleCreatorFilter.bind(this)}"
                    >
                        <md-select-option value="">
                            <div slot="headline">Todos los creadores</div>
                        </md-select-option>
                        ${this.creatorOptions.map(creator => html`
                            <md-select-option value="${creator}">
                                <div slot="headline">${creator}</div>
                            </md-select-option>
                        `)}
                    </md-filled-select>
                    <md-text-button
                        type="button"
                        ?disabled="${!this.hasActiveFilters}"
                        @click="${this.handleClearFilters.bind(this)}"
                    >
                        Limpiar filtros
                    </md-text-button>
                </div>
                ${this.loading && this.decks.length ?
                    html`<p role="status">Cargando...</p>` :
                    ''
                }
                ${this.renderDecks()}
            </section>
        `;
    }
}

if (!window.customElements.get(McDeckList.is)) {
    window.customElements.define(McDeckList.is, McDeckList);
}
