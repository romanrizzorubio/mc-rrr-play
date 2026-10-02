import {LitElement, html} from 'lit-element';

import styles from './mc-scenarios.css.js';
import '../../panels/mc-deck/mc-deck.js';
import '../../cards/mc-card-list/mc-card-list.js';
import '../../cards/characters/mc-villain-card/mc-villain-card.js';
import '../../cards/schemes/mc-main-scheme-card/mc-main-scheme-card.js';
import {path} from '../../../misc/utils.js';

export class McScenario extends LitElement {
    static get is() {
        return 'mc-scenario';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            scenario: {type: Object},
        };
    }
    constructor() {
        super();

        this.scenario = null;
    }
    renderVillain() {
        const villain = path(this, 'scenario.villain');

        if (villain) {
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
                stage,
                attached,
                statusCards,
                extraTraits = [],
            } = villain;

            return html`
                <mc-villain-card
                    name="${name}"
                    image="${image}"
                    life="${life}"
                    .hitPoints="${hitPoints}"
                    .stage="${stage}"
                    .attack="${attack}"
                    .thwart="${thwart}"
                    .defense="${defense}"
                    .recovery="${recovery}"
                    .scheme="${scheme}"
                    .statusCards="${statusCards}"
                    .attached="${attached}"
                    .extraTraits="${extraTraits}"
                ></mc-villain-card>
            `;
        }

        return '';
    }
    renderMainScheme() {
        const scheme = path(this, 'scenario.mainScheme');

        if (scheme) {
            const {
                name,
                image,
                threat,
                accelerationTokens,
                value,
                stage
            } = scheme;

            return html`
                <mc-main-scheme-card
                    name="${name}"
                    image="${image}"
                    .acceleration="${accelerationTokens}"
                    .threat="${threat}"
                    .value="${value}"
                    .stage="${stage}"
                    show-threat
                ></mc-main-scheme-card>
            `;
        } else {
            return '';
        }
    }
    renderSchemes() {
        const {scenario: {gameZone: {cards}}} = this;

        return html`
            <div class="schemes">
                ${this.renderMainScheme()}
                <mc-card-list
                    .cards="${cards.filter(card => card.isSideScheme)}"
                    show-basic-stats
                    show-threat
                ></mc-card-list>
            </div>
        `;
    }
    renderDeck() {
        const {scenario: {deck: {cards, discard}}} = this;

        return html`
            <mc-deck
                .cards="${cards}"
                .discard="${discard}"
                discard-label="Descarte del mazo de encuentros"
            ></mc-deck>
        `;
    }
    render() {
        const {scenario} = this;

        return scenario ? html`
            ${this.renderDeck()}
            ${this.renderSchemes()}
            ${this.renderVillain()}
        ` : '';
    }
}

window.customElements.define(McScenario.is, McScenario);
