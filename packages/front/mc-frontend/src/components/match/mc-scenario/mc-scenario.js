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
            player: {type: Object},
            deckSelectionTargetIds: {type: Array},
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            dragResourcePayment: {type: Object},
        };
    }
    constructor() {
        super();

        this.scenario = null;
        this.player = null;
        this.deckSelectionTargetIds = [];
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
    }
    handleCardSelect(e) {
        const {card} = e.detail;
        const ability = (card.abilities || []).find((candidate, index) =>
            (candidate.isAction || candidate.isBasic) &&
            !candidate.disable &&
            (candidate.index ?? index) >= 0
        );

        if (ability) {
            this.dispatchEvent(new CustomEvent('ability', {
                bubbles: true,
                composed: true,
                detail: {
                    card,
                    ability: ability.index ?? card.abilities.indexOf(ability),
                },
            }));
        }
    }
    isDeckSelectable(deck) {
        return Boolean(
            deck?.id &&
            this.deckSelectionTargetIds.includes(deck.id)
        );
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
                unprintedStats = [],
                stage,
                attached,
                faceDown,
                tuckedCards,
                statusCards,
                extraTraits = [],
                extraKeywords = [],
            } = villain;

            return html`
                <mc-villain-card
                    .card="${villain}"
                    .player="${this.player}"
                    .dragActivation="${this.dragActivation}"
                    .dragPlayCard="${this.dragPlayCard}"
                    .dragResourcePayment="${this.dragResourcePayment}"
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
                    .unprintedStats="${unprintedStats}"
                    .statusCards="${statusCards}"
                    .attached="${attached}"
                    .faceDown="${faceDown}"
                    .tuckedCards="${tuckedCards}"
                    .extraTraits="${extraTraits}"
                    .extraKeywords="${extraKeywords}"
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
                counters,
                value,
                stage,
                attached = [],
            } = scheme;

            return html`
                <mc-main-scheme-card
                    .card="${scheme}"
                    .attached="${attached}"
                    .player="${this.player}"
                    .dragActivation="${this.dragActivation}"
                    .dragPlayCard="${this.dragPlayCard}"
                    .dragResourcePayment="${this.dragResourcePayment}"
                    name="${name}"
                    image="${image}"
                    .acceleration="${accelerationTokens}"
                    .threat="${threat}"
                    .counters="${counters}"
                    .value="${value}"
                    .stage="${stage}"
                    show-threat
                ></mc-main-scheme-card>
            `;
        } else {
            return '';
        }
    }
    renderExtraDecks() {
        const extraDecks = Object.values(this.scenario.extraDecks || {});

        return html`
            <div class="extra-decks">
                ${extraDecks.map(deck => html`
                    <mc-deck
                        .cards="${deck.cards}"
                        .discard="${deck.discard || []}"
                        .knownCards="${deck.knownCards || []}"
                        .deckName="${deck.name}"
                        .deckNameSpansPiles="${true}"
                        .showDiscard="${deck.hasDiscard !== false}"
                        .dragActivation="${this.dragActivation}"
                        .dragPlayCard="${this.dragPlayCard}"
                        .dragResourcePayment="${this.dragResourcePayment}"
                        deck-name-position="top"
                    ></mc-deck>
                `)}
            </div>
        `;
    }
    renderSchemes() {
        const {scenario: {gameZone: {cards}}} = this;

        return html`
            <div class="schemes">
                <div class="main-scheme-decks">
                    ${this.renderMainScheme()}
                </div>
                <mc-card-list
                    .cards="${cards.filter(card =>
                        card.isSideScheme)}"
                    .player="${this.player}"
                    .dragActivation="${this.dragActivation}"
                    .dragPlayCard="${this.dragPlayCard}"
                    .dragResourcePayment="${this.dragResourcePayment}"
                    basic-activation-type="thwart"
                    show-basic-stats
                    show-threat
                    show-menu-abilities
                    @card-list-select="${this.handleCardSelect.bind(this)}"
                ></mc-card-list>
            </div>
        `;
    }
    renderEnvironments() {
        const {scenario: {gameZone: {cards}}} = this;

        return html`
            <div class="environments">
                <mc-card-list
                    .cards="${cards.filter(card => card.isEnvironment)}"
                    .dragActivation="${this.dragActivation}"
                    .dragPlayCard="${this.dragPlayCard}"
                    show-basic-stats
                    show-generic
                    show-menu-abilities
                ></mc-card-list>
                ${this.renderExtraDecks()}
            </div>
        `;
    }
    renderDeck() {
        const {deck} = this.scenario;

        return html`
            <mc-deck
                .cards="${deck.cards}"
                .discard="${deck.discard || []}"
                .knownCards="${deck.knownCards || []}"
                .targetId="${deck.id || ''}"
                .targetSelectable="${this.isDeckSelectable(deck)}"
                .dragActivation="${this.dragActivation}"
                .dragPlayCard="${this.dragPlayCard}"
                discard-label="Descarte del mazo de encuentros"
            ></mc-deck>
        `;
    }
    render() {
        const {scenario} = this;

        return scenario ? html`
            ${this.renderDeck()}
            ${this.renderSchemes()}
            ${this.renderEnvironments()}
            ${this.renderVillain()}
        ` : '';
    }
}

window.customElements.define(McScenario.is, McScenario);
