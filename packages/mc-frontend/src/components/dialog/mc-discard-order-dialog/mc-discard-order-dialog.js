import {html} from 'lit-element';

import stylesCardList from '../mc-card-list-dialog/mc-card-list-dialog.css.js';
import {McCardListDialog} from '../mc-card-list-dialog/mc-card-list-dialog.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-discard-order-dialog.css.js';
import '@material/web/button/text-button.js';

const MAX_CARDS_WITH_IMAGES = 6;

export class McDiscardOrderDialog extends McCardListDialog {
    static get is() {
        return 'mc-discard-order-dialog';
    }
    static get styles() {
        return [stylesDialog, stylesCardList, styles];
    }
    constructor() {
        super(arguments[0]);
    }
    handleSelectByName(card) {
        this._response = {selected: card};
        this.sendResponse();
    }
    handleDiscardAll() {
        this._response = {discardAll: true};
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

        if (cards.length > MAX_CARDS_WITH_IMAGES) {
            return this.renderNames(cards);
        }

        return html`
            <mc-card-list
                .cards="${cards}"
                @card-list-select="${this.handleCardListSelect.bind(this)}"
            ></mc-card-list>
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
