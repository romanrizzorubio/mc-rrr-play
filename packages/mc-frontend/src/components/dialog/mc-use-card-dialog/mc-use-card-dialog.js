import stylesCardList from '../mc-card-list-dialog/mc-card-list-dialog.css.js';
import {McCardListDialog} from '../mc-card-list-dialog/mc-card-list-dialog.js';

import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-use-card-dialog.css.js';


export class McUseCardDialog extends McCardListDialog {
    static get is() {
        return 'mc-use-card-dialog';
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
                mandatory: false,
            },
        };
    }
    getFooter() {
        const {showCancel, hideOk} = this;

        if (showCancel && !hideOk) {
            return 'Pulsa Ok si no quieres usar ninguna.';
        }

        return '';
    }
    validate() {
        const {data:{mandatory}} = this;

        return !mandatory;
    }
}

window.customElements.define(McUseCardDialog.is, McUseCardDialog);
