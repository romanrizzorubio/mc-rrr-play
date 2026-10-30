import {LitElement, html} from 'lit-element';

import styles from './mc-hand.css.js';
import '../../cards/mc-card-list/mc-card-list.js';

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
            interactive: {type: Boolean},
            playCardPending: {type: Boolean},
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            dragResourcePayment: {type: Object},
        };
    }

    constructor() {
        super();

        this.cards = [];
        this.showPanel = true;
        this.interactive = false;
        this.playCardPending = false;
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
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
        if (!this.interactive || this.playCardPending) {
            return;
        }
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
        const disabledCards = !this.interactive || this.playCardPending ?
            cards.map((_, index) => index) :
            [];

        return html`
            <div
                class="panel ${this.getClass()}"
                aria-busy="${this.playCardPending}"
            >
                <md-elevated-button
                    type="button"
                    aria-label="${this.showPanel ? 'Ocultar mano' : 'Mostrar mano'}"
                    aria-expanded="${this.showPanel}"
                    aria-controls="hand-cards"
                    @click="${this.handleToggle.bind(this)}"
                >${this.getButton()}</md-elevated-button>
                <mc-card-list
                    id="hand-cards"
                    ?inert="${!this.interactive || this.playCardPending}"
                    .cards="${cards}"
                    .disabledCards="${disabledCards}"
                    .dragActivation="${this.dragActivation}"
                    .dragPlayCard="${this.dragPlayCard}"
                    .dragResourcePayment="${this.dragResourcePayment}"
                    .allowPlayCardDrag="${this.interactive && !this.playCardPending}"
                    .highlightPlayable="${true}"
                    @card-list-select="${this.handleSelect}"
                ></mc-card-list>
            </div>
        `;
    }
}

window.customElements.define(McHand.is, McHand);
