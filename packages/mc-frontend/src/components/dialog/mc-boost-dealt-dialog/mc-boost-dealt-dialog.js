import {html} from 'lit-element';

import styles from './mc-boost-dealt-dialog.css.js';
import stylesDialog from '../mc-dialog/mc-dialog.css.js';
import '../../cards/mc-card/mc-card.js';
import {McDialog} from '../mc-dialog/mc-dialog.js';
import {BACK_CARD_ENCOUNTER} from '../../../misc/cards.js';

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
    renderContent() {
        const {data: {allowHideFuture, cardCount, cards, cumulativeBoost}} = this;
        const displayedCards = cards.length ?
            cards :
            Array.from({length: cardCount}, () => null);
        const size = displayedCards.length <= 2 ? 'l' : 'm';

        return html`
            <div class="boost-cards">
                ${displayedCards.map(boostCard => boostCard ? html`
                    <div class="boost-card">
                        <div class="boost-icons">
                            <strong>Iconos de aumento:</strong> ${boostCard.card.boost || 0}
                        </div>
                        <mc-card
                            name="${boostCard.card.name}"
                            image="${boostCard.card.image}"
                            size="${size}"
                            ?horizontal="${boostCard.horizontal}"
                            .generic="${boostCard.card.counters}"
                            .showGeneric="${Boolean(boostCard.card.counters)}"
                        ></mc-card>
                        ${boostCard.hasBoostAbility ? html`
                            <div class="boost-ability">
                                <strong>Capacidad de aumento:</strong> Sí
                            </div>
                        ` : ''}
                    </div>
                ` : html`
                    <div class="boost-card">
                        <mc-card
                            name="Carta de aumento"
                            image="${BACK_CARD_ENCOUNTER}"
                            size="${size}"
                        ></mc-card>
                    </div>
                `)}
            </div>
            ${Number.isFinite(cumulativeBoost) ? html`
                <div class="boost-total">
                    <strong>Iconos de aumento acumulados:</strong> ${cumulativeBoost}
                </div>
            ` : ''}
            ${allowHideFuture ? html`
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
