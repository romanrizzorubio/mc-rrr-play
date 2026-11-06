import {html} from 'lit-element';

import styles from './mc-boost-dealt-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {BACK_CARD_ENCOUNTER} from '../../../misc/cards.js';
import {
    renderAmplificationIcons,
    renderBoostIcons,
} from '../../../utils/boost-icons.js';

export class McBoostDealtDialog extends McDialog {
    static get is() {
        return 'mc-boost-dealt-dialog';
    }
    static get properties() {
        return {
            ...super.properties,
            _skipBoostDealtNotification: {type: Boolean},
        };
    }
    static get styles() {
        return [stylesDialog, styles];
    }
    constructor() {
        super(arguments[0]);

        this._skipBoostDealtNotification = false;
    }
    get defaultProperties() {
        return {
            ...super.defaultProperties,
            data: {
                ...super.defaultProperties.data,
                allowHideFuture: false,
                cardCount: 1,
                cards: [],
            },
        };
    }
    getSubtitle() {
        const playerText = this.targetPlayerName ?
            `Aumento mostrado por ${this.targetPlayerName}.` : '';
        return [super.getSubtitle(), playerText].filter(Boolean).join(' ');
    }
    renderResponsiblePlayer() {
        return html``;
    }
    renderContent() {
        const {data: {allowHideFuture, cardCount, cards, cumulativeBoost}} = this;
        const displayedCards = cards.length ?
            cards :
            Array.from({length: cardCount}, () => null);
        const size = displayedCards.length <= 2 ? 'l' : 'm';
        const cumulativeBoostIcons = renderBoostIcons(cumulativeBoost);

        return html`
            <div class="boost-cards">
                ${displayedCards.map(boostCard => {
                    if (!boostCard) {
                        return html`
                            <div class="boost-card">
                                <mc-card
                                    name="Carta de aumento"
                                    image="${BACK_CARD_ENCOUNTER}"
                                    size="${size}"
                                ></mc-card>
                            </div>
                        `;
                    }

                    const boostIcons = renderBoostIcons(boostCard.card.boost);
                    const amplificationIcons = renderAmplificationIcons(
                        boostCard.appliedAmplificationIcons
                    );
                    const isFacedown = Boolean(boostCard.card.isFacedownCard);

                    return html`
                        <div class="boost-card">
                            ${!isFacedown &&
                                (boostIcons.length || amplificationIcons.length) ?
                                html`
                                <div class="boost-icons">
                                    ${boostIcons.length ? html`
                                        <div class="boost-icon-row">
                                            <strong>Iconos de aumento</strong>
                                            <span class="boost-icon-list">${boostIcons}</span>
                                        </div>
                                    ` : ''}
                                    ${amplificationIcons.length ? html`
                                        <div class="boost-amplification-row">
                                            <strong>
                                                Bonificador de amplificación
                                                (+${boostCard.appliedAmplificationIcons})
                                            </strong>
                                            <span class="boost-icon-list">
                                                ${amplificationIcons}
                                            </span>
                                        </div>
                                    ` : ''}
                                </div>
                            ` : ''}
                            <mc-card
                                name="${boostCard.card.name}"
                                image="${boostCard.card.image}"
                                .isFacedownCard="${boostCard.card.isFacedownCard}"
                                .canPeekFacedown="${Boolean(!this.readOnly && boostCard.card.canPeekFacedown)}"
                                .facedownImage="${BACK_CARD_ENCOUNTER}"
                                size="${size}"
                                ?horizontal="${boostCard.horizontal}"
                                .generic="${boostCard.card.counters}"
                                .showGeneric="${Boolean(boostCard.card.counters)}"
                            ></mc-card>
                            ${!isFacedown && boostCard.hasBoostAbility ? html`
                                <div class="boost-ability">
                                    <strong>Capacidad de aumento</strong> Sí
                                </div>
                            ` : ''}
                        </div>
                    `;
                })}
            </div>
            ${cumulativeBoostIcons.length ? html`
                <div class="boost-total">
                    <strong>Iconos de aumento acumulados</strong>
                    <span class="boost-icon-list">${cumulativeBoostIcons}</span>
                </div>
            ` : ''}
            ${allowHideFuture && !this.readOnly ? html`
                <label class="remember-choice">
                    <input
                        type="checkbox"
                        .checked="${this._skipBoostDealtNotification}"
                        @change="${this.handleSkipBoostDealtNotificationChange.bind(this)}"
                    >
                    <span>No volver a mostrar este aviso durante esta partida</span>
                </label>
            ` : ''}
        `;
    }
    handleSkipBoostDealtNotificationChange(e) {
        this._skipBoostDealtNotification = e.target.checked;
    }
    sendResponse() {
        if (this.data.allowHideFuture && this._skipBoostDealtNotification) {
            this._response = {
                ...this._response,
                skipBoostDealtNotification: true,
            };
        }

        super.sendResponse();
    }
}

window.customElements.define(McBoostDealtDialog.is, McBoostDealtDialog);
