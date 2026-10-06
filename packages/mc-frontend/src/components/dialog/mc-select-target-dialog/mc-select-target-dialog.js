import {html} from 'lit-element';

import stylesCardList from '../mc-card-list-dialog/mc-card-list-dialog.css.js';
import {McCardListDialog} from '../mc-card-list-dialog/mc-card-list-dialog.js';

import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-select-target-dialog.css.js';


export class McSelectTargetDialog extends McCardListDialog {
    static get is() {
        return 'mc-select-target-dialog';
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
                showCounters: true,
                showLife: true,
                showDamage: true,
            },
        };
    }
    renderButtonOk() {
        return html``;
    }
}

window.customElements.define(McSelectTargetDialog.is, McSelectTargetDialog);
