import { LitElement, html } from 'lit-element';
import { outlet } from 'lit-element-router';

import styles from './mc-main.css.js';

class Main extends outlet(LitElement) {
    static get is() {
        return 'mc-main';
    }
    static get styles() {
        return styles;
    }
    render() {
        return html`
          <slot></slot>
        `;
    }
}

window.customElements.define(Main.is, Main);