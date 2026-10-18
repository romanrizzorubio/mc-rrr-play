import {LitElement, html} from 'lit-element';

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
            card: {type: Object},
            basicActivation: {type: Object},
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            dragResourcePayment: {type: Object},
            clickDisabled: {type: Boolean},
            menuOptions: {type: Array},
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
            unprintedStats: {type: Array},
            statusCards: {type: Object},
            attached: {type: Array},
            faceDown: {type: Array},
            tuckedCards: {type: Array},
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
        this.card = null;
        this.basicActivation = null;
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
        this.clickDisabled = false;
        this.menuOptions = [];
        this.image = '';
        this.isFacedownCard = false;
        this.life = 0;
        this.hitPoints = undefined;
        this.attack = undefined;
        this.thwart = undefined;
        this.defense = undefined;
        this.recovery = undefined;
        this.scheme = undefined;
        this.unprintedStats = [];
        this.statusCards = {};
        this.attached = [];
        this.faceDown = [];
        this.tuckedCards = [];
        this.extraTraits = [];
        this.extraKeywords = [];
        this.headerLeft = undefined;
        this.headerRight = undefined;
        this.stage = undefined;
        this.nameWithStage = false;
    }

    render() {
        const {
            card,
            basicActivation,
            dragActivation,
            dragPlayCard,
            clickDisabled,
            menuOptions,
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
            unprintedStats,
            statusCards,
            attached,
            faceDown,
            tuckedCards,
            extraTraits,
            extraKeywords,
            headerLeft,
            headerRight,
            stage,
            nameWithStage,
        } = this;

        return html`
            <mc-card
                .card="${card}"
                .basicActivation="${basicActivation}"
                .dragActivation="${dragActivation}"
                .dragPlayCard="${dragPlayCard}"
                .dragResourcePayment="${this.dragResourcePayment}"
                .clickDisabled="${clickDisabled}"
                .menuOptions="${menuOptions}"
                name="${name}"
                image="${image}"
                .isFacedownCard="${isFacedownCard}"
                .life="${life}"
                .hitPoints="${hitPoints}"
                .statusCards="${statusCards}"
                .attached="${attached}"
                .faceDown="${faceDown}"
                .tuckedCards="${tuckedCards}"
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
                .unprintedStats="${unprintedStats}"
            >
            </mc-card>
        `;
    }
}

window.customElements.define(McCharacterCard.is, McCharacterCard);
