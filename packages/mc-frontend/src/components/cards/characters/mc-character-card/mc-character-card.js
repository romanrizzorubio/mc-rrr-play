import {LitElement, html} from 'lit-element';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';

import '../../mc-card/mc-card.js';

import styles from './mc-character-card.css.js';

export class McCharacterCard extends LitElement {
    static get is() {
        return 'mc-character-card';
    }
    static get styles() {
        return styles;
    }

    static get properties() {
        return {
            name: {type: String},
            image: {type: String},
            life: {type: Number},
            statusCards: {type: Object},
            attached: {type: Array},
            showDamage: {type: Boolean, attribute: 'show-damage'},
            headerLeft: {type: String, attribute: 'header-left'},
            headerRight: {type: String, attribute: 'header-right'},
        };
    }

    constructor() {
        super();

        this.name = '';
        this.image = '';
        this.life = 0;
        this.statusCards = {};
        this.attached = [];
        this.headerLeft = '';
        this.headerRight = '';
    }

    render() {
        const {name, image, life, statusCards, attached, headerLeft, headerRight, showDamage} = this;

        return html`
            <mc-card
                name="${name}"
                image="${image}"
                damage="${life}"
                .showDamage="${showDamage}"
                .statusCards="${statusCards}"
                .attached="${attached}"
                header-left="${headerLeft}"
                header-right="${headerRight}"
            >
            </mc-card>
        `;
    }
}

window.customElements.define(McCharacterCard.is, McCharacterCard);
