import {LitElement, html} from 'lit-element';

import {
    getSelectedDeckAspects,
    translateAspect,
} from 'mc-shared';
import {
    getDeckAspectClass,
    getDeckAspectGradient,
    getDeckCardCount,
} from '../../../utils/deck-presentation.js';
import styles from './mc-deck-picker.css.js';

export class McDeckPicker extends LitElement {
    static get is() {
        return 'mc-deck-picker';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            hero: {type: String},
            heroesList: {type: Array},
            decksList: {type: Array},
            selectedDeckId: {type: String},
            loadingDecks: {type: Boolean},
            hideCreateDeck: {type: Boolean, attribute: 'hide-create-deck'},
            deckNameFilter: {type: String},
            deckAspectFilter: {type: String},
        };
    }
    constructor() {
        super();

        this.hero = '';
        this.heroesList = [];
        this.decksList = [];
        this.selectedDeckId = '';
        this.loadingDecks = false;
        this.hideCreateDeck = false;
        this.deckNameFilter = '';
        this.deckAspectFilter = '';
    }
    willUpdate(changedProperties) {
        if (changedProperties.has('hero')) {
            this.clearDeckPickerFilters();
        }
    }
    get selectedHero() {
        return this.heroesList.find(hero =>
            (hero.id || hero.folder) === this.hero
        );
    }
    get preconDeck() {
        return {aspect: this.selectedHero?.preconAspect || ''};
    }
    get preconAspectGradient() {
        return getDeckAspectGradient(this.preconDeck);
    }
    get filteredDeckPickerDecks() {
        const name = this.deckNameFilter.trim().toLocaleLowerCase('es');

        return this.decksList.filter(deck => {
            const matchesName = !name ||
                deck.name.toLocaleLowerCase('es').includes(name);
            const matchesAspect = !this.deckAspectFilter ||
                getSelectedDeckAspects(deck).includes(this.deckAspectFilter);

            return matchesName && matchesAspect;
        });
    }
    get deckPickerAspectOptions() {
        return [...new Set(this.decksList.flatMap(getSelectedDeckAspects))]
            .map(id => ({id, name: this.getAspectName(id)}))
            .sort((left, right) =>
                left.name.localeCompare(right.name, 'es', {sensitivity: 'base'}));
    }
    get showPreconPickerOption() {
        const name = this.deckNameFilter.trim().toLocaleLowerCase('es');
        const matchesName = !name ||
            'precon (predeterminado)'.includes(name);

        return matchesName && !this.deckAspectFilter;
    }
    getAspectName(aspect) {
        return Array.isArray(aspect) ?
            aspect.map(translateAspect).filter(Boolean).join(', ') :
            translateAspect(aspect);
    }
    handleDeckNameFilter(event) {
        this.deckNameFilter = event.target.value;
    }
    handleDeckAspectFilter(event) {
        this.deckAspectFilter = event.target.value;
    }
    clearDeckPickerFilters() {
        this.deckNameFilter = '';
        this.deckAspectFilter = '';
    }
    handleDeckSelected(deckId) {
        if (deckId && !this.decksList.some(deck => deck.id === deckId)) {
            return;
        }

        this.selectedDeckId = deckId;
        this.dispatchEvent(new CustomEvent('deck-selected', {
            bubbles: true,
            composed: true,
            detail: {deckId},
        }));
    }
    handleDeckChoiceKeydown(event, deckId) {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        this.handleDeckSelected(deckId);
    }
    handleCreateDeck() {
        this.dispatchEvent(new CustomEvent('create-deck', {
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        const hasHero = Boolean(this.hero);
        const selectedHero = this.selectedHero;
        const selectedDeckId = this.selectedDeckId;
        const filteredDecks = this.filteredDeckPickerDecks;

        return html`
            <section class="deck-picker" aria-labelledby="deck-picker-title">
                <h3 id="deck-picker-title">
                    ${selectedHero ?
                        `Mazos de ${selectedHero.name}` :
                        'Mazos disponibles'}
                </h3>
                <div class="deck-picker-content">
                    ${hasHero ? html`
                    <p>Selecciona un mazo legal para este héroe.</p>
                    <div class="deck-picker-filters">
                        <md-filled-text-field
                            label="Buscar por nombre"
                            type="search"
                            .value="${this.deckNameFilter}"
                            @input="${this.handleDeckNameFilter.bind(this)}"
                        ></md-filled-text-field>
                        <md-filled-select
                            label="Filtrar por aspecto"
                            .value="${this.deckAspectFilter}"
                            @change="${this.handleDeckAspectFilter.bind(this)}"
                        >
                            <md-select-option value="">
                                <div slot="headline">Todos los aspectos</div>
                            </md-select-option>
                            ${this.deckPickerAspectOptions.map(aspect => html`
                                <md-select-option value="${aspect.id}">
                                    <div slot="headline">${aspect.name}</div>
                                </md-select-option>
                            `)}
                        </md-filled-select>
                        ${this.deckNameFilter || this.deckAspectFilter ? html`
                            <md-text-button
                                type="button"
                                @click="${this.clearDeckPickerFilters.bind(this)}"
                            >Limpiar filtros</md-text-button>
                        ` : ''}
                    </div>
                    ` : ''}
                    <table class="deck-picker-table">
                        <colgroup>
                            <col class="deck-name-column">
                            <col class="deck-aspect-column">
                            <col class="deck-count-column">
                            <col class="deck-creator-column">
                        </colgroup>
                        <thead>
                            <tr>
                                <th scope="col">Nombre</th>
                                <th scope="col">Aspecto</th>
                                <th scope="col">Número de cartas</th>
                                <th scope="col">Creador</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${!hasHero ? html`
                                <tr class="deck-picker-message">
                                    <td colspan="4">Elige un héroe para ver sus mazos.</td>
                                </tr>
                            ` : ''}
                            ${hasHero && this.showPreconPickerOption ? html`
                                <tr
                                    class="deck-choice precon-choice ${
                                        getDeckAspectClass(this.preconDeck)
                                    } ${selectedDeckId ? '' : 'selected'}"
                                    style="${this.preconAspectGradient ?
                                        `background-image: ${this.preconAspectGradient};` : ''}"
                                    role="button"
                                    tabindex="0"
                                    aria-label="Seleccionar mazo Precon"
                                    aria-pressed="${!selectedDeckId}"
                                    @click="${() => this.handleDeckSelected('')}"
                                    @keydown="${event =>
                                        this.handleDeckChoiceKeydown(event, '')}"
                                >
                                    <td>Precon (predeterminado)</td>
                                    <td>${selectedHero?.preconAspect ?
                                        this.getAspectName(selectedHero.preconAspect) :
                                        'Del héroe'}
                                    </td>
                                    <td>—</td>
                                    <td>Sistema</td>
                                </tr>
                            ` : ''}
                            ${hasHero && this.loadingDecks ? html`
                                <tr class="deck-picker-message">
                                    <td colspan="4" role="status">Cargando mazos...</td>
                                </tr>
                            ` : ''}
                            ${hasHero && !this.loadingDecks ? filteredDecks.map(deck => {
                                const aspectGradient = getDeckAspectGradient(deck);

                                return html`
                                    <tr
                                        class="deck-choice ${
                                            getDeckAspectClass(deck)
                                        } ${selectedDeckId === deck.id ? 'selected' : ''}"
                                        style="${aspectGradient ?
                                            `background-image: ${aspectGradient};` : ''}"
                                        role="button"
                                        tabindex="0"
                                        aria-label="Seleccionar mazo ${deck.name}"
                                        aria-pressed="${selectedDeckId === deck.id}"
                                        @click="${() =>
                                            this.handleDeckSelected(deck.id)}"
                                        @keydown="${event =>
                                            this.handleDeckChoiceKeydown(event, deck.id)}"
                                    >
                                        <td>${deck.name}</td>
                                        <td>${this.getAspectName(deck.aspect) || '—'}</td>
                                        <td>${getDeckCardCount(deck)}</td>
                                        <td>${deck.creatorName || 'Desconocido'}</td>
                                    </tr>
                                `;
                            }) : ''}
                            ${hasHero && !this.loadingDecks && !filteredDecks.length ? html`
                                <tr class="deck-picker-message">
                                    <td colspan="4">${
                                        this.showPreconPickerOption ?
                                            'No hay otros mazos legales guardados para este héroe.' :
                                            'No hay mazos que coincidan con los filtros.'
                                    }</td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
                ${hasHero && !this.hideCreateDeck ? html`
                    <div class="deck-picker-actions">
                        <md-text-button
                            type="button"
                            @click="${this.handleCreateDeck.bind(this)}"
                        >Crear mazo</md-text-button>
                    </div>
                ` : ''}
            </section>
        `;
    }
}

window.customElements.define(McDeckPicker.is, McDeckPicker);
