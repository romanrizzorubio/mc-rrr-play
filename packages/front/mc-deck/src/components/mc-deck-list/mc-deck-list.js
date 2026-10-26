import {LitElement, html} from 'lit-element';

import styles from './mc-deck-list.css.js';
import {
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
            filter: {type: String},
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
        this.filter = '';
        this.sortColumn = 'name';
        this.sortDirection = 'asc';
    }
    get filteredDecks() {
        const query = this.filter.trim().toLocaleLowerCase('es');
        if (!query) {
            return this.decks;
        }

        return this.decks.filter(deck => [
            deck.name,
            deck.heroName,
            getDeckAspectName(deck),
        ].some(value => value.toLocaleLowerCase('es').includes(query)));
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
    }
    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            return;
        }

        this.sortColumn = column;
        this.sortDirection = 'asc';
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
        dispatchComponentEvent(this, 'create-deck');
    }
    handleRestoreRepository() {
        dispatchComponentEvent(this, 'restore-repository-decks');
    }
    handleSaveRepository() {
        dispatchComponentEvent(this, 'save-repository-decks');
    }
    handleEdit(deck) {
        dispatchComponentEvent(this, 'edit-deck', {deck});
    }
    handleDelete(event, deck) {
        event.stopPropagation();
        dispatchComponentEvent(this, 'delete-deck', {deck});
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
                        <span class="deck-size">
                            <span class="field-label">Cartas</span>
                            ${deck.validation.size}
                        </span>
                    </div>
                </md-list-item>
                <div class="deck-row-action">
                    <md-text-button
                        type="button"
                        class="delete"
                        ?disabled="${this.loading}"
                        aria-label="Eliminar mazo ${deck.name}"
                        @click="${event => this.handleDelete(event, deck)}"
                    >
                        Eliminar
                    </md-text-button>
                </div>
            </div>
        `;
    }
    renderDecks() {
        if (this.loading && !this.decks.length) {
            return html`<p role="status">Cargando mazos...</p>`;
        }
        if (!this.decks.length) {
            return html`<p>Aún no has creado mazos.</p>`;
        }
        if (!this.filteredDecks.length) {
            return html`<p>No se encontraron mazos con ese filtro.</p>`;
        }

        return html`
            <section class="deck-table" aria-label="Mazos creados">
                <div class="deck-table-header">
                    ${this.renderSortHeader('name', 'Nombre')}
                    ${this.renderSortHeader('hero', 'Héroe')}
                    ${this.renderSortHeader('aspect', 'Aspecto')}
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
                    <div class="deck-list-actions">
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
                        <md-filled-button
                            type="button"
                            ?disabled="${this.loading}"
                            @click="${this.handleCreate.bind(this)}"
                        >
                            Crear mazo
                        </md-filled-button>
                    </div>
                </div>
                <div class="deck-list-toolbar">
                    <div class="deck-filter">
                        <md-filled-text-field
                            label="Buscar por nombre, héroe o aspecto"
                            type="search"
                            .value="${this.filter}"
                            @input="${this.handleFilter.bind(this)}"
                        ></md-filled-text-field>
                    </div>
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
