import {html} from 'lit-element';

import stylesCardList from '../mc-card-list-dialog/mc-card-list-dialog.css.js';
import {McCardListDialog} from '../mc-card-list-dialog/mc-card-list-dialog.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-discard-order-dialog.css.js';

export class McDiscardOrderDialog extends McCardListDialog {
    static get properties() {
        return {
            ...super.properties,
            _dontAskAgain: {type: Boolean},
            _orderedCards: {type: Array},
            _discardedCards: {type: Array},
            _draggedFrom: {type: Object},
            _draggedIndex: {type: Number},
        };
    }
    static get is() {
        return 'mc-discard-order-dialog';
    }
    static get styles() {
        return [stylesDialog, stylesCardList, styles];
    }
    constructor() {
        super(arguments[0]);

        this._dontAskAgain = false;
        this._orderedCards = [];
        this._discardedCards = [];
        this._draggedFrom = undefined;
        this._draggedIndex = undefined;
    }
    initProperties() {
        super.initProperties();
        this._orderedCards = this.data.cards.slice();
        this._discardedCards = [];
    }
    get discardCount() {
        const count = this.data.discardCount;
        return Number.isSafeInteger(count) && count > 0 ?
            Math.min(count, this.data.cards.length) :
            0;
    }
    get canReorder() {
        return this.data.allowReorder !== false;
    }
    handleDontAskAgainChange(e) {
        this._dontAskAgain = e.target.checked;
    }
    handleConfirmOrder() {
        if (this.discardCount &&
            this._discardedCards.length !== this.discardCount) {
            return;
        }

        this._response = {
            selected: this._orderedCards,
            ...(this.discardCount ?
                {discarded: this._discardedCards} :
                {}),
            skipDiscardOrderDialog: this._dontAskAgain,
        };
        this.sendResponse();
    }
    handleDragStart(zone, index, e) {
        this._draggedFrom = {zone, index};
        this._draggedIndex = index;
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', `${zone}:${index}`);
        }
    }
    handleDragOver(e) {
        e.preventDefault();
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'move';
        }
    }
    handleDropOnOrdered(index, e) {
        e.preventDefault();
        e.stopPropagation();
        const draggedFrom = this._draggedFrom;
        if (!draggedFrom) {
            return;
        }

        const orderedCards = this._orderedCards.slice();
        const discardedCards = this._discardedCards.slice();
        if (draggedFrom.zone === 'discarded') {
            const [card] = discardedCards.splice(draggedFrom.index, 1);
            orderedCards.splice(
                Math.min(index, orderedCards.length),
                0,
                card
            );
            if (!this.canReorder) {
                orderedCards.sort((first, second) =>
                    this.data.cards.indexOf(first) -
                    this.data.cards.indexOf(second));
            }
        } else if (this.canReorder) {
            const [card] = orderedCards.splice(draggedFrom.index, 1);
            orderedCards.splice(
                Math.min(index, orderedCards.length),
                0,
                card
            );
        } else {
            return;
        }

        this._orderedCards = orderedCards;
        this._discardedCards = discardedCards;
        this.resetDraggedCard();
    }
    handleDropOnDiscard(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!this.discardCount || !this._draggedFrom ||
            this._draggedFrom.zone !== 'ordered') {
            return;
        }

        const orderedCards = this._orderedCards.slice();
        const discardedCards = this._discardedCards.slice();
        const [card] = orderedCards.splice(this._draggedFrom.index, 1);
        if (discardedCards.length === this.discardCount) {
            const [replacedCard] = discardedCards.splice(0, 1);
            orderedCards.splice(this._draggedFrom.index, 0, replacedCard);
        }
        discardedCards.push(card);

        this._orderedCards = orderedCards;
        this._discardedCards = discardedCards;
        this.resetDraggedCard();
    }
    resetDraggedCard() {
        this._draggedFrom = undefined;
        this._draggedIndex = undefined;
    }
    handleDragEnd() {
        this.resetDraggedCard();
    }
    renderCard(card, index, zone, size) {
        const isDragging = this._draggedFrom?.zone === zone &&
            index === this._draggedIndex;
        return html`
            <div
                class="ordered-card ${isDragging ? 'dragging' : ''}"
                role="listitem"
                aria-label="${card.name}, posición ${index + 1}"
                draggable="${zone === 'discarded' || this.canReorder || this.discardCount > 0}"
                @dragstart="${e => this.handleDragStart(zone, index, e)}"
                @dragover="${this.handleDragOver.bind(this)}"
                @drop="${zone === 'discarded' ?
                    this.handleDropOnDiscard.bind(this) :
                    e => this.handleDropOnOrdered(index, e)}"
                @dragend="${this.handleDragEnd.bind(this)}"
            >
                <mc-card
                    name="${card.name}"
                    image="${card.image}"
                    .card="${card}"
                    size="${size}"
                    wrap-name
                    ?horizontal="${Boolean(card.isMainScheme || card.isSideScheme)}"
                    .isFacedownCard="${Boolean(card.isFacedownCard)}"
                    .canPeekFacedown="${Boolean(card.isFacedownCard && card.image)}"
                ></mc-card>
            </div>
        `;
    }
    renderContent() {
        const {data: {cards}, _orderedCards, _discardedCards} = this;
        const size = cards.length > 8 ? 's' : 'm';
        const discardCount = this.discardCount;
        const discardCountLabel = discardCount === 1 ?
            'una carta' :
            `${discardCount} cartas`;

        return html`
            <p class="order-instructions">
                ${discardCount ?
                    this.canReorder ?
                        `Arrastra ${discardCountLabel} al descarte y ordena las demás. La carta de la izquierda quedará arriba del mazo.` :
                        `Arrastra ${discardCountLabel} al descarte. El orden de las demás se conservará.` :
                    'Arrastra las cartas para elegir el orden en que se descartan. La carta de la izquierda quedará más arriba en la pila de descartes.'}
            </p>
            ${discardCount ? html`
                <div class="card-zones">
                    <section class="card-zone order-zone">
                        <h3>Cartas que vuelven al mazo</h3>
                        <div
                            class="ordered-cards"
                            role="list"
                            @dragover="${this.handleDragOver.bind(this)}"
                            @drop="${e => this.handleDropOnOrdered(_orderedCards.length, e)}"
                        >
                            ${_orderedCards.map((card, index) =>
                                this.renderCard(card, index, 'ordered', size))}
                        </div>
                    </section>
                    <section class="card-zone discard-zone">
                        <h3>Descartar (${_discardedCards.length}/${discardCount})</h3>
                        <div
                            class="discard-cards"
                            role="list"
                            @dragover="${this.handleDragOver.bind(this)}"
                            @drop="${this.handleDropOnDiscard.bind(this)}"
                        >
                            ${_discardedCards.length ?
                                _discardedCards.map((card, index) =>
                                    this.renderCard(card, index, 'discarded', size)) :
                                html`<span class="discard-placeholder">Arrastra aquí las cartas que se descartan</span>`}
                        </div>
                    </section>
                </div>
            ` : html`
                <div
                    class="ordered-cards"
                    role="list"
                    @dragover="${this.handleDragOver.bind(this)}"
                    @drop="${e => this.handleDropOnOrdered(_orderedCards.length, e)}"
                >
                    ${_orderedCards.map((card, index) =>
                        this.renderCard(card, index, 'ordered', size))}
                </div>
            `}
            ${!discardCount && this.canReorder ? html`
                <label class="remember-choice">
                    <input
                        type="checkbox"
                        .checked="${this._dontAskAgain}"
                        @change="${this.handleDontAskAgainChange.bind(this)}"
                    >
                    <span>No volver a preguntar por el orden de descarte</span>
                </label>
            ` : ''}
        `;
    }
    renderButtons() {
        if (this.discardCount) {
            return html`
                <md-text-button
                    ?disabled="${this._discardedCards.length !== this.discardCount}"
                    @click="${this.handleConfirmOrder.bind(this)}"
                >Confirmar descarte y orden</md-text-button>
            `;
        }

        return html`
            <md-text-button
                @click="${this.handleConfirmOrder.bind(this)}"
            >Confirmar orden</md-text-button>
        `;
    }
}

window.customElements.define(McDiscardOrderDialog.is, McDiscardOrderDialog);
