import {html} from 'lit-element';

import '../../cards/mc-card-list/mc-card-list.js';
import stylesCardList from '../mc-card-list-dialog/mc-card-list-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';

export class McSelectCardDialog extends McDialog {
    static get is() {
        return 'mc-select-card-dialog';
    }
    static get styles() {
        return [stylesDialog, stylesCardList];
    }
    constructor() {
        super(arguments[0]);
    }
    get defaultProperties() {
        return {
            data: {
                cards: [],
                count: 1,
                distinctNames: false,
                title: '',
                upTo: false,
            },
            _response: {
                selected: [],
            },
        };
    }
    get selectionCount() {
        const {cards, count} = this.data;
        const requiredCount = Number.isInteger(count) && count > 0 ? count : 1;

        return Math.min(requiredCount, cards.length);
    }
    get isMandatorySingleSelection() {
        return !this.data.upTo && this.selectionCount === 1;
    }
    getTitle() {
        return this.data.title || this.title || 'Elige una carta';
    }
    isCardDisabled(card) {
        return this.data.distinctNames && this._response.selected.some(selectedCard =>
            selectedCard.id !== card.id && selectedCard.name === card.name);
    }
    handleCardListSelect(e) {
        if (this.isMandatorySingleSelection && this._response.selected.length) {
            return;
        }

        const {card} = e.detail;
        if (this.isCardDisabled(card)) {
            return;
        }

        const selected = this._response.selected.slice();
        const selectedIndex = selected.findIndex(selectedCard =>
            selectedCard.id === card.id);

        if (selectedIndex > -1) {
            selected.splice(selectedIndex, 1);
        } else if (selected.length < this.selectionCount) {
            selected.push(card);
        }

        this._response = {
            ...this._response,
            selected,
        };

        if (this.isMandatorySingleSelection && selected.length === 1) {
            this.sendResponse();
        }
    }
    validate() {
        return this.data.upTo ?
            this._response.selected.length <= this.selectionCount :
            this._response.selected.length === this.selectionCount;
    }
    renderButtonOk() {
        if (this.isMandatorySingleSelection) {
            return html``;
        }

        return super.renderButtonOk();
    }
    renderContent() {
        const {cards} = this.data;
        const {selected} = this._response;
        const marked = cards.reduce((indexes, card, index) => {
            if (selected.some(selectedCard => selectedCard.id === card.id)) {
                indexes.push(index);
            }

            return indexes;
        }, []);
        const disabledCards = cards.reduce((indexes, card, index) => {
            if (this.isCardDisabled(card)) {
                indexes.push(index);
            }

            return indexes;
        }, []);

        return html`
            <mc-card-list
                .cards="${cards}"
                .marked="${marked}"
                .disabledCards="${disabledCards}"
                @card-list-select="${this.handleCardListSelect.bind(this)}"
            ></mc-card-list>
        `;
    }
}

window.customElements.define(McSelectCardDialog.is, McSelectCardDialog);
