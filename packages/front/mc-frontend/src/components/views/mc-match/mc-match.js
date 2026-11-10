import {LitElement, html} from 'lit-element';
import {live} from 'lit/directives/live.js';

import styles from './mc-match.css.js';
import '../../match/mc-scenario/mc-scenario.js';
import '../../match/mc-player/mc-player.js';
import '../../panels/mc-hand/mc-hand.js';
import '../mc-chat/mc-chat.js';
import {DECK_TYPES} from '../../panels/mc-deck/mc-deck.js';
import {getCardAssetUrl} from '../../../misc/cards.js';
import {MENU_OPTION_VIEW_TUCKED_CARDS} from '../../../misc/card-menu.js';
import {
    MENU_OPTION_REQUEST_PLAYER_ACTION,
    MENU_OPTION_VIEW_HAND,
} from '../../cards/characters/mc-superhero-card/mc-superhero-card.js';

export class MatchComponent extends LitElement {
    static get is() {
        return 'mc-match';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            match: {type: Object},
            api: {type: Object},
            player: {type: Object},
            boardPlayer: {type: Object},
            dialogBoardPlayerId: {type: String},
            tableConsultationMode: {type: Boolean},
            playersPanelOpen: {type: Boolean},
            interactive: {type: Boolean},
            canRequestAction: {type: Boolean},
            actionRequest: {type: Object},
            firstPlayerTokenUrl: {type: String},
            focusedPlayerId: {type: String},
            secondaryPlayerId: {type: String},
            playCardPending: {type: Boolean},
            deckSelectionTargetIds: {type: Array},
            deckSelectionPlayerId: {type: String},
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            dragResourcePayment: {type: Object},
        };
    }
    constructor() {
        super();

        this.match = null;
        this.api = null;
        this.player = null;
        this.boardPlayer = null;
        this.dialogBoardPlayerId = '';
        this.tableConsultationMode = false;
        this.playersPanelOpen = false;
        this.interactive = true;
        this.canRequestAction = false;
        this.actionRequest = null;
        this.firstPlayerTokenUrl = '';
        this.focusedPlayerId = '';
        this.secondaryPlayerId = '';
        this.playCardPending = false;
        this.deckSelectionTargetIds = [];
        this.deckSelectionPlayerId = '';
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
        this.handleViewportResize = this.handleViewportResize.bind(this);
    }
    connectedCallback() {
        super.connectedCallback();
        globalThis.window?.addEventListener?.(
            'resize',
            this.handleViewportResize,
        );
    }
    disconnectedCallback() {
        globalThis.window?.removeEventListener?.(
            'resize',
            this.handleViewportResize,
        );
        super.disconnectedCallback();
    }
    handleViewportResize() {
        this.requestUpdate();
    }
    updated(changedProperties) {
        if (changedProperties.has('player') &&
            this.secondaryPlayerId &&
            this.secondaryPlayerId === this.getPlayerIdentifier(this.player)) {
            this.secondaryPlayerId = '';
        }
        if (!changedProperties.has('match')) {
            return;
        }

        const previousMatch = changedProperties.get('match');
        if (!previousMatch) {
            return;
        }

        const matchChanged = previousMatch.id !== this.match?.id;
        const turnChanged = previousMatch.currentTurnPlayer !==
            this.match?.currentTurnPlayer;
        const actionRequestChanged =
            previousMatch.actionRequest?.targetId !==
                this.match?.actionRequest?.targetId ||
            previousMatch.actionRequest?.target !==
                this.match?.actionRequest?.target ||
            previousMatch.actionRequest?.status !==
                this.match?.actionRequest?.status;

        if (matchChanged || turnChanged) {
            this.focusedPlayerId = '';
            this.secondaryPlayerId = '';
        } else if (actionRequestChanged) {
            this.focusedPlayerId = '';
        }

        if (this.secondaryPlayerId && !this.getSecondaryPlayerOptions().some(player =>
            this.getPlayerIdentifier(player) === this.secondaryPlayerId)) {
            this.secondaryPlayerId = '';
        }
    }
    getPlayerIdentifier(player) {
        return player?.id || player?.userId || player?.name || '';
    }
    get hasChat() {
        return new Set(
            (this.match?.players || [])
                .map(player => player.userId)
                .filter(Boolean),
        ).size > 1;
    }
    isPlayerInteractive(player) {
        if (!player || !this.player || this.tableConsultationMode ||
            (this.match?.phase && this.match.phase !== 'players')) {
            return false;
        }

        const playerId = this.getPlayerIdentifier(player);
        const localPlayerId = this.getPlayerIdentifier(this.player);
        if (playerId === localPlayerId) {
            return Boolean(this.interactive);
        }
        if (!player.userId || player.userId !== this.player.userId) {
            return false;
        }

        if (this.actionRequest?.status === 'pending') {
            return false;
        }
        if (this.actionRequest?.status === 'accepted') {
            return this.actionTargetId === playerId;
        }

        return this.match?.currentTurnPlayer === playerId;
    }
    get hasRoomForSecondaryBoard() {
        return globalThis.window?.matchMedia ?
            globalThis.window.matchMedia('(min-width: 1501px)').matches :
            globalThis.window?.innerWidth > 1500;
    }
    get activePlayer() {
        if (this.actionRequest?.status === 'accepted') {
            const actionTargetPlayer = this.actionTargetPlayer;
            if (actionTargetPlayer &&
                this.isPlayerInteractive(actionTargetPlayer)) {
                return actionTargetPlayer;
            }
        }

        if (!this.hasRoomForSecondaryBoard) {
            return this.player;
        }

        const turnPlayer = (this.match?.players || []).find(player =>
            this.getPlayerIdentifier(player) === this.match?.currentTurnPlayer
        );
        if (this.isPlayerInteractive(turnPlayer)) {
            return turnPlayer;
        }

        const secondaryPlayer = this.secondaryPlayer;

        return this.isPlayerInteractive(secondaryPlayer) ?
            secondaryPlayer :
            this.player;
    }
    showAlert(msg) {
        this.dispatchEvent(new CustomEvent('show-alert', {
            bubbles: true,
            composed: true,
            detail: {
                msg
            }
        }));
    }
    handleAbility(e, player = this.player) {
        e.stopPropagation();
        if (!this.isPlayerInteractive(player)) {
            return;
        }

        const {card, ability} = e.detail;

        this.dispatchEvent(new CustomEvent('ability', {
            bubbles: true,
            composed: true,
            detail: {
                card,
                ability,
                playerId: this.getPlayerIdentifier(player),
            }
        }));
    }
    handlePlayerBoardInteraction(event, player) {
        const {type, detail = {}} = event;
        let playerId = this.getPlayerIdentifier(player);

        if (type === 'basic-activation' && this.dragActivation?.playerId) {
            playerId = this.dragActivation.playerId;
        } else if (type === 'play-card-drop' && this.dragPlayCard?.playerId) {
            playerId = this.dragPlayCard.playerId;
        } else if (type === 'resource-payment-drop' &&
            this.dragResourcePayment?.playerId) {
            playerId = this.dragResourcePayment.playerId;
        } else if (type === 'deck-target-select' &&
            this.deckSelectionPlayerId) {
            playerId = this.deckSelectionPlayerId;
        } else if (type === 'activation-drag-end' &&
            this.dragActivation?.playerId) {
            playerId = this.dragActivation.playerId;
        } else if (type === 'play-card-drag-end' &&
            this.dragPlayCard?.playerId) {
            playerId = this.dragPlayCard.playerId;
        } else if (type === 'resource-payment-drag-end' &&
            this.dragResourcePayment?.playerId) {
            playerId = this.dragResourcePayment.playerId;
        }

        const contextPlayer = (this.match?.players || []).find(candidate =>
            this.getPlayerIdentifier(candidate) === playerId
        ) || (this.getPlayerIdentifier(player) === playerId ? player : null);

        if (!this.isPlayerInteractive(contextPlayer)) {
            if (type === 'change-menu' &&
                detail.card === contextPlayer?.superhero) {
                const allowedOptionIds = new Set(
                    this.getPlayerMenuOptions(contextPlayer).map(option =>
                        option.id
                    ),
                );
                const menuOptions = (detail.menuOptions || []).filter(option =>
                    allowedOptionIds.has(option.id)
                );
                if (menuOptions.length) {
                    event.stopPropagation();
                    this.dispatchEvent(new CustomEvent('change-menu', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            ...detail,
                            menuOptions,
                            playerId,
                        },
                    }));
                    return;
                }
            }
            if (this.tableConsultationMode && type === 'change-menu') {
                const {card, menuOptions = []} = detail;
                const canViewTuckedCards = menuOptions.some(option =>
                    option.id === MENU_OPTION_VIEW_TUCKED_CARDS
                );
                const cards = card?.tuckedCards || [];

                if (canViewTuckedCards && cards.length) {
                    this.dispatchEvent(new CustomEvent('view-tucked-cards', {
                        bubbles: true,
                        composed: true,
                        detail: {card, cards},
                    }));
                }
            }
            event.stopPropagation();
            return;
        }

        event.stopPropagation();
        this.dispatchEvent(new CustomEvent(type, {
            bubbles: true,
            composed: true,
            detail: {
                ...detail,
                playerId,
            },
        }));
    }
    handleSecondaryPlayerChange(event) {
        const playerId = event.currentTarget.value;
        const selectedPlayer = this.getSecondaryPlayerOptions().find(player =>
            this.getPlayerIdentifier(player) === playerId
        );

        this.focusedPlayerId = '';
        this.secondaryPlayerId = selectedPlayer ? playerId : '';
    }
    showPlayerBoard(playerId) {
        const selectedPlayer = this.match?.players.find(player =>
            this.getPlayerIdentifier(player) === playerId);
        if (selectedPlayer?.userId &&
            selectedPlayer.userId === this.player?.userId) {
            this.focusedPlayerId = '';
            if (playerId !== this.getPlayerIdentifier(this.player)) {
                this.dispatchEvent(new CustomEvent('select-controlled-player', {
                    bubbles: true,
                    composed: true,
                    detail: {player: playerId},
                }));
            }
            return;
        }
        this.focusedPlayerId = playerId;
        this.secondaryPlayerId = playerId;
    }
    isPlayerPlayCardDropTarget(player) {
        return Boolean(
            this.dragPlayCard?.playablePlayerIds?.includes(
                this.getPlayerIdentifier(player),
            )
        );
    }
    getPlayerMenuOptions(player) {
        if (!player ||
            this.getPlayerIdentifier(player) ===
                this.getPlayerIdentifier(this.activePlayer)) {
            return [];
        }

        const options = [];
        if (this.canRequestAction && !this.actionRequest) {
            options.push({
                id: MENU_OPTION_REQUEST_PLAYER_ACTION,
                text: 'Pedir una acción',
            });
        }
        if (this.player?.userId &&
            this.player.userId === player.userId) {
            options.push({
                id: MENU_OPTION_VIEW_HAND,
                text: 'Ver mano',
            });
        }
        return options;
    }
    handlePlayerPlayCardDragOver(event, player) {
        if (!this.isPlayerPlayCardDropTarget(player)) {
            return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }
    handlePlayerPlayCardDrop(event, player) {
        if (!this.isPlayerPlayCardDropTarget(player) ||
            !this.dragPlayCard?.card?.id) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('play-card-drop', {
            bubbles: true,
            composed: true,
            detail: {
                card: this.dragPlayCard.card,
                targetId: this.getPlayerIdentifier(player),
                playerId: this.dragPlayCard.playerId,
            },
        }));
    }
    guardBoardInteraction(event) {
        const playerId = event.detail?.playerId ||
            (event.type === 'deck-target-select' ?
                this.deckSelectionPlayerId :
                '') ||
            this.getPlayerIdentifier(this.player);
        const player = (this.match?.players || []).find(candidate =>
            this.getPlayerIdentifier(candidate) === playerId
        ) || (playerId === this.getPlayerIdentifier(this.player) ?
            this.player :
            null);

        if (!this.isPlayerInteractive(player)) {
            if (this.tableConsultationMode && event.type === 'change-menu') {
                const {card, menuOptions = []} = event.detail || {};
                const canViewTuckedCards = menuOptions.some(option =>
                    option.id === MENU_OPTION_VIEW_TUCKED_CARDS
                );
                const cards = card?.tuckedCards || [];

                if (canViewTuckedCards && cards.length) {
                    this.dispatchEvent(new CustomEvent('view-tucked-cards', {
                        bubbles: true,
                        composed: true,
                        detail: {card, cards},
                    }));
                }
            }
            event.stopPropagation();
        }
    }
    handlePlayerAccordionToggle(event, playerId) {
        if (this.hasRoomForSecondaryBoard) {
            return;
        }

        if (event.currentTarget.open) {
            this.showPlayerBoard(playerId);
            return;
        }
        if (this.focusedPlayerId === playerId) {
            this.focusedPlayerId = '';
        }
    }
    togglePlayersPanel() {
        this.playersPanelOpen = !this.isPlayersPanelOpen;
    }
    handlePlayerSummaryClick(event, playerId) {
        const selectedPlayer = this.match?.players.find(player =>
            this.getPlayerIdentifier(player) === playerId);
        if (selectedPlayer?.userId &&
            selectedPlayer.userId === this.player?.userId) {
            event.preventDefault();
            this.showPlayerBoard(playerId);
        }
    }
    handlePlayerHeroMenuClick(event, player) {
        const menuOptions = this.getPlayerMenuOptions(player);
        if (!menuOptions.length) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('change-menu', {
            bubbles: true,
            composed: true,
            detail: {
                card: player.superhero,
                menuOptions,
                playerId: this.getPlayerIdentifier(player),
            },
        }));
    }
    respondToActionRequest(accept) {
        this.dispatchEvent(new CustomEvent('respond-player-action', {
            bubbles: true,
            composed: true,
            detail: {
                accept,
                playerId: this.actionTargetPlayerId,
            },
        }));
    }
    completeRequestedAction() {
        this.dispatchEvent(new CustomEvent('complete-player-action', {
            bubbles: true,
            composed: true,
            detail: {playerId: this.actionTargetPlayerId},
        }));
    }
    get actionTargetId() {
        return this.actionRequest?.targetId || this.actionRequest?.target || '';
    }
    get actionTargetPlayer() {
        const targetPlayer = (this.match?.players || []).find(player =>
            this.isActionTarget(player)
        );

        return targetPlayer ||
            (this.isActionTarget(this.player) ? this.player : null);
    }
    get actionTargetPlayerId() {
        return this.actionRequest?.targetId ||
            this.getPlayerIdentifier(this.actionTargetPlayer) ||
            this.actionTargetId;
    }
    get isActionTargetControlledByCurrentUser() {
        const targetPlayer = this.actionTargetPlayer;

        return this.isActionTarget(this.player) ||
            Boolean(this.player?.userId &&
                targetPlayer?.userId === this.player.userId);
    }
    get actionRequesterName() {
        return this.actionRequest?.requester || '';
    }
    get displayedPlayer() {
        const players = this.match?.players || [];

        return players.find(player =>
                this.getPlayerIdentifier(player) === this.dialogBoardPlayerId
            ) ||
            players.find(player =>
                this.getPlayerIdentifier(player) === this.focusedPlayerId
            ) ||
            this.player ||
            this.boardPlayer;
    }
    get automaticSecondaryPlayer() {
        const players = this.match?.players || [];
        const localPlayerId = this.getPlayerIdentifier(this.player);
        const candidates = players.filter(player =>
            this.getPlayerIdentifier(player) !== localPlayerId
        );

        if (!candidates.length) {
            return null;
        }

        const turnPlayer = players.find(player =>
            this.getPlayerIdentifier(player) === this.match?.currentTurnPlayer
        );
        if (!turnPlayer) {
            return candidates[0];
        }

        if (this.getPlayerIdentifier(turnPlayer) !== localPlayerId) {
            return turnPlayer;
        }

        const turnIndex = players.indexOf(turnPlayer);
        if (turnPlayer.userId) {
            for (let offset = 1; offset < players.length; offset += 1) {
                const candidate = players[(turnIndex + offset) % players.length];
                if (this.getPlayerIdentifier(candidate) !== localPlayerId &&
                    candidate.userId === turnPlayer.userId) {
                    return candidate;
                }
            }
        }

        for (let offset = 1; offset < players.length; offset += 1) {
            const candidate = players[(turnIndex + offset) % players.length];
            if (this.getPlayerIdentifier(candidate) !== localPlayerId) {
                return candidate;
            }
        }

        return null;
    }
    get secondaryPlayer() {
        const localPlayerId = this.getPlayerIdentifier(this.player);
        const selectedPlayer = [
            this.dialogBoardPlayerId,
            this.focusedPlayerId,
            this.secondaryPlayerId,
        ].map(playerId => (this.match?.players || []).find(player =>
            this.getPlayerIdentifier(player) === playerId
        )).find(player =>
            player && this.getPlayerIdentifier(player) !== localPlayerId
        );

        return selectedPlayer || this.automaticSecondaryPlayer;
    }
    getSecondaryPlayerOptions() {
        const localPlayerId = this.getPlayerIdentifier(this.player);

        return (this.match?.players || []).filter(player =>
            this.getPlayerIdentifier(player) !== localPlayerId
        );
    }
    get shouldRenderSecondaryPlayerSelectorOnPrimary() {
        return this.hasRoomForSecondaryBoard &&
            this.getSecondaryPlayerOptions().length > 1 &&
            this.match?.phase === 'players' &&
            this.getPlayerIdentifier(this.secondaryPlayer) ===
                this.match.currentTurnPlayer;
    }
    renderSecondaryPlayerSelector() {
        return html`
            <label class="secondary-player-selector">
                <span>Ver zona de</span>
                <select
                    aria-label="Jugador de la zona derecha"
                    @change="${this.handleSecondaryPlayerChange.bind(this)}"
                >
                    ${this.getSecondaryPlayerOptions().map(option => html`
                        <option
                            value="${this.getPlayerIdentifier(option)}"
                            ?selected="${this.getPlayerIdentifier(option) ===
                                this.getPlayerIdentifier(this.secondaryPlayer)}"
                        >${option.name}</option>
                    `)}
                </select>
            </label>
        `;
    }
    get isPlayersPanelOpen() {
        return this.playersPanelOpen !== false;
    }
    get boardInteractive() {
        return this.isPlayerInteractive(this.player);
    }
    renderPlayerHeading() {
        const player = this.displayedPlayer;

        if (!player ||
            this.getPlayerIdentifier(player) ===
                this.getPlayerIdentifier(this.player)) {
            return '';
        }

        return player ? html`
            <div class="board-player-heading">
                <strong>${player.name}</strong>
            </div>
        ` : '';
    }
    renderActionRequest() {
        const actionRequest = this.actionRequest;
        if (!actionRequest || this.tableConsultationMode) {
            return '';
        }

        if (actionRequest.status === 'pending' &&
            this.isActionTargetControlledByCurrentUser) {
            return html`
                <section class="action-request" aria-live="polite">
                    <p>${this.actionRequesterName} te pide realizar una acción.</p>
                    <div class="action-request-buttons">
                        <md-filled-button
                            type="button"
                            @click="${() => this.respondToActionRequest(true)}"
                        >Realizar acción</md-filled-button>
                        <md-text-button
                            class="secondary"
                            type="button"
                            @click="${() => this.respondToActionRequest(false)}"
                        >Rechazar</md-text-button>
                    </div>
                </section>
            `;
        }

        if (actionRequest.status === 'accepted' &&
            this.isActionTargetControlledByCurrentUser) {
            return html`
                <section class="action-request" aria-live="polite">
                    <md-filled-button
                        type="button"
                        @click="${this.completeRequestedAction.bind(this)}"
                    >He terminado</md-filled-button>
                </section>
            `;
        }

        const status = actionRequest.status === 'accepted' ?
            `${actionRequest.target} está realizando una acción.` :
            `Esperando la respuesta de ${actionRequest.target}.`;

        return html`<p class="action-request-status" role="status">${status}</p>`;
    }
    isActionTarget(player) {
        return this.actionRequest?.targetId ?
            this.actionRequest.targetId === this.getPlayerIdentifier(player) :
            this.actionRequest?.target === player?.name;
    }
    renderPlayerAccordions() {
        const {match, player} = this;
        if (!match || !player || match.players.length <= 1 ||
            this.hasRoomForSecondaryBoard) {
            return '';
        }

        const playersPanelOpen = this.isPlayersPanelOpen;
        const displayPlayer = this.displayedPlayer;
        const otherPlayers = match.players.filter(otherPlayer =>
            this.getPlayerIdentifier(otherPlayer) !==
                this.getPlayerIdentifier(player));

        return html`
            <aside
                class="player-sidebar ${playersPanelOpen ? '' : 'collapsed'} legacy-player-selector"
                aria-label="Jugadores"
            >
                <div class="player-sidebar-header">
                    ${playersPanelOpen ? html`<h2>Jugadores</h2>` : ''}
                    <button
                        class="player-sidebar-toggle"
                        type="button"
                        aria-label="${playersPanelOpen ?
                            'Ocultar jugadores' :
                            'Ver jugadores'}"
                        aria-expanded="${playersPanelOpen}"
                        aria-controls="player-sidebar-content"
                        @click="${this.togglePlayersPanel.bind(this)}"
                    >
                        ${playersPanelOpen ? '' : 'Ver jugadores'}
                        <span
                            class="player-sidebar-chevron ${playersPanelOpen ? 'open' : ''}"
                            aria-hidden="true"
                        ></span>
                    </button>
                </div>
                <div
                    class="player-sidebar-content"
                    id="player-sidebar-content"
                    ?hidden="${!playersPanelOpen}"
                >
                    ${this.getPlayerIdentifier(displayPlayer) !==
                        this.getPlayerIdentifier(player) ? html`
                        <md-text-button
                            class="request-action"
                            type="button"
                            @click="${() =>
                                this.showPlayerBoard(this.getPlayerIdentifier(player))}"
                        >Ver mi mesa</md-text-button>
                    ` : ''}
                    ${otherPlayers.map(otherPlayer => {
                        const playerId = this.getPlayerIdentifier(otherPlayer);
                        const heroName = otherPlayer.superhero?.name ||
                            otherPlayer.name;
                        const menuOptions = this.getPlayerMenuOptions(otherPlayer);
                        const firstPlayerToken = otherPlayer.initial &&
                            this.firstPlayerTokenUrl ? html`
                                <img
                                    class="first-player-token"
                                    src="${this.firstPlayerTokenUrl}"
                                    alt="Ficha del jugador inicial"
                                    title="Jugador inicial"
                                >
                            ` : '';
                        const heroImage = html`
                            <img
                                class="hero-thumbnail"
                                src="${getCardAssetUrl(otherPlayer.superhero.image)}"
                                alt=""
                            >
                        `;

                        return html`
                            <div class="player-list-entry">
                                ${menuOptions.length ? html`
                                    <button
                                        class="player-hero-menu"
                                        type="button"
                                        aria-label="Opciones de ${heroName}"
                                        title="Opciones de ${heroName}"
                                        @click="${event =>
                                            this.handlePlayerHeroMenuClick(
                                                event,
                                                otherPlayer,
                                            )}"
                                    >
                                        ${firstPlayerToken}
                                        ${heroImage}
                                    </button>
                                ` : ''}
                                <details
                                    class="player-accordion
                                        ${this.isPlayerPlayCardDropTarget(otherPlayer) ?
                                        'play-card-drop-target' :
                                        ''}"
                                    .open="${live(this.getPlayerIdentifier(displayPlayer) ===
                                        playerId)}"
                                    @dragover="${event =>
                                        this.handlePlayerPlayCardDragOver(event, otherPlayer)}"
                                    @drop="${event =>
                                        this.handlePlayerPlayCardDrop(event, otherPlayer)}"
                                    @toggle="${event =>
                                        this.handlePlayerAccordionToggle(
                                            event,
                                            playerId,
                                        )}"
                                >
                                    <summary
                                        @click="${event =>
                                            this.handlePlayerSummaryClick(
                                                event,
                                                playerId,
                                            )}"
                                    >
                                        ${menuOptions.length ? '' : firstPlayerToken}
                                        ${menuOptions.length ? '' : heroImage}
                                        <span class="player-name">${otherPlayer.name}${otherPlayer.userId &&
                                            otherPlayer.userId === player.userId ? ' (tú)' : ''}</span>
                                    </summary>
                                </details>
                            </div>
                        `;
                    })}
                </div>
            </aside>
        `;
    }
    isDeckSelectable(deck) {
        return Boolean(
            deck?.id &&
            this.deckSelectionTargetIds.includes(deck.id)
        );
    }
    renderScenario() {
        const {match} = this;
        const player = this.activePlayer;

        return match ? html`
            <div
                class="scenario-interaction-context"
                @basic-activation="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @change-menu="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @activation-drag-start="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @activation-drag-end="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @play-card-drag-start="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @play-card-drag-end="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @play-card-drop="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @resource-payment-drag-start="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @resource-payment-drag-end="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @resource-payment-drop="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @deck-target-select="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @superhero-flip="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @player-end="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
            >
                <mc-scenario
                    .scenario="${match.scenario}"
                    .player="${player}"
                    class="${this.tableConsultationMode ?
                        'consultation' :
                        this.isPlayerInteractive(player) ? '' : 'read-only'}"
                    .deckSelectionTargetIds="${this.deckSelectionTargetIds}"
                    .dragActivation="${this.dragActivation}"
                    .dragPlayCard="${this.dragPlayCard}"
                    .dragResourcePayment="${this.dragResourcePayment}"
                    @ability="${event => this.handleAbility(event, player)}"
                    @attached-card-click="${event =>
                        this.handleAbility(event, player)}"
                ></mc-scenario>
            </div>
        ` : '';
    }
    renderPlayer(player = this.player) {
        const {match} = this;
        const playerId = this.getPlayerIdentifier(player);
        const compactDecks = this.hasRoomForSecondaryBoard &&
            Boolean(this.secondaryPlayer);
        const canEndTurn = this.isPlayerInteractive(player) &&
            match?.phase === 'players' &&
            match.currentTurnPlayer === playerId &&
            !this.actionRequest;

        return player ? html`
            <div
                class="player-board"
                @basic-activation="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @change-menu="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @activation-drag-start="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @activation-drag-end="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @play-card-drag-start="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @play-card-drag-end="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @play-card-drop="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @resource-payment-drag-start="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @resource-payment-drag-end="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @resource-payment-drop="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @deck-target-select="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @superhero-flip="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @player-end="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
            >
            <mc-player
                .player="${player}"
                class="${this.tableConsultationMode ?
                    'consultation' :
                    this.isPlayerInteractive(player) ? '' : 'read-only'}"
                .canEndTurn="${canEndTurn}"
                .firstPlayerTokenUrl="${match?.players?.length > 1 ? this.firstPlayerTokenUrl : ''}"
                .compactDecks="${compactDecks}"
                .superheroMenuOptions="${this.getPlayerMenuOptions(player)}"
                .deckSelectionTargetIds="${this.deckSelectionTargetIds}"
                .dragActivation="${this.dragActivation}"
                .dragPlayCard="${this.dragPlayCard}"
                .dragResourcePayment="${this.dragResourcePayment}"
                @superhero-ability="${event => this.handleAbility(event, player)}"
                @attached-card-click="${event => this.handleAbility(event, player)}"
                @game-zone-card-click="${event => this.handleAbility(event, player)}"
                @game-zone-menu-click="${event => this.handleAbility(event, player)}"
            ></mc-player>
            </div>
        ` : '';
    }
    renderPrimaryPlayer() {
        return this.player ? html`
            <section class="primary-player-panel" aria-label="Tu zona de juego">
                <header class="primary-player-header">
                    <h2>Tu zona de juego</h2>
                    ${this.shouldRenderSecondaryPlayerSelectorOnPrimary ?
                        this.renderSecondaryPlayerSelector() :
                        ''}
                </header>
                ${this.renderPlayer(this.player)}
            </section>
        ` : '';
    }
    renderSecondaryPlayer() {
        const player = this.secondaryPlayer;
        const playerId = this.getPlayerIdentifier(player);
        const options = this.getSecondaryPlayerOptions();
        const showSelector = options.length > 1 &&
            !this.shouldRenderSecondaryPlayerSelectorOnPrimary;

        if (!player || !playerId) {
            return '';
        }

        return html`
            <section
                class="secondary-player-panel"
                aria-label="Zona de juego de ${player.name}"
            >
                <header class="secondary-player-header">
                    ${showSelector ?
                        this.renderSecondaryPlayerSelector() :
                        html`<h2>${player.name}</h2>`}
                </header>
                ${this.renderPlayer(player)}
            </section>
        `;
    }
    renderHand() {
        const player = this.activePlayer;
        const interactive = this.isPlayerInteractive(player);

        return player ? html`
            <mc-hand
                .cards="${player.hand || []}"
                .interactive="${interactive}"
                .playCardPending="${this.playCardPending}"
                .dragActivation="${this.dragActivation}"
                .dragPlayCard="${this.dragPlayCard}"
                .dragResourcePayment="${this.dragResourcePayment}"
                @hand-select-card="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @activation-drag-start="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @activation-drag-end="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @play-card-drag-start="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @play-card-drag-end="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @resource-payment-drag-start="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
                @resource-payment-drag-end="${event =>
                    this.handlePlayerBoardInteraction(event, player)}"
            ></mc-hand>
        ` : '';
    }
    renderOtherPlayerDiscards() {
        const {match, player} = this;
        const selectingDeck = this.deckSelectionTargetIds.length > 0;

        if (!match || !player || !selectingDeck) {
            return '';
        }

        const otherPlayers = match.players.filter(otherPlayer =>
            this.getPlayerIdentifier(otherPlayer) !==
                this.getPlayerIdentifier(player) && otherPlayer.deck);

        if (!otherPlayers.length) {
            return '';
        }

        return html`
            <div
                class="other-player-discards"
                role="group"
                aria-label="Mazos de otros jugadores"
            >
                ${otherPlayers.map(otherPlayer => html`
                    <div class="other-player-discard">
                        <span>${otherPlayer.name}</span>
                        <mc-deck
                            .cards="${otherPlayer.deck.cards || []}"
                            .discard="${[]}"
                            .showDeck="${true}"
                            .showDiscard="${false}"
                            .targetId="${otherPlayer.deck.id || ''}"
                            .targetSelectable="${this.isDeckSelectable(otherPlayer.deck)}"
                            .type="${DECK_TYPES.PLAYER}"
                            .dragActivation="${this.dragActivation}"
                            .dragPlayCard="${this.dragPlayCard}"
                            discard-label="Mazo de ${otherPlayer.name}"
                        ></mc-deck>
                    </div>
                `)}
            </div>
        `;
    }
    render() {
        const selectingDeck = this.deckSelectionTargetIds.length > 0;

        return html`
            ${this.renderActionRequest()}
            <div
                class="match-layout"
                @basic-activation="${this.guardBoardInteraction.bind(this)}"
                @change-menu="${this.guardBoardInteraction.bind(this)}"
                @superhero-flip="${this.guardBoardInteraction.bind(this)}"
                @player-end="${this.guardBoardInteraction.bind(this)}"
                @activation-drag-start="${this.guardBoardInteraction.bind(this)}"
                @play-card-drag-start="${this.guardBoardInteraction.bind(this)}"
                @play-card-drop="${this.guardBoardInteraction.bind(this)}"
                @resource-payment-drag-start="${this.guardBoardInteraction.bind(this)}"
                @resource-payment-drop="${this.guardBoardInteraction.bind(this)}"
                @deck-target-select="${this.guardBoardInteraction.bind(this)}"
            >
                <div class="match-board">
                    ${this.renderOtherPlayerDiscards()}
                    ${this.renderScenario()}
                    <div class="player-board-row ${this.match?.players?.length <= 1 ?
                        'single-player' : ''}">
                        ${this.renderPrimaryPlayer()}
                        ${this.renderSecondaryPlayer()}
                    </div>
                    ${this.renderPlayerAccordions()}
                    ${selectingDeck ? html`
                        <div
                            class="deck-target-veil"
                            aria-hidden="true"
                        ></div>
                    ` : ''}
                </div>
            </div>
            ${this.renderHand()}
            ${this.hasChat ? html`<mc-chat .api="${this.api}"></mc-chat>` : ''}
        `;
    }
}

window.customElements.define(MatchComponent.is, MatchComponent);
