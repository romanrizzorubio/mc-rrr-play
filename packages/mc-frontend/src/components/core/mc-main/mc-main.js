import { LitElement, html } from 'lit-element';
import { outlet } from 'lit-element-router';

class Main extends outlet(LitElement) {
    static get is() {
        return 'mc-main';
    }
    render() {
        return html`
          <slot></slot>
        `;
    }
}

window.customElements.define(Main.is, Main);