import {LitElement, html} from 'lit-element';

import '../../components/config/mc-form-player/mc-form-player.js';
import '../../components/config/mc-deck-picker/mc-deck-picker.js';
import {ConfigMatch} from '../../components/api/config-match.js';
import styles from './mc-match-lobby-page.css.js';
import {
    getSelectedDeckAspects,
    translateAspect,
} from 'mc-shared';
import {getAspectColorClass} from '../../utils/deck-presentation.js';

export class McMatchLobbyPage extends LitElement {
    static get is() {
        return 'mc-match-lobby-page';
    }
    static get styles() {
        return [styles];
    }
    static get properties() {
        return {
            active: {type: Boolean},
            api: {attribute: false},
            user: {type: Object},
            id: {type: String},
            routeQuery: {attribute: false},
            prepareMatch: {attribute: false},
            lobby: {type: Object},
            heroesList: {type: Array},
            decksList: {type: Array},
            lobbyDecks: {type: Array},
            playerSelection: {type: Object},
            loading: {type: Boolean},
            loadingHeroes: {type: Boolean},
            loadingDecks: {type: Boolean},
            busy: {type: Boolean},
            error: {type: String},
            deckInfoError: {type: String},
            notice: {type: String},
        };
    }
    constructor() {
        super();

        this.active = false;
        this.api = null;
        this.user = null;
        this.id = '';
        this.routeQuery = {};
        this.prepareMatch = null;
        this.lobby = null;
        this.heroesList = [];
        this.decksList = [];
        this.lobbyDecks = [];
        this.playerSelection = {hero: '', deckId: ''};
        this.loading = false;
        this.loadingHeroes = false;
        this.loadingDecks = false;
        this.busy = false;
        this.error = '';
        this.deckInfoError = '';
        this.notice = '';
        this.apiConfigMatch = null;
        this.requestSequence = 0;
        this.deckListRequestSequence = 0;
        this.lobbyDeckRequestSequence = 0;
        this.pollTimer = null;
        this.enteringMatch = false;
        this.loadedHeroes = false;
        this.deckListHero = '';
        this.lobbyDeckSignature = '';
        this.routeDeckSelectionKey = '';
    }
    updated(changedProperties) {
        if (changedProperties.has('api') && this.api) {
            this.apiConfigMatch = new ConfigMatch(this.api);
        }
        if (changedProperties.has('active') || changedProperties.has('id')) {
            this.stopPolling();
            if (this.active && this.id) {
                this.loadLobby();
                this.pollTimer = globalThis.setInterval(
                    () => this.loadLobby(),
                    3000,
                );
            }
        }
        if (changedProperties.has('routeQuery') ||
            changedProperties.has('active') ||
            changedProperties.has('id')) {
            this.applyRouteDeckSelection();
        }
    }
    disconnectedCallback() {
        this.stopPolling();
        super.disconnectedCallback();
    }
    stopPolling() {
        globalThis.clearInterval(this.pollTimer);
        this.pollTimer = null;
    }
    get currentPlayer() {
        return this.lobby?.players?.find(player =>
            player.userId === this.user?.id
        ) || null;
    }
    get isCreator() {
        return this.lobby?.ownerId === this.user?.id;
    }
    get isWaiting() {
        return this.lobby?.status === 'waiting';
    }
    canRemovePlayer(player) {
        return this.isWaiting &&
            Boolean(this.user?.id && player?.id) &&
            (this.isCreator || player.userId === this.user.id);
    }
    get canJoin() {
        return this.isWaiting &&
            Boolean(this.user?.id) &&
            (this.lobby?.players?.length || 0) < (this.lobby?.maxPlayers || 0);
    }
    get availableHeroes() {
        const selectedHeroIds = new Set(
            (this.lobby?.players || []).map(player => player.hero)
        );

        return this.heroesList.filter(hero =>
            !selectedHeroIds.has(hero.id || hero.folder)
        );
    }
    async loadLobby() {
        if (!this.apiConfigMatch || !this.active || !this.id || this.loading) {
            return;
        }

        const requestSequence = ++this.requestSequence;
        this.loading = true;
        this.error = '';
        try {
            const lobby = await this.apiConfigMatch.getLobby(this.id);
            if (requestSequence !== this.requestSequence) {
                return;
            }
            this.lobby = lobby;
            const loadHeroes = this.canJoin && !this.loadedHeroes ?
                this.loadHeroes() :
                Promise.resolve();
            await Promise.all([this.loadLobbyDecks(lobby), loadHeroes]);
            await this.applyRouteDeckSelection();
            if (['starting', 'started'].includes(lobby.status) &&
                this.currentPlayer) {
                this.enterStartedMatch(lobby);
            } else if (lobby.status === 'starting' && this.isCreator && !this.enteringMatch) {
                await this.apiConfigMatch.startLobby(this.id);
                await this.initializeOrganizedMatch(lobby);
            }
        } catch (error) {
            if (requestSequence === this.requestSequence) {
                this.error = error.message;
            }
        } finally {
            if (requestSequence === this.requestSequence) {
                this.loading = false;
            }
        }
    }
    async loadHeroes() {
        this.loadingHeroes = true;
        try {
            this.heroesList = await this.apiConfigMatch.getHeroesList();
            this.loadedHeroes = true;
        } catch (error) {
            this.error = error.message;
        } finally {
            this.loadingHeroes = false;
        }
    }
    async handlePlayerChanged(event) {
        const {hero, deckId} = event.detail;
        this.playerSelection = {hero, deckId};
        this.notice = '';

        await this.loadDecksForHero(hero);
    }
    async loadDecksForHero(hero, force = false) {
        if (!hero) {
            this.deckListRequestSequence++;
            this.deckListHero = '';
            this.decksList = [];
            this.loadingDecks = false;
            this.error = '';
            return [];
        }
        if (!force && hero === this.deckListHero) {
            return this.decksList;
        }

        const requestSequence = ++this.deckListRequestSequence;
        this.deckListHero = hero;
        this.loadingDecks = true;
        this.decksList = [];
        this.error = '';
        try {
            const decks = await this.apiConfigMatch.getDecksList(hero, true);
            if (requestSequence !== this.deckListRequestSequence) {
                return null;
            }

            this.decksList = decks;
            return decks;
        } catch (error) {
            if (requestSequence === this.deckListRequestSequence) {
                this.deckListHero = '';
                this.error = `No se pudieron cargar los mazos de este héroe: ${error.message}`;
            }
            return null;
        } finally {
            if (requestSequence === this.deckListRequestSequence) {
                this.loadingDecks = false;
            }
        }
    }
    async applyRouteDeckSelection() {
        const hero = this.routeQuery?.hero;
        const deckId = this.routeQuery?.deckId || '';
        if (!this.active || !this.id || !this.lobby || !hero ||
            !this.loadedHeroes || !this.canJoin) {
            return;
        }

        const selectionKey = `${this.id}:${hero}:${deckId}`;
        if (selectionKey === this.routeDeckSelectionKey) {
            return;
        }
        if (!this.availableHeroes.some(item => (item.id || item.folder) === hero)) {
            this.routeDeckSelectionKey = selectionKey;
            this.playerSelection = {hero: '', deckId: ''};
            this.notice = 'Ese héroe ya está inscrito en la partida. Elige otro héroe.';
            return;
        }

        this.playerSelection = {hero, deckId: ''};
        const decks = await this.loadDecksForHero(hero, true);
        if (decks === null || this.playerSelection.hero !== hero || !this.canJoin) {
            return;
        }

        this.routeDeckSelectionKey = selectionKey;
        if (deckId && decks.some(deck => deck.id === deckId)) {
            this.playerSelection = {hero, deckId};
            this.notice = '';
        } else if (deckId) {
            this.playerSelection = {hero, deckId: ''};
            this.notice = 'El mazo se ha guardado, pero todavía no es legal para jugar. Solo se pueden elegir mazos legales.';
        }
    }
    async loadLobbyDecks(lobby) {
        const customDeckPlayers = (lobby.players || [])
            .filter(player => player.deckId && player.hero);
        const signature = JSON.stringify(customDeckPlayers
            .map(({userId, hero, deckId}) => [userId, hero, deckId])
            .sort((left, right) => left.join(':').localeCompare(right.join(':'))));
        if (signature === this.lobbyDeckSignature) {
            return;
        }

        const heroes = [...new Set(customDeckPlayers.map(player => player.hero))];
        if (!heroes.length) {
            this.lobbyDecks = [];
            this.lobbyDeckSignature = signature;
            this.deckInfoError = '';
            return;
        }

        const requestSequence = ++this.lobbyDeckRequestSequence;
        try {
            const deckLists = await Promise.all(heroes.map(hero =>
                this.apiConfigMatch.getDecksList(hero)
            ));
            if (requestSequence !== this.lobbyDeckRequestSequence) {
                return;
            }

            this.lobbyDecks = deckLists.flat();
            this.lobbyDeckSignature = signature;
            this.deckInfoError = '';
        } catch (error) {
            if (requestSequence === this.lobbyDeckRequestSequence) {
                this.lobbyDecks = [];
                this.deckInfoError =
                    `No se pudieron cargar los nombres de los mazos inscritos: ${error.message}`;
            }
        }
    }
    getLobbyDeckName(player) {
        if (!player.deckId) {
            return 'Precon';
        }

        return player.deckName || this.lobbyDecks.find(deck =>
            deck.id === player.deckId
        )?.name || 'Mazo no disponible';
    }
    handleDeckSelected(deckId) {
        if (deckId && !this.decksList.some(deck => deck.id === deckId)) {
            return;
        }

        this.playerSelection = {
            ...this.playerSelection,
            deckId,
        };
        this.notice = '';
    }
    handleDeckPickerSelection(event) {
        this.handleDeckSelected(event.detail.deckId);
    }
    createDeckForHero() {
        const hero = this.playerSelection.hero;
        if (!hero || !this.id) {
            return;
        }

        const query = new URLSearchParams({
            hero,
            returnLobby: this.id,
        });
        this.navigate(`/decks/create?${query}`);
    }
    async joinLobby() {
        if (!this.canJoin || !this.playerSelection.hero || this.busy) {
            return;
        }

        this.busy = true;
        this.error = '';
        this.notice = '';
        try {
            await this.apiConfigMatch.joinLobby(this.id, this.playerSelection);
            this.playerSelection = {hero: '', deckId: ''};
            this.deckListHero = '';
            this.deckListRequestSequence++;
            this.decksList = [];
            await this.loadLobby();
        } catch (error) {
            this.error = error.message;
        } finally {
            this.busy = false;
        }
    }
    async leaveLobby() {
        if (!this.currentPlayer || this.isCreator || !this.isWaiting || this.busy) {
            return;
        }

        this.busy = true;
        this.error = '';
        try {
            await this.apiConfigMatch.leaveLobby(this.id);
            this.navigate('/');
        } catch (error) {
            this.error = error.message;
        } finally {
            this.busy = false;
        }
    }
    async removePlayer(player) {
        if (!this.canRemovePlayer(player) || this.busy ||
            !globalThis.confirm(
                `¿Eliminar la inscripción de "${player.name}" (${player.heroName || player.hero})?`,
            )) {
            return;
        }

        this.busy = true;
        this.error = '';
        try {
            const lobby = await this.apiConfigMatch.removeLobbyPlayer(
                this.id,
                player.id,
            );
            this.requestSequence++;
            this.loading = false;
            this.lobby = lobby;
            await Promise.all([
                this.loadLobbyDecks(lobby),
                this.canJoin && !this.loadedHeroes ?
                    this.loadHeroes() :
                    Promise.resolve(),
            ]);
        } catch (error) {
            this.error = error.message;
        } finally {
            this.busy = false;
        }
    }
    async deleteLobby() {
        if (!this.isCreator || !this.isWaiting || this.busy ||
            !globalThis.confirm(`¿Eliminar la partida "${this.lobby?.name}"?`)) {
            return;
        }

        this.busy = true;
        this.error = '';
        try {
            await this.apiConfigMatch.deleteLobby(this.id);
            this.navigate('/');
        } catch (error) {
            this.error = error.message;
        } finally {
            this.busy = false;
        }
    }
    async startLobby() {
        if (!this.isCreator || !this.isWaiting || !this.lobby.players.length || this.busy) {
            return;
        }

        this.busy = true;
        this.error = '';
        this.notice = '';
        try {
            if (typeof this.prepareMatch !== 'function') {
                throw new Error('No se configuró la preparación del remoto mc-match.');
            }
            await this.prepareMatch();
            const started = await this.apiConfigMatch.startLobby(this.id);
            const startedLobby = started.lobby || this.lobby;
            const matchName = started.matchName ||
                startedLobby.name ||
                this.lobby.name;
            this.lobby = {
                ...startedLobby,
                status: startedLobby.status || 'starting',
                matchId: started.matchId || startedLobby.matchId,
                matchName,
            };
            if (this.currentPlayer) {
                await this.enterStartedMatch(this.lobby);
            } else {
                await this.initializeOrganizedMatch(this.lobby);
            }
        } catch (error) {
            this.error = error.message;
        } finally {
            this.busy = false;
        }
    }
    async initializeOrganizedMatch(lobby) {
        if (this.enteringMatch) {
            return;
        }

        this.enteringMatch = true;
        try {
            this.api.beginMatch(lobby.matchName || lobby.name);
            await this.apiConfigMatch.initMatch(lobby.expert);
            this.lobby = {...this.lobby, status: 'started'};
        } finally {
            this.enteringMatch = false;
        }
    }
    async enterStartedMatch(lobby) {
        if (this.enteringMatch || !this.currentPlayer || !this.active) {
            return;
        }
        if (typeof this.prepareMatch !== 'function') {
            this.error = 'No se configuró la preparación del remoto mc-match.';
            return;
        }

        this.enteringMatch = true;
        try {
            await this.prepareMatch();
            const matchName = lobby.matchName || lobby.name;
            this.api.beginMatch(matchName);
            this.api.markMatchReady();
            this.dispatchEvent(new CustomEvent('match-resumed', {
                bubbles: true,
                composed: true,
                detail: {
                    matchName,
                    player: this.currentPlayer.id ||
                        this.currentPlayer.userId ||
                        this.currentPlayer.name,
                },
            }));
            const joined = await this.api.joinMatch(true);
            if (!joined) {
                throw new Error('No se pudo conectar a la partida iniciada.');
            }
            if (this.isCreator) {
                const match = await this.apiConfigMatch.initMatch(lobby.expert);
                this.dispatchEvent(new CustomEvent('match-resumed', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        matchName,
                        player: this.currentPlayer.id ||
                            this.currentPlayer.userId ||
                            this.currentPlayer.name,
                        match,
                    },
                }));
            }
        } catch (error) {
            this.enteringMatch = false;
            this.error = error.message;
        }
    }
    navigate(route) {
        this.dispatchEvent(new CustomEvent('navigate-route', {
            detail: {route},
            bubbles: true,
            composed: true,
        }));
    }
    getScenarioName() {
        return this.lobby?.scenarioName ||
            this.lobby?.scenario?.name ||
            this.lobby?.scenario?.scenario ||
            'Pendiente';
    }
    getModularSetNames() {
        return this.lobby?.modularSetNames ||
            this.lobby?.scenario?.modularSetNames ||
            this.lobby?.scenario?.modularSets ||
            [];
    }
    getAspectName(aspect) {
        return Array.isArray(aspect) ?
            aspect.map(translateAspect).filter(Boolean).join(', ') :
            translateAspect(aspect);
    }
    renderPlayerAspects(player) {
        const aspects = getSelectedDeckAspects(player);
        if (!aspects.length) {
            return 'Aspecto pendiente';
        }

        return aspects.map((aspect, index) => html`
            ${index ? ', ' : ''}
            <span class="player-aspect ${getAspectColorClass(aspect)}">${this.getAspectName(aspect)}</span>
        `);
    }
    renderPlayers() {
        return html`
            <ul class="players">
                ${(this.lobby?.players || []).map(player => html`
                    <li>
                        <div class="player-details">
                            <strong class="player-name">${player.name}</strong>
                            <span>
                                ${player.heroName || player.hero}
                                <span class="player-detail-separator">.</span>
                                ${this.renderPlayerAspects(player)}
                                <span class="player-detail-separator">.</span>
                                ${this.getLobbyDeckName(player)}
                            </span>
                        </div>
                        ${this.canRemovePlayer(player) ? html`
                            <md-text-button
                                class="player-remove"
                                aria-label="Eliminar la inscripción de ${player.name}"
                                ?disabled="${this.busy}"
                                @click="${() => this.removePlayer(player)}"
                            >Eliminar</md-text-button>
                        ` : ''}
                    </li>
                `)}
            </ul>
        `;
    }
    renderDeckPicker() {
        return html`
            <mc-deck-picker
                .hero="${this.playerSelection.hero}"
                .heroesList="${this.heroesList}"
                .decksList="${this.decksList}"
                .selectedDeckId="${this.playerSelection.deckId || ''}"
                .loadingDecks="${this.loadingDecks}"
                @deck-selected="${this.handleDeckPickerSelection.bind(this)}"
                @create-deck="${this.createDeckForHero.bind(this)}"
            ></mc-deck-picker>
        `;
    }
    renderJoinButton() {
        return html`
            <md-filled-button
                .disabled="${this.busy || !this.playerSelection.hero ||
                    this.loadingDecks}"
                @click="${this.joinLobby.bind(this)}"
            >${this.busy ? 'Inscribiendo...' : this.currentPlayer ?
                'Añadir héroe' : 'Apuntarme a la partida'}</md-filled-button>
        `;
    }
    renderJoinForm() {
        if (!this.canJoin) {
            return '';
        }

        return html`
            <section class="join-panel" aria-labelledby="join-title">
                <h2 id="join-title">${this.currentPlayer ?
                    'Añadir otro héroe' : 'Elegir héroe y mazo'}</h2>
                ${this.loadingHeroes ? html`
                    <p role="status">Cargando héroes...</p>
                ` : html`
                    <mc-form-player
                        hide-name
                        hide-button
                        .name="${this.user?.name || ''}"
                        .heroesList="${this.availableHeroes}"
                        .decksList="${this.decksList}"
                        .loadingDecks="${this.loadingDecks}"
                        .hero="${this.playerSelection.hero}"
                        .deckId="${this.playerSelection.deckId || 'precon'}"
                        hide-deck
                        @player-change="${this.handlePlayerChanged.bind(this)}"
                    ></mc-form-player>
                `}
                <div class="player-actions">
                    ${this.renderJoinButton()}
                </div>
                ${this.renderDeckPicker()}
                <div class="player-actions">
                    ${this.renderJoinButton()}
                </div>
            </section>
        `;
    }
    renderRoomActions() {
        if (!this.lobby || !this.isWaiting) {
            return '';
        }
        if (this.isCreator) {
            return html`
                <div class="room-actions">
                    <md-filled-button
                        .disabled="${this.busy || !this.lobby.players.length}"
                        @click="${this.startLobby.bind(this)}"
                    >${this.busy ? 'Iniciando...' : 'Empezar partida'}</md-filled-button>
                    <md-text-button
                        .disabled="${this.busy}"
                        @click="${this.deleteLobby.bind(this)}"
                    >Eliminar partida</md-text-button>
                </div>
            `;
        }
        if (this.currentPlayer) {
            return html`
                <div class="room-actions">
                    <md-text-button
                        .disabled="${this.busy}"
                        @click="${this.leaveLobby.bind(this)}"
                    >Abandonar partida</md-text-button>
                </div>
            `;
        }

        return '';
    }
    renderRoom() {
        if (!this.lobby) {
            return '';
        }

        const modularSets = this.getModularSetNames();

        return html`
            <section class="room">
                <div class="room-heading">
                    <h1>${this.lobby.name}</h1>
                    <span class="room-status">${this.lobby.status === 'waiting' ?
                        'Esperando jugadores' : this.lobby.status === 'started' ?
                        'Partida iniciada' : 'Preparando partida'}
                    </span>
                </div>
                <div class="room-meta">
                    <p><strong>Escenario:</strong> ${this.getScenarioName()}</p>
                    <p><strong>Dificultad:</strong>
                        ${this.lobby.expert ? 'Experto' : 'Normal'}
                    </p>
                    <p><strong>Guardado automático:</strong>
                        ${this.lobby.autoSave !== false ? 'Sí' : 'No'}
                    </p>
                    <p><strong>Conjuntos modulares:</strong>
                        ${modularSets.length ? modularSets.join(', ') : 'Ninguno'}
                    </p>
                    <p><strong>Superhéroes:</strong>
                        ${this.lobby.players.length}/${this.lobby.maxPlayers}
                    </p>
                </div>
                <h2>Jugadores inscritos</h2>
                ${this.deckInfoError ? html`
                    <p class="error" role="alert">${this.deckInfoError}</p>
                ` : ''}
                ${this.renderPlayers()}
                ${this.renderRoomActions()}
            </section>
            ${this.renderJoinForm()}
        `;
    }
    render() {
        return html`
            ${this.error ? html`<p class="error" role="alert">${this.error}</p>` : ''}
            ${this.notice ? html`<p class="notice" role="status">${this.notice}</p>` : ''}
            ${this.loading && !this.lobby ? html`
                <p role="status">Cargando la partida...</p>
            ` : this.renderRoom()}
        `;
    }
}

if (!globalThis.window?.customElements.get(McMatchLobbyPage.is)) {
    globalThis.window?.customElements.define(McMatchLobbyPage.is, McMatchLobbyPage);
}
