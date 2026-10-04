import {html} from 'lit-element';

import stylesCardList from '../mc-card-list-dialog/mc-card-list-dialog.css.js';
import {McCardListDialog} from '../mc-card-list-dialog/mc-card-list-dialog.js';

import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import styles from './mc-use-card-dialog.css.js';


export class McUseCardDialog extends McCardListDialog {
    static get properties() {
        return {
            ...super.properties,
            _dontShowInformationalDialog: {type: Boolean},
        };
    }
    static get is() {
        return 'mc-use-card-dialog';
    }
    static get styles() {
        return [stylesDialog, stylesCardList, styles];
    }
    constructor() {
        super(arguments[0]);

        this._dontShowInformationalDialog = false;
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
    handleDontShowInformationalDialogChange(e) {
        this._dontShowInformationalDialog = e.target.checked;
    }
    renderContent() {
        const {informationalDialogId} = this.data;

        return html`
            ${super.renderContent()}
            ${informationalDialogId ? html`
                <label class="remember-choice">
                    <input
                        type="checkbox"
                        .checked="${this._dontShowInformationalDialog}"
                        @change="${this.handleDontShowInformationalDialogChange.bind(this)}"
                    >
                    <span>No volver a mostrar este aviso para esta capacidad en esta partida</span>
                </label>
            ` : ''}
        `;
    }
    sendResponse() {
        const {informationalDialogId} = this.data;

        if (informationalDialogId && this._dontShowInformationalDialog) {
            this._response = {
                ...this._response,
                suppressedInformationalDialogId: informationalDialogId,
            };
        }

        super.sendResponse();
    }
    validate() {
        const {data:{mandatory}} = this;

        return !mandatory;
    }
}

window.customElements.define(McUseCardDialog.is, McUseCardDialog);
