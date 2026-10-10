import {LitElement, html} from 'lit-element';

import cardListStyles from '../shared/card-list.css.js';
import styles from './mc-deck-selected-cards.css.js';
import '../shared/mc-deck-card-economy.js';
import {dispatchComponentEvent} from '../../utils/dispatch-component-event.js';
import {
    getAspectClass,
    getCardImageUrl,
    getCardOriginName,
    getCardTypeName,
} from '../../utils/deck-presentation.js';

const CARD_COLUMN_TYPES = [
    ['resource', 'upgrade'],
    ['ally', 'support'],
    ['event'],
];

export class McDeckSelectedCards extends LitElement {
    static get is() {
        return 'mc-deck-selected-cards';
    }
    static get properties() {
        return {
            cards: {type: Array},
            pendingRemoval: {type: Object},
            previewCard: {type: Object},
        };
    }
    static get styles() {
        return [cardListStyles, styles];
    }
    constructor() {
        super();

        this.cards = [];
        this.pendingRemoval = null;
        this.previewCard = null;
    }
    handleCardRowClick(event, card) {
        const interactiveTarget = event.target.closest?.(
            'input, button, md-filled-button, md-text-button, md-filled-select',
        );
        if (card.fixed || interactiveTarget) {
            return;
        }

        this.pendingRemoval = card;
    }
    handleCardRowKeyDown(event, card) {
        if (event.target !== event.currentTarget ||
            (event.key !== 'Enter' && event.key !== ' ')) {
            return;
        }

        event.preventDefault();
        this.pendingRemoval = card;
    }
    confirmRemoval() {
        if (!this.pendingRemoval) {
            return;
        }

        dispatchComponentEvent(this, 'set-card-count', {
            cardId: this.pendingRemoval.id,
            count: 0,
        });
        this.pendingRemoval = null;
    }
    handleRemovalDialogClosed() {
        this.pendingRemoval = null;
    }
    handleImageClick(event, card) {
        event.stopPropagation();
        this.previewCard = card;
    }
    handlePreviewClose() {
        this.previewCard = null;
    }
    handleCountChanged(event, cardId) {
        const input = event.target;
        const count = Number(input.value);
        if (!Number.isInteger(count) || count < 1) {
            input.value = input.dataset.currentCount;
            return;
        }

        dispatchComponentEvent(this, 'set-card-count', {
            cardId,
            count,
        });
    }
    get groupedCards() {
        const groups = new Map();
        for (const card of this.cards) {
            const type = card.type || 'other';
            const cards = groups.get(type) || [];
            cards.push(card);
            groups.set(type, cards);
        }

        return [...groups.entries()]
            .map(([type, cards]) => ({
                type,
                name: getCardTypeName(type),
                cardCount: cards.reduce((total, card) => total + card.count, 0),
                cards: cards.sort((left, right) =>
                    left.name.localeCompare(right.name, 'es', {sensitivity: 'base'}) ||
                    left.id.localeCompare(right.id, 'es')),
            }))
            .sort((left, right) =>
                left.name.localeCompare(right.name, 'es', {sensitivity: 'base'}));
    }
    get groupedCardColumns() {
        const groupsByType = new Map(this.groupedCards.map(group => [group.type, group]));
        const knownTypes = new Set(CARD_COLUMN_TYPES.flat());
        const columns = CARD_COLUMN_TYPES.map(types =>
            types.map(type => groupsByType.get(type)).filter(Boolean));

        columns[2].push(...this.groupedCards.filter(group => !knownTypes.has(group.type)));

        return columns;
    }
    renderCardColumn(groups, className) {
        return html`
            <div class="card-column ${className}">
                ${groups.map(group => html`
                    <section class="card-group" aria-label="${group.name}">
                        <h4>${group.name} (${group.cardCount} cartas)</h4>
                        <ul class="card-list">
                            ${group.cards.map(card => this.renderCard(card))}
                        </ul>
                    </section>
                `)}
            </div>
        `;
    }
    renderCard(card) {
        const imageUrl = getCardImageUrl(card);
        const currentCount = Number(card.count);
        const maxCopies = Number(card.maxCopies) || 0;
        const inputMax = Math.max(maxCopies, currentCount);

        return html`
            <li
                class="selected-card ${getAspectClass(card.aspect)}"
                role="${card.fixed ? 'listitem' : 'button'}"
                tabindex="${card.fixed ? '-1' : '0'}"
                aria-label="${card.fixed ? card.name : `Quitar ${card.name} del mazo`}"
                @click="${event => this.handleCardRowClick(event, card)}"
                @keydown="${event => this.handleCardRowKeyDown(event, card)}"
            >
                ${imageUrl ? html`
                    <button
                        class="card-image-button"
                        type="button"
                        aria-label="Ampliar imagen de ${card.name}"
                        @click="${event => this.handleImageClick(event, card)}"
                    >
                        <img src="${imageUrl}" alt="">
                    </button>
                ` : ''}
                <div class="card-info">
                    <strong class="card-name">${card.name}</strong>
                    <span>${getCardOriginName(card)}</span>
                    <mc-deck-card-economy
                        .cost="${card.cost}"
                        .resources="${card.resources}"
                    ></mc-deck-card-economy>
                </div>
                ${card.fixed ? html`
                    <span class="fixed-count">×${card.count}</span>
                ` : html`
                    <div class="selected-card-actions">
                    ${maxCopies <= 1 && currentCount === 1 ? html`
                        <span class="fixed-count">×${currentCount}</span>
                    ` : html`
                        <input
                            class="copy-count"
                            type="number"
                            min="1"
                            max="${inputMax}"
                            step="1"
                            aria-label="Copias de ${card.name}"
                            .value="${String(currentCount)}"
                            data-current-count="${currentCount}"
                            @change="${event => this.handleCountChanged(event, card.id)}"
                        >
                    `}
                    </div>
                `}
            </li>
        `;
    }
    render() {
        const columns = this.groupedCardColumns;

        return html`
            <section aria-labelledby="selected-cards-title">
                <h3 id="selected-cards-title">Mazo actual</h3>
                ${this.cards.length ? html`
                    <div class="card-groups">
                        ${this.renderCardColumn(columns[0], 'primary-column')}
                        <div class="secondary-card-columns">
                            ${this.renderCardColumn(
                                columns[1],
                                'secondary-column',
                            )}
                            ${this.renderCardColumn(
                                columns[2],
                                'events-column',
                            )}
                        </div>
                    </div>
                ` : html`<p>No hay cartas añadidas.</p>`}
                <mc-card-image-dialog
                    .open="${Boolean(this.previewCard)}"
                    .title="${this.previewCard?.name || ''}"
                    .imageUrl="${this.previewCard ? getCardImageUrl(this.previewCard) : ''}"
                    @close-card-image-dialog="${this.handlePreviewClose.bind(this)}"
                ></mc-card-image-dialog>
                ${this.pendingRemoval ? html`
                    <md-dialog
                        open
                        @closed="${this.handleRemovalDialogClosed.bind(this)}"
                    >
                        <div slot="headline">Quitar carta del mazo</div>
                        <div slot="content">
                            ¿Quieres quitar ${this.pendingRemoval.name} del mazo?
                        </div>
                        <div slot="actions">
                            <md-text-button
                                type="button"
                                @click="${this.handleRemovalDialogClosed.bind(this)}"
                            >
                                Cancelar
                            </md-text-button>
                            <md-filled-button
                                type="button"
                                @click="${this.confirmRemoval.bind(this)}"
                            >
                                Quitar
                            </md-filled-button>
                        </div>
                    </md-dialog>
                ` : ''}
            </section>
        `;
    }
}

if (!window.customElements.get(McDeckSelectedCards.is)) {
    window.customElements.define(McDeckSelectedCards.is, McDeckSelectedCards);
}
