import {LitElement, html} from 'lit-element';
import styles from './mc-card.css.js';

import "../mc-card-image/mc-card-image.js";

import '@material/web/menu/menu.js';
import '@material/web/menu/menu-item.js';

import {
    BACK_CARD_ENCOUNTER_FULL,
    BACK_CARD_PLAYER_FULL,
    BACK_CARD_VILLAIN_FULL, CARD_PATH
} from "../../../misc/cards.js";

const CARD_TYPES = {
    ENCOUNTER_CARD: 'ENCOUNTER_CARD',
    ENCOUNTER_PLAYER: 'ENCOUNTER_PLAYER',
    ENCOUNTER_VILLAIN: 'ENCOUNTER_VILLAIN',
}

export class CardComponent extends LitElement {
    static get is() {
        return 'mc-card';
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            name: {type: String},
            image: {type: String},
            size: {type: String},
            horizontal: {type: Boolean},
            acceleration: {type: Number},
            damage: {type: Number},
            generic: {type: Number},
            threat: {type: Number},
            showDamage: {type: Boolean, attribute: 'show-damage'},
            showDamageIfHas: {type: Boolean, attribute: 'show-damage-if-has'},
            showThreat: {type: Boolean, attribute: 'show-threat'},
            showGeneric: {type: Boolean, attribute: 'show-generic'},
            statusCards: {type: Object},
            attached: {type: Array},
            headerLeft: {type: String, attribute: 'header-left'},
            headerRight: {type: String, attribute: 'header-right'},
            hideName: {type: Boolean, attribute: 'hide-name'},
            exhausted: {type: Boolean},
            menuOptions: {type: Array},
            _menuOpen: {type: Boolean},
            _showBig: {type: Boolean},
        };
    }
    constructor() {
        super();

        this.name = '';
        this.image = '';
        this.attached = [];
        this.size = 'm';
        this.generic = undefined;
        this.showDamage = false;
        this.showDamageIfHas = false;
        this.showThreat = false;
        this.showGeneric = false;
        this.horizontal = false;
        this.hideName = false;
        this.exhausted = false;
        this.menuOptions = [];
        this._menuOpen = false;
        this._showBig = false;
    }
    get _card() {
        return this.renderRoot?.querySelector('#card') ?? null;
    }
    get _menu() {
        return this.renderRoot?.querySelector('#menu') ?? null;
    }
    get _smallSize() {
        const {size} = this;

        return size === 's' ? 'xs' : 's';
    }
    firstUpdated(properties) {
        super.firstUpdated(properties);

        if (this._menu) {
            this._menu.anchorElement = this._card;
        }
    }
    getFaceDownTypes() {
        const {faceDown} = this;

        const _addType = (ret, type, card) => {
            if (!ret[type]) {
                ret[type] = [];

                ret[type].push(card);
            }
        }

        return faceDown ? faceDown.reduce((ret, card) => {
            if (card.isEncounterCard) {
                _addType(ret, CARD_TYPES.ENCOUNTER_CARD, card);
            } else if (card.isPlayerCard) {
                _addType(ret, CARD_TYPES.ENCOUNTER_PLAYER, card);
            } else if (card.isVillain) {
                _addType(ret, CARD_TYPES.ENCOUNTER_VILLAIN, card);
            }

            return ret;
        }, {}) : {};
    }
    getImageBack(type) {
        switch (type) {
            case CARD_TYPES.ENCOUNTER_CARD:
                return BACK_CARD_ENCOUNTER_FULL;
            case CARD_TYPES.ENCOUNTER_PLAYER:
                return BACK_CARD_PLAYER_FULL;
            case CARD_TYPES.ENCOUNTER_VILLAIN:
                return BACK_CARD_VILLAIN_FULL;
        }
    }
    handleAttachedCardClick(e) {
        e.stopPropagation();

        const {card, cardIndex} = e.detail;

        this.dispatchEvent(new CustomEvent('attached-card-click', {
            bubbles: true,
            composed: true,
            detail: {
                card,
                cardIndex,
                ability: 0,
            }
        }));
    }
    handleAttachedMenuClick(e) {
        e.stopPropagation();

        this.dispatchEvent(new CustomEvent('game-zone-menu-click', {
            bubbles: true,
            composed: true,
            detail: {
                ...e.detail,
            }
        }))
    }
    handleClick() {
        if (this.menuOptions.length) {
            this.dispatchEvent(new CustomEvent('change-menu', {
                bubbles: true,
                composed: true,
                detail: {
                    menuOptions: this.menuOptions,
                }
            }));
        } else {
            this.dispatchEvent(new CustomEvent('card-click', {
                bubbles: true,
                composed: true
            }));
        }
    }
    handleClickMenu(e) {
        this.dispatchEvent(new CustomEvent('card-menu-click', {
            bubbles: true,
            composed: true,
            detail: {
                option: e.target.id
            }
        }));

        this._menuOpen = false;
    }
    handleCloseBigCard() {
        this._showBig = false;
    }
    handleCloseMenu() {
        this._menuOpen = false;
    }
    hableContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();

        this._showBig = true;
    }
    handleFaceDownClick(type, cards) {
        return e => {
            e.stopPropagation();

            this.dispatchEvent(new CustomEvent('facedown-click', {
                bubbles: true,
                composed: true,
                detail: {
                    type,
                    cards,
                }
            }))
        }
    }
    renderAttached() {
        const {attached} = this;

        return attached.length ? html`
            <div class="attached" >
                <mc-card-list
                    .cards="${attached}"
                    show-damage-if-has
                    size="${this._smallSize}"
                    @card-list-select="${this.handleAttachedCardClick.bind(this)}"
                    @card-list-menu-click="${this.handleAttachedMenuClick.bind(this)}"
                ></mc-card-list>
            </div>
        ` : html``;
    }
    renderBigCard() {
        const {horizontal, image, name, _showBig} = this;

        return _showBig ? html`
            <md-dialog 
                class="dialog" 
                open
                @closed="${this.handleCloseBigCard.bind(this)}"
            >
                <div class="title" slot="headline">
                    ${name}
                </div>
                <div class="content" slot="content">
                    <mc-card-image
                        id="card"
                        src="${CARD_PATH}${image}"
                        size="xl"
                        .horizontal="${horizontal}"
                        @click="${this.handleCloseBigCard.bind(this)}"
                    ></mc-card-image>
                </div>
                <div slot="actions">
                    <md-text-button
                        @click="${this.handleCloseBigCard.bind(this)}"
                    >Ok</md-text-button>
                </div>
            </md-dialog>
        ` : html``;
    }
    renderCard() {
        const {horizontal, image, size, exhausted} = this;

        return html`
            <div class="${exhausted ? 'exhausted' : ''}" >
                ${this.renderHeader()}
                <slot name="top"></slot>
                <div class="cards-facedown">
                    <div class="card">
                        <mc-card-image
                            id="card"
                            src="${CARD_PATH}${image}"
                            size="${size}"
                            .horizontal="${horizontal}"
                            @click="${this.handleClick.bind(this)}"
                            @contextmenu="${this.hableContextMenu.bind(this)}"
                        ></mc-card-image>
                        ${this.renderCounters()}
                        ${this.renderStatusCards()}
                        ${this.renderAttached()}
                    </div>
                    ${this.renderFaceDown()}
                </div>
                <slot name="bottom"></slot>
                ${this.renderMenu()}
            </div>
        `;
    }
    renderConfused() {
        const {statusCards: {confused}} = this;

        return confused ? html`
            <div class="confused" >
                ${confused}
            </div>
        ` : html``;
    }
    renderCounters() {
        return html`
            <div class="counters" >
                ${this.renderAccelerationCounters()}
                ${this.renderThreatCounters()}
                ${this.renderDamageCounters()}
                ${this.renderGenericCounters()}
            </div>
        `;
    }
    renderDamageCounters() {
        const {damage, showDamage, showDamageIfHas} = this;

        const _render = () => {
            return html`
            <div class="damage" >
                ${damage}
            </div>
        `;
        }

        if (showDamage) {
            return _render();
        }

        if (showDamageIfHas && damage) {
            return _render();
        }

        return html``;
    }
    renderFaceDown() {
        const types = this.getFaceDownTypes();

        const htmlFaceDown = Object.keys(types).map(type => {
            return html`
            <mc-card-image
                src="${this.getImageBack(type)}"
                size="${this._smallSize}"
                @click="${this.handleFaceDownClick(type, types[type])}"
            ></mc-card-image>
            <div class="facedown-count">
                ${types[type].length}
            </div>
        `;
        });

        return Object.keys(types).length ? html`
            <div class="facedown" >
                ${htmlFaceDown}
            </div>
        ` : html``;
    }
    renderGenericCounters() {
        const {generic, showGeneric} = this;

        return showGeneric && generic ? html`
            <div class="generic" >
                ${generic}
            </div>
        ` : html``;
    }
    renderHeader() {
        const {name} = this;

        return this.hideName ? html`` : html`
            <header>
                <div class="header-left">${this.headerLeft}</div>
                <div class="name">${name}</div>
                <div class="header-right">${this.headerRight}</div>
            </header>
        `
    }
    renderMenu() {
        return /*this.menuOptions.length ? html`
            <md-menu 
                id="menu" 
                .open="${this._menuOpen}"
                @closing="${this.handleCloseMenu}"
            >
                ${this.renderMenuOptions()}
            </md-menu>
        ` : */html``;
    }
    renderMenuOption(option) {
        return html`
            <md-menu-item
                .disabled="${option.disable}"
            >
                <div 
                    id="${option.id}"
                    slot="headline"
                    @click="${this.handleClickMenu}"
                >${option.text}</div>
            </md-menu-item>
        `;
    }
    renderMenuOptions() {
        return this.menuOptions.map(this.renderMenuOption.bind(this));
    }
    renderStatusCards() {
        const {statusCards} = this;

        return statusCards ? html`
            <div class="status" >
                ${this.renderTough()}
                ${this.renderStunned()}
                ${this.renderConfused()}
            </div>
        ` : html``;
    }
    renderStunned() {
        const {statusCards: {stunned}} = this;

        return stunned ? html`
            <div class="stunned" >
                ${stunned}
            </div>
        ` : html``;
    }
    renderAccelerationCounters() {
        const {acceleration} = this;

        return acceleration ? html`
            <div class="acceleration" >
                ${acceleration}
            </div>
        ` : html``;
    }
    renderThreatCounters() {
        const {threat, showThreat} = this;

        return showThreat || threat ? html`
            <div class="threat" >
                ${threat}
            </div>
        ` : html``;
    }
    renderTough() {
        const {statusCards: {tough}} = this;

        return tough ? html`
            <div class="tough" >
                ${tough}
            </div>
        ` : html``;
    }
    render() {
        return html`
            ${this.renderCard()}
            ${this.renderBigCard()}
        `;
    }
}

window.customElements.define(CardComponent.is, CardComponent);
