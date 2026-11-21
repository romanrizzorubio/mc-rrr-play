import {LitElement, html} from 'lit-element';

import styles from './mc-scenarios.css.js';
import '../../panels/mc-deck/mc-deck.js';
import '../../cards/mc-card-list/mc-card-list.js';
import '../../cards/characters/mc-villain-card/mc-villain-card.js';
import '../../cards/schemes/mc-main-scheme-card/mc-main-scheme-card.js';

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
            victoryDisplay: {type: Array},
            deckSelectionTargetIds: {type: Array},
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            dragResourcePayment: {type: Object},
            openAdditionalZones: {attribute: false},
        };
    }
    constructor() {
        super();

        this.scenario = null;
        this.player = null;
        this.victoryDisplay = [];
        this.deckSelectionTargetIds = [];
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
        this.openAdditionalZones = new Set();
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
    handleCardMenuClick(e) {
        e.stopPropagation();

        const {card, ability} = e.detail;
        this.dispatchEvent(new CustomEvent('ability', {
            bubbles: true,
            composed: true,
            detail: {
                card,
                ability,
            },
        }));
    }
    handleViewVictoryDisplay() {
        this.dispatchEvent(new CustomEvent('view-victory-display', {
            bubbles: true,
            composed: true,
        }));
    }
    isDeckSelectable(deck) {
        return Boolean(
            deck?.id &&
            this.deckSelectionTargetIds.includes(deck.id)
        );
    }
    renderVillain(zone = this.scenario?.gameZone) {
        const villain = zone?.villain ??
            (zone ? undefined : this.scenario?.villain);

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
    renderMainScheme(zone = this.scenario?.gameZone) {
        const scheme = zone?.mainScheme ??
            (zone ? undefined : this.scenario?.mainScheme);

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

        if (!extraDecks.length) {
            return '';
        }

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
                        .targetId="${deck.id || ''}"
                        .targetSelectable="${this.isDeckSelectable(deck)}"
                        .dragActivation="${this.dragActivation}"
                        .dragPlayCard="${this.dragPlayCard}"
                        .dragResourcePayment="${this.dragResourcePayment}"
                        deck-name-position="top"
                    ></mc-deck>
                `)}
            </div>
        `;
    }
    renderSchemes(zone = this.scenario?.gameZone, includeGlobalAreas = true) {
        const cards = zone?.cards || [];
        const hasEnvironmentArea = McScenario.hasEnvironmentArea(
            zone,
            this.scenario?.extraDecks,
            includeGlobalAreas
        ) || (includeGlobalAreas &&
            Object.keys(this.scenario?.additionalZones || {}).length > 0);

        return html`
            <div class="${hasEnvironmentArea ?
                'schemes has-environment-area' : 'schemes'}">
                <div class="scheme-cards">
                    <div class="main-scheme-decks">
                        ${this.renderMainScheme(zone)}
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
                        highlight-playable
                        @card-list-select="${this.handleCardSelect.bind(this)}"
                        @card-list-menu-click="${this.handleCardMenuClick.bind(this)}"
                    ></mc-card-list>
                </div>
                ${this.renderEnvironments(zone, includeGlobalAreas)}
            </div>
        `;
    }
    renderEnvironments(zone = this.scenario?.gameZone, includeGlobalAreas = true) {
        const cards = zone?.cards || [];
        const environments = cards.filter(card => card.isEnvironment);
        const extraDecks = includeGlobalAreas ?
            Object.values(this.scenario?.extraDecks || {}) :
            [];
        const additionalZones = includeGlobalAreas ?
            Object.values(this.scenario?.additionalZones || {}) :
            [];

        if (!environments.length && !extraDecks.length &&
            !additionalZones.length) {
            return '';
        }

        return html`
            <div class="environment-area">
                <div class="environments">
                    <mc-card-list
                        .cards="${environments}"
                        .dragActivation="${this.dragActivation}"
                        .dragPlayCard="${this.dragPlayCard}"
                        show-basic-stats
                        show-generic
                        show-menu-abilities
                    ></mc-card-list>
                </div>
                ${extraDecks.length ? this.renderExtraDecks() : ''}
                ${additionalZones.length ? this.renderAdditionalZones() : ''}
            </div>
        `;
    }
    static hasEnvironmentArea(zone, extraDecks = {}, includeExtraDecks = true) {
        return Boolean(zone?.cards?.some(card => card.isEnvironment) ||
            (includeExtraDecks && Object.keys(extraDecks).length));
    }
    renderZones(zones) {
        const generalZone = zones.find(zone =>
            zone.id === this.scenario?.gameZone?.id
        ) ?? zones[0];

        return html`
            <div class="scenario-zones">
                ${zones.map(zone => html`
                    <section class="scenario-play-area">
                        ${zones.length > 1 ? html`
                            <header class="zone-players">
                                ${zone.id === this.scenario?.gameZone?.id ?
                                    'General' :
                                    (zone.players || []).join(', ')}
                            </header>
                        ` : ''}
                        <div class="scenario-zone-cards">
                            ${this.renderSchemes(
                                zone,
                                zone === generalZone
                            )}
                            ${this.renderVillain(zone)}
                        </div>
                    </section>
                `)}
            </div>
        `;
    }
    getVisibleZones(zones) {
        const generalZone = zones.find(zone =>
            zone.id === this.scenario?.gameZone?.id) ?? zones[0];
        const playerZone = zones.find(zone =>
            zone.id === this.player?.scenarioZoneId) ??
            zones.find(zone => zone.players?.includes(this.player?.name));
        const visibleZones = new Set([generalZone, playerZone].filter(Boolean));

        return zones.filter(zone => visibleZones.has(zone));
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
    renderVictoryDisplay() {
        const victoryCount = this.victoryDisplay?.length || 0;
        if (!victoryCount) {
            return '';
        }
        const label = `Zona de victoria (${victoryCount})`;

        return html`
            <button
                type="button"
                class="victory-display-toggle"
                aria-label="${label}"
                @click="${this.handleViewVictoryDisplay.bind(this)}"
            >${label}</button>
        `;
    }
    renderEncounterArea() {
        return html`
            <div class="scenario-encounter-area">
                ${this.renderDeck()}
                ${this.renderVictoryDisplay()}
            </div>
        `;
    }
    toggleAdditionalZone(zoneId) {
        const openZones = new Set(this.openAdditionalZones);
        if (openZones.has(zoneId)) {
            openZones.delete(zoneId);
        } else {
            openZones.add(zoneId);
        }
        this.openAdditionalZones = openZones;
    }
    renderAdditionalZones() {
        const zones = Object.values(this.scenario?.additionalZones || {});
        if (!zones.length) {
            return '';
        }

        return html`
            <div class="additional-zones">
                ${zones.map(zone => {
                    const cards = zone.cards || [];
                    const expanded = this.openAdditionalZones.has(zone.id);

                    return html`
                        <section class="additional-zone">
                            <button
                                type="button"
                                class="additional-zone-toggle"
                                aria-expanded="${expanded}"
                                @click="${() => this.toggleAdditionalZone(zone.id)}"
                            >${zone.name}</button>
                            <mc-deck
                                .cards="${cards}"
                                .topCard="${cards[0]}"
                                .topCardFaceUp="${true}"
                                .deckName="${zone.name}"
                                .showDeckName="${false}"
                                .showDiscard="${false}"
                                size="s"
                            ></mc-deck>
                            ${expanded ? html`
                                <div class="additional-zone-cards">
                                    ${cards.map(card => html`
                                        <div class="additional-zone-card">
                                            ${(zone.displayCardInfo || []).map(info => {
                                                const value = card.additionalInfo?.[info.id];
                                                return value !== undefined &&
                                                    value !== null &&
                                                    value !== '' ? html`
                                                    <span>
                                                        <strong>${info.label}:</strong>
                                                        ${value}
                                                    </span>
                                                ` : '';
                                            })}
                                            <mc-card-list
                                                .cards="${[card]}"
                                                .player="${this.player}"
                                                .dragActivation="${this.dragActivation}"
                                                .dragPlayCard="${this.dragPlayCard}"
                                                .dragResourcePayment="${this.dragResourcePayment}"
                                            ></mc-card-list>
                                        </div>
                                    `)}
                                </div>
                            ` : ''}
                        </section>
                    `;
                })}
            </div>
        `;
    }
    render() {
        const {scenario} = this;
        const zones = scenario?.zones?.length ?
            scenario.zones :
            [{
                ...scenario?.gameZone,
                villain: scenario?.villain,
                mainScheme: scenario?.mainScheme,
            }];
        const visibleZones = this.getVisibleZones(zones);
        const zone = visibleZones[0];

        return scenario ? html`
            ${visibleZones.length > 1 ? this.renderEncounterArea() : ''}
            ${visibleZones.length > 1 ? this.renderZones(visibleZones) : html`
                <div class="scenario-board">
                    ${this.renderEncounterArea()}
                    ${this.renderSchemes(zone)}
                    ${this.renderVillain(zone)}
                </div>
            `}
        ` : '';
    }
}

window.customElements.define(McScenario.is, McScenario);
