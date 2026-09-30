import {LitElement, html} from 'lit-element';

import styles from './mc-game-zone.css.js';
import '../../cards/mc-card-list/mc-card-list.js';
import {BACK_CARD_ENCOUNTER, CARD_PATH} from '../../../misc/cards.js';

export class McGameZone extends LitElement {
    static get is() {
        return 'mc-game-zone';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            cards: {type: Array},
            minions: {type: Array},
            encounters: {type: Number},
        };
    }

    constructor() {
        super();

        this.cards = [];
        this.minions = [];
        this.encounters = 0;
    }

    handleSelect(e) {
        e.stopPropagation();

        const {card, cardIndex} = e.detail;

        this.dispatchEvent(new CustomEvent('game-zone-card-click', {
            bubbles: true,
            composed: true,
            detail: {
                card,
                cardIndex,
                ability: 0,
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
        showDamage,
        showThreat,
    }) {
        return html`
            <mc-card-list
                class="${type}"
                .cards="${cards}"
                size="s"
                show-menu-abilities
                show-generic
                .showDamage="${showDamage}"
                .showThreat="${showThreat}"
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
                    src="${CARD_PATH}${BACK_CARD_ENCOUNTER}"
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
            showDamage: true,
        });
    }
    renderMinions() {
        const {minions} = this;

        return this.renderCards({
            cards: minions,
            type: 'minions',
            showDamage: true,
        });
    }

    renderUpgrades() {
        const {cards} = this;

        return this.renderCards({
            cards: cards
                .filter(card => card.isUpgrade && !card.isAttached)
                .sort((a, b) => a.id > b.id ? 1 : -1),
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
