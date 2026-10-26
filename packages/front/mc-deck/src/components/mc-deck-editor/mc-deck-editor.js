import {LitElement, html} from 'lit-element';

import '../mc-deck-selected-cards/mc-deck-selected-cards.js';
import '../mc-deck-card-pool/mc-deck-card-pool.js';
import styles from './mc-deck-editor.css.js';
import {
    getAspectName,
    getDeckComposition,
} from '../../utils/deck-presentation.js';
import {dispatchComponentEvent} from '../../utils/dispatch-component-event.js';
import {getSelectedDeckAspects} from 'mc-shared';

export class McDeckEditor extends LitElement {
    static get is() {
        return 'mc-deck-editor';
    }
    static get properties() {
        return {
            deck: {type: Object},
            catalog: {type: Object},
            deckSize: {type: Number},
            selectedCards: {type: Array},
            availableCards: {type: Array},
            search: {type: String},
            saving: {type: Boolean},
        };
    }
    static get styles() {
        return [styles];
    }
    constructor() {
        super();

        this.deck = null;
        this.catalog = null;
        this.deckSize = 0;
        this.selectedCards = [];
        this.availableCards = [];
        this.search = '';
        this.saving = false;
    }
    handleNameChange(event) {
        dispatchComponentEvent(this, 'deck-update', {
            changes: {name: event.target.value},
        });
    }
    handleAspectChange(event) {
        dispatchComponentEvent(this, 'deck-update', {
            changes: {aspect: event.target.value},
        });
    }
    handleAspectToggle(aspect, event) {
        const selectedAspects = new Set(getSelectedDeckAspects(this.deck));
        if (event.target.checked) {
            selectedAspects.add(aspect);
        } else {
            selectedAspects.delete(aspect);
        }
        dispatchComponentEvent(this, 'deck-update', {
            changes: {
                aspect: [...selectedAspects],
            },
        });
    }
    handleSave() {
        dispatchComponentEvent(this, 'save-deck');
    }
    handleClose() {
        dispatchComponentEvent(this, 'close-deck');
    }
    renderValidation() {
        const {validation} = this.deck;
        if (!validation) {
            return '';
        }

        return html`
            <div class="validation ${validation.legal ? 'legal' : 'draft'}" role="status">
                ${validation.legal ? html`Mazo legal.` : html`
                    <strong>Este mazo se guardó como borrador:</strong>
                    <ul>${validation.errors.map(error => html`<li>${error}</li>`)}</ul>
                `}
            </div>
        `;
    }
    renderAspectSelector() {
        const aspectCount = this.catalog.hero.deckBuildingRules?.aspectCount ?? 1;
        if (aspectCount <= 1) {
            return html`
                <md-filled-select
                    label="Aspecto"
                    .value="${this.deck.aspect}"
                    @change="${this.handleAspectChange.bind(this)}"
                >
                    <md-select-option value="">
                        <div slot="headline">Selecciona un aspecto</div>
                    </md-select-option>
                    ${this.catalog.aspects.map(aspect => html`
                        <md-select-option value="${aspect.id}">
                            <div slot="headline">${getAspectName(aspect.id)}</div>
                        </md-select-option>
                    `)}
                </md-filled-select>
            `;
        }

        const selectedAspects = getSelectedDeckAspects(this.deck);

        return html`
            <fieldset class="aspect-selection">
                <legend>Aspectos (elige ${aspectCount})</legend>
                <div class="aspect-options">
                    ${this.catalog.aspects.map(aspect => html`
                        <label>
                            <input
                                type="checkbox"
                                .checked="${selectedAspects.includes(aspect.id)}"
                                ?disabled="${!selectedAspects.includes(aspect.id) &&
                                    selectedAspects.length >= aspectCount}"
                                @change="${event =>
                                    this.handleAspectToggle(aspect.id, event)}"
                            >
                            ${getAspectName(aspect.id)}
                        </label>
                    `)}
                </div>
            </fieldset>
            ${selectedAspects.length === aspectCount &&
                this.catalog.hero.deckBuildingRules?.equalAspectCardCounts ? html`
                <p class="aspect-rule">
                    Incluye la misma cantidad de cartas de cada aspecto seleccionado.
                </p>
            ` : ''}
        `;
    }
    render() {
        const composition = getDeckComposition(
            this.selectedCards,
            getSelectedDeckAspects(this.deck),
        );

        return html`
            <section class="editor" aria-labelledby="editor-title">
                <div class="section-heading">
                    <h2 id="editor-title">${this.deck.id ? 'Editar mazo' : 'Nuevo mazo'}</h2>
                    <div class="section-actions">
                        <md-text-button type="button" @click="${this.handleClose.bind(this)}">
                            Cerrar
                        </md-text-button>
                        <md-filled-button
                            type="button"
                            class="save-button"
                            ?disabled="${this.saving}"
                            @click="${this.handleSave.bind(this)}"
                        >
                            ${this.saving ? 'Guardando...' : 'Guardar'}
                        </md-filled-button>
                    </div>
                </div>
                <div class="field">
                    <md-filled-text-field
                        label="Nombre del mazo"
                        maxlength="100"
                        .value="${this.deck.name}"
                        @input="${this.handleNameChange.bind(this)}"
                    ></md-filled-text-field>
                </div>
                <div class="field">
                    ${this.renderAspectSelector()}
                </div>
                <p class="deck-size">
                    Tamaño: <strong>${this.deckSize}</strong> / 40–50 cartas.
                    Incluye las ${this.catalog.hero.baseCardCount} cartas fijas del héroe;
                    estas no se guardan en el mazo editable.
                </p>
                <p class="draft-help">
                    Puedes guardar borradores; solo los mazos legales aparecen al crear partidas.
                </p>
                ${this.renderValidation()}
                <div class="deck-editor-grid">
                    <mc-deck-selected-cards .cards="${this.selectedCards}"></mc-deck-selected-cards>
                    <div
                        class="deck-editor-middle"
                        role="group"
                        aria-label="Resumen y acciones del mazo"
                    >
                        <div class="deck-editor-middle-counts">
                            <p>Mazo actual: <strong>${this.deckSize}</strong> cartas</p>
                            ${composition.length ? html`
                                <p class="deck-composition" aria-label="Composición del mazo">
                                    <strong>Composición:</strong>
                                    ${composition.map((group, index) => html`
                                        ${index ? html`<span aria-hidden="true"> · </span>` : ''}
                                        <span>${group.label}: <strong>${group.count}</strong></span>
                                    `)}
                                </p>
                            ` : ''}
                        </div>
                        <div class="section-actions">
                            <md-text-button
                                type="button"
                                @click="${this.handleClose.bind(this)}"
                            >
                                Cancelar
                            </md-text-button>
                            <md-filled-button
                                type="button"
                                class="save-button"
                                ?disabled="${this.saving}"
                                @click="${this.handleSave.bind(this)}"
                            >
                                ${this.saving ? 'Guardando...' : 'Guardar'}
                            </md-filled-button>
                        </div>
                    </div>
                    <mc-deck-card-pool
                        .cards="${this.availableCards}"
                        .search="${this.search}"
                        .deckAspects="${getSelectedDeckAspects(this.deck)}"
                    ></mc-deck-card-pool>
                </div>
            </section>
        `;
    }
}

if (!window.customElements.get(McDeckEditor.is)) {
    window.customElements.define(McDeckEditor.is, McDeckEditor);
}
