import {LitElement, html} from 'lit-element';
import {translateTrait} from 'mc-shared';

import styles from './mc-deck-card-pool.css.js';
import '../shared/mc-deck-card-economy.js';
import {
    getAspectName,
    getCardCategoryClass,
    getCardImageUrl,
    getCardOriginName,
    getCardTypeName,
    matchesDeckAspectFilter,
} from '../../utils/deck-presentation.js';
import {dispatchComponentEvent} from '../../utils/dispatch-component-event.js';
import {compareDeckPoolCards} from '../../utils/deck-card-pool-sort.js';
import {
    getCardTraits,
    matchesCardTraitFilter,
    NO_TRAITS_FILTER,
} from '../../utils/deck-card-traits.js';

export class McDeckCardPool extends LitElement {
    static get is() {
        return 'mc-deck-card-pool';
    }
    static get properties() {
        return {
            cards: {type: Array},
            search: {type: String},
            deckAspects: {type: Array},
            typeFilter: {type: String},
            aspectFilter: {type: String},
            traitFilter: {type: String},
            addCounts: {type: Object},
            previewCard: {type: Object},
            sortColumn: {type: String},
            sortDirection: {type: String},
        };
    }
    static get styles() {
        return [styles];
    }
    constructor() {
        super();

        this.cards = [];
        this.search = '';
        this.deckAspects = [];
        this.typeFilter = 'all';
        this.aspectFilter = 'all';
        this.traitFilter = 'all';
        this.addCounts = {};
        this.previewCard = null;
        this.sortColumn = 'name';
        this.sortDirection = 'asc';
    }
    updated(changedProperties) {
        if (changedProperties.has('deckAspects')) {
            this.aspectFilter = 'all';
        }
        if (changedProperties.has('cards')) {
            this.addCounts = {};
            if (this.typeFilter !== 'all' &&
                !this.cards.some(card => card.type === this.typeFilter)) {
                this.typeFilter = 'all';
            }
            if (this.traitFilter !== 'all' &&
                this.traitFilter !== NO_TRAITS_FILTER &&
                !this.traitOptions.includes(this.traitFilter)) {
                this.traitFilter = 'all';
            }
            if (this.traitFilter === NO_TRAITS_FILTER &&
                !this.cards.some(card => !getCardTraits(card).length)) {
                this.traitFilter = 'all';
            }
        }
    }
    handleSearch(event) {
        dispatchComponentEvent(this, 'card-search-changed', {
            search: event.target.value,
        });
    }
    handleTypeFilter(event) {
        this.typeFilter = event.target.value;
    }
    handleAspectFilter(event) {
        this.aspectFilter = event.target.value;
    }
    handleTraitFilter(event) {
        this.traitFilter = event.target.value;
    }
    handleSort(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            return;
        }

