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
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            dragResourcePayment: {type: Object},
        };
    }

    constructor() {
        super();

        this.player = null;
        this.cards = [];
        this.attachedUpgrades = [];
        this.minions = [];
        this.encounters = 0;
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
    }
    handlePlayCardDragOver(event) {
        if (!this.dragPlayCard?.playableInGameZone) {
            return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }
    handlePlayCardDrop(event) {
        if (!this.dragPlayCard?.playableInGameZone) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('play-card-drop', {
            bubbles: true,
            composed: true,
            detail: {
                card: this.dragPlayCard.card,
            },
        }));
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
        dragActivation,
        dragPlayCard,
        dragResourcePayment,
    }) {
        return html`
            <mc-card-list
                class="${type}"
                .cards="${cards}"
                .player="${this.player}"
                .dragActivation="${dragActivation}"
                .dragPlayCard="${dragPlayCard}"
                .dragResourcePayment="${dragResourcePayment}"
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
                    .activationBlocked="${Boolean(
                        this.dragActivation || this.dragPlayCard
                    )}"
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
            dragActivation: this.dragActivation,
            dragPlayCard: this.dragPlayCard,
            dragResourcePayment: this.dragResourcePayment,
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
            dragActivation: this.dragActivation,
            dragPlayCard: this.dragPlayCard,
            dragResourcePayment: this.dragResourcePayment,
        });
    }

    renderUpgrades() {
        const {attachedUpgrades, cards} = this;

        return this.renderCards({
            cards: getUpgradesForDisplay(cards, attachedUpgrades),
            type: 'upgrades',
            dragActivation: this.dragActivation,
            dragPlayCard: this.dragPlayCard,
            dragResourcePayment: this.dragResourcePayment,
        });
    }

    renderSupports() {
        const {cards} = this;

        return this.renderCards({
            cards: cards
                .filter(card => card.isSupport)
                .sort((a, b) => a.id > b.id ? 1 : -1),
            type: 'supports',
            dragActivation: this.dragActivation,
            dragPlayCard: this.dragPlayCard,
            dragResourcePayment: this.dragResourcePayment,
        });
    }

    render() {
        return html`
            <div
                class="play-card-drop-zone ${this.dragPlayCard?.playableInGameZone ?
                    'available' : ''}"
                @dragover="${this.handlePlayCardDragOver.bind(this)}"
                @drop="${this.handlePlayCardDrop.bind(this)}"
            >
                ${this.renderEncounters()}
                ${this.renderMinions()}
                ${this.renderAllies()}
                <div class="upgrades-supports">
                    ${this.renderUpgrades()}
                    ${this.renderSupports()}
                </div>
            </div>
        `;
    }
}

window.customElements.define(McGameZone.is, McGameZone);
