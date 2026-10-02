import {LitElement, html} from 'lit-element';

import styles from './mc-match.css.js';
import '../../match/mc-scenario/mc-scenario.js';
import '../../match/mc-player/mc-player.js';
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
        };
    }
    constructor() {
        super();

        this.match = null;
        this.player = null;
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
    renderScenario() {
        const {match} = this;

        return match ? html`
            <mc-scenario
                .scenario="${match.scenario}"
                @attached-card-click="${this.handleAbility.bind(this)}"
            ></mc-scenario>
        ` : '';
    }
    renderPlayer() {
        const {player} = this;

        return player ? html`
            <mc-player
                .player="${player}"
                @superhero-ability="${this.handleAbility.bind(this)}"
                @game-zone-card-click="${this.handleAbility.bind(this)}"
                @game-zone-menu-click="${this.handleAbility.bind(this)}"
            ></mc-player>
        ` : '';
    }
    renderOtherPlayerDiscards() {
        const {match, player} = this;

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
                aria-label="Pilas de descartes de otros jugadores"
            >
                ${otherPlayers.map(otherPlayer => html`
                    <div class="other-player-discard">
                        <span>${otherPlayer.name}</span>
                        <mc-deck
                            .discard="${otherPlayer.deck.discard}"
                            .showDeck="${false}"
                            .type="${DECK_TYPES.PLAYER}"
                            discard-label="Descarte de ${otherPlayer.name}"
                        ></mc-deck>
                    </div>
                `)}
            </div>
        `;
    }
    render() {
        return html`
            ${this.renderOtherPlayerDiscards()}
            ${this.renderScenario()}
            ${this.renderPlayer()}
        `;
    }
}

window.customElements.define(MatchComponent.is, MatchComponent);
