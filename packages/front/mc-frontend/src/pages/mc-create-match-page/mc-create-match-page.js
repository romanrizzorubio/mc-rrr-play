import {LitElement, html} from 'lit-element';

import styles from './mc-create-match-page.css.js';
import '../../components/views/mc-create-match/mc-create-match.js';
import {Api} from '../../components/api/api.js';
import {ConfigMatch} from '../../components/api/config-match.js';
import {EVENTS} from 'mc-endpoints';
import {translateAspect} from 'mc-shared';

export class McCreateMatchPage extends LitElement {
    static get is() {
        return 'mc-create-match-page';
    }
    static get styles() {
        return [styles];
    }
    static get properties() {
        return {
            active: {type: Boolean},
            api: {type: Api},
            creatingGame: {type: Boolean},
            creatingMatch: {type: Boolean},
            deletingMatch: {type: String},
            heroesList: {type: Array},
            loadingCatalog: {type: Boolean},
            loadingMatches: {type: Boolean},
            matches: {type: Array},
            prepareMatch: {attribute: false},
            resumingMatch: {type: String},
            scenariosList: {type: Array},
            modularSetsList: {type: Array},
            selectedPlayers: {type: Object},
        };
    }
    constructor() {
        super();

        this.active = false;
        this.api = null;
        this.apiConfigMatch = null;
        this.creatingGame = false;
        this.creatingMatch = false;
        this.deletingMatch = '';
        this.heroesList = [];
        this.loadingCatalog = false;
        this.loadingMatches = false;
        this.matches = [];
        this.matchListRequestSequence = 0;
        this.prepareMatch = null;
        this.resumingMatch = '';
        this.scenariosList = [];
        this.modularSetsList = [];
        this.selectedPlayers = {};
    }
    connectedCallback() {
        super.connectedCallback();

        this.apiConfigMatch = new ConfigMatch(this.api);
    }
    updated(changedProperties) {
        if (changedProperties.has('active') && this.active) {
            this.loadMatches();
        }
    }
    async loadMatches() {
        if (!this.apiConfigMatch) {
            return;
        }

        const requestSequence = ++this.matchListRequestSequence;
        this.loadingMatches = true;
        try {
            const matches = await this.apiConfigMatch.getMatchesList();
            if (requestSequence === this.matchListRequestSequence) {
                this.matches = matches;
            }
        } catch (error) {
            if (requestSequence === this.matchListRequestSequence) {
                this.reportCommunicationError(error, 'No se pudieron cargar las partidas');
            }
        } finally {
            if (requestSequence === this.matchListRequestSequence) {
                this.loadingMatches = false;
            }
        }
    }
    async startCreatingMatch() {
        this.creatingMatch = true;
        this.loadingCatalog = true;

        try {
            const [heroesList, scenariosList, modularSetsList] = await Promise.all([
                this.apiConfigMatch.getHeroesList(),
                this.apiConfigMatch.getScenariosList(),
                this.apiConfigMatch.getModularSetsList(),
            ]);

            this.heroesList = heroesList;
            this.scenariosList = scenariosList;
            this.modularSetsList = modularSetsList;
        } catch (error) {
            this.creatingMatch = false;
            this.reportCommunicationError(error, 'No se pudo cargar la configuración');
        } finally {
            this.loadingCatalog = false;
        }
    }
    async handleCreate(e) {
        if (this.creatingGame) {
            return;
        }

        const {name, expert, player, scenario} = e.detail;
        if (this.matches.some(match => match.name === name)) {
            this.reportCommunicationError(new Error('Ya existe una partida con ese nombre.'));
            return;
        }

        this.creatingGame = true;

        try {
            const {apiConfigMatch} = this;
            if (typeof this.prepareMatch !== 'function') {
                throw new Error('No se configuró la preparación del remoto mc-match.');
            }
            await this.prepareMatch();
            await apiConfigMatch.createMatch({name});
            const createdPlayer = await apiConfigMatch.createPlayer(player);
            await apiConfigMatch.createScenario(scenario);
            const match = await apiConfigMatch.initMatch(expert);

            this.creatingMatch = false;
            this.dispatchEvent(new CustomEvent(EVENTS.MATCH.CREATED, {
                bubbles: true,
                composed: true,
                detail: {
                    match,
                    player: createdPlayer,
                }
            }));
            this.loadMatches();
        } catch (error) {
            this.creatingMatch = false;
            this.reportCommunicationError(error, 'No se pudo crear la partida');
            this.loadMatches();
        } finally {
            this.creatingGame = false;
        }
    }
    async resumeMatch(match) {
        const player = this.selectedPlayers[match.name] || match.players[0]?.name;
        if (!player || (!match.initialized && !match.initializing)) {
            this.reportCommunicationError(
                new Error('La partida todavía no está lista para continuar.')
            );
            return;
        }

        this.resumingMatch = match.name;
        try {
            this.api.beginMatch(match.name);
            this.api.markMatchReady();
            this.dispatchEvent(new CustomEvent('match-resume-requested', {
                bubbles: true,
                composed: true,
                detail: {
                    matchName: match.name,
                    player,
                },
            }));
            const joined = await this.api.joinMatch(true);
            if (!joined) {
                return;
            }

            this.dispatchEvent(new CustomEvent('match-resumed', {
                bubbles: true,
                composed: true,
                detail: {
                    matchName: match.name,
                    player,
                },
            }));
        } finally {
            this.resumingMatch = '';
        }
    }
    async deleteMatch(match) {
        if (this.deletingMatch || this.resumingMatch) {
            return;
        }
        if (!window.confirm(
            `¿Eliminar la partida "${match.name}"? Esta acción no se puede deshacer.`
        )) {
            return;
        }

        this.deletingMatch = match.name;
        try {
            await this.apiConfigMatch.deleteMatch(match.name);
            this.matchListRequestSequence++;
            this.matches = this.matches.filter(item => item.name !== match.name);
        } catch (error) {
            this.reportCommunicationError(
                error,
                `No se pudo eliminar la partida "${match.name}"`
            );
        } finally {
            this.deletingMatch = '';
        }
    }
    handlePlayerChange(matchName, e) {
        this.selectedPlayers = {
            ...this.selectedPlayers,
            [matchName]: e.target.value,
        };
    }
    reportCommunicationError(error, prefix = '') {
        const message = prefix ? `${prefix}: ${error.message}` : error.message;

        this.dispatchEvent(new CustomEvent('communication-error', {
            bubbles: true,
            composed: true,
            detail: {message},
        }));
    }
    getMatchStatus(match) {
        if (match.initialized) {
            return match.playing ? 'En curso' : 'Finalizada';
        }
        return match.initializing ? 'Configuración en curso' : 'Incompleta';
    }
    getPlayerSummary(player) {
        const hero = player.hero ? ` (${player.hero})` : '';
        const aspect = player.aspect ? ` - ${translateAspect(player.aspect)}` : '';

        return `${player.name}${hero}${aspect}`;
    }
    renderMatch(match) {
        const {players} = match;
        const player = this.selectedPlayers[match.name] || players[0]?.name || '';
        const canResume = players.length > 0 &&
            (match.initialized || match.initializing);
        const resuming = this.resumingMatch === match.name;
        const deleting = this.deletingMatch === match.name;

        return html`
            <li>
                <article class="match-card">
                    <h2>${match.name}</h2>
                    <p><strong>Estado:</strong> ${this.getMatchStatus(match)}</p>
                    <p><strong>Escenario:</strong> ${match.scenario || 'Pendiente'}</p>
                    <p><strong>Jugadores:</strong>
                        ${players.length ? players
                            .map(item => this.getPlayerSummary(item))
                            .join(', ') : 'Ninguno'}
                    </p>
                    ${players.length ? html`
                        <md-filled-select
                            label="Continuar como"
                            .value="${player}"
                            @change="${e => this.handlePlayerChange(match.name, e)}"
                        >
                            ${players.map(item => html`
                                <md-select-option value="${item.name}">
                                    <div slot="headline">${item.name}</div>
                                </md-select-option>
                            `)}
                        </md-filled-select>
                    ` : ''}
                    <div class="match-actions">
                        <md-filled-button
                            .disabled="${!canResume || resuming || Boolean(this.deletingMatch)}"
                            @click="${() => this.resumeMatch(match)}"
                        >
                            ${resuming ? 'Conectando...' : 'Continuar partida'}
                        </md-filled-button>
                        <md-text-button
                            class="delete-button"
                            .disabled="${Boolean(this.deletingMatch) ||
                                Boolean(this.resumingMatch)}"
                            @click="${() => this.deleteMatch(match)}"
                        >
                            ${deleting ? 'Eliminando...' : 'Eliminar partida'}
                        </md-text-button>
                    </div>
                </article>
            </li>
        `;
    }
    renderMatchList() {
        if (this.loadingMatches) {
            return html`<p role="status">Cargando partidas...</p>`;
        }
        if (!this.matches.length) {
            return html`<p>No hay partidas creadas en este servidor.</p>`;
        }

        return html`
            <ul class="match-list">
                ${this.matches.map(match => this.renderMatch(match))}
            </ul>
        `;
    }
    renderCreateForm() {
        return html`
            <section class="create-form">
                <div class="section-heading">
                    <h2>Nueva partida</h2>
                    <md-text-button
                        .disabled="${this.creatingGame}"
                        @click="${() => { this.creatingMatch = false; }}"
                    >
                        Volver a partidas
                    </md-text-button>
                </div>
                ${this.creatingGame ? html`
                    <p role="status">Creando partida y preparando el setup...</p>
                ` : this.loadingCatalog ? html`
                    <p role="status">Cargando héroes, escenarios y conjuntos modulares...</p>
                ` : html`
                    <mc-create-match
                        .heroesList="${this.heroesList}"
                        .configMatch="${this.apiConfigMatch}"
                        .scenariosList="${this.scenariosList}"
                        .modularSetsList="${this.modularSetsList}"
                        @create-match="${this.handleCreate.bind(this)}"
                    ></mc-create-match>
                `}
            </section>
        `;
    }
    renderLobby() {
        return html`
            <div class="section-heading">
                <h1>Partidas creadas</h1>
                <div class="actions">
                    <md-text-button
                        .disabled="${this.loadingMatches || Boolean(this.deletingMatch)}"
                        @click="${this.loadMatches.bind(this)}"
                    >
                        Actualizar
                    </md-text-button>
                    <md-filled-button
                        .disabled="${this.loadingMatches || Boolean(this.deletingMatch)}"
                        @click="${this.startCreatingMatch.bind(this)}"
                    >
                        Nueva partida
                    </md-filled-button>
                </div>
            </div>
            ${this.renderMatchList()}
        `;
    }
    render() {
        return this.creatingMatch ? this.renderCreateForm() : this.renderLobby();
    }
}

window.customElements.define(McCreateMatchPage.is, McCreateMatchPage);
