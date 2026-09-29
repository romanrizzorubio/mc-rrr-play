import {LitElement, html} from 'lit-element';
import styles from './mc-deck.css.js';

import "../../cards/mc-card-image/mc-card-image.js";
import {
    BACK_CARD_EMPTY_FULL,
    BACK_CARD_ENCOUNTER_FULL,
    BACK_CARD_PLAYER_FULL,
    BACK_CARD_VILLAIN_FULL, CARD_PATH,
} from "../../../misc/cards.js";

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
            type: {type: Number}
        };
    }
    constructor() {
        super();

        this.cards = [];
        this.discard = [];
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
    renderCards(src, count) {
        return html`
            <div class="panel">
                <mc-card-image
                    src="${src}"
                >
                </mc-card-image>
                <div class="count">
                    ${count}
                </div>
            </div>
        `;
    }
    renderDeck() {
        const {cards} = this;

        return this.renderCards(this.getImageBack(), cards.length);
    }
    renderDiscard() {
        const card = this.getDiscardTop();

        let src = `${BACK_CARD_EMPTY_FULL}`
        if (card) {
            src = `${CARD_PATH}${card.image}`;
        }

        return this.renderCards(src, this.discard.length);
    }
    render() {
        return html`
            ${this.renderDiscard()}
            ${this.renderDeck()}
        `;
    }
}

window.customElements.define(DeckComponent.is, DeckComponent);
