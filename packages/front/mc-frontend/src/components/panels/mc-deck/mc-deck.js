import {LitElement, html} from 'lit-element';
import {PLACE_DISCARD_PILE} from 'mc-shared';

import {ICON_EYE} from '../../common/mc-icon/mc-icon.js';
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
import {hasPlayCardDropTarget} from '../../../utils/play-card-drag.js';

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
            knownCards: {type: Array, attribute: 'known-cards'},
            deckName: {type: String, attribute: 'deck-name'},
            deckNamePosition: {type: String, attribute: 'deck-name-position'},
            showDeckName: {type: Boolean, attribute: 'show-deck-name'},
            discardLabel: {type: String, attribute: 'discard-label'},
            highlightPlayableDiscard: {type: Boolean, attribute: 'highlight-playable-discard'},
            showDeck: {type: Boolean, attribute: 'show-deck'},
            showDiscard: {type: Boolean, attribute: 'show-discard'},
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            type: {type: Number}
        };
    }
    constructor() {
        super();

        this.cards = [];
        this.discard = [];
        this.knownCards = [];
        this.deckName = '';
        this.deckNamePosition = 'bottom';
        this.showDeckName = true;
        this.discardLabel = '';
        this.highlightPlayableDiscard = false;
        this.showDeck = true;
        this.showDiscard = true;
        this.dragActivation = null;
        this.dragPlayCard = null;
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
    handleViewKnownCards() {
        if (!this.knownCards.length) {
            return;
        }

        const title = this.deckName ?
            `Cartas vistas del mazo de ${this.deckName}` :
            this.type === DECK_TYPES.PLAYER ?
                'Cartas vistas del mazo de jugador' :
                'Cartas vistas del mazo de encuentros';

        this.dispatchEvent(new CustomEvent('view-known-cards', {
            bubbles: true,
            composed: true,
            detail: {
                cards: this.knownCards.slice(),
                title,
            },
        }));
    }
    renderCardStack(src, count, isEmptyDiscard = false, card) {
        const horizontal = isPlanCard(card);

        return html`
            <mc-card-image
                class="${isEmptyDiscard ? 'empty-discard' : ''}"
                src="${src}"
                .activationBlocked="${Boolean(this.dragActivation)}"
                .horizontal="${horizontal}"
                .rotated="${horizontal}"
            >
            </mc-card-image>
            <span class="count">
                ${count}
            </span>
        `;
    }
    handlePlayCardDragOver(cards, event) {
        if (!hasPlayCardDropTarget(cards, this.dragPlayCard)) {
            return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }
    handlePlayCardDrop(cards, event) {
        if (!hasPlayCardDropTarget(cards, this.dragPlayCard)) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('play-card-drop', {
            bubbles: true,
            composed: true,
            detail: {
                card: this.dragPlayCard.card,
            },
        }));
    }
    renderCards(src, count, isEmptyDiscard = false, knownCards = [], deckTitle = '') {
        const hasDeckTitle = Boolean(deckTitle);
        const hasDropTarget = hasPlayCardDropTarget(
            this.cards,
            this.dragPlayCard
        );
        const dropClass = this.dragPlayCard ?
            hasDropTarget ? 'play-card-drop-target' : 'play-card-blocked' :
            '';

        return html`
            <div
                class="panel deck-panel ${hasDeckTitle ? 'deck-panel-titled' : ''} ${dropClass}"
                @dragover="${event =>
                    this.handlePlayCardDragOver(this.cards, event)}"
                @drop="${event =>
                    this.handlePlayCardDrop(this.cards, event)}"
            >
                ${hasDeckTitle ? html`
                    <span class="deck-name deck-name-top">${deckTitle}</span>
                ` : ''}
                ${this.renderCardStack(src, count, isEmptyDiscard)}
                ${knownCards.length ? html`
                    <button
                        class="known-cards-button"
                        type="button"
                        aria-label="Ver las ${knownCards.length} cartas vistas de este mazo"
                        title="Ver cartas vistas"
                        @click="${this.handleViewKnownCards.bind(this)}"
                    >
                        <mc-icon icon="${ICON_EYE}" aria-hidden="true"></mc-icon>
                    </button>
                ` : ''}
            </div>
        `;
    }
    renderDeck() {
        const {cards, knownCards} = this;
        const deckTitle = this.deckNamePosition === 'top' &&
            this.showDeckName !== false ?
            this.deckName :
            '';

        return this.renderCards(
            this.getImageBack(),
            cards.length,
            false,
            knownCards,
            deckTitle
        );
    }
    renderDiscard() {
        const card = this.getDiscardTop();
        const title = this.getDiscardTitle();
        const hasDropTarget = hasPlayCardDropTarget(
            this.discard,
            this.dragPlayCard
        );
        const dropClass = this.dragPlayCard ?
            hasDropTarget ? 'play-card-drop-target' : 'play-card-blocked' :
            '';

        let src = getCardAssetUrl(BACK_CARD_EMPTY);
        if (card) {
            src = getCardAssetUrl(card.image);
        }
        const playable = this.hasPlayableCardInDiscard();

        return html`
            <button
                class="panel discard-button ${playable ? 'playable' : ''} ${this.dragActivation ? 'activation-blocked' : ''} ${dropClass}"
                type="button"
                aria-label="Ver ${title} (${this.discard.length} cartas)"
                ?disabled="${!card}"
                @click="${this.handleViewDiscard.bind(this)}"
                @dragover="${event =>
                    this.handlePlayCardDragOver(this.discard, event)}"
                @drop="${event =>
                    this.handlePlayCardDrop(this.discard, event)}"
            >
                ${this.renderCardStack(src, this.discard.length, !card, card)}
            </button>
        `;
    }
    render() {
        const {
            deckName,
            deckNamePosition,
            showDeck,
            showDiscard,
        } = this;
        const titleOnTop = deckNamePosition === 'top';
        const title = deckName && this.showDeckName !== false ?
            html`
                <span class="${titleOnTop ? 'deck-name deck-name-top' : 'deck-name'}">
                    ${deckName}
                </span>
            ` :
            '';

        return html`
            <div class="deck-display" aria-label="${deckName}">
                ${titleOnTop && !showDeck ? title : ''}
                <div class="deck-piles">
                    ${showDiscard ? this.renderDiscard() : ''}
                    ${showDeck ? this.renderDeck() : ''}
                </div>
                ${titleOnTop ? '' : title}
            </div>
        `;
    }
}

window.customElements.define(DeckComponent.is, DeckComponent);
