import {LitElement, html} from 'lit-element';

import styles from './mc-card.css.js';
import '../mc-card-image/mc-card-image.js';
import '@material/web/menu/menu.js';
import '@material/web/menu/menu-item.js';

import {
    BACK_CARD_ENCOUNTER_FULL,
    BACK_CARD_PLAYER_FULL,
    BACK_CARD_VILLAIN_FULL, CARD_PATH
} from '../../../misc/cards.js';

const CARD_TYPES = {
    ENCOUNTER_CARD: 'ENCOUNTER_CARD',
    ENCOUNTER_PLAYER: 'ENCOUNTER_PLAYER',
    ENCOUNTER_VILLAIN: 'ENCOUNTER_VILLAIN',
};

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
            handSize: {type: Number},
            showBasicStats: {type: Boolean, attribute: 'show-basic-stats'},
            extraTraits: {type: Array},
            showAcquiredTraits: {type: Boolean, attribute: 'show-acquired-traits'},
            hitPoints: {type: Number},
            damage: {type: Number},
            showDamage: {type: Boolean, attribute: 'show-damage'},
            attack: {type: Number},
            thwart: {type: Number},
            defense: {type: Number},
            recovery: {type: Number},
            scheme: {type: Number},
            acceleration: {type: Number},
            life: {type: Number},
            generic: {type: Number},
            threat: {type: Number},
            showThreat: {type: Boolean, attribute: 'show-threat'},
            showGeneric: {type: Boolean, attribute: 'show-generic'},
            statusCards: {type: Object},
            attached: {type: Array},
            headerLeft: {type: Number, attribute: 'header-left'},
            headerRight: {type: Number, attribute: 'header-right'},
            hideName: {type: Boolean, attribute: 'hide-name'},
            nameWithStage: {type: Boolean, attribute: 'name-with-stage'},
            exhausted: {type: Boolean},
            menuOptions: {type: Array},
            _menuOpen: {type: Boolean},
            _showBig: {type: Boolean},
            stage: {type: Number},
        };
    }
    constructor() {
        super();

        this.name = '';
        this.image = '';
        this.attached = [];
        this.size = 'm';
        this.handSize = undefined;
        this.showBasicStats = false;
        this.extraTraits = [];
        this.showAcquiredTraits = false;
        this.hitPoints = undefined;
        this.damage = undefined;
        this.showDamage = false;
        this.attack = undefined;
        this.thwart = undefined;
        this.defense = undefined;
        this.recovery = undefined;
        this.scheme = undefined;
        this.generic = undefined;
        this.life = undefined;
        this.showThreat = false;
        this.showGeneric = false;
        this.horizontal = false;
        this.hideName = false;
        this.nameWithStage = false;
        this.exhausted = false;
        this.menuOptions = [];
        this._menuOpen = false;
        this._showBig = false;
        this.stage = undefined;
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
        };

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

        if (card.playable === false) {
            return;
        }

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
        }));
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
            }));
        };
    }
    renderAttached() {
        const {attached} = this;

        return attached.length ? html`
            <div class="attached" >
                <mc-card-list
                    .cards="${attached}"
                    show-life
                    show-damage
                    show-basic-stats
                    dim-unplayable
                    size="${this._smallSize}"
                    @card-list-select="${this.handleAttachedCardClick.bind(this)}"
                    @card-list-menu-click="${this.handleAttachedMenuClick.bind(this)}"
                ></mc-card-list>
            </div>
        ` : html``;
    }
    renderAcquiredTraits() {
        const traits = [...new Set(this.extraTraits)];

        return this.showAcquiredTraits && traits.length ? html`
            <div class="acquired-traits" role="group" aria-label="Rasgos adquiridos">
                ${traits.map(trait => html`
                    <span class="acquired-trait">${trait}</span>
                `)}
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
                    ${this.renderStats()}
                    <div class="card">
                        <div class="card-face">
                            ${this.renderStage()}
                            <mc-card-image
                                id="card"
                                src="${CARD_PATH}${image}"
                                size="${size}"
                                .horizontal="${horizontal}"
                                @click="${this.handleClick.bind(this)}"
                                @contextmenu="${this.hableContextMenu.bind(this)}"
                            ></mc-card-image>
                            ${this.renderCounters()}
                            ${this.renderBottomStats()}
                        </div>
                        ${this.renderAttached()}
                    </div>
                    ${this.renderFaceDown()}
                </div>
                ${this.renderAcquiredTraits()}
                <slot name="bottom"></slot>
                ${this.renderMenu()}
            </div>
        `;
    }
    renderStats() {
        if (!this.showBasicStats) {
            return html``;
        }

        const stats = [
            {label: 'INT', value: this.thwart, className: 'stat-thwart'},
            {label: 'PLA', value: this.scheme, className: 'stat-scheme'},
            {label: 'ATQ', value: this.attack, className: 'stat-attack'},
            {label: 'DEF', value: this.defense, className: 'stat-defense'},
            {label: 'REC', value: this.recovery, className: 'stat-recovery'},
        ].filter(({value}) =>
            value !== undefined && value !== null && Number.isFinite(value)
        );
        const stageAligned = this.nameWithStage && Number.isFinite(this.stage);

        return stats.length ? html`
            <div class="character-stats ${stageAligned ? 'stage-aligned' : ''}">
                ${stats.map(({label, value, className}) => html`
                    <span
                        class="character-stat ${className}"
                        aria-label="${label}: ${value}"
                    >
                        ${value}
                    </span>
                `)}
            </div>
        ` : html``;
    }
    renderStatusCard(count, initial, label, className) {
        return Number.isFinite(count) && count > 0 ? html`
            <span
                class="character-stat status-card ${className}"
                aria-label="${label}: ${count} ${count === 1 ? 'carta' : 'cartas'} de estado"
            >
                ${initial}${count > 1 ? ` x${count}` : ''}
            </span>
        ` : html``;
    }
    renderConfused() {
        const {statusCards: {confused}} = this;

        return this.renderStatusCard(confused, 'C', 'Confundido', 'confused');
    }
    renderCounters() {
        return html`
            <div class="counters" >
                ${this.renderAccelerationCounters()}
                ${this.renderThreatCounters()}
            </div>
        `;
    }
    renderBottomStats() {
        const life = Number.isFinite(this.life) ?
            Number.isFinite(this.hitPoints) ?
                `${this.life}/${this.hitPoints}` :
                this.life :
            undefined;
        const statusCards = this.statusCards || {};
        const hasStatusCards = [
            statusCards.tough,
            statusCards.stunned,
            statusCards.confused,
        ].some(count => Number.isFinite(count) && count > 0);
        const stats = [
            {label: 'VIDA', value: life, className: 'stat-life'},
            ...(this.showDamage && Number.isFinite(this.damage) && this.damage > 0 ? [{
                label: 'DAÑO',
                value: this.damage,
                className: 'stat-damage',
            }] : []),
            ...(this.showGeneric && this.generic ? [{
                label: 'CONTADORES',
                value: this.generic,
                className: 'stat-counters',
            }] : []),
            {label: 'MANO', value: this.handSize, className: 'stat-hand-size'},
        ].filter(({value}) =>
            Number.isFinite(value) || typeof value === 'string'
        );

        return stats.length || hasStatusCards ? html`
            <div class="character-bottom-stats">
                ${hasStatusCards ? this.renderStatusCards() : ''}
                ${stats.length ? html`
                    <div class="character-bottom-values">
                        ${stats.map(({label, value, className}) => html`
                            <span
                                class="character-stat ${className}"
                                aria-label="${label}: ${value}"
                            >
                                ${value}
                            </span>
                        `)}
                    </div>
                ` : ''}
            </div>
        ` : html``;
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
    renderHeader() {
        const {name, headerLeft, headerRight, hideName, nameWithStage, stage} = this;

        return hideName || (nameWithStage && Number.isFinite(stage)) ? html`` : html`
            <header>
                <div class="header-left">
                    ${Number.isFinite(headerLeft) ? html`
                        <span class="character-stat stat-stage header-stat" aria-label="Umbral: ${headerLeft}">
                            ${headerLeft}
                        </span>
                    ` : ''}
                </div>
                <div class="name">${name}</div>
                <div class="header-right">
                    ${Number.isFinite(headerRight) ? html`
                        <span class="character-stat stat-stage header-stat" aria-label="Etapa: ${headerRight}">
                            ${headerRight}
                        </span>
                    ` : ''}
                </div>
            </header>
        `;
    }
    renderStage() {
        const {name, hideName, nameWithStage, stage} = this;

        return Number.isFinite(stage) ? html`
            <div class="stage-label">
                ${nameWithStage && !hideName ? html`
                    <span class="name stage-name">${name}</span>
                ` : ''}
                <span class="character-stat stat-stage header-stat" aria-label="Etapa: ${stage}">
                    ${stage}
                </span>
            </div>
        ` : html``;
    }
    renderMenu() {
        return; /*this.menuOptions.length ? html`
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

        return this.renderStatusCard(stunned, 'A', 'Aturdido', 'stunned');
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
            <div class="character-stat stat-threat threat" aria-label="Amenaza: ${threat}">
                ${threat}
            </div>
        ` : html``;
    }
    renderTough() {
        const {statusCards: {tough}} = this;

        return this.renderStatusCard(tough, 'D', 'Duro', 'tough');
    }
    render() {
        return html`
            ${this.renderCard()}
            ${this.renderBigCard()}
        `;
    }
}

window.customElements.define(CardComponent.is, CardComponent);
