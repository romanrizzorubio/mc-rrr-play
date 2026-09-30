import {LitElement, html} from 'lit-element';

import styles from './mc-form-scenario.css.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';

export class McFormScenario extends LitElement {
    static get is() {
        return 'mc-form-scenario';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            scenario: {type: String},
            scenariosList: {type: Array},
        };
    }
    constructor() {
        super();

        this.scenario = '';
        this.scenariosList = [];
    }
    validate() {
        return !!this.scenario;
    }
    handleScenarioChange(e) {
        this.scenario = e.target.value;

        this.dispatchEvent(new CustomEvent('scenario-changed', {
            detail: {
                scenario: this.scenario,
            }
        }));
    }
    renderSelectOption(item) {
        return html`
            <md-select-option value="${item.folder}">
                <div slot="headline">${item.name}</div>
            </md-select-option>
        `;
    }
    renderSelectOptions() {
        const {scenariosList} = this;

        return scenariosList.map(this.renderSelectOption.bind(this));
    }
    renderSelect() {
        return html`
              <md-filled-select
                  label="Escenario"
                  required
                  @change="${this.handleScenarioChange}"
              >
                  ${this.renderSelectOptions()}
              </md-filled-select>
        `;
    }
    render() {
        return html`
            ${this.renderSelect()}
        `;
    }
}

window.customElements.define(McFormScenario.is, McFormScenario);
