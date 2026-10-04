import {LitElement, html} from 'lit-element';

import styles from './mc-hand.css.js';
import '../../cards/mc-card-list/mc-card-list.js';
import '@material/web/button/elevated-button.js';

export class McHand extends LitElement {
    static get is() {
        return 'mc-hand';
    }
    static get styles() {
        return styles;
    }

    static get properties() {
        return {
            cards: {type: Array},
            showPanel: {type: Boolean},
            playCardPending: {type: Boolean},
        };
    }

    constructor() {
        super();

        this.cards = [];
        this.showPanel = true;
        this.playCardPending = false;
    }

    getButton() {
        const {showPanel} = this;

        return showPanel ? 'v' : '^';
    }

    getClass() {
        const {showPanel} = this;

        return showPanel ? 'show' : 'hide';
    }

    handleSelect(e) {
        this.dispatchEvent(new CustomEvent('hand-select-card', {
            detail: {
                card: e.detail.card,
                cardIndex: e.detail.cardIndex,
            },
            bubbles: true,
            composed: true
        }));
    }

    handleToggle(e) {
        e.stopPropagation();

        this.showPanel = !this.showPanel;
    }

    render() {
        const {cards} = this;
        const disabledCards = this.playCardPending ?
            cards.map((_, index) => index) :
            [];

        return html`
            <div
                class="panel ${this.getClass()}"
                aria-busy="${this.playCardPending}"
            >
                <md-elevated-button
                    @click="${this.handleToggle.bind(this)}"
                >${this.getButton()}</md-elevated-button>
                <mc-card-list
                    .cards="${cards}"
                    .disabledCards="${disabledCards}"
                    .dimUnplayable="${true}"
                    @card-list-select="${this.handleSelect}"
                ></mc-card-list>
            </div>
        `;
    }
}

window.customElements.define(McHand.is, McHand);
