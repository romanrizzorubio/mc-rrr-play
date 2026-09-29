import {LitElement, html} from 'lit-element';
import styles from './mc-match.css.js';

import "../../match/mc-scenario/mc-scenario.js";
import "../../match/mc-player/mc-player.js";

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
        }))
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
        }))
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
    render() {
        return html`
            ${this.renderScenario()}
            ${this.renderPlayer()}
        `;
    }
}

window.customElements.define(MatchComponent.is, MatchComponent);
