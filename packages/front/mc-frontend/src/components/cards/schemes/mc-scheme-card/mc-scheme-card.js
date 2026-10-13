import {LitElement, html} from 'lit-element';

import styles from './mc-scheme-card.css.js';

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
            card: {type: Object},
            basicActivation: {type: Object},
            clickDisabled: {type: Boolean},
            menuOptions: {type: Array},
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
        this.card = null;
        this.basicActivation = null;
        this.clickDisabled = false;
        this.menuOptions = [];
        this.image = '';
        this.acceleration = 0;
        this.threat = 0;
        this.headerLeft = undefined;
        this.headerRight = undefined;
    }

    render() {
        const {
            card,
            basicActivation,
            clickDisabled,
            menuOptions,
            name,
            image,
            threat,
            acceleration,
            headerLeft,
            headerRight,
        } = this;

        return html`
            <mc-card
                .card="${card}"
                .basicActivation="${basicActivation}"
                .clickDisabled="${clickDisabled}"
                .menuOptions="${menuOptions}"
                horizontal
                size="m"
                name="${name}"
                image="${image}"
                threat="${threat}"
                acceleration="${acceleration}"
                show-threat
                .horizontal="${true}"
                .headerLeft="${headerLeft}"
                .headerRight="${headerRight}"
            >
            </mc-card>
        `;
    }
}

window.customElements.define(SchemeCardComponent.is, SchemeCardComponent);
