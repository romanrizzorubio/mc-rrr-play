import {LitElement, html} from 'lit-element';

import styles from './mc-card-image.css.js';

export class McCardImage extends LitElement {
    static get is() {
        return 'mc-card-image';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            src: {type: String},
            size: {type: String},
            horizontal: {type: Boolean},
        };
    }
    constructor() {
        super();

        this.src = '';
        this.size = 'm';
        this.horizontal = false;
    }
    getOrientationClass() {
        return this.horizontal ? 'horizontal' : 'vertical';
    }
    render() {
        const {size} = this;

        return html`
            <img
                class="${this.getOrientationClass()} size-${size}"
                src="${this.src}" 
            />
        `;
    }
}

window.customElements.define(McCardImage.is, McCardImage);
