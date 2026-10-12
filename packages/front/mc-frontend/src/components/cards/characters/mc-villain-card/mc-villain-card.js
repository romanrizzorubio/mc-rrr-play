import {LitElement, html} from 'lit-element';

import styles from './mc-villain-card.css.js';
import '../mc-character-card/mc-character-card.js';

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
            hitPoints: {type: Number},
            attack: {type: Number},
            thwart: {type: Number},
            defense: {type: Number},
            recovery: {type: Number},
            scheme: {type: Number},
            unprintedStats: {type: Array},
            stage: {type: Number},
            attached: {type: Array},
            faceDown: {type: Array},
            tuckedCards: {type: Array},
            statusCards: {type: Object},
            extraTraits: {type: Array},
            extraKeywords: {type: Array},
        };
    }

    constructor() {
        super(arguments[0]);

        this.name = '';
        this.image = '';
        this.life = 0;
        this.hitPoints = undefined;
        this.attack = undefined;
        this.thwart = undefined;
        this.defense = undefined;
        this.recovery = undefined;
        this.scheme = undefined;
        this.unprintedStats = [];
        this.stage = undefined;
        this.attached = [];
        this.faceDown = [];
        this.tuckedCards = [];
        this.statusCards = {};
        this.extraTraits = [];
        this.extraKeywords = [];
    }

    render() {
        const {
            name,
            image,
            life,
            hitPoints,
            attack,
            thwart,
            defense,
            recovery,
            scheme,
            unprintedStats,
            stage,
            attached,
            faceDown,
            tuckedCards,
            statusCards,
            extraTraits,
            extraKeywords,
        } = this;

        return html`
            <mc-character-card
                name="${name}"
                image="${image}"
                life="${life}"
                .hitPoints="${hitPoints}"
                .stage="${stage}"
                .nameWithStage="${true}"
                .attack="${attack}"
                .thwart="${thwart}"
                .defense="${defense}"
                .recovery="${recovery}"
                .scheme="${scheme}"
                .unprintedStats="${unprintedStats}"
                .statusCards="${statusCards}"
                .attached="${attached}"
                .faceDown="${faceDown}"
                .tuckedCards="${tuckedCards}"
                .extraTraits="${extraTraits}"
                .extraKeywords="${extraKeywords}"
            >
            </mc-character-card>
        `;
    }
}

window.customElements.define(VillainCardComponent.is, VillainCardComponent);
