import {LitElement, html} from 'lit-element';
import 'mc-components';

import styles from './mc-card.css.js';
import '../mc-card-image/mc-card-image.js';
import {
    ICON_EYE,
    ICON_EYE_SLASH,
    ICON_STAR,
} from '../../common/mc-icon/mc-icon.js';
import {MENU_OPTION_VIEW_TUCKED_CARDS} from '../../../misc/card-menu.js';

import {
    BACK_CARD_ENCOUNTER,
    BACK_CARD_PLAYER,
    BACK_CARD_VILLAIN,
    getCardAssetUrl,
} from '../../../misc/cards.js';
import {translateTrait} from '../../../utils/traits.js';
import {
    getActivationOptionForActor,
    getActivationOptionsForActor,
    getBasicActivationOptionForActor,
    getBasicActivationOptionsForActor,
} from '../../../utils/basic-activation.js';
import {isPlayCardDropTarget} from '../../../utils/play-card-drag.js';
import {
    getResourcePaymentOption,
    getResourcePaymentSource,
} from '../../../utils/resource-payment-drag.js';

const DOUBLE_CLICK_DELAY_MS = 500;

const CARD_TYPES = {
    ENCOUNTER_CARD: 'ENCOUNTER_CARD',
    ENCOUNTER_PLAYER: 'ENCOUNTER_PLAYER',
    ENCOUNTER_VILLAIN: 'ENCOUNTER_VILLAIN',
};

const KEYWORD_LABELS = {
    guard: 'Guardia',
    permanent: 'Permanente',
    toughness: 'Dureza',
    quickStrike: 'Ataque veloz',
    surge: 'Oleada',
    villainous: 'Infame',
    overkill: 'Brutalidad',
    piercing: 'Penetrante',
    ranged: 'A distancia',
    restricted: 'Restringida',
    retaliate: 'Represalia',
};

