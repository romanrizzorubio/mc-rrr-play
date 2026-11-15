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
    canPlayDraggedCardOnPlayer() {
        if (!this.dragPlayCard?.playableInGameZone) {
            return false;
        }

        const playerIds = this.dragPlayCard.playablePlayerIds || [];
        return playerIds.length ?
            playerIds.includes(this.player?.id) :
            this.dragPlayCard.playerId === this.player?.id;
    }
    handlePlayCardDragOver(event) {
        if (!this.canPlayDraggedCardOnPlayer()) {
            return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }
    handlePlayCardDrop(event) {
        if (!this.canPlayDraggedCardOnPlayer()) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        const playerIds = this.dragPlayCard.playablePlayerIds || [];
        this.dispatchEvent(new CustomEvent('play-card-drop', {
            bubbles: true,
            composed: true,
            detail: {
                card: this.dragPlayCard.card,
                ...(playerIds.length ? {targetId: this.player.id} : {}),
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
            <div class="panel encounters">
                <mc-card-image
                    src="${getCardAssetUrl(BACK_CARD_ENCOUNTER)}"
                    size="s"
                    .activationBlocked="${Boolean(
                        this.dragActivation || this.dragPlayCard
                    )}"
                ></mc-card-image>
                ${encounters > 1 ? html`
                    <div class="count">
                        ${encounters}
                    </div>
                ` : ''}
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
    renderObligations() {
        const obligations = this.cards.filter(card => card.isObligation);

        return obligations.length ? this.renderCards({
            cards: obligations,
            type: 'obligations',
            dragActivation: this.dragActivation,
            dragPlayCard: this.dragPlayCard,
            dragResourcePayment: this.dragResourcePayment,
        }) : '';
    }
    renderMinionsRow() {
        return html`
            <div class="minions-row">
                ${this.renderObligations()}
                ${this.renderMinions()}
            </div>
        `;
    }

    renderUpgradesAndSupports() {
        const {attachedUpgrades, cards} = this;
        const upgrades = getUpgradesForDisplay(cards, attachedUpgrades);
        const supports = cards
            .filter(card => card.isSupport)
            .sort((a, b) => a.id > b.id ? 1 : -1);

        return this.renderCards({
            cards: [...upgrades, ...supports],
            type: 'upgrades-supports',
            dragActivation: this.dragActivation,
            dragPlayCard: this.dragPlayCard,
            dragResourcePayment: this.dragResourcePayment,
        });
    }

    render() {
        return html`
            <div
                class="play-card-drop-zone ${this.canPlayDraggedCardOnPlayer() ?
                    'available' : ''}"
                @dragover="${this.handlePlayCardDragOver.bind(this)}"
                @drop="${this.handlePlayCardDrop.bind(this)}"
            >
                ${this.renderEncounters()}
                ${this.renderMinionsRow()}
                ${this.renderAllies()}
                ${this.renderUpgradesAndSupports()}
            </div>
        `;
    }
}

window.customElements.define(McGameZone.is, McGameZone);
