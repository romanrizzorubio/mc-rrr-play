import {LitElement, html} from 'lit-element';

import styles from './mc-deck.css.js';
import '../../cards/mc-card-image/mc-card-image.js';
import {
    BACK_CARD_EMPTY_FULL,
    BACK_CARD_ENCOUNTER_FULL,
    BACK_CARD_PLAYER_FULL,
    BACK_CARD_VILLAIN_FULL, CARD_PATH,
} from '../../../misc/cards.js';

export const DECK_TYPES = {
    ENCOUNTER: 0,
    PLAYER: 1,
    VILLAIN: 2,
};

export class DeckComponent extends LitElement {
    static get is() {
        return 'mc-deck';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            cards: {type: Array},
            discard: {type: Array},
            discardLabel: {type: String, attribute: 'discard-label'},
            showDeck: {type: Boolean, attribute: 'show-deck'},
            type: {type: Number}
        };
    }
    constructor() {
        super();

        this.cards = [];
        this.discard = [];
        this.discardLabel = '';
        this.showDeck = true;
        this.type = DECK_TYPES.ENCOUNTER;
    }
    getDiscardTop() {
        return this.discard[this.discard.length - 1];
    }
    getImageBack() {
        switch (this.type) {
            case DECK_TYPES.ENCOUNTER:
                return BACK_CARD_ENCOUNTER_FULL;
            case DECK_TYPES.PLAYER:
                return BACK_CARD_PLAYER_FULL;
            case DECK_TYPES.VILLAIN:
                return BACK_CARD_VILLAIN_FULL;
        }
    }
    getDiscardTitle() {
        if (this.discardLabel) {
            return this.discardLabel;
        }

        switch (this.type) {
            case DECK_TYPES.PLAYER:
                return 'Descarte del mazo de jugador';
            case DECK_TYPES.VILLAIN:
                return 'Descarte del mazo de villano';
            default:
                return 'Descarte del mazo de encuentros';
        }
    }
    handleViewDiscard() {
        if (!this.discard.length) {
            return;
        }

        this.dispatchEvent(new CustomEvent('view-discard', {
            bubbles: true,
            composed: true,
            detail: {
                cards: this.discard.slice().reverse(),
                title: this.getDiscardTitle(),
            },
        }));
    }
    renderCardStack(src, count, isEmptyDiscard = false) {
        return html`
            <mc-card-image
                class="${isEmptyDiscard ? 'empty-discard' : ''}"
                src="${src}"
            >
            </mc-card-image>
            <span class="count">
                ${count}
            </span>
        `;
    }
    renderCards(src, count, isEmptyDiscard = false) {
        return html`
            <div class="panel">
                ${this.renderCardStack(src, count, isEmptyDiscard)}
            </div>
        `;
    }
    renderDeck() {
        const {cards} = this;

        return this.renderCards(this.getImageBack(), cards.length);
    }
    renderDiscard() {
        const card = this.getDiscardTop();
        const title = this.getDiscardTitle();

        let src = `${BACK_CARD_EMPTY_FULL}`;
        if (card) {
            src = `${CARD_PATH}${card.image}`;
        }

        return html`
            <button
                class="panel discard-button"
                type="button"
                aria-label="Ver ${title} (${this.discard.length} cartas)"
                ?disabled="${!card}"
                @click="${this.handleViewDiscard.bind(this)}"
            >
                ${this.renderCardStack(src, this.discard.length, !card)}
            </button>
        `;
    }
    render() {
        const {showDeck} = this;

        return html`
            ${this.renderDiscard()}
            ${showDeck ? this.renderDeck() : ''}
        `;
    }
}

window.customElements.define(DeckComponent.is, DeckComponent);
