import {html} from 'lit-element';
import '@material/web/button/text-button.js';

import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-confirm-dialog.css.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';

export class McConfirmDialog extends McDialog {
    static get is() {
        return 'mc-confirm-dialog';
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    get className() {
        return 'confirm';
    }
    renderContent() {
        const {data: {reasons = []}} = this;

        return html`
            <ul class="reasons" aria-label="Motivos de la confirmación">
                ${reasons.map(reason => html`<li>${reason}</li>`)}
            </ul>
        `;
    }
    renderButtonCancel() {
        return html`
            <md-text-button @click="${this.handleCancel.bind(this)}">
                No, seguir jugando
            </md-text-button>
        `;
    }
    renderButtonOk() {
        return html`
            <md-text-button @click="${this.handleOk.bind(this)}">
                Sí, finalizar el turno
            </md-text-button>
        `;
    }
    sendResponse() {
        this.dispatchEvent(new CustomEvent('dialog-ok', {
            bubbles: true,
            composed: true,
            detail: {confirmed: true},
        }));
    }
}

window.customElements.define(McConfirmDialog.is, McConfirmDialog);