        this.sortColumn = column;
        this.sortDirection = 'asc';
    }
    handleAddCountChanged(event, card) {
        const input = event.target;
        const requestedCount = Number(input.value);
        if (!Number.isInteger(requestedCount) || requestedCount < 1) {
            input.value = String(this.addCountFor(card));
            return;
        }

        this.addCounts = {
            ...this.addCounts,
            [card.id]: Math.min(Math.max(1, requestedCount), card.maxAddCount),
        };
    }
    handleAdd(card) {
        dispatchComponentEvent(this, 'add-card', {
            cardId: card.id,
            count: this.addCountFor(card),
        });
    }
    handleImageClick(card) {
        this.previewCard = card;
    }
    handlePreviewClose() {
        this.previewCard = null;
    }
    get cardTypes() {
        return [...new Set(this.cards.map(card => card.type))]
            .filter(Boolean)
            .sort((left, right) =>
                getCardTypeName(left).localeCompare(getCardTypeName(right), 'es', {
                    sensitivity: 'base',
                }));
    }
    get traitOptions() {
        return [...new Set(this.cards.flatMap(card => getCardTraits(card)))]
            .sort((left, right) =>
                translateTrait(left).localeCompare(translateTrait(right), 'es', {
                    sensitivity: 'base',
                }));
    }
    get filteredCards() {
        const query = this.search.trim().toLocaleLowerCase('es');

        return this.cards
            .filter(card => this.typeFilter === 'all' || card.type === this.typeFilter)
            .filter(card => matchesDeckAspectFilter(
                card,
                this.aspectFilter,
                this.deckAspects,
            ))
            .filter(card => matchesCardTraitFilter(card, this.traitFilter))
            .filter(card => !query || [
                card.name,
                getCardTypeName(card.type),
                getCardOriginName(card),
                ...getCardTraits(card).flatMap(trait => [
                    trait,
                    translateTrait(trait),
                ]),
            ].some(value => value.toLocaleLowerCase('es').includes(query)))
            .sort((left, right) => compareDeckPoolCards(
                left,
                right,
                this.sortColumn,
                this.sortDirection,
            ));
    }
    renderSortHeader(column, label) {
        const isSorted = this.sortColumn === column;
        const direction = this.sortDirection === 'asc' ? 'ascending' : 'descending';
        const indicator = isSorted ? (this.sortDirection === 'asc' ? '↑' : '↓') : '↕';

        return html`
            <th scope="col" aria-sort="${isSorted ? direction : 'none'}">
                <button
                    class="sort-button"
                    type="button"
                    @click="${() => this.handleSort(column)}"
                >
                    ${label}
                    <span class="sort-indicator" aria-hidden="true">${indicator}</span>
                </button>
            </th>
        `;
    }
    addCountFor(card) {
        if (!card.maxAddCount) {
            return 0;
        }

        return Math.min(this.addCounts[card.id] || 1, card.maxAddCount);
    }
    renderTraits(card) {
        const traits = getCardTraits(card);
        if (!traits.length) {
            return '—';
        }

        return traits.flatMap((trait, index) => [
            ...(index ?
                [html`
                    <span class="trait-separator-space" aria-hidden="true">&nbsp;</span>
                    <span class="trait-separator" aria-hidden="true">.</span>
                    <span class="trait-separator-space" aria-hidden="true">&nbsp;</span>
                `] :
                []),
            html`<span>${translateTrait(trait)}</span>`,
        ]);
    }
    renderCard(card) {
        const imageUrl = getCardImageUrl(card);
        const addCount = this.addCountFor(card);

        return html`
            <tr id="${card.id}" class="${getCardCategoryClass(card)}">
                <td>
                    <div class="card-cell">
                        ${imageUrl ? html`
                            <button
                                class="card-image-button"
                                type="button"
                                aria-label="Ampliar imagen de ${card.name}"
                                @click="${() => this.handleImageClick(card)}"
                            >
                                <img src="${imageUrl}" alt="">
                            </button>
                        ` : ''}
                        <div class="card-cell-info">
                            <strong class="card-name">${card.name}</strong>
                            <mc-deck-card-economy
                                .cost="${card.cost}"
                                .resources="${card.resources}"
                                .showCost="${false}"
                            ></mc-deck-card-economy>
                        </div>
                    </div>
                </td>
                <td>${getCardTypeName(card.type)}</td>
                <td>${getCardOriginName(card)}</td>
                <td class="traits-cell">
                    ${this.renderTraits(card)}
                </td>
                <td class="cost-cell">${card.cost ?? 0}</td>
                <td>
                    ${card.maxAddCount === 1 ? html`
                        <span class="fixed-count">×1</span>
                    ` : card.maxAddCount > 1 ? html`
                        <input
                            class="copy-count"
                            type="number"
                            min="1"
                            max="${card.maxAddCount}"
                            step="1"
                            aria-label="Copias de ${card.name} para añadir"
                            .value="${String(addCount)}"
                            @change="${event => this.handleAddCountChanged(event, card)}"
                        >
                    ` : html`<span class="fixed-count" aria-label="Sin copias disponibles">—</span>`}
                </td>
                <td class="add-action">
                    <md-filled-button
                        type="button"
                        ?disabled="${card.maxAddCount === 0}"
                        aria-label="Añadir ${this.addCountFor(card)} copias de ${card.name}"
                        @click="${() => this.handleAdd(card)}"
                    >
                        Añadir
                    </md-filled-button>
                </td>
            </tr>
        `;
    }
    render() {
        return html`
            <section aria-labelledby="card-pool-title">
                <h3 id="card-pool-title">Cartas disponibles</h3>
                <div class="field">
                    <md-filled-text-field
                        label="Buscar carta"
                        type="search"
                        .value="${this.search}"
                        @input="${this.handleSearch.bind(this)}"
                    ></md-filled-text-field>
                </div>
                <div class="filters">
                    <md-filled-select
                        label="Filtrar por tipo"
                        .value="${this.typeFilter}"
                        @change="${this.handleTypeFilter.bind(this)}"
                    >
                        <md-select-option value="all">
                            <div slot="headline">Todos los tipos</div>
                        </md-select-option>
                        ${this.cardTypes.map(type => html`
                            <md-select-option value="${type}">
                                <div slot="headline">${getCardTypeName(type)}</div>
                            </md-select-option>
                        `)}
                    </md-filled-select>
                    <md-filled-select
                        label="Filtrar por aspecto"
                        .value="${this.aspectFilter}"
                        @change="${this.handleAspectFilter.bind(this)}"
                    >
                        <md-select-option value="all">
                            <div slot="headline">
                                ${this.deckAspects.length ?
                                    'Aspectos del mazo y básicas' :
                                    'Todos los aspectos y básicas'
                                }
                            </div>
                        </md-select-option>
                        ${this.deckAspects.map(aspect => html`
                            <md-select-option value="${aspect}">
                                <div slot="headline">${getAspectName(aspect)}</div>
                            </md-select-option>
                        `)}
                        <md-select-option value="basic">
                            <div slot="headline">Básicas</div>
                        </md-select-option>
                    </md-filled-select>
                    <md-filled-select
                        label="Filtrar por rasgo"
                        .value="${this.traitFilter}"
                        @change="${this.handleTraitFilter.bind(this)}"
                    >
                        <md-select-option value="all">
                            <div slot="headline">Todos los rasgos</div>
                        </md-select-option>
                        ${this.traitOptions.map(trait => html`
                            <md-select-option value="${trait}">
                                <div class="trait-label" slot="headline">${translateTrait(trait)}</div>
                            </md-select-option>
                        `)}
                        ${this.cards.some(card => !getCardTraits(card).length) ? html`
                            <md-select-option value="${NO_TRAITS_FILTER}">
                                <div slot="headline">Sin rasgos</div>
                            </md-select-option>
                        ` : ''}
                    </md-filled-select>
                </div>
                <div class="table-wrap">
                    <table>
                        <caption class="visually-hidden">Cartas disponibles para añadir al mazo</caption>
                        <thead>
                            <tr>
                                ${this.renderSortHeader('name', 'Carta')}
                                ${this.renderSortHeader('type', 'Tipo')}
                                ${this.renderSortHeader('aspect', 'Aspecto')}
                                ${this.renderSortHeader('traits', 'Rasgos')}
                                ${this.renderSortHeader('cost', 'Coste')}
                                ${this.renderSortHeader('copies', 'Copias')}
                                <th scope="col"><span class="visually-hidden">Añadir</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.filteredCards.length ? this.filteredCards.map(card =>
                                this.renderCard(card)) : html`
                                <tr>
                                    <td colspan="7">No hay cartas que coincidan con los filtros.</td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <mc-card-image-dialog
                    .open="${Boolean(this.previewCard)}"
                    .title="${this.previewCard?.name || ''}"
                    .imageUrl="${this.previewCard ? getCardImageUrl(this.previewCard) : ''}"
                    @close-card-image-dialog="${this.handlePreviewClose.bind(this)}"
                ></mc-card-image-dialog>
            </section>
        `;
    }
}

if (!window.customElements.get(McDeckCardPool.is)) {
    window.customElements.define(McDeckCardPool.is, McDeckCardPool);
}
