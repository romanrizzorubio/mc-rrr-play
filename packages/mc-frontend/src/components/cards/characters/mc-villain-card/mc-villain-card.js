import {LitElement, html} from 'lit-element';

import styles from './mc-villain-card.css.js';
import '../mc-character-card/mc-character-card.js';
import '@material/web/button/filled-button.js';
import '@material/web/textfield/filled-text-field.js';

export class VillainCardComponent extends LitElement {
    static get is() {
        return 'mc-villain-card';
    }
    static get styles() {
        return styles;
    }

    static get properties() {
        return {
            name: {type: String},
            image: {type: String},
            life: {type: Number},
            stage: {type: String},
            attached: {type: Array},
            statusCards: {type: Object},
        };
    }

    constructor() {
        super(arguments[0]);

        this.name = '';
        this.image = '';
        this.life = 0;
        this.stage = '';
        this.attached = [];
        this.statusCards = {};
    }

    render() {
        const {name, image, life, stage, attached, statusCards} = this;

        return html`
            <mc-character-card
                name="${name}"
                image="${image}"
                life="${life}"
                header-right="${stage}"
                show-damage
                .statusCards="${statusCards}"
                .attached="${attached}"
            >
            </mc-character-card>
        `;
    }
}

window.customElements.define(VillainCardComponent.is, VillainCardComponent);
