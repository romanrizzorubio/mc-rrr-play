import { LitElement, html } from 'lit-element';
import { navigator } from 'lit-element-router';

class Navigate extends navigator(LitElement) {
    static get is() {
        return 'mc-navigate';
    }
    static get properties() {
        return {
            href: { type: String }
        };
    }
    constructor() {
        super();
        this.href = '';
    }
    linkClick(event) {
        event.preventDefault();
        this.navigate(this.href);
    }
    render() {
        return html`
            <a href='${this.href}' @click='${this.linkClick}'>
                <slot></slot>
            </a>
        `;
    }
}

window.customElements.define(Navigate.is, Navigate);