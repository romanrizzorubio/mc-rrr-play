import styles from './mc-max-cards-dialog.css.js';
import stylesCardList from '../mc-card-list-dialog/mc-card-list-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';

import {McCardListDialog} from "../mc-card-list-dialog/mc-card-list-dialog.js";
export class McMaxCardsDialog extends McCardListDialog {
    static get is() {
        return `mc-max-allies-dialog`;
    }
    static get styles() {
        return [stylesDialog, stylesCardList, styles];
    }
    constructor() {
        super(arguments[0]);
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                ...super.defaultProperties.data,
            },
            _response: {
                ...super.defaultProperties._response,
                accepted: false,
            }
        };
    }
    getTitle() {
        const {title} = this;

        return `Has superado el máximo de ${title}, si continuas deberás descartar uno.`;
    }
    handleCardListSelect(e) {
        e.stopPropagation();
    }
    handleCancel(e) {
        super.handleOk(e);
    }
    handleOk(e) {
        this._response = {
            ...this._response,
            accepted: true,
        }

        super.handleOk(e);
    }
}

window.customElements.define(McMaxCardsDialog.is, McMaxCardsDialog);
