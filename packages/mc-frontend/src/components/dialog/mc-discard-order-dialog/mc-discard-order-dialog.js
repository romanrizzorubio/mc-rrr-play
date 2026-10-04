import {html} from 'lit-element';

import stylesCardList from '../mc-card-list-dialog/mc-card-list-dialog.css.js';
import {McCardListDialog} from '../mc-card-list-dialog/mc-card-list-dialog.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-discard-order-dialog.css.js';
import '@material/web/button/text-button.js';

const MAX_CARDS_WITH_IMAGES = 6;

export class McDiscardOrderDialog extends McCardListDialog {
    static get properties() {
        return {
            ...super.properties,
            _dontAskAgain: {type: Boolean},
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
    }
    handleDontAskAgainChange(e) {
        this._dontAskAgain = e.target.checked;
    }
    handleSelect(card) {
        this._response = {
            selected: card,
            skipDiscardOrderDialog: this._dontAskAgain,
        };
        this.sendResponse();
    }
    handleSelectByName(card) {
        this.handleSelect(card);
    }
    handleCardListSelect(e) {
        this.handleSelect(e.detail.card);
    }
    handleDiscardAll() {
        this._response = {
            discardAll: true,
            skipDiscardOrderDialog: this._dontAskAgain,
        };
        this.sendResponse();
    }
    renderNames(cards) {
        return html`
            <ul class="card-names">
                ${cards.map(card => html`
                    <li>
                        <button
                            type="button"
                            @click="${() => this.handleSelectByName(card)}"
                        >${card.name}</button>
                    </li>
                `)}
            </ul>
        `;
    }
    renderContent() {
        const {data: {cards}} = this;

        return html`
            ${cards.length > MAX_CARDS_WITH_IMAGES ? this.renderNames(cards) : html`
                <mc-card-list
                    .cards="${cards}"
                    @card-list-select="${this.handleCardListSelect.bind(this)}"
                ></mc-card-list>
            `}
            <label class="remember-choice">
                <input
                    type="checkbox"
                    .checked="${this._dontAskAgain}"
                    @change="${this.handleDontAskAgainChange.bind(this)}"
                >
                <span>No volver a preguntar por el orden de descarte</span>
            </label>
        `;
    }
    renderButtons() {
        return html`
            <md-text-button
                @click="${this.handleDiscardAll.bind(this)}"
            >Descartar las restantes en cualquier orden</md-text-button>
        `;
    }
}

window.customElements.define(McDiscardOrderDialog.is, McDiscardOrderDialog);
