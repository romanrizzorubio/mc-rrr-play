import {LitElement, html} from 'lit-element';

import styles from './mc-create-match.css.js';
import '../../config/mc-form-player/mc-form-player.js';
import '../../config/mc-form-scenario/mc-form-scenario.js';
import '../../common/mc-panel/mc-panel.js';

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
            currentStep: {type: Number},
            expert: {type: Boolean},
            player: {type: Object},
            scenario: {type: Object},
            heroesList: {type: Array},
            configMatch: {attribute: false},
            decksList: {type: Array},
            loadingDecks: {type: Boolean},
            deckLoadError: {type: String},
            scenariosList: {type: Array},
            modularSetsList: {type: Array},
            selectedModularSets: {type: Array},
        };
    }

    constructor() {
        super();

        this.name = 'RRR';
        this.currentStep = 1;
        this.expert = false;
        this.player = {name: 'RRR'};
        this.scenario = {};
        this.heroesList = [];
        this.configMatch = null;
        this.decksList = [];
        this.loadingDecks = false;
        this.deckLoadError = '';
        this.deckListHero = '';
        this.deckListRequestSequence = 0;
        this.scenariosList = [];
        this.modularSetsList = [];
        this.selectedModularSets = [];
    }
    get disabled() {
        return !this.validate();
    }
    validateFirstStep() {
        const {name, player} = this;

        return Boolean(name && player.name && player.hero);
    }
    validateSecondStep() {
        return Boolean(this.scenario.scenario);
    }
    validate() {
        return this.validateFirstStep() &&
            this.validateSecondStep();
    }
    handleNext() {
        if (!this.validateFirstStep()) {
            return;
        }

        this.currentStep = 2;
    }
    handleBack() {
        this.currentStep = 1;
    }
    handleClick() {
        if (this.currentStep !== 2 || !this.validate()) {
            return;
        }

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
        const requiredSetIds = new Set(
            configuredScenario.requiredSets.map(({id}) => id)
        );

        this.selectedModularSets = [...new Set(configuredScenario.defaultModularSets || [])]
            .filter(id => availableSetIds.has(id) && !requiredSetIds.has(id));

        this.scenario = {
            scenario,
            modularSets: this.selectedModularSets,
        };
    }
    get requiredSets() {
        const configuredScenario = this.scenariosList.find(
            item => item.folder === this.scenario.scenario
        );

        return configuredScenario?.requiredSets || [];
    }
    get requiredSetIds() {
        return new Set(this.requiredSets.map(({id}) => id));
    }
    get requiredSetNames() {
        return this.requiredSets.map(({id, name}) =>
            id === 'standard' ? 'Normal' : name);
    }
    get sortedModularSets() {
        return [...this.modularSetsList].sort(compareSetNames);
    }
    get availableModularSets() {
        const selected = new Set(this.selectedModularSets);
        const required = this.requiredSetIds;

        return this.sortedModularSets.filter(({id}) =>
            !selected.has(id) && !required.has(id));
    }
    get chosenModularSets() {
        const selected = new Set(this.selectedModularSets);

        return this.sortedModularSets.filter(({id}) => selected.has(id));
    }
    addModularSet(id) {
        if (this.selectedModularSets.includes(id) ||
            this.requiredSetIds.has(id)) {
            return;
        }

        this.selectedModularSets = [...this.selectedModularSets, id];
        this.scenario = {
            ...this.scenario,
            modularSets: this.selectedModularSets,
        };
    }
    removeModularSet(id) {
        if (this.requiredSetIds.has(id)) {
            return;
        }

        this.selectedModularSets = this.selectedModularSets.filter(setId => setId !== id);
        this.scenario = {
            ...this.scenario,
            modularSets: this.selectedModularSets,
        };
    }
    async handlePlayerChanged(e) {
        const {name, hero, deckId} = e.detail;

        this.player = {
            name,
            hero,
            ...(deckId ? {deckId} : {}),
        };

        if (hero !== this.deckListHero) {
            this.deckListHero = hero;
            this.deckListRequestSequence++;
            const requestSequence = this.deckListRequestSequence;
            this.decksList = [];
            this.deckLoadError = '';
            this.loadingDecks = Boolean(hero);
            if (hero && this.configMatch) {
                try {
                    const decksList = await this.configMatch.getDecksList(hero, true);
                    if (requestSequence === this.deckListRequestSequence) {
                        this.decksList = decksList;
                    }
                } catch (error) {
                    if (requestSequence === this.deckListRequestSequence) {
                        this.deckLoadError = error.message;
                        this.dispatchEvent(new CustomEvent('communication-error', {
                            bubbles: true,
                            composed: true,
                            detail: {
                                message: `No se pudieron cargar los mazos de este héroe: ${error.message}`,
                            },
                        }));
                    }
                } finally {
                    if (requestSequence === this.deckListRequestSequence) {
                        this.loadingDecks = false;
                    }
                }
            }
        }

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
    renderStepActions() {
        if (this.currentStep === 1) {
            return html`
                <div class="step-actions step-actions-next">
                    <md-filled-button
                        class="button"
                        .disabled="${!this.validateFirstStep()}"
                        @click="${this.handleNext.bind(this)}"
                    >
                        Continuar
                    </md-filled-button>
                </div>
            `;
        }

        return html`
            <div class="step-actions">
                <md-text-button @click="${this.handleBack.bind(this)}">
                    Volver
                </md-text-button>
                ${this.renderButton()}
            </div>
        `;
    }
    renderMatch() {
        const {name} = this;

        return html`
            <mc-panel title="Partida">
                <md-filled-text-field
                    class="field field-match-name"
                    .value="${name}"
                    @change="${this.handleNameChange}"
                ></md-filled-text-field>
            </mc-panel>
        `;
    }
    renderPlayer() {
        const {heroesList, player} = this;

        return html`
            <mc-panel title="Jugador">
                <mc-form-player
                    hide-button
                    .heroesList="${heroesList}"
                    .decksList="${this.decksList}"
                    .loadingDecks="${this.loadingDecks}"
                    .name="${player.name || ''}"
                    .hero="${player.hero || ''}"
                    .deckId="${player.deckId || 'precon'}"
                    @player-change="${this.handlePlayerChanged.bind(this)}"
                >
                </mc-form-player>
                ${this.deckLoadError ? html`
                    <p role="alert">No se pudieron cargar los mazos guardados: ${this.deckLoadError}</p>
                ` : ''}
            </mc-panel>
        `;
    }
    renderScenario() {
        const {scenariosList, scenario} = this;

        return html`
            <mc-panel title="Escenario">
                <mc-form-scenario
                    .scenariosList="${scenariosList}"
                    .scenario="${scenario.scenario || ''}"
                    @scenario-changed="${this.handleScenarioChanged.bind(this)}"
                >
                </mc-form-scenario>
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
                ${this.requiredSets.length ? html`
                    <section class="required-modular-sets" aria-labelledby="required-sets-title">
                        <h3 id="required-sets-title">Obligatorios</h3>
                        <p class="required-modular-set-names">
                            ${this.requiredSetNames.join(', ')}
                        </p>
                    </section>
                ` : ''}
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
        const firstStep = this.currentStep === 1;
        const stepTitle = firstStep ?
            'Partida y Jugador' :
            'Escenario y Conjuntos modulares';

        return html`
            <p class="step-status" role="status" aria-live="polite">
                Paso ${this.currentStep} de 2: ${stepTitle}
            </p>
            ${firstStep ? html`
                ${this.renderMatch()}
                ${this.renderPlayer()}
            ` : html`
                ${this.renderScenario()}
                ${this.renderModularSets()}
            `}
            ${this.renderStepActions()}
        `;
    }
}

window.customElements.define(McCreateMatch.is, McCreateMatch);
