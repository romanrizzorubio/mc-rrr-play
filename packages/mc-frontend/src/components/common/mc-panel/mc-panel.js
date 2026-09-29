import {LitElement, html} from 'lit-element';
import styles from './mc-panel.css.js';

import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';

export class McPanel extends LitElement {
    static get is() {
        return 'mc-panel';
    }
    static get styles() {
        return [styles];
    }
    static get properties() {
        return {
            title: {type: String}
        };
    }
    constructor() {
        super();

        this.title = '';
    }
    render() {
        return html`
            <h6 class="title">${this.title}</h6>
            <div class="panel">
                <slot></slot>
            </div>
        `;
    }
}

window.customElements.define(McPanel.is, McPanel);
