import {LitElement, html} from 'lit-element';

import styles from './mc-create-match.css.js';
import '../../config/mc-form-player/mc-form-player.js';
import '../../config/mc-form-scenario/mc-form-scenario.js';
import '../../common/mc-panel/mc-panel.js';

const ID_PLAYER = 'player';
const ID_SCENARIO = 'scenario';

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
            player: {type: Object},
            scenario: {type: Object},
            heroesList: {type: Array},
            scenariosList: {type: Array},
        };
    }

    constructor() {
        super();

        this.name = '';
        this.player = {};
        this.scenario = {};
        this.heroesList = [];
        this.scenariosList = [];
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
        const {name, player, scenario} = this;

        this.dispatchEvent(new CustomEvent('create-match', {
            bubbles: true,
            composed: true,
            detail: {
                name, player, scenario
            }
        }));
    }
    handleNameChange(e) {
        this.name = e.target.value;
    }
    handleScenarioChanged(e) {
        const {scenario} = e.detail;

        this.scenario = {
            scenario,
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
                Continuar partida
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
    render() {
        return html`
            ${this.renderMatch()}
            ${this.renderPlayer()}
            ${this.renderScenario()}
            ${this.renderButton()}
        `;
    }
}

window.customElements.define(McCreateMatch.is, McCreateMatch);
