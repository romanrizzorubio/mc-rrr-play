import {LitElement, html} from 'lit-element';

import styles from './mc-game-zone.css.js';
import '../../cards/mc-card-list/mc-card-list.js';
import {BACK_CARD_ENCOUNTER, getCardAssetUrl} from '../../../misc/cards.js';
import {getUpgradesForDisplay} from '../../../utils/game-zone.js';

export class McGameZone extends LitElement {
    static get is() {
        return 'mc-game-zone';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            player: {type: Object},
            cards: {type: Array},
            attachedUpgrades: {type: Array},
            minions: {type: Array},
            encounters: {type: Number},
        };
    }

    constructor() {
        super();

        this.player = null;
        this.cards = [];
        this.attachedUpgrades = [];
        this.minions = [];
        this.encounters = 0;
    }

    handleSelect(e) {
        e.stopPropagation();

        const {card, cardIndex} = e.detail;
        const ability = card.abilities.findIndex(_ability =>
            (_ability.isAction || _ability.isBasic) && !_ability.disable);

        if (ability < 0) {
            return;
        }

        this.dispatchEvent(new CustomEvent('game-zone-card-click', {
            bubbles: true,
            composed: true,
            detail: {
                card,
                cardIndex,
                ability,
            }
        }));
    }

    handleMenuClick(e) {
        e.stopPropagation();

        this.dispatchEvent(new CustomEvent('game-zone-menu-click', {
            bubbles: true,
            composed: true,
            detail: {
                ...e.detail,
            }
        }));
    }

    renderCards({
        cards,
        type,
        showLife,
        showThreat,
        showAcquiredTraits,
        basicActivationType,
    }) {
        return html`
            <mc-card-list
                class="${type}"
                .cards="${cards}"
                .player="${this.player}"
                basic-activation-type="${basicActivationType || ''}"
                size="s"
                show-menu-abilities
                show-basic-stats
                .showAcquiredTraits="${showAcquiredTraits}"
                show-generic
                .showLife="${showLife}"
                .showThreat="${showThreat}"
                .highlightPlayable="${true}"
                show-exhausted
                @card-list-select="${this.handleSelect}"
                @card-list-menu-click="${this.handleMenuClick}"
            ></mc-card-list>
        `;
    }

    renderEncounters() {
        const {encounters} = this;

        return encounters ? html`
            <div class="panel">
                <mc-card-image
                    src="${getCardAssetUrl(BACK_CARD_ENCOUNTER)}"
                    size="xs"
                ></mc-card-image>
                <div class="count">
                    ${encounters}
                </div>
            </div>
        ` : html``;
    }

    renderAllies() {
        const {cards} = this;

        return this.renderCards({
            cards: cards.filter(card => card.isAlly),
            type: 'allies',
            showLife: true,
            showAcquiredTraits: true,
        });
    }
    renderMinions() {
        const {minions} = this;

        return this.renderCards({
            cards: minions,
            type: 'minions',
            showLife: true,
            showAcquiredTraits: true,
            basicActivationType: 'attack',
        });
    }

    renderUpgrades() {
        const {attachedUpgrades, cards} = this;

        return this.renderCards({
            cards: getUpgradesForDisplay(cards, attachedUpgrades),
            type: 'upgrades',
        });
    }

    renderSupports() {
        const {cards} = this;

        return this.renderCards({
            cards: cards
                .filter(card => card.isSupport)
                .sort((a, b) => a.id > b.id ? 1 : -1),
            type: 'supports',
        });
    }

    render() {
        return html`
            ${this.renderEncounters()}
            ${this.renderMinions()}
            ${this.renderAllies()}
            <div class="upgrades-supports">
                ${this.renderUpgrades()}
                ${this.renderSupports()}
            </div>
        `;
    }
}

window.customElements.define(McGameZone.is, McGameZone);
