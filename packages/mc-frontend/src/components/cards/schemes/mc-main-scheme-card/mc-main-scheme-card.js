import {LitElement, html} from 'lit-element';

import styles from './mc-main-scheme-card.css.js';
import '../mc-scheme-card/mc-scheme-card.js';

export class MainSchemeCardComponent extends LitElement {
    static get is() {
        return 'mc-main-scheme-card';
    }
    static get styles() {
        return styles;
    }

    static get properties() {
        return {
            name: { type: String},
            image: { type: String},
            acceleration: { type: Number},
            threat: { type: Number},
            value: { type: Number},
            stage: { type: String},
        };
    }

    constructor() {
        super(arguments[0]);

        this.name = '';
        this.image = '';
        this.acceleration = 0;
        this.threat = 0;
        this.value = 0;
        this.stage = '';
    }

    render() {
        const {name, image, threat, acceleration, value, stage} = this;

        return html`
            <mc-scheme-card
                name="${name}"
                image="${image}"
                acceleration="${acceleration}"
                threat="${threat}"
                header-left="${value}"
                header-right="${stage}"
            >
            </mc-scheme-card>
        `;
    }
}

window.customElements.define(MainSchemeCardComponent.is, MainSchemeCardComponent);
