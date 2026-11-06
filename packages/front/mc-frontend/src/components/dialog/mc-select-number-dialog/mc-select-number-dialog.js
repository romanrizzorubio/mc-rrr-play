import {html} from 'lit-element';

import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import styles from './mc-select-number-dialog.css.js';

export class McSelectNumberDialog extends McDialog {
    static get is() {
        return 'mc-select-number-dialog';
    }
    static get styles() {
        return [
            stylesDialog,
            styles,
        ];
    }
    constructor() {
        super(arguments[0]);
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                min: 0,
                step: 1,
                label: 'Elige un número',
            },
            _response: {
                value: 0,
            },
        };
    }
    get minimum() {
        return Number.isSafeInteger(this.data.min) ?
            this.data.min :
            0;
    }
    handleValueChange(event) {
        const input = event.target.value;
        const value = input === '' ? undefined : Number(input);
        this._response = {value};
    }
    validate() {
        const {value} = this._response;
        const {max} = this.data;

        return Number.isSafeInteger(value) &&
            value >= this.minimum &&
            (max === undefined || value <= max);
    }
    renderContent() {
        const {label, max, step} = this.data;
        const {value} = this._response;

        return html`
            <label class="number-field">
                <span>${label || 'Elige un número'}</span>
                <input
                    type="number"
                    min="${this.minimum}"
                    step="${Number.isSafeInteger(step) && step > 0 ? step : 1}"
                    .value="${value ?? ''}"
                    max="${Number.isSafeInteger(max) ? max : ''}"
                    @input="${this.handleValueChange.bind(this)}"
                >
            </label>
        `;
    }
    renderButtons() {
        if (this.viewOnly) {
            return this.renderButtonViewerClose();
        }
        if (this.readOnly) {
            return html``;
        }

        return html`
            ${this.renderButtonCancel()}
            <md-text-button
                ?disabled="${!this.validate()}"
                @click="${this.handleOk.bind(this)}"
            >Confirmar</md-text-button>
        `;
    }
}

window.customElements.define(
    McSelectNumberDialog.is,
    McSelectNumberDialog
);
