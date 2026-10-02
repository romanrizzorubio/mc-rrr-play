import {LitElement, html} from 'lit-element';

import styles from './mc-scheme-card.css.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';

import '../../mc-card/mc-card.js';

export class SchemeCardComponent extends LitElement {
    static get is() {
        return 'mc-scheme-card';
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
            showThreat: { type: Boolean, attribute: 'show-threat'},
            headerLeft: {type: Number, attribute: 'header-left'},
            headerRight: {type: Number, attribute: 'header-right'},
        };
    }

    constructor() {
        super();

        this.name = '';
        this.image = '';
        this.acceleration = 0;
        this.threat = 0;
        this.headerLeft = undefined;
        this.headerRight = undefined;
    }

    render() {
        const {name, image, threat, acceleration, headerLeft, headerRight} = this;

        return html`
            <mc-card
                horizontal
                name="${name}"
                image="${image}"
                threat="${threat}"
                acceleration="${acceleration}"
                show-threat
                .headerLeft="${headerLeft}"
                .headerRight="${headerRight}"
            >
            </mc-card>
        `;
    }
}

window.customElements.define(SchemeCardComponent.is, SchemeCardComponent);
