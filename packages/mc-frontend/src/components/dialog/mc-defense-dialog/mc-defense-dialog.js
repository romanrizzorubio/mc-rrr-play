import {html} from 'lit-element';

import styles from './mc-defense-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../panels/mc-defense/mc-defense.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';

export class McDefenseDialog extends McDialog {
    static get is() {
        return 'mc-defense-dialog';
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    constructor() {
        super(arguments[0]);
    }
    get className() {
        return 'large';
    }
    get defaultProperties() {
        return {
            data: {
                count: 0,
                cards: [],
            },
            _response: {
                defender: null
            }
        };
    }
    getTitle() {
        return 'Quieres defender';
    }
    handleDefenseSelect(e) {
        const {card} = e.detail;

        this._response = {
            defender: card
        };

        this.sendResponse();
    }
    renderContent() {
        const {data: {attack, defenders}} = this;

        return attack ? html`
            <mc-defense
                .attack="${attack}"
                .defenders="${defenders}"
                @select-defender="${this.handleDefenseSelect.bind(this)}"
            ></mc-defense>
        ` : html``;
    }
}

window.customElements.define(McDefenseDialog.is, McDefenseDialog);
