import {LitElement, html} from 'lit-element';

import styles from './mc-main-scheme-card.css.js';
import '../mc-scheme-card/mc-scheme-card.js';
import {
    getBasicActivationOption,
    getCardAbilityOptions,
    isTargetClickDisabled,
    getTargetMenuOptions,
} from '../../../../utils/basic-activation.js';

export class MainSchemeCardComponent extends LitElement {
    static get is() {
        return 'mc-main-scheme-card';
    }
    static get styles() {
        return styles;
    }

    static get properties() {
        return {
            card: {type: Object},
            attached: {type: Array},
            player: {type: Object},
            dragActivation: {type: Object},
            name: { type: String},
            image: { type: String},
            acceleration: { type: Number},
            threat: { type: Number},
            value: { type: Number},
            stage: { type: Number},
        };
    }

    constructor() {
        super(arguments[0]);

        this.name = '';
        this.card = null;
        this.attached = [];
        this.player = null;
        this.dragActivation = null;
        this.image = '';
        this.acceleration = 0;
        this.threat = 0;
        this.value = 0;
        this.stage = undefined;
    }
    get basicActivation() {
        return getBasicActivationOption(this.player, this.card, 'thwart');
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
        return isTargetClickDisabled(this.card, this.player, 'thwart');
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
            attached,
            name,
            image,
            threat,
            acceleration,
            value,
            stage,
        } = this;

        return html`
            <mc-scheme-card
                .card="${card}"
                .attached="${attached}"
                .basicActivation="${this.basicActivation}"
                .dragActivation="${this.dragActivation}"
                .clickDisabled="${this.clickDisabled}"
                .menuOptions="${this.menuOptions}"
                name="${name}"
                image="${image}"
                acceleration="${acceleration}"
                threat="${threat}"
                .headerLeft="${value}"
                .headerRight="${stage}"
                @card-click="${this.handleCardClick.bind(this)}"
            >
            </mc-scheme-card>
        `;
    }
}

window.customElements.define(MainSchemeCardComponent.is, MainSchemeCardComponent);
