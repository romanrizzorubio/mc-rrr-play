import {LitElement, html} from 'lit-element';

import styles from './mc-match.css.js';
import '../../match/mc-scenario/mc-scenario.js';
import '../../match/mc-player/mc-player.js';
import '../../panels/mc-hand/mc-hand.js';
import {DECK_TYPES} from '../../panels/mc-deck/mc-deck.js';

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
        this.playCardPending = false;
        this.deckSelectionTargetIds = [];
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
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

        const {card, ability} = e.detail;

        this.dispatchEvent(new CustomEvent('ability', {
            bubbles: true,
            composed: true,
            detail: {
                card, ability,
            }
        }));
    }
    isDeckSelectable(deck) {
        return Boolean(
            deck?.id &&
            this.deckSelectionTargetIds.includes(deck.id)
        );
    }
    renderScenario() {
        const {match, player} = this;

        return match ? html`
            <mc-scenario
                .scenario="${match.scenario}"
                .player="${player}"
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
        const {match, player} = this;
        const canEndTurn = match?.phase === 'players' &&
            match.currentTurnPlayer === player?.name;

        return player ? html`
            <mc-player
                .player="${player}"
                .canEndTurn="${canEndTurn}"
                .deckSelectionTargetIds="${this.deckSelectionTargetIds}"
                .dragActivation="${this.dragActivation}"
                .dragPlayCard="${this.dragPlayCard}"
                .dragResourcePayment="${this.dragResourcePayment}"
                @superhero-ability="${this.handleAbility.bind(this)}"
                @attached-card-click="${this.handleAbility.bind(this)}"
                @game-zone-card-click="${this.handleAbility.bind(this)}"
                @game-zone-menu-click="${this.handleAbility.bind(this)}"
            ></mc-player>
        ` : '';
    }
    renderHand() {
        const {player} = this;

        return player ? html`
            <mc-hand
                .cards="${player.hand || []}"
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

        if (!match || !player) {
            return '';
        }

        const otherPlayers = match.players.filter(otherPlayer =>
            otherPlayer.name !== player.name && otherPlayer.deck);

        if (!otherPlayers.length) {
            return '';
        }

        return html`
            <div
                class="other-player-discards"
                role="group"
                aria-label="${selectingDeck ?
                    'Mazos de otros jugadores' :
                    'Pilas de descartes de otros jugadores'}"
            >
                ${otherPlayers.map(otherPlayer => html`
                    <div class="other-player-discard">
                        <span>${otherPlayer.name}</span>
                        <mc-deck
                            .cards="${selectingDeck ?
                                otherPlayer.deck.cards || [] :
                                []}"
                            .discard="${selectingDeck ?
                                [] :
                                otherPlayer.deck.discard || []}"
                            .showDeck="${selectingDeck}"
                            .showDiscard="${!selectingDeck}"
                            .targetId="${otherPlayer.deck.id || ''}"
                            .targetSelectable="${selectingDeck &&
                                this.isDeckSelectable(otherPlayer.deck)}"
                            .type="${DECK_TYPES.PLAYER}"
                            .dragActivation="${this.dragActivation}"
                            .dragPlayCard="${this.dragPlayCard}"
                            discard-label="${selectingDeck ?
                                `Mazo de ${otherPlayer.name}` :
                                `Descarte de ${otherPlayer.name}`}"
                        ></mc-deck>
                    </div>
                `)}
            </div>
        `;
    }
    render() {
        const selectingDeck = this.deckSelectionTargetIds.length > 0;

        return html`
            <div class="match-board">
                ${this.renderOtherPlayerDiscards()}
                ${this.renderScenario()}
                ${this.renderPlayer()}
                ${selectingDeck ? html`
                    <div
                        class="deck-target-veil"
                        aria-hidden="true"
                    ></div>
                ` : ''}
            </div>
            ${this.renderHand()}
        `;
    }
}

window.customElements.define(MatchComponent.is, MatchComponent);
