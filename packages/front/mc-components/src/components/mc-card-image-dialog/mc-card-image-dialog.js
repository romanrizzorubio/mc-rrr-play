import {LitElement, html} from 'lit-element';

import styles from './mc-card-image-dialog.css.js';

export class McCardImageDialog extends LitElement {
    static get is() {
        return 'mc-card-image-dialog';
    }
    static get properties() {
        return {
            open: {type: Boolean},
            title: {type: String},
            imageUrl: {type: String, attribute: 'image-url'},
            closeLabel: {type: String, attribute: 'close-label'},
            large: {type: Boolean},
        };
    }
    static get styles() {
        return [styles];
    }
    constructor() {
        super();

        this.open = false;
        this.title = '';
        this.imageUrl = '';
        this.closeLabel = 'Cerrar';
        this.large = false;
    }
    handleClose() {
        this.dispatchEvent(new CustomEvent('close-card-image-dialog', {
            bubbles: true,
            composed: true,
        }));
    }
    render() {
        if (!this.open) {
            return '';
        }

        return html`
            <md-dialog
                class="${this.large ? 'large' : ''}"
                open
                @closed="${this.handleClose.bind(this)}"
            >
                <div slot="headline">${this.title}</div>
                <div slot="content" class="content">
                    ${this.imageUrl ? html`
                        <img src="${this.imageUrl}" alt="${this.title}">
                    ` : html`<slot name="image"></slot>`}
                </div>
                <div slot="actions">
                    <md-text-button type="button" @click="${this.handleClose.bind(this)}">
                        ${this.closeLabel}
                    </md-text-button>
                </div>
            </md-dialog>
        `;
    }
}

if (!globalThis.customElements.get(McCardImageDialog.is)) {
    globalThis.customElements.define(McCardImageDialog.is, McCardImageDialog);
}
