import {html} from 'lit-element';

import styles from './mc-surge-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {BACK_CARD_ENCOUNTER} from '../../../misc/cards.js';

export class McSurgeDialog extends McDialog {
    static get is() {
        return 'mc-surge-dialog';
    }
    static get properties() {
        return {
            ...super.properties,
            _skipSurgeNotification: {type: Boolean},
        };
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    constructor() {
        super(arguments[0]);

        this._skipSurgeNotification = false;
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                ...super.defaultProperties.data,
                allowHideFuture: false,
            },
        };
    }
    renderContent() {
        const {data: {allowHideFuture}} = this;

        return html`
            <div class="surge-card">
                <mc-card
                    name="Carta de Encuentros"
                    image="${BACK_CARD_ENCOUNTER}"
                    size="l"
                ></mc-card>
            </div>
            ${allowHideFuture ? html`
                <label class="remember-choice">
                    <input
                        type="checkbox"
                        .checked="${this._skipSurgeNotification}"
                        @change="${this.handleSkipSurgeNotificationChange.bind(this)}"
                    >
                    <span>No volver a mostrar este aviso durante esta partida</span>
                </label>
            ` : ''}
        `;
    }
    handleSkipSurgeNotificationChange(e) {
        this._skipSurgeNotification = e.target.checked;
    }
    sendResponse() {
        if (this.data.allowHideFuture && this._skipSurgeNotification) {
            this._response = {
                ...this._response,
                skipSurgeNotification: true,
            };
        }

        super.sendResponse();
    }
}

window.customElements.define(McSurgeDialog.is, McSurgeDialog);
