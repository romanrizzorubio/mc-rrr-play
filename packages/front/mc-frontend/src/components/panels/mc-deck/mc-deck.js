import {LitElement, html} from 'lit-element';
import {PLACE_DISCARD_PILE} from 'mc-shared';

import styles from './mc-deck.css.js';
import '../../cards/mc-card-image/mc-card-image.js';
import {
    BACK_CARD_EMPTY,
    BACK_CARD_ENCOUNTER,
    BACK_CARD_PLAYER,
    BACK_CARD_VILLAIN,
    getCardAssetUrl,
} from '../../../misc/cards.js';
import {isPlanCard} from '../../../misc/utils.js';

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
            highlightPlayableDiscard: {type: Boolean, attribute: 'highlight-playable-discard'},
            showDeck: {type: Boolean, attribute: 'show-deck'},
            type: {type: Number}
        };
    }
    constructor() {
        super();

        this.cards = [];
        this.discard = [];
        this.discardLabel = '';
        this.highlightPlayableDiscard = false;
        this.showDeck = true;
        this.type = DECK_TYPES.ENCOUNTER;
    }
    getDiscardTop() {
        return this.discard[this.discard.length - 1];
    }
    hasPlayableCardInDiscard() {
        return this.highlightPlayableDiscard &&
            this.type === DECK_TYPES.PLAYER &&
            this.discard.some(card =>
                card.playFrom?.includes(PLACE_DISCARD_PILE) === true);
    }
    getImageBack() {
        switch (this.type) {
            case DECK_TYPES.ENCOUNTER:
                return getCardAssetUrl(BACK_CARD_ENCOUNTER);
            case DECK_TYPES.PLAYER:
                return getCardAssetUrl(BACK_CARD_PLAYER);
            case DECK_TYPES.VILLAIN:
                return getCardAssetUrl(BACK_CARD_VILLAIN);
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
                isPlayerDeck: this.type === DECK_TYPES.PLAYER,
            },
        }));
    }
    renderCardStack(src, count, isEmptyDiscard = false, card) {
        const horizontal = isPlanCard(card);

        return html`
            <mc-card-image
                class="${isEmptyDiscard ? 'empty-discard' : ''}"
                src="${src}"
                .horizontal="${horizontal}"
                .rotated="${horizontal}"
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

        let src = getCardAssetUrl(BACK_CARD_EMPTY);
        if (card) {
            src = getCardAssetUrl(card.image);
        }
        const playable = this.hasPlayableCardInDiscard();

        return html`
            <button
                class="panel discard-button ${playable ? 'playable' : ''}"
                type="button"
                aria-label="Ver ${title} (${this.discard.length} cartas)"
                ?disabled="${!card}"
                @click="${this.handleViewDiscard.bind(this)}"
            >
                ${this.renderCardStack(src, this.discard.length, !card, card)}
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