export class CardComponent extends LitElement {
    static get is() {
        return 'mc-card';
    }
    getFaceDownType(card) {
        if (card.isEncounterCard) {
            return CARD_TYPES.ENCOUNTER_CARD;
        }
        if (card.isPlayerCard) {
            return CARD_TYPES.ENCOUNTER_PLAYER;
        }
        if (card.isVillain) {
            return CARD_TYPES.ENCOUNTER_VILLAIN;
        }
    }
    getFaceDownPeekCards() {
        return this.card?.isSideScheme ?
            (this.faceDown || []).filter(card => this.getFaceDownType(card)) :
            [];
    }
    renderTucked() {
        const tuckedCards = this.tuckedCards || [];
        const faceDownCards = this.getFaceDownPeekCards();
        const previews = [
            ...tuckedCards.map(card => ({
                image: getCardAssetUrl(card.image),
            })),
            ...faceDownCards.map(card => ({
                image: this.getImageBack(this.getFaceDownType(card)),
            })),
        ].slice(0, 2);

        return previews.length ? html`
            <div class="tucked ${
                faceDownCards.length ? 'side-scheme-facedown' : ''
            }" aria-hidden="true">
                ${previews.map(({image}) => html`
                    <div class="tucked-card-peek">
                        <mc-card-image
                            src="${image}"
                            size="${this._smallSize}"
                            .activationBlocked="${Boolean(
                                this.dragActivation ||
                                this.dragPlayCard ||
                                this.dragResourcePayment
                            )}"
                        ></mc-card-image>
                    </div>
                `)}
            </div>
        ` : html``;
    }
    static get styles() {
        return styles;
    }
    static get properties() {
        return {
            name: {type: String},
            wrapName: {type: Boolean, attribute: 'wrap-name', reflect: true},
            card: {type: Object},
            basicActivation: {type: Object},
            activationActor: {type: Object},
            dragActivation: {type: Object},
            dragPlayCard: {type: Object},
            dragResourcePayment: {type: Object},
            allowPlayCardDrag: {type: Boolean},
            clickDisabled: {type: Boolean},
            image: {type: String},
            isFacedownCard: {type: Boolean},
            canPeekFacedown: {type: Boolean},
            facedownImage: {type: String},
            size: {type: String},
            horizontal: {type: Boolean},
            rotated: {type: Boolean, reflect: true},
            handSize: {type: Number},
            showBasicStats: {type: Boolean, attribute: 'show-basic-stats'},
            extraTraits: {type: Array},
            extraKeywords: {type: Array},
            showAcquiredTraits: {type: Boolean, attribute: 'show-acquired-traits'},
            hitPoints: {type: Number},
            damage: {type: Number},
            showDamage: {type: Boolean, attribute: 'show-damage'},
            attack: {type: Number},
            thwart: {type: Number},
            defense: {type: Number},
            recovery: {type: Number},
            scheme: {type: Number},
            unprintedStats: {type: Array},
            emphasizedStats: {type: Array},
            acceleration: {type: Number},
            life: {type: Number},
            generic: {type: Number},
            threat: {type: Number},
            showThreat: {type: Boolean, attribute: 'show-threat'},
            showGeneric: {type: Boolean, attribute: 'show-generic'},
            statusCards: {type: Object},
            attached: {type: Array},
            faceDown: {type: Array},
            tuckedCards: {type: Array},
            headerLeft: {type: Number, attribute: 'header-left'},
            headerRight: {type: Number, attribute: 'header-right'},
            hideName: {type: Boolean, attribute: 'hide-name'},
            nameWithStage: {type: Boolean, attribute: 'name-with-stage'},
            exhausted: {type: Boolean},
            menuOptions: {type: Array},
            doubleClickOption: {type: String},
            _menuOpen: {type: Boolean},
            _showBig: {type: Boolean},
            _showFacedownPreview: {type: Boolean},
            stage: {type: Number},
        };
    }
    constructor() {
        super();

        this.name = '';
        this.wrapName = false;
        this.card = null;
        this.basicActivation = null;
        this.activationActor = null;
        this.dragActivation = null;
        this.dragPlayCard = null;
        this.dragResourcePayment = null;
        this.allowPlayCardDrag = false;
        this.clickDisabled = false;
        this.image = '';
        this.isFacedownCard = false;
        this.canPeekFacedown = false;
        this.facedownImage = '';
        this.attached = [];
        this.faceDown = [];
        this.tuckedCards = [];
        this.size = 'm';
        this.handSize = undefined;
        this.showBasicStats = false;
        this.extraTraits = [];
        this.extraKeywords = [];
        this.showAcquiredTraits = false;
        this.hitPoints = undefined;
        this.damage = undefined;
        this.showDamage = false;
        this.attack = undefined;
        this.thwart = undefined;
        this.defense = undefined;
        this.recovery = undefined;
        this.scheme = undefined;
        this.unprintedStats = [];
        this.emphasizedStats = [];
        this.generic = undefined;
        this.life = undefined;
        this.showThreat = false;
        this.showGeneric = false;
        this.horizontal = false;
        this.rotated = false;
        this.hideName = false;
        this.nameWithStage = false;
        this.exhausted = false;
        this.menuOptions = [];
        this.doubleClickOption = '';
        this._pendingSingleClickTimeout = undefined;
        this._menuOpen = false;
        this._showBig = false;
        this._showFacedownPreview = false;
        this._draggingPlayCard = false;
        this._draggingResourcePayment = false;
        this.stage = undefined;
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.clearPendingSingleClick();
    }
    willUpdate(changedProperties) {
        if (
            changedProperties.has('card') ||
            changedProperties.has('name') ||
            changedProperties.has('image') ||
            changedProperties.has('isFacedownCard')
        ) {
            this._showFacedownPreview = false;
        }
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
    get activationDropOption() {
        const actor = this.dragActivation?.actor;
        const getOption = actor?.isUpgrade || actor?.isSupport ?
            getActivationOptionForActor :
            getBasicActivationOptionForActor;

        return this.card && actor ?
            getOption(actor, this.card) :
            undefined;
    }
    get activationSourceOptions() {
        return this.activationActor?.isUpgrade ||
            this.activationActor?.isSupport ?
            getActivationOptionsForActor(this.activationActor) :
            getBasicActivationOptionsForActor(this.activationActor);
    }
    get resourcePaymentDropOption() {
        return getResourcePaymentOption(
            this.card,
            this.dragResourcePayment
        );
    }
    get isResourcePaymentDragSource() {
        return Boolean(
            this.card?.id &&
            this.card.id === this.dragResourcePayment?.card?.id
        );
    }
    get isResourcePaymentDropTarget() {
        return Boolean(this.resourcePaymentDropOption);
    }
    get isResourcePaymentVeiled() {
        return Boolean(
            this.dragResourcePayment &&
            !this.isResourcePaymentDragSource &&
            !this.isResourcePaymentDropTarget
        );
    }
    get isActivationDragSource() {
        return Boolean(
            this.activationActor?.id &&
            this.activationActor.id === this.dragActivation?.actor?.id
        );
    }
    get isActivationDropTarget() {
        return Boolean(this.activationDropOption);
    }
    get isActivationVeiled() {
        return Boolean(
            this.dragActivation &&
            !this.isActivationDragSource &&
            !this.isActivationDropTarget
        );
    }
    get canDragPlayCard() {
        return Boolean(
            this.allowPlayCardDrag &&
            this.card?.id &&
            this.card.playable === true &&
            !this.dragActivation &&
            !this.dragPlayCard &&
            !this.dragResourcePayment
        );
    }
    get canDragResourcePayment() {
        return Boolean(
            this.card?.id &&
            getResourcePaymentSource(this.card) &&
            !this.dragActivation &&
            !this.dragPlayCard &&
            !this.dragResourcePayment
        );
    }
    get isPlayCardDragSource() {
        return Boolean(
            this.card?.id &&
            this.card.id === this.dragPlayCard?.cardId
        );
    }
    get isPlayCardDropTarget() {
        return isPlayCardDropTarget(this.card, this.dragPlayCard);
    }
    get isPlayCardBlocked() {
        return Boolean(
            this.dragPlayCard &&
            !this.isPlayCardDragSource &&
            !this.isPlayCardDropTarget
        );
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
            }
            ret[type].push(card);
        };

        return faceDown ? faceDown.reduce((ret, card) => {
            const type = this.getFaceDownType(card);
            if (type) {
                _addType(ret, type, card);
            }

            return ret;
        }, {}) : {};
    }
    getImageBack(type) {
        switch (type) {
            case CARD_TYPES.ENCOUNTER_CARD:
                return getCardAssetUrl(BACK_CARD_ENCOUNTER);
            case CARD_TYPES.ENCOUNTER_PLAYER:
                return getCardAssetUrl(BACK_CARD_PLAYER);
            case CARD_TYPES.ENCOUNTER_VILLAIN:
                return getCardAssetUrl(BACK_CARD_VILLAIN);
        }
    }
    handleAttachedCardClick(e) {
        e.stopPropagation();

        const {card, cardIndex} = e.detail;

        if (card.playable === false) {
            return;
        }

        const ability = card.abilities.findIndex(_ability =>
            _ability.isAction || _ability.isBasic);
        if (ability < 0) {
            return;
        }

        this.dispatchEvent(new CustomEvent('attached-card-click', {
            bubbles: true,
            composed: true,
            detail: {
                card,
                cardIndex,
                ability,
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
    handleViewTuckedCards() {
        this.dispatchEvent(new CustomEvent('view-tucked-cards', {
            bubbles: true,
            composed: true,
            detail: {
                card: {
                    name: this.name,
                    image: this.image,
                },
                cards: this.tuckedCards,
            },
        }));
    }
    dispatchMenuOption(option) {
        if (option.id === MENU_OPTION_VIEW_TUCKED_CARDS) {
            this.handleViewTuckedCards();
        } else if (option.basicActivation) {
            this.dispatchEvent(new CustomEvent('basic-activation', {
                bubbles: true,
                composed: true,
                detail: {
                    card: this.card,
                    option,
                },
            }));
        } else {
            this.dispatchEvent(new CustomEvent('card-menu-click', {
                bubbles: true,
                composed: true,
                detail: {
                    option: option.id,
                },
            }));
        }
    }
    clearPendingSingleClick() {
        if (this._pendingSingleClickTimeout !== undefined) {
            clearTimeout(this._pendingSingleClickTimeout);
            this._pendingSingleClickTimeout = undefined;
        }
    }
    handleClick(event) {
        if (this.clickDisabled) {
            return;
        }

        const doubleClickOption = this.menuOptions.find(option =>
            option.id === this.doubleClickOption && !option.disable
        );

        if (doubleClickOption && event?.detail > 0) {
            event.stopPropagation();

            if (event.detail === 1) {
                this.clearPendingSingleClick();
                this._pendingSingleClickTimeout = setTimeout(() => {
                    this._pendingSingleClickTimeout = undefined;
                    this.handleSingleClick();
                }, DOUBLE_CLICK_DELAY_MS);
                return;
            }

            this.clearPendingSingleClick();
            if (event.detail === 2) {
                this.dispatchMenuOption(doubleClickOption);
            }
            return;
        }

        this.handleSingleClick();
    }
    handleSingleClick() {
        if (this.clickDisabled) {
            return;
        }

        const hasOtherAction = this.menuOptions.some(option =>
            option.id !== MENU_OPTION_VIEW_TUCKED_CARDS && !option.disable
        );

        if (this.menuOptions.length && hasOtherAction) {
            const availableOptions = this.menuOptions.filter(option =>
                !option.disable
            );

            if (availableOptions.length === 1) {
                this.dispatchMenuOption(availableOptions[0]);
            } else {
                this.dispatchEvent(new CustomEvent('change-menu', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        card: this.card,
                        menuOptions: this.menuOptions,
                    }
                }));
            }
        } else if (this.basicActivation) {
            this.dispatchEvent(new CustomEvent('basic-activation', {
                bubbles: true,
                composed: true,
                detail: {
                    card: this.card,
                    option: this.basicActivation,
                },
            }));
        } else if (this.tuckedCards?.length && !hasOtherAction) {
            this.handleViewTuckedCards();
        } else if (this.menuOptions.length) {
            this.dispatchEvent(new CustomEvent('change-menu', {
                bubbles: true,
                composed: true,
                detail: {
                    card: this.card,
                    menuOptions: this.menuOptions,
                }
            }));
        } else {
            this.dispatchEvent(new CustomEvent('card-click', {
                bubbles: true,
                composed: true,
                detail: {
                    card: this.card,
                },
            }));
        }
    }
    handleActivationDragStart(event) {
        const options = this.activationSourceOptions;

        if (!options.length) {
            if (this.activationActor?.id) {
                event.preventDefault();
            }
            return;
        }

        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', this.activationActor.id);
        }

        this.dispatchEvent(new CustomEvent('activation-drag-start', {
            bubbles: true,
            composed: true,
            detail: {
                actor: this.activationActor,
                options,
            },
        }));
    }
    handleDragStart(event) {
        if (this.canDragPlayCard) {
            this._draggingPlayCard = true;
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', this.card.id);
            }

            this.dispatchEvent(new CustomEvent('play-card-drag-start', {
                bubbles: true,
                composed: true,
                detail: {
                    card: this.card,
                },
            }));
            return;
        }

        if (this.canDragResourcePayment) {
            this._draggingResourcePayment = true;
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', this.card.id);
            }

            this.dispatchEvent(new CustomEvent('resource-payment-drag-start', {
                bubbles: true,
                composed: true,
                detail: {
                    card: this.card,
                    source: getResourcePaymentSource(this.card),
                },
            }));
            return;
        }

        this.handleActivationDragStart(event);
    }
    handleDragEnd() {
        if (this._draggingPlayCard) {
            this._draggingPlayCard = false;
            this.dispatchEvent(new CustomEvent('play-card-drag-end', {
                bubbles: true,
                composed: true,
            }));
            return;
        }

        if (this._draggingResourcePayment) {
            this._draggingResourcePayment = false;
            this.dispatchEvent(new CustomEvent('resource-payment-drag-end', {
                bubbles: true,
                composed: true,
            }));
            return;
        }

        this.handleActivationDragEnd();
    }
    handlePlayCardDragOver(event) {
        if (!this.isPlayCardDropTarget) {
            return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }
    handleDragOver(event) {
        this.handlePlayCardDragOver(event);
        this.handleResourcePaymentDragOver(event);
        this.handleActivationDragOver(event);
    }
    handlePlayCardDrop(event) {
        if (!this.isPlayCardDropTarget) {
            return false;
        }

        event.preventDefault();
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('play-card-drop', {
            bubbles: true,
            composed: true,
            detail: {
                card: this.dragPlayCard.card,
                targetCard: this.card,
            },
        }));
        return true;
    }
    handleResourcePaymentDragOver(event) {
        if (!this.isResourcePaymentDropTarget) {
            return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }
    handleResourcePaymentDrop(event) {
        const option = this.resourcePaymentDropOption;

        if (!option) {
            return false;
        }

        event.preventDefault();
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('resource-payment-drop', {
            bubbles: true,
            composed: true,
            detail: {
                card: this.dragResourcePayment.card,
                targetCard: this.card,
                option,
            },
        }));
        return true;
    }
    handleDrop(event) {
        if (!this.handlePlayCardDrop(event)) {
            if (!this.handleResourcePaymentDrop(event)) {
                this.handleActivationDrop(event);
            }
        }
    }
    handleActivationDragEnd() {
        this.dispatchEvent(new CustomEvent('activation-drag-end', {
            bubbles: true,
            composed: true,
        }));
    }
    handleActivationDragOver(event) {
        if (!this.isActivationDropTarget) {
            return;
        }

        event.preventDefault();
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }
    handleActivationDrop(event) {
        const option = this.activationDropOption;

        if (!option) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        this.dispatchEvent(new CustomEvent('basic-activation', {
            bubbles: true,
            composed: true,
            detail: {
                actor: this.dragActivation.actor,
                card: this.card,
                option,
            },
        }));
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
                    .dragActivation="${this.dragActivation}"
                    .dragPlayCard="${this.dragPlayCard}"
                    .dragResourcePayment="${this.dragResourcePayment}"
                    show-life
                    show-damage
                    show-generic
                    show-basic-stats
                    show-menu-abilities
                    highlight-playable
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
                    <span class="acquired-trait">${translateTrait(trait)}</span>
                `)}
            </div>
        ` : html``;
    }
    renderAcquiredKeywords() {
        return this.extraKeywords.length ? html`
            <div class="acquired-keywords" role="group" aria-label="Palabras clave adquiridas">
                ${this.extraKeywords.map(({name, value}) => {
                    const label = KEYWORD_LABELS[name] || name;
                    const text = typeof value === 'number' ?
                        `${label} ${value}` :
                        label;

                    return html`
                        <span class="acquired-keyword">${text}</span>
                    `;
                })}
            </div>
        ` : html``;
    }
    renderBigCard() {
        const {
            horizontal,
            image,
            name,
            rotated,
            _showBig,
        } = this;
        const hiddenFacedown = this.isFacedownHidden();
        const imageSrc = hiddenFacedown ?
            getCardAssetUrl(this.facedownImage || BACK_CARD_PLAYER) :
            getCardAssetUrl(image);

        return _showBig ? html`
            <mc-card-image-dialog
                .open="${_showBig}"
                .title="${hiddenFacedown ? 'Carta boca abajo' : name}"
                .large="${true}"
                close-label="Ok"
                @close-card-image-dialog="${this.handleCloseBigCard.bind(this)}"
            >
                <mc-card-image
                    slot="image"
                    id="card"
                    src="${imageSrc}"
                    size="xl"
                    .horizontal="${horizontal}"
                    .rotated="${rotated}"
                    @click="${this.handleCloseBigCard.bind(this)}"
                ></mc-card-image>
            </mc-card-image-dialog>
        ` : html``;
    }
    renderCard() {
        const {
            horizontal,
            image,
            size,
            exhausted,
            rotated,
        } = this;
        const hiddenFacedown = this.isFacedownHidden();
        const sideSchemeFaceDown = this.getFaceDownPeekCards().length > 0;
        const imageSrc = hiddenFacedown ?
            getCardAssetUrl(this.facedownImage || BACK_CARD_PLAYER) :
            getCardAssetUrl(image);
        const cardFrontClasses = [
            'card-front',
            ...(this.isActivationDragSource ? ['activation-drag-source'] : []),
            ...(this.isActivationDropTarget ? ['activation-drop-target'] : []),
            ...(this.isPlayCardDragSource ? ['play-card-drag-source'] : []),
            ...(this.isPlayCardDropTarget ? ['play-card-drop-target'] : []),
            ...(this.isPlayCardBlocked ? ['play-card-blocked'] : []),
            ...(this.isResourcePaymentDragSource ? [
                'resource-payment-drag-source'
            ] : []),
            ...(this.isResourcePaymentDropTarget ? [
                'resource-payment-drop-target'
            ] : []),
            ...(this.isResourcePaymentVeiled ? [
                'resource-payment-blocked'
            ] : []),
        ].join(' ');
        const activationSourceOptions =
            this.activationSourceOptions;
        const isDraggable = this.canDragPlayCard ||
            this.canDragResourcePayment ||
            (!this.dragActivation &&
                !this.dragPlayCard &&
                !this.dragResourcePayment &&
                activationSourceOptions.length > 0);

        return html`
            <div class="${exhausted ? 'exhausted' : ''}">
                ${this.renderHeader()}
                <slot name="top"></slot>
                <div class="cards-facedown">
                    ${hiddenFacedown ? '' : this.renderStats()}
                    <div class="card ${
                        this.tuckedCards?.length && !sideSchemeFaceDown ?
                            'has-tucked-cards' :
                            ''
                    }">
                        <div class="card-face">
                            ${hiddenFacedown || sideSchemeFaceDown ?
                                '' :
                                this.renderTucked()}
                            <div class="${cardFrontClasses}">
                                ${hiddenFacedown ? '' : this.renderStage()}
                                <mc-card-image
                                    id="card"
                                    src="${imageSrc}"
                                    size="${size}"
                                    .horizontal="${horizontal}"
                                    .rotated="${rotated}"
                                    .activationBlocked="${this.isActivationVeiled ||
                                        this.isResourcePaymentVeiled}"
                                    ?draggable="${isDraggable}"
                                    @click="${this.handleClick.bind(this)}"
                                    @contextmenu="${this.hableContextMenu.bind(this)}"
                                    @dragstart="${this.handleDragStart.bind(this)}"
                                    @dragend="${this.handleDragEnd.bind(this)}"
                                    @dragover="${this.handleDragOver.bind(this)}"
                                    @drop="${this.handleDrop.bind(this)}"
                                ></mc-card-image>
                                ${this.renderFacedownPeekButton()}
                                ${hiddenFacedown || sideSchemeFaceDown ?
                                    '' :
                                    this.renderCounters()}
                                ${hiddenFacedown ? '' : this.renderBottomStats()}
                            </div>
                            ${sideSchemeFaceDown ? this.renderTucked() : ''}
                            ${sideSchemeFaceDown ?
                                this.renderCounters() :
                                ''}
                            ${hiddenFacedown ? '' : this.renderAcquiredTraits()}
                            ${hiddenFacedown ? '' : this.renderAcquiredKeywords()}
                        </div>
                        ${hiddenFacedown ? '' : this.renderAttached()}
                    </div>
                    ${hiddenFacedown ? '' : this.renderFaceDown()}
                </div>
                <slot name="bottom"></slot>
                ${this.renderMenu()}
            </div>
        `;
    }
    getDisplayName() {
        return this.isFacedownHidden() ? 'Carta boca abajo' : this.name;
    }
    isFacedownHidden() {
        return this.isFacedownCard && !this._showFacedownPreview;
    }
    handleFacedownPreviewClick(e) {
        e.stopPropagation();
        this._showFacedownPreview = !this._showFacedownPreview;
    }
    renderFacedownPeekButton() {
        if (!this.isFacedownCard || !this.canPeekFacedown) {
            return '';
        }

        const showingFace = this._showFacedownPreview;
        const label = showingFace ? 'Ocultar carta' : 'Ver carta';
        const icon = showingFace ? ICON_EYE_SLASH : ICON_EYE;

        return html`
            <button
                class="facedown-peek-button"
                type="button"
                aria-label="${label}"
                title="${label}"
                @click="${this.handleFacedownPreviewClick.bind(this)}"
            >
                <mc-icon icon="${icon}" aria-hidden="true"></mc-icon>
            </button>
        `;
    }
    renderStatValue(stat, value) {
        return this.unprintedStats.includes(stat) && value === 0 ?
            html`
                <span class="stat-star">
                    <mc-icon icon="${ICON_STAR}"></mc-icon>
                </span>
            ` :
            html`<span class="numeric-value">${value}</span>`;
    }
    renderStats() {
        if (!this.showBasicStats) {
            return html``;
        }

        const stats = [
            {stat: 'thwart', label: 'INT', value: this.thwart, className: 'stat-thwart'},
            {stat: 'scheme', label: 'PLA', value: this.scheme, className: 'stat-scheme'},
            {stat: 'attack', label: 'ATQ', value: this.attack, className: 'stat-attack'},
            {stat: 'defense', label: 'DEF', value: this.defense, className: 'stat-defense'},
            {stat: 'recovery', label: 'REC', value: this.recovery, className: 'stat-recovery'},
        ].filter(({value}) =>
            value !== undefined && value !== null && Number.isFinite(value)
        );
        const emphasizedStats = this.emphasizedStats ?? [];
        const hasEmphasizedStat = stats.some(({stat}) =>
            emphasizedStats.includes(stat)
        );
        const stageAligned = this.nameWithStage && Number.isFinite(this.stage);
        const statsClass = [
            stageAligned ? 'stage-aligned' : '',
            hasEmphasizedStat ? 'has-emphasized' : '',
        ].filter(Boolean).join(' ');

        return stats.length ? html`
            <div class="character-stats ${statsClass}">
                ${stats.map(({stat, label, value, className}) => html`
                    <span
                        class="character-stat ${[
                            className,
                            emphasizedStats.includes(stat) ? 'emphasized' : '',
                        ].filter(Boolean).join(' ')}"
                        aria-label="${label}: ${value}"
                    >
                        ${this.renderStatValue(stat, value)}
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
                <span class="numeric-value">${initial}</span>${count > 1 ? html`
                    <span class="numeric-value">x${count}</span>
                ` : ''}
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
                ${this.renderGenericCounter()}
            </div>
        `;
    }
    renderGenericCounter() {
        const {generic, horizontal, showGeneric, showThreat, threat} = this;
        const showAlongsideThreat = (horizontal && showThreat) || threat > 0;

        return showGeneric && showAlongsideThreat && generic ? html`
            <div
                class="character-stat stat-counters"
                aria-label="CONTADORES: ${generic}"
            >
                <span class="numeric-value">${generic}</span>
            </div>
        ` : html``;
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
            ...(this.showGeneric &&
                !(this.horizontal && this.showThreat) &&
                !(this.threat && this.generic) &&
                this.generic ? [{
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
                                <span class="numeric-value">${value}</span>
                            </span>
                        `)}
                    </div>
                ` : ''}
            </div>
        ` : html``;
    }
    renderFaceDown() {
        if (this.getFaceDownPeekCards().length) {
            return html``;
        }

        const types = this.getFaceDownTypes();

        const htmlFaceDown = Object.keys(types).map(type => {
            return html`
            <mc-card-image
                src="${this.getImageBack(type)}"
                size="${this._smallSize}"
                .activationBlocked="${Boolean(
                    this.dragActivation ||
                    this.dragPlayCard ||
                    this.dragResourcePayment
                )}"
                @click="${this.handleFaceDownClick(type, types[type])}"
            ></mc-card-image>
            ${types[type].length > 1 ? html`
                <div class="facedown-count">${types[type].length}</div>
            ` : ''}
        `;
        });

        return Object.keys(types).length ? html`
            <div class="facedown" >
                ${htmlFaceDown}
            </div>
        ` : html``;
    }
    renderHeader() {
        const {
            horizontal,
            headerLeft,
            headerRight,
            hideName,
            nameWithStage,
            stage,
        } = this;
        const name = this.getDisplayName();

        if (hideName || (nameWithStage && Number.isFinite(stage))) {
            return html``;
        }

        if (horizontal && (Number.isFinite(headerLeft) || Number.isFinite(headerRight))) {
            return html`
                <header class="scheme-title-header">
                    <div class="header-left">${this.renderHeaderStat(headerLeft, 'Umbral')}</div>
                    <div class="name">${name}</div>
                    <div class="header-right">${this.renderHeaderStat(headerRight, 'Etapa')}</div>
                </header>
            `;
        }

        return html`
            <header>
                <div class="header-left">
                    ${this.renderHeaderStat(headerLeft, 'Umbral')}
                </div>
                <div class="name">${name}</div>
                <div class="header-right">
                    ${this.renderHeaderStat(headerRight, 'Etapa')}
                </div>
            </header>
        `;
    }
    renderHeaderStat(value, label) {
        return Number.isFinite(value) ? html`
            <span class="character-stat stat-stage header-stat" aria-label="${label}: ${value}">
                <span class="numeric-value">${value}</span>
            </span>
        ` : '';
    }
    renderStage() {
        const {hideName, nameWithStage, stage} = this;
        const name = this.getDisplayName();

        return Number.isFinite(stage) ? html`
            <div class="stage-label">
                ${nameWithStage && !hideName ? html`
                    <span class="name stage-name">${name}</span>
                ` : ''}
                <span class="character-stat stat-stage header-stat" aria-label="Etapa: ${stage}">
                    <span class="numeric-value">${stage}</span>
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
            <div
                class="character-stat stat-acceleration acceleration"
                aria-label="Fichas de aceleración: ${acceleration}"
            >
                <span class="numeric-value">+${acceleration}</span>
            </div>
        ` : html``;
    }
    renderThreatCounters() {
        const {threat, showThreat} = this;

        return showThreat || threat ? html`
            <div class="character-stat stat-threat threat" aria-label="Amenaza: ${threat}">
                <span class="numeric-value">${threat}</span>
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
