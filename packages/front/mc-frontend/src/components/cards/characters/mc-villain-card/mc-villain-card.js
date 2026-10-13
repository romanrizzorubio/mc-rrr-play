import {LitElement, html} from 'lit-element';

import styles from './mc-villain-card.css.js';
import '../mc-character-card/mc-character-card.js';
import {
    getBasicActivationOption,
    getCardAbilityOptions,
    isTargetClickDisabled,
    getTargetMenuOptions,
} from '../../../../utils/basic-activation.js';

export class VillainCardComponent extends LitElement {
    static get is() {
        return 'mc-villain-card';
    }
    static get styles() {
        return styles;
    }

    static get properties() {
        return {
            card: {type: Object},
            player: {type: Object},
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
        this.card = null;
        this.player = null;
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
    get basicActivation() {
        return getBasicActivationOption(this.player, this.card, 'attack');
    }
    get menuOptions() {
        return getTargetMenuOptions(
            this.card,
            this.basicActivation,
            getCardAbilityOptions(this.card),
            true
        );
    }
    get clickDisabled() {
        return isTargetClickDisabled(this.card, this.player, 'attack');
    }
    handleCardClick() {
        const abilityIndex = (this.card?.abilities || []).findIndex(ability =>
            (ability.isAction || ability.isBasic) && !ability.disable
        );

        if (abilityIndex >= 0) {
            this.dispatchEvent(new CustomEvent('ability', {
                bubbles: true,
                composed: true,
                detail: {
                    card: this.card,
                    ability: abilityIndex,
                },
            }));
        }
    }

    render() {
        const {
            card,
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
                .card="${card}"
                .basicActivation="${this.basicActivation}"
                .clickDisabled="${this.clickDisabled}"
                .menuOptions="${this.menuOptions}"
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
                @card-click="${this.handleCardClick.bind(this)}"
            >
            </mc-character-card>
        `;
    }
}

window.customElements.define(VillainCardComponent.is, VillainCardComponent);
