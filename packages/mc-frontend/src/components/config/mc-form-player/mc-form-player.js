import {LitElement, html} from 'lit-element';
import styles from './mc-form-player.css.js';

import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/switch/switch.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';

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
            hideButton: {type: Boolean, attribute: 'hide-button'},
        };
    }
    constructor() {
        super();

        this.name = '';
        this.hero = '';
        this.heroesList = [];
        this.hideButton = false;
    }
    dispatchChange() {
        const {name, hero} = this;

        this.dispatchEvent(new CustomEvent('player-change', {
            bubbles: true,
            composed: true,
            detail: {
                name: name,
                hero: hero,
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

        this.dispatchChange();
    }
    renderSelectOption(item) {
        return html`
            <md-select-option value="${item.folder}">
                <div slot="headline">${item.name}</div>
            </md-select-option>
        `;
    }
    renderSelectOptions() {
        const {heroesList} = this;

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
            ${this.renderButton()}
        `;
    }
}

window.customElements.define(McFormPlayer.is, McFormPlayer);
