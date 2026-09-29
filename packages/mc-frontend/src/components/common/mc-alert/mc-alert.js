import {LitElement, html} from 'lit-element';
import styles from './mc-alert.css.js';

import '@material/web/dialog/dialog.js';
import '@material/web/button/text-button.js';

export class McAlert extends LitElement {
    static get is() {
        return 'mc-alert';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            msg:{type: String},
            open:{type: Boolean},
        };
    }
    constructor() {
        super();

        this.msg = '';
        this.open = false;
    }
    handleClick() {
        this.dispatchEvent(new CustomEvent('alert-ok'))
    }
    render() {
        const {msg, open} = this;

        return html`
            <md-dialog type="alert" .open="${open}">
                <div slot="headline">${msg}</div>
                <div slot="content">
                </div>
                <div slot="actions">
                    <md-text-button
                        @click="${this.handleClick}"
                    >Ok</md-text-button>
                </div>
            </md-dialog>
        `;
    }
}

window.customElements.define(McAlert.is, McAlert);
