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
            isFacedownCard: {type: Boolean},
            life: {type: Number},
            hitPoints: {type: Number},
            attack: {type: Number},
            thwart: {type: Number},
            defense: {type: Number},
            recovery: {type: Number},
            scheme: {type: Number},
            statusCards: {type: Object},
            attached: {type: Array},
            extraTraits: {type: Array},
            extraKeywords: {type: Array},
            headerLeft: {type: Number, attribute: 'header-left'},
            headerRight: {type: Number, attribute: 'header-right'},
            stage: {type: Number},
            nameWithStage: {type: Boolean, attribute: 'name-with-stage'},
        };
    }

    constructor() {
        super();

        this.name = '';
        this.image = '';
        this.isFacedownCard = false;
        this.life = 0;
        this.hitPoints = undefined;
        this.attack = undefined;
        this.thwart = undefined;
        this.defense = undefined;
        this.recovery = undefined;
        this.scheme = undefined;
        this.statusCards = {};
        this.attached = [];
        this.extraTraits = [];
        this.extraKeywords = [];
        this.headerLeft = undefined;
        this.headerRight = undefined;
        this.stage = undefined;
        this.nameWithStage = false;
    }

    render() {
        const {
            name,
            image,
            isFacedownCard,
            life,
            hitPoints,
            attack,
            thwart,
            defense,
            recovery,
            scheme,
            statusCards,
            attached,
            extraTraits,
            extraKeywords,
            headerLeft,
            headerRight,
            stage,
            nameWithStage,
        } = this;

        return html`
            <mc-card
                name="${name}"
                image="${image}"
                .isFacedownCard="${isFacedownCard}"
                .life="${life}"
                .hitPoints="${hitPoints}"
                .statusCards="${statusCards}"
                .attached="${attached}"
                .extraTraits="${extraTraits}"
                .extraKeywords="${extraKeywords}"
                show-acquired-traits
                show-basic-stats
                .headerLeft="${headerLeft}"
                .headerRight="${headerRight}"
                .stage="${stage}"
                .nameWithStage="${nameWithStage}"
                .attack="${attack}"
                .thwart="${thwart}"
                .defense="${defense}"
                .recovery="${recovery}"
                .scheme="${scheme}"
            >
            </mc-card>
        `;
    }
}

window.customElements.define(McCharacterCard.is, McCharacterCard);
