import {LitElement, html} from 'lit-element';

import styles from './mc-create-match-page.css.js';
import '../../components/views/mc-create-match/mc-create-match.js';
import {Api} from '../../components/api/api.js';
import {ConfigMatch} from '../../components/api/config-match.js';
import {translateAspect} from 'mc-shared';
import {getMatchLobbyPath} from '../../utils/app-routes.js';

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
            user: {type: Object},
            creatingGame: {type: Boolean},
            creatingMatch: {type: Boolean},
            deletingMatch: {type: String},
            loadingCatalog: {type: Boolean},
            loadingMatches: {type: Boolean},
            lobbies: {type: Array},
            matches: {type: Array},
            prepareMatch: {attribute: false},
            resumingMatch: {type: String},
            resettingMatch: {type: String},
            scenariosList: {type: Array},
            modularSetsList: {type: Array},
            selectedPlayers: {type: Object},
        };
    }
    constructor() {
        super();

        this.active = false;
        this.api = null;
        this.user = null;
        this.apiConfigMatch = null;
        this.creatingGame = false;
        this.creatingMatch = false;
        this.deletingMatch = '';
        this.loadingCatalog = false;
        this.loadingMatches = false;
        this.lobbies = [];
        this.matches = [];
        this.matchListRequestSequence = 0;
        this.matchListRefreshTimer = null;
        this.prepareMatch = null;
        this.resumingMatch = '';
        this.resettingMatch = '';
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
            this.matchListRefreshTimer = globalThis.setInterval(
                () => this.loadMatches(),
                5000,
            );
        } else if (changedProperties.has('active')) {
            globalThis.clearInterval(this.matchListRefreshTimer);
            this.matchListRefreshTimer = null;
        } else if (changedProperties.has('user') && this.active) {
            this.loadMatches();
        }
    }
    disconnectedCallback() {
        globalThis.clearInterval(this.matchListRefreshTimer);
        this.matchListRefreshTimer = null;
        super.disconnectedCallback();
    }
    async loadMatches() {
        if (!this.apiConfigMatch) {
            return;
        }

        const requestSequence = ++this.matchListRequestSequence;
        this.loadingMatches = true;
        try {
            const [matches, lobbies] = await Promise.all([
                this.user ?
                    this.apiConfigMatch.getMatchesList() :
                    Promise.resolve([]),
                this.apiConfigMatch.getLobbiesList(),
            ]);
            if (requestSequence === this.matchListRequestSequence) {
                this.matches = matches.filter(match =>
                    match.creatorUserId === this.user?.id ||
                    match.players.some(player => player.userId === this.user?.id)
                );
                this.lobbies = lobbies;
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
            const [scenariosList, modularSetsList] = await Promise.all([
                this.apiConfigMatch.getScenariosList(),
                this.apiConfigMatch.getModularSetsList(),
            ]);

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

        const {name, maxPlayers, expert, scenario} = e.detail;
        if (this.matches.some(match => match.name === name) ||
            this.lobbies.some(lobby => lobby.name === name)) {
            this.reportCommunicationError(new Error('Ya existe una partida con ese nombre.'));
            return;
        }

        this.creatingGame = true;

        try {
            const {apiConfigMatch} = this;
            const lobby = await apiConfigMatch.createLobby({
                name,
                maxPlayers,
                scenario,
                expert,
            });

            this.creatingMatch = false;
            this.dispatchEvent(new CustomEvent('navigate-route', {
                bubbles: true,
                composed: true,
                detail: {route: getMatchLobbyPath(lobby.id)},
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
    async resetMatch(match) {
        if (!this.isCreator(match.creatorUserId)) {
            this.reportCommunicationError(
                new Error('Solo el creador puede reiniciar esta partida.')
            );
            return;
        }
        if (this.resettingMatch || this.deletingMatch || this.resumingMatch) {
            return;
        }
        if (!window.confirm(
            `¿Reiniciar la partida "${match.name}"? Se perderá el progreso actual.`
        )) {
            return;
        }

        const player = match.players.find(item =>
            item.userId === this.user?.id
        );
        const playerId = player?.id || player?.userId || player?.name;
        if (!playerId) {
            this.reportCommunicationError(
                new Error('La partida no tiene un jugador para iniciar el reinicio.')
            );
            return;
        }

        this.resettingMatch = match.id;
        this.requestUpdate();
        try {
            await this.prepareMatch();
            this.api.beginMatch(match.name);
            this.api.markMatchReady();
            this.dispatchEvent(new CustomEvent('match-resume-requested', {
                bubbles: true,
                composed: true,
                detail: {
                    matchName: match.name,
                    player: playerId,
                },
            }));
            const joined = await this.api.joinMatch(true);
            if (!joined) {
                throw new Error('No se pudo conectar a la partida para reiniciarla.');
            }

            const resetMatch = await this.apiConfigMatch.resetMatch(match.id);
            await this.loadMatches();
            this.dispatchEvent(new CustomEvent('match-resumed', {
                bubbles: true,
                composed: true,
                detail: {
                    matchName: match.name,
                    player: playerId,
                    match: resetMatch,
                },
            }));
        } catch (error) {
            this.reportCommunicationError(
                error,
                `No se pudo reiniciar la partida "${match.name}"`
            );
        } finally {
            this.resettingMatch = '';
            this.requestUpdate();
        }
    }
    async resumeMatch(match) {
        if (this.resettingMatch || this.deletingMatch || this.resumingMatch) {
            return;
        }

        const player = match.players.find(item =>
            item.userId === this.user?.id
        );
        const playerId = player?.id || player?.userId || player?.name;
        if (!playerId || (!match.initialized && !match.initializing)) {
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
                    player: playerId,
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
                    player: playerId,
                },
            }));
        } finally {
            this.resumingMatch = '';
        }
    }
    deleteMatch(match) {
        return this.deleteEntry(match, {
            ownerId: match.creatorUserId,
            remove: () => this.apiConfigMatch.deleteMatch(match.name),
            listProperty: 'matches',
        });
    }
    deleteLobby(lobby) {
        return this.deleteEntry(lobby, {
            ownerId: lobby.ownerId,
            remove: () => this.apiConfigMatch.deleteLobby(lobby.id),
            listProperty: 'lobbies',
        });
    }
    async deleteEntry(entry, {ownerId, remove, listProperty}) {
        if (this.deletingMatch || this.resumingMatch || this.resettingMatch) {
            return;
        }
        if (!this.isCreator(ownerId)) {
            this.reportCommunicationError(new Error('Solo el creador puede eliminar esta partida.'));
            return;
        }
        if (!window.confirm(
            `¿Eliminar la partida "${entry.name}"? Esta acción no se puede deshacer.`
        )) {
            return;
        }

        this.deletingMatch = entry.name;
        try {
            await remove();
            this.matchListRequestSequence++;
            this.loadingMatches = false;
            this[listProperty] = this[listProperty].filter(item => item.name !== entry.name);
        } catch (error) {
            this.reportCommunicationError(
                error,
                `No se pudo eliminar la partida "${entry.name}"`
            );
        } finally {
            this.deletingMatch = '';
        }
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
        const aspectName = translateAspect(player.aspect);
        const aspect = aspectName ? ` - ${aspectName}` : '';

        return `${player.name}${hero}${aspect}`;
    }
    isCreator(ownerId) {
        return Boolean(this.user?.id && ownerId === this.user.id);
    }
    renderMatch(match) {
        const {players} = match;
        const organizingOnly = this.isCreator(match.creatorUserId) &&
            !players.some(player => player.userId === this.user?.id);
        const canResume = players.length > 0 &&
            (match.initialized || match.initializing);
        const resuming = this.resumingMatch === match.name;
        const resetting = this.resettingMatch === match.id;

        return html`
            <li>
                <article class="match-card">
                    <h2>${match.name}</h2>
                    <p><strong>Estado:</strong> ${this.getMatchStatus(match)}</p>
                    <p><strong>Escenario:</strong> ${match.scenarioName || match.scenario || 'Pendiente'}</p>
                    <p><strong>Jugadores:</strong>
                        ${players.length ? players
                            .map(item => this.getPlayerSummary(item))
                            .join(', ') : 'Ninguno'}
                    </p>
                    <div class="match-actions">
                        <md-filled-button
                            .disabled="${!canResume || resuming ||
                                Boolean(this.deletingMatch) || Boolean(this.resettingMatch)}"
                            @click="${() => organizingOnly ?
                                this.openLobby(match.id) : this.resumeMatch(match)}"
                        >
                            ${resuming ? 'Conectando...' : organizingOnly ?
                                'Ver sala' : 'Continuar partida'}
                        </md-filled-button>
                        ${this.isCreator(match.creatorUserId) ? html`
                        ${!organizingOnly ? html`<md-text-button
                            class="reset-button"
                            .disabled="${Boolean(this.deletingMatch) ||
                                Boolean(this.resumingMatch) || Boolean(this.resettingMatch)}"
                            @click="${() => this.resetMatch(match)}"
                        >
                            ${resetting ? 'Reiniciando...' : 'Reiniciar partida'}
                        </md-text-button>` : ''}
                            <md-text-button
                                class="delete-button"
                                .disabled="${Boolean(this.deletingMatch) ||
                                    Boolean(this.resumingMatch) || Boolean(this.resettingMatch)}"
                                @click="${() => this.deleteMatch(match)}"
                            >${this.deletingMatch === match.name ?
                                'Eliminando...' : 'Eliminar partida'}</md-text-button>
                        ` : ''}
                    </div>
                </article>
            </li>
        `;
    }
    renderMatchList() {
        if (!this.user) {
            return html`
                <p>Inicia sesión para ver tus partidas iniciadas.</p>
                <md-text-button
                    href="/login"
                    @click="${event => {
                        event.preventDefault();
                        this.dispatchEvent(new CustomEvent('navigate-route', {
                            bubbles: true,
                            composed: true,
                            detail: {route: 'login'},
                        }));
                    }}"
                >
                    Iniciar sesión
                </md-text-button>
            `;
        }
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
    openLobby(lobbyId) {
        this.dispatchEvent(new CustomEvent('navigate-route', {
            bubbles: true,
            composed: true,
            detail: {route: getMatchLobbyPath(lobbyId)},
        }));
    }
    renderLobbyList() {
        if (!this.lobbies.length) {
            return html`<p>No hay partidas esperando jugadores.</p>`;
        }

        return html`
            <div class="lobby-table-wrap">
                <table class="lobby-table">
                    <thead>
                        <tr>
                            <th scope="col">Partida</th>
                            <th scope="col">Escenario</th>
                            <th scope="col">Dificultad</th>
                            <th scope="col">Superhéroes</th>
                            <th scope="col"><span class="visually-hidden">Acción</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.lobbies.map(lobby => html`
                            <tr>
                                <th scope="row">${lobby.name}</th>
                                <td>${lobby.scenarioName}</td>
                                <td>${lobby.expert ? 'Experto' : 'Normal'}</td>
                                <td>${lobby.players.length}/${lobby.maxPlayers}</td>
                                <td class="lobby-action">
                                    <md-filled-button
                                        @click="${() => this.openLobby(lobby.id)}"
                                    >Ver partida</md-filled-button>
                                    ${this.isCreator(lobby.ownerId) ? html`
                                        <md-text-button
                                            class="delete-button"
                                            .disabled="${Boolean(this.deletingMatch) ||
                                                Boolean(this.resumingMatch) || Boolean(this.resettingMatch)}"
                                            @click="${() => this.deleteLobby(lobby)}"
                                        >${this.deletingMatch === lobby.name ?
                                            'Eliminando...' : 'Eliminar partida'}</md-text-button>
                                    ` : ''}
                                </td>
                            </tr>
                        `)}
                    </tbody>
                </table>
            </div>
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
                    <p role="status">Creando sala de espera...</p>
                ` : this.loadingCatalog ? html`
                    <p role="status">Cargando escenarios y conjuntos modulares...</p>
                ` : html`
                    <mc-create-match
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
                <h1>Partidas</h1>
                <div class="actions">
                    <md-text-button
                        .disabled="${this.loadingMatches || Boolean(this.deletingMatch) ||
                            Boolean(this.resettingMatch)}"
                        @click="${this.loadMatches.bind(this)}"
                    >
                        Actualizar
                    </md-text-button>
                    <md-filled-button
                        .disabled="${this.loadingMatches || Boolean(this.deletingMatch) ||
                            Boolean(this.resettingMatch)}"
                        @click="${this.startCreatingMatch.bind(this)}"
                    >
                        Nueva partida
                    </md-filled-button>
                </div>
            </div>
            <section aria-labelledby="waiting-matches-title">
                <h2 id="waiting-matches-title">Esperando jugadores</h2>
                ${this.renderLobbyList()}
            </section>
            <section aria-labelledby="active-matches-title">
                <h2 id="active-matches-title">Mis partidas iniciadas</h2>
                ${this.renderMatchList()}
            </section>
        `;
    }
    render() {
        return this.creatingMatch ? this.renderCreateForm() : this.renderLobby();
    }
}

window.customElements.define(McCreateMatchPage.is, McCreateMatchPage);
