import {LitElement, html} from 'lit-element';

import styles from './mc-form-player.css.js';

export class McFormPlayer extends LitElement {
    static get is() {
        return 'mc-form-player';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            name: {type: String},
            hero: {type: String},
            heroesList: {type: Array},
            decksList: {type: Array},
            deckId: {type: String},
            loadingDecks: {type: Boolean},
            hideButton: {type: Boolean, attribute: 'hide-button'},
        };
    }
    constructor() {
        super();

        this.name = '';
        this.hero = '';
        this.heroesList = [];
        this.decksList = [];
        this.deckId = 'precon';
        this.loadingDecks = false;
        this.hideButton = false;
    }
    dispatchChange() {
        const {name, hero, deckId} = this;

        this.dispatchEvent(new CustomEvent('player-change', {
            bubbles: true,
            composed: true,
            detail: {
                name: name,
                hero: hero,
                deckId: deckId === 'precon' ? '' : deckId,
            }
        }));
    }
    validate() {
        return !!this.name && !!this.hero;
    }
    handleNameChange(e) {
        e.stopPropagation();

        this.name = e.target.value;

        this.dispatchChange();
    }
    handleHeroChange(e) {
        e.stopPropagation();

        this.hero = e.target.value;
        this.deckId = 'precon';

        this.dispatchChange();
    }
    handleDeckChange(e) {
        e.stopPropagation();

        this.deckId = e.target.value;

        this.dispatchChange();
    }
    renderSelectOption(item) {
        return html`
            <md-select-option value="${item.id || item.folder}">
                <div slot="headline">${item.name}</div>
            </md-select-option>
        `;
    }
    renderSelectOptions() {
        const heroesList = [...this.heroesList].sort((left, right) =>
            left.name.localeCompare(right.name, 'es', {sensitivity: 'base'})
        );

        return heroesList.map(this.renderSelectOption.bind(this));
    }
    renderSelect() {
        return html`
              <md-filled-select
                  label="Héroe"
                  value="${this.hero}"
                  required
                  @change="${this.handleHeroChange.bind(this)}"
              >
                  ${this.renderSelectOptions()}
              </md-filled-select>
        `;
    }
    renderDeckSelect() {
        return html`
            <md-filled-select
                label="Mazo"
                value="${this.deckId}"
                ?disabled="${!this.hero || this.loadingDecks}"
                @change="${this.handleDeckChange.bind(this)}"
            >
                <md-select-option value="precon">
                    <div slot="headline">Precon (predeterminado)</div>
                </md-select-option>
                ${this.decksList.map(deck => html`
                    <md-select-option value="${deck.id}">
                        <div slot="headline">${deck.name}</div>
                    </md-select-option>
                `)}
            </md-filled-select>
        `;
    }
    renderName() {
        return html`
            <md-filled-text-field
                label="Nombre"
                value="${this.name}"
                required
                @change="${this.handleNameChange.bind(this)}"
            >
            </md-filled-text-field>
        `;
    }
    renderButton() {
        const {hideButton} = this;

        return hideButton ? '' :html`
            <md-filled-button
                @click="${this.handleOk.bind(this)}"
            >
                Crear Jugador
            </md-filled-button>
        `;
    }
    render() {
        return html`
            ${this.renderName()}
            ${this.renderSelect()}
            ${this.renderDeckSelect()}
            ${this.renderButton()}
        `;
    }
}

window.customElements.define(McFormPlayer.is, McFormPlayer);
