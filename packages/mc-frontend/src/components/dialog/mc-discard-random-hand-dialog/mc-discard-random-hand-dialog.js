import styles from './mc-discard-random-hand-dialog.css.js';
import stylesCardList from '../mc-card-list-dialog/mc-card-list-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';

import {McCardListDialog} from "../mc-card-list-dialog/mc-card-list-dialog.js";
import {random} from "../../../misc/utils.js";
export class McDiscardRandomHandDialog extends McCardListDialog {
    static get is() {
        return `mc-discard-random-hand-dialog`;
    }
    static get styles() {
        return [stylesDialog, stylesCardList, styles];
    }
    constructor() {
        super(arguments[0]);

        this._searching = false;
        this._search = 0;
    }
    connectedCallback() {
        super.connectedCallback();
        
        this._initSearch();
        setTimeout(() => {
            this._endSearch();
        }, 3000);
        this._interval = setInterval(() => {
            this._changeSearch();
        }, 100);
    }
    _initSearch() {
        this._searching = true;
        this._search = 0;

        this.requestUpdate();
    }
    _changeSearch() {
        if (this._searching) {
            if (this._search < this.data.cards.length) {
                this._search++;
            } else {
                this._search = 0;
            }
            this._marked = [this._search];
        }

        this.requestUpdate();
    }
    _endSearch() {
        if (this._searching) {
            clearInterval(this._interval);
            this._search = random(0, this.data.cards.length - 1);
            this._searching = false;
            this._marked = [this._search];
            this._response = {
                ...this._response,
                selected: this.data.cards[this._search],
            }
        }

        this.requestUpdate();
    }
    getTitle() {
        return 'Eligiendo carta aleatoria';
    }
    handleCardListSelect(e) {
        e.stopPropagation();
    }
    handleOk() {
        if (this._searching) {
            this._endSearch();
        } else {
            super.handleOk();
        }
    }
}

window.customElements.define(McDiscardRandomHandDialog.is, McDiscardRandomHandDialog);
