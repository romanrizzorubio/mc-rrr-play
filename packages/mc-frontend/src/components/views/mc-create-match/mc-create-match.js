import {LitElement, html} from 'lit-element';

import styles from './mc-create-match.css.js';
import '../../config/mc-form-player/mc-form-player.js';
import '../../config/mc-form-scenario/mc-form-scenario.js';
import '../../common/mc-panel/mc-panel.js';

const ID_PLAYER = 'player';
const ID_SCENARIO = 'scenario';
const compareSetNames = (left, right) =>
    left.name.localeCompare(right.name, 'es', {sensitivity: 'base'}) ||
    left.id.localeCompare(right.id);

export class McCreateMatch extends LitElement {
    static get is() {
        return 'mc-create-match';
    }
    static get styles() {
        return [styles];
    }

    static get properties() {
        return {
            name: {type: String},
            expert: {type: Boolean},
            player: {type: Object},
            scenario: {type: Object},
            heroesList: {type: Array},
            scenariosList: {type: Array},
            modularSetsList: {type: Array},
            selectedModularSets: {type: Array},
        };
    }

    constructor() {
        super();

        this.name = '';
        this.expert = false;
        this.player = {};
        this.scenario = {};
        this.heroesList = [];
        this.scenariosList = [];
        this.modularSetsList = [];
        this.selectedModularSets = [];
    }
    get disabled() {
        return !this.validate();
    }
    get elPlayer() {
        return this.shadowRoot.getElementById(ID_PLAYER);
    }
    get elScenario() {
        return this.shadowRoot.getElementById(ID_SCENARIO);
    }
    validate() {
        const {name, elPlayer, elScenario} = this;

        return name &&
            elPlayer && elPlayer.validate() &&
            elScenario && elScenario.validate();
    }
    handleClick() {
        const {name, expert, player, scenario} = this;

        this.dispatchEvent(new CustomEvent('create-match', {
            bubbles: true,
            composed: true,
            detail: {
                name, expert, player, scenario
            }
        }));
    }
    handleNameChange(e) {
        this.name = e.target.value;
    }
    handleExpertChange(e) {
        this.expert = e.target.checked;
    }
    handleScenarioChanged(e) {
        const {scenario} = e.detail;
        const configuredScenario = this.scenariosList.find(item => item.folder === scenario);
        const availableSetIds = new Set(this.modularSetsList.map(({id}) => id));

        this.selectedModularSets = [...new Set(configuredScenario.configuredSets)]
            .filter(id => availableSetIds.has(id));

        this.scenario = {
            scenario,
            modularSets: this.selectedModularSets,
        };
    }
    get sortedModularSets() {
        return [...this.modularSetsList].sort(compareSetNames);
    }
    get availableModularSets() {
        const selected = new Set(this.selectedModularSets);

        return this.sortedModularSets.filter(({id}) => !selected.has(id));
    }
    get chosenModularSets() {
        const selected = new Set(this.selectedModularSets);

        return this.sortedModularSets.filter(({id}) => selected.has(id));
    }
    addModularSet(id) {
        if (this.selectedModularSets.includes(id)) {
            return;
        }

        this.selectedModularSets = [...this.selectedModularSets, id];
        this.scenario = {
            ...this.scenario,
            modularSets: this.selectedModularSets,
        };
    }
    removeModularSet(id) {
        this.selectedModularSets = this.selectedModularSets.filter(setId => setId !== id);
        this.scenario = {
            ...this.scenario,
            modularSets: this.selectedModularSets,
        };
    }
    async handlePlayerChanged(e) {
        const {name, hero} = e.detail;

        this.player = {
            name,
            hero,
        };
    }
    renderButton() {
        return html`
            <md-filled-button
                class="button"
                .disabled="${this.disabled}"
                @click="${this.handleClick.bind(this)}"
            >
                Crear partida
            </md-filled-button>
        `;
    }
    renderMatch() {
        const {name} = this;

        return html`
            <mc-panel title="Partida">
                <md-filled-text-field
                    class="field field-match-name"
                    @change="${this.handleNameChange}"
                >${name}</md-filled-text-field>
                <label class="expert-mode">
                    <input
                        type="checkbox"
                        .checked="${this.expert}"
                        @change="${this.handleExpertChange.bind(this)}"
                    >
                    <span>Modo Experto</span>
                </label>
            </mc-panel>
        `;
    }
    renderPlayer() {
        const {heroesList} = this;

        return html`
            <mc-panel title="Jugador">
                <mc-form-player
                    id="${ID_PLAYER}"
                    hide-button
                    .heroesList="${heroesList}"
                    @player-change="${this.handlePlayerChanged.bind(this)}"
                >
                </mc-form-player>
            </mc-panel>
        `;
    }
    renderScenario() {
        const {scenariosList} = this;

        return html`
            <mc-panel title="Escenario">
                <mc-form-scenario
                    id="${ID_SCENARIO}"
                    .scenariosList="${scenariosList}"
                    @scenario-changed="${this.handleScenarioChanged.bind(this)}"
                >
                </mc-form-scenario>
            </mc-panel>
            `;
    }
    renderModularSets() {
        if (!this.scenario.scenario) {
            return html`
                <mc-panel title="Conjuntos modulares">
                    <p>Selecciona un escenario para configurar los conjuntos modulares.</p>
                </mc-panel>
            `;
        }

        return html`
            <mc-panel title="Conjuntos modulares">
                <div class="modular-sets">
                    <section aria-labelledby="available-sets-title">
                        <h3 id="available-sets-title">Disponibles</h3>
                        ${this.availableModularSets.length ? html`
                            <ul class="modular-set-list">
                                ${this.availableModularSets.map(set => html`
                                    <li>
                                        <button
                                            type="button"
                                            aria-label="Añadir ${set.name}"
                                            @click="${() => this.addModularSet(set.id)}"
                                        >
                                            <span>${set.name}</span>
                                            <span aria-hidden="true">+</span>
                                        </button>
                                    </li>
                                `)}
                            </ul>
                        ` : html`<p class="empty-list">No hay conjuntos disponibles.</p>`}
                    </section>
                    <section aria-labelledby="selected-sets-title">
                        <h3 id="selected-sets-title">Seleccionados</h3>
                        ${this.chosenModularSets.length ? html`
                            <ul class="modular-set-list">
                                ${this.chosenModularSets.map(set => html`
                                    <li>
                                        <button
                                            type="button"
                                            aria-label="Quitar ${set.name}"
                                            @click="${() => this.removeModularSet(set.id)}"
                                        >
                                            <span>${set.name}</span>
                                            <span aria-hidden="true">-</span>
                                        </button>
                                    </li>
                                `)}
                            </ul>
                        ` : html`<p class="empty-list">No hay conjuntos seleccionados.</p>`}
                    </section>
                </div>
            </mc-panel>
        `;
    }
    render() {
        return html`
            ${this.renderMatch()}
            ${this.renderPlayer()}
            ${this.renderScenario()}
            ${this.renderModularSets()}
            ${this.renderButton()}
        `;
    }
}

window.customElements.define(McCreateMatch.is, McCreateMatch);
