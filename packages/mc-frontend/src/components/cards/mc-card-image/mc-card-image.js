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
            rotated: {type: Boolean, reflect: true},
        };
    }
    constructor() {
        super();

        this.src = '';
        this.size = 'm';
        this.horizontal = false;
        this.rotated = false;
    }
    getOrientationClass() {
        return this.horizontal ? 'horizontal' : 'vertical';
    }
    render() {
        const {size} = this;
        const classes = [
            this.getOrientationClass(),
            `size-${size}`,
            this.rotated ? 'rotated' : '',
        ].filter(Boolean).join(' ');

        return html`
            <img
                class="${classes}"
                src="${this.src}" 
            />
        `;
    }
}

window.customElements.define(McCardImage.is, McCardImage);
