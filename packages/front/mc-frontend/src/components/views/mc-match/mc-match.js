import {LitElement, html} from 'lit-element';
import {live} from 'lit/directives/live.js';

import styles from './mc-match.css.js';
import '../../match/mc-scenario/mc-scenario.js';
import '../../match/mc-player/mc-player.js';
import '../../panels/mc-hand/mc-hand.js';
import {DECK_TYPES} from '../../panels/mc-deck/mc-deck.js';
import {getCardAssetUrl} from '../../../misc/cards.js';

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
            player: {type: Object},
            boardPlayer: {type: Object},
            interactive: {type: Boolean},
            canRequestAction: {type: Boolean},
            actionRequest: {type: Object},
            firstPlayerTokenUrl: {type: String},
            focusedPlayerId: {type: String},
            playCardPending: {type: Boolean},
            deckSelectionTargetIds: {type: Array},
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            dragResourcePayment: {type: Object},
        };
    }
    constructor() {
        super();

        this.match = null;
        this.player = null;
        this.boardPlayer = null;
        this.interactive = true;
        this.canRequestAction = false;
        this.actionRequest = null;
        this.firstPlayerTokenUrl = '';
        this.focusedPlayerId = '';
        this.playCardPending = false;
        this.deckSelectionTargetIds = [];
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
    }
    updated(changedProperties) {
        if (!changedProperties.has('match')) {
            return;
        }

        const previousMatch = changedProperties.get('match');
        if (previousMatch && (
            previousMatch.id !== this.match?.id ||
            previousMatch.currentTurnPlayer !== this.match?.currentTurnPlayer ||
            previousMatch.actionRequest?.targetId !== this.match?.actionRequest?.targetId ||
            previousMatch.actionRequest?.target !== this.match?.actionRequest?.target ||
            previousMatch.actionRequest?.status !== this.match?.actionRequest?.status
        )) {
            this.focusedPlayerId = '';
        }
    }
    getPlayerIdentifier(player) {
        return player?.id || player?.userId || player?.name || '';
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
    handleAbility(e) {
        e.stopPropagation();
        if (!this.boardInteractive) {
            return;
        }

        const {card, ability} = e.detail;

        this.dispatchEvent(new CustomEvent('ability', {
            bubbles: true,
            composed: true,
            detail: {
                card, ability,
            }
        }));
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
    }
    isPlayerPlayCardDropTarget(player) {
        return Boolean(
            this.dragPlayCard?.playablePlayerIds?.includes(
                this.getPlayerIdentifier(player),
            )
        );
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
            },
        }));
    }
    guardBoardInteraction(event) {
        if (!this.boardInteractive) {
            event.stopPropagation();
        }
    }
    handlePlayerAccordionToggle(event, playerId) {
        if (event.currentTarget.open) {
            this.showPlayerBoard(playerId);
            return;
        }
        if (this.focusedPlayerId === playerId) {
            this.focusedPlayerId = '';
        }
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
    requestPlayerAction(playerId) {
        this.dispatchEvent(new CustomEvent('request-player-action', {
            bubbles: true,
            composed: true,
            detail: {targetPlayer: playerId},
        }));
    }
    requestControlledPlayerAction(event, playerId) {
        event.preventDefault();
        event.stopPropagation();
        this.requestPlayerAction(playerId);
    }
    respondToActionRequest(accept) {
        this.dispatchEvent(new CustomEvent('respond-player-action', {
            bubbles: true,
            composed: true,
            detail: {accept},
        }));
    }
    completeRequestedAction() {
        this.dispatchEvent(new CustomEvent('complete-player-action', {
            bubbles: true,
            composed: true,
        }));
    }
    get actionTargetId() {
        return this.actionRequest?.targetId || this.actionRequest?.target || '';
    }
    get actionRequesterName() {
        return this.actionRequest?.requester || '';
    }
    get displayedPlayer() {
        const players = this.match?.players || [];

        return players.find(player =>
                this.getPlayerIdentifier(player) === this.focusedPlayerId
            ) ||
            this.player ||
            this.boardPlayer;
    }
    get boardInteractive() {
        return this.interactive &&
            this.getPlayerIdentifier(this.displayedPlayer) ===
                this.getPlayerIdentifier(this.player);
    }
    renderPlayerHeading() {
        const player = this.displayedPlayer;

        return player ? html`
            <div class="board-player-heading">
                <strong>${player.name}</strong>
            </div>
        ` : '';
    }
    renderActionRequest() {
        const actionRequest = this.actionRequest;
        if (!actionRequest) {
            return '';
        }

        if (actionRequest.status === 'pending' &&
            this.isActionTarget(this.player)) {
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
            this.isActionTarget(this.player)) {
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
        if (!match || !player || match.players.length <= 1) {
            return '';
        }

        const displayPlayer = this.displayedPlayer;
        const otherPlayers = match.players.filter(otherPlayer =>
            this.getPlayerIdentifier(otherPlayer) !==
                this.getPlayerIdentifier(player));

        return html`
            <aside class="player-sidebar" aria-label="Jugadores">
                <h2>Jugadores</h2>
                <div class="local-player-summary">
                    <span class="player-name">${player.name} (tú)</span>
                </div>
                ${this.renderActionRequest()}
                ${this.getPlayerIdentifier(displayPlayer) !==
                    this.getPlayerIdentifier(player) ? html`
                    <md-text-button
                        class="request-action"
                        type="button"
                        @click="${() =>
                            this.showPlayerBoard(this.getPlayerIdentifier(player))}"
                    >Ver mi mesa</md-text-button>
                ` : ''}
                ${otherPlayers.map(otherPlayer => html`
                    <div class="player-list-entry">
                    <details
                        class="player-accordion
                            ${this.isPlayerPlayCardDropTarget(otherPlayer) ?
                            'play-card-drop-target' :
                            ''}"
                        .open="${live(this.getPlayerIdentifier(displayPlayer) ===
                            this.getPlayerIdentifier(otherPlayer))}"
                        @dragover="${event =>
                            this.handlePlayerPlayCardDragOver(event, otherPlayer)}"
                        @drop="${event =>
                            this.handlePlayerPlayCardDrop(event, otherPlayer)}"
                        @toggle="${event =>
                            this.handlePlayerAccordionToggle(
                                event,
                                this.getPlayerIdentifier(otherPlayer),
                            )}"
                    >
                        <summary
                            @click="${event => this.handlePlayerSummaryClick(
                                event, this.getPlayerIdentifier(otherPlayer),
                            )}"
                        >
                            ${otherPlayer.initial && this.firstPlayerTokenUrl ? html`
                                <img
                                    class="first-player-token"
                                    src="${this.firstPlayerTokenUrl}"
                                    alt="Ficha del jugador inicial"
                                    title="Jugador inicial"
                                >
                            ` : ''}
                            <img
                                class="hero-thumbnail"
                                src="${getCardAssetUrl(otherPlayer.superhero.image)}"
                                alt=""
                            >
                            <span class="player-name">${otherPlayer.name}${otherPlayer.userId &&
                                otherPlayer.userId === player.userId ? ' (tú)' : ''}</span>
                        </summary>
                        ${this.canRequestAction && !this.actionRequest &&
                            (!otherPlayer.userId || otherPlayer.userId !== player.userId) ? html`
                            <md-filled-button
                                class="request-action"
                                type="button"
                                @click="${() =>
                                    this.requestPlayerAction(
                                        this.getPlayerIdentifier(otherPlayer),
                                    )}"
                            >Pedir una acción</md-filled-button>
                        ` : ''}
                    </details>
                    ${otherPlayer.userId && otherPlayer.userId === player.userId &&
                        this.canRequestAction && !this.actionRequest ? html`
                        <md-text-button
                            class="request-action"
                            type="button"
                            @click="${event => this.requestControlledPlayerAction(
                                event,
                                this.getPlayerIdentifier(otherPlayer),
                            )}"
                        >Pedir una acción</md-text-button>
                    ` : ''}
                    </div>
                `)}
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
        const player = this.displayedPlayer;

        return match ? html`
            <mc-scenario
                .scenario="${match.scenario}"
                .player="${player}"
                class="${this.boardInteractive ? '' : 'read-only'}"
                .deckSelectionTargetIds="${this.deckSelectionTargetIds}"
                .dragActivation="${this.dragActivation}"
                .dragPlayCard="${this.dragPlayCard}"
                .dragResourcePayment="${this.dragResourcePayment}"
                @ability="${this.handleAbility.bind(this)}"
                @attached-card-click="${this.handleAbility.bind(this)}"
            ></mc-scenario>
        ` : '';
    }
    renderPlayer() {
        const {match} = this;
        const player = this.displayedPlayer;
        const canEndTurn = this.boardInteractive &&
            match?.phase === 'players' &&
            match.currentTurnPlayer === this.getPlayerIdentifier(this.player) &&
            !this.actionRequest;

        return player ? html`
            <div class="player-board">
            <mc-player
                .player="${player}"
                class="${this.boardInteractive ? '' : 'read-only'}"
                .canEndTurn="${canEndTurn}"
                .firstPlayerTokenUrl="${this.firstPlayerTokenUrl}"
                .deckSelectionTargetIds="${this.deckSelectionTargetIds}"
                .dragActivation="${this.dragActivation}"
                .dragPlayCard="${this.dragPlayCard}"
                .dragResourcePayment="${this.dragResourcePayment}"
                @superhero-ability="${this.handleAbility.bind(this)}"
                @attached-card-click="${this.handleAbility.bind(this)}"
                @game-zone-card-click="${this.handleAbility.bind(this)}"
                @game-zone-menu-click="${this.handleAbility.bind(this)}"
            ></mc-player>
            </div>
        ` : '';
    }
    renderHand() {
        const {player, interactive} = this;

        return player ? html`
            <mc-hand
                .cards="${player.hand || []}"
                .interactive="${interactive}"
                .playCardPending="${this.playCardPending}"
                .dragActivation="${this.dragActivation}"
                .dragPlayCard="${this.dragPlayCard}"
                .dragResourcePayment="${this.dragResourcePayment}"
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
                    ${this.renderPlayerHeading()}
                    ${this.renderOtherPlayerDiscards()}
                    ${this.renderScenario()}
                    <div class="player-board-row ${this.match?.players?.length === 1 ?
                        'single-player' : ''}">
                        ${this.renderPlayer()}
                        ${this.renderPlayerAccordions()}
                    </div>
                    ${selectingDeck ? html`
                        <div
                            class="deck-target-veil"
                            aria-hidden="true"
                        ></div>
                    ` : ''}
                </div>
            </div>
            ${this.renderHand()}
        `;
    }
}

window.customElements.define(MatchComponent.is, MatchComponent);
